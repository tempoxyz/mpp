/**
 * Smoke-test the static home card and each dynamic MPP social-card layout.
 *
 * Start the docs server first, then run `pnpm og:probe`.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const baseUrl =
  process.env.OG_BASE_URL ?? process.env.PREVIEW_URL ?? "http://localhost:5173";
const pagesDir = "src/pages";
const samplePaths = [
  "/overview",
  "/advanced/security",
  "/blog",
  "/blog/sessions-improved",
  "/guides/accept-card-payments",
  "/protocol/challenges",
  "/sdk/typescript",
  "/services",
];

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = join(dir, entry.name);
    if (entry.isDirectory())
      return entry.name.startsWith("_") ? [] : walk(file);
    return entry.name.endsWith(".mdx") ? [file] : [];
  });
}

function routeForFile(file: string): string {
  const route = relative(pagesDir, file)
    .replace(/\.mdx$/, "")
    .replace(/\/index$/, "");
  return route === "index" ? "/" : `/${route}`;
}

function titleForFile(file: string): string {
  const content = readFileSync(file, "utf8");
  const frontmatterTitle = content.match(/^title:\s*"(.+)"$/m)?.[1];
  const heading = content
    .match(/^#\s+(.+?)(?:\s+\[[^\]]+\])?\s*$/m)?.[1]
    ?.replaceAll("`", "");
  return frontmatterTitle ?? heading ?? routeForFile(file);
}

async function probe(label: string, url: string): Promise<string | null> {
  const response = await fetch(url);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") ?? "";
  const isPng =
    bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
  if (response.ok && contentType.startsWith("image/png") && isPng) {
    console.log(`OK   ${label}`);
    return null;
  }
  return `${label}: ${response.status} ${contentType}`;
}

const pages = walk(pagesDir).sort();
const pagesByRoute = new Map(pages.map((file) => [routeForFile(file), file]));
const failures = [await probe("static home", `${baseUrl}/og.png`)];

for (const path of samplePaths) {
  const file = pagesByRoute.get(path);
  if (!file) throw new Error(`No page found for smoke-test route: ${path}`);
  const query = new URLSearchParams({
    path,
    title: titleForFile(file),
  });
  failures.push(await probe(`layout ${path}`, `${baseUrl}/api/og?${query}`));
}

for (const title of [
  "X",
  "A long MPP social card title that wraps cleanly",
  "<script>alert(1)</script>",
]) {
  const query = new URLSearchParams({ path: "/blog", title });
  failures.push(await probe(`title ${title}`, `${baseUrl}/api/og?${query}`));
}

const errors = failures.filter(
  (failure): failure is string => failure !== null,
);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
