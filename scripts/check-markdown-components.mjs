import { spawnSync } from "node:child_process";

// Add exceptions only when a component cannot have a semantic Markdown form.
// Each reason must explain the nearby Markdown fallback.
const allowedComponents = new Map([
  // ["ComponentName", "Reason and fallback"],
]);
const invalidAllowedComponents = [...allowedComponents].filter(
  ([name, reason]) =>
    typeof name !== "string" ||
    typeof reason !== "string" ||
    reason.length === 0,
);

if (invalidAllowedComponents.length > 0)
  throw new Error(
    "Every Markdown allowlist entry needs a component name and fallback reason.",
  );

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const audit = spawnSync(command, ["exec", "vocs", "markdown-audit", "--json"], {
  encoding: "utf8",
});

if (audit.error) throw audit.error;

let report;
try {
  report = JSON.parse(audit.stdout);
} catch {
  console.error(audit.stderr || audit.stdout);
  throw new Error("Vocs did not produce a JSON Markdown audit report.");
}

if (audit.status !== 0 && audit.status !== 1) {
  console.error(audit.stderr);
  process.exit(audit.status ?? 1);
}

const unexpected = report.components.filter(
  ({ name }) => !allowedComponents.has(name),
);
if (report.errors.length > 0 || unexpected.length > 0) {
  console.error("Markdown component audit failed.");
  for (const { path, error } of report.errors)
    console.error(`- ${path}: ${error}`);
  for (const { name, count, pages } of unexpected) {
    console.error(
      `- ${name}: ${count} unrendered occurrence${count === 1 ? "" : "s"}`,
    );
    for (const { count: pageCount, path } of pages)
      console.error(
        `  - ${path}: ${pageCount} occurrence${pageCount === 1 ? "" : "s"}`,
      );
  }
  console.error(`
Generated Markdown cannot contain custom MDX components. Add a semantic renderer
to scripts/remark-mpp-markdown.mjs, cover it in
scripts/remark-mpp-markdown.test.mjs, then run pnpm check:markdown. Allowlist
only components that cannot have semantic Markdown, with a reason and nearby
Markdown fallback.`);
  process.exit(1);
}

const allowlisted = report.components.filter(({ name }) =>
  allowedComponents.has(name),
);
console.log(
  allowlisted.length === 0
    ? "Markdown component audit passed (all custom components render semantic Markdown)."
    : `Markdown component audit passed (${allowlisted.length} documented exception${allowlisted.length === 1 ? "" : "s"}).`,
);
