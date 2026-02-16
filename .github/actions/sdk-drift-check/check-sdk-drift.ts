#!/usr/bin/env npx tsx
/**
 * SDK Manifest Drift Check
 *
 * Validates that sidebar SDK references in vocs.config.tsx match actual exports
 * from the TypeScript SDK package. Runs daily to detect drift between docs and SDK.
 *
 * Usage:
 *   pnpm check:sdk-drift
 *   pnpm check:sdk-drift --output results.json
 *
 * Configuration (via environment or defaults):
 *   SDK_PACKAGE: npm package name to check (default: "mpay")
 *   VOCS_CONFIG: path to vocs config (default: "./vocs.config.tsx")
 *   SDK_PATH_PREFIX: sidebar path prefix for SDK refs (default: "/sdk/typescript")
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Find the workspace root by looking for vocs.config.tsx or package.json
 * Starts from cwd and walks up
 */
export function findWorkspaceRoot(): string {
  let dir = process.cwd();
  while (dir !== "/") {
    if (
      existsSync(join(dir, "vocs.config.tsx")) ||
      existsSync(join(dir, "vocs.config.ts"))
    ) {
      return dir;
    }
    dir = dirname(dir);
  }
  return process.cwd();
}

const rootDir = findWorkspaceRoot();

export interface DriftCheckConfig {
  sdkPackage: string;
  vocsConfigPath: string;
  sdkPathPrefix: string;
  pagesDir: string;
  outputPath?: string;
}

export interface SidebarReference {
  link: string;
  namespace: string;
  member?: string;
  area: "core" | "client" | "server";
}

export interface ExportInfo {
  namespace: string;
  members: string[];
}

export interface DriftResult {
  timestamp: string;
  sdkPackage: string;
  sdkVersion: string;
  summary: {
    total: number;
    valid: number;
    invalid: number;
    missingPages: number;
    undocumentedExports: number;
  };
  errors: Array<{
    type: "missing_export" | "missing_member" | "missing_page";
    link: string;
    details: string;
  }>;
  warnings: Array<{
    type: "undocumented_export";
    namespace: string;
    member?: string;
    area: string;
  }>;
  validRefs: string[];
}

function parseArgs(): { output?: string } {
  const args = process.argv.slice(2);
  const outputIdx = args.indexOf("--output");
  return {
    output: outputIdx >= 0 ? args[outputIdx + 1] : undefined,
  };
}

/**
 * Check if running in GitHub Actions environment
 */
function isGitHubActions(): boolean {
  return process.env.GITHUB_ACTIONS === "true";
}

/**
 * Emit GitHub Actions workflow annotation
 * @see https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#setting-an-error-message
 */
function emitAnnotation(
  level: "error" | "warning" | "notice",
  message: string,
  options?: { title?: string; file?: string; line?: number },
): void {
  if (!isGitHubActions()) return;

  let command = `::${level}`;
  const params: string[] = [];

  if (options?.file) params.push(`file=${options.file}`);
  if (options?.line) params.push(`line=${options.line}`);
  if (options?.title) params.push(`title=${options.title}`);

  if (params.length > 0) {
    command += ` ${params.join(",")}`;
  }

  console.log(`${command}::${message}`);
}

function getConfig(): DriftCheckConfig {
  const args = parseArgs();
  return {
    sdkPackage: process.env.SDK_PACKAGE || "mpay",
    vocsConfigPath: process.env.VOCS_CONFIG || join(rootDir, "vocs.config.tsx"),
    sdkPathPrefix: process.env.SDK_PATH_PREFIX || "/sdk/typescript",
    pagesDir: join(rootDir, "src", "pages"),
    outputPath: args.output,
  };
}

/**
 * Extract sidebar links from content string using regex
 */
export function extractSidebarLinksFromContent(
  content: string,
  pathPrefix: string,
): string[] {
  const escapedPrefix = pathPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const linkRegex = new RegExp(
    `link:\\s*["'](${escapedPrefix}\\/[^"']+)["']`,
    "g",
  );
  const links: string[] = [];

  for (const match of content.matchAll(linkRegex)) {
    links.push(match[1]);
  }

  return links;
}

/**
 * Extract sidebar links from vocs.config.tsx using regex
 * (avoids needing to execute the config)
 */
export function extractSidebarLinks(
  configPath: string,
  pathPrefix: string,
): string[] {
  const content = readFileSync(configPath, "utf-8");
  return extractSidebarLinksFromContent(content, pathPrefix);
}

/**
 * Parse a sidebar link into structured reference
 * e.g., "/sdk/typescript/core/Challenge.from" -> { area: "core", namespace: "Challenge", member: "from" }
 */
export function parseLink(
  link: string,
  pathPrefix: string,
): SidebarReference | null {
  const relativePath = link.slice(pathPrefix.length + 1); // Remove prefix and leading slash
  const parts = relativePath.split("/");

  if (parts.length === 0) return null;

  // Determine area (core, client, server)
  let area: "core" | "client" | "server";
  let symbolPart: string;

  if (parts[0] === "core" || parts[0] === "client" || parts[0] === "server") {
    area = parts[0] as "core" | "client" | "server";
    symbolPart = parts.slice(1).join("/");
  } else {
    // Default to core for top-level refs like /sdk/typescript/Challenge.from
    area = "core";
    symbolPart = parts.join("/");
  }

  if (!symbolPart) return null;

  // Parse Namespace.member or just Namespace
  const dotIndex = symbolPart.indexOf(".");
  if (dotIndex > 0) {
    return {
      link,
      area,
      namespace: symbolPart.slice(0, dotIndex),
      member: symbolPart.slice(dotIndex + 1),
    };
  }

  return {
    link,
    area,
    namespace: symbolPart,
  };
}

/**
 * Get exports from the SDK package by importing it
 */
export async function getSdkExports(
  packageName: string,
): Promise<Record<string, ExportInfo>> {
  const exports: Record<string, ExportInfo> = {};

  // Import each entrypoint
  const entrypoints = [
    { area: "core", path: packageName },
    { area: "client", path: `${packageName}/client` },
    { area: "server", path: `${packageName}/server` },
  ];

  for (const { area, path } of entrypoints) {
    try {
      const mod = await import(path);

      for (const [name, value] of Object.entries(mod)) {
        if (name === "default" || name === "z") continue;

        const members: string[] = [];
        if (value && typeof value === "object") {
          for (const key of Object.keys(value as object)) {
            if (!key.startsWith("_")) {
              members.push(key);
            }
          }
        } else if (typeof value === "function") {
          // Named function export (e.g., `export { tempo }`)
          // Treat as a namespace with no members for matching
          // This handles cases like `Method.tempo` where `tempo` is the actual export
        }

        const key = `${area}:${name}`;
        exports[key] = { namespace: name, members };
      }
    } catch (e) {
      console.warn(`Warning: Could not import ${path}: ${e}`);
    }
  }

  return exports;
}

/**
 * Get SDK package version
 */
async function getSdkVersion(packageName: string): Promise<string> {
  try {
    // Try to find package.json in node_modules
    const pkgJsonPath = join(
      rootDir,
      "node_modules",
      packageName,
      "package.json",
    );
    if (existsSync(pkgJsonPath)) {
      const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
      return pkg.version || "unknown";
    }
  } catch {
    // ignore
  }
  return "unknown";
}

/**
 * Check if a documentation page exists for a reference
 */
function pageExists(ref: SidebarReference, pagesDir: string): boolean {
  // Build expected page path
  const pagePath = ref.member
    ? join(
        pagesDir,
        "sdk",
        "typescript",
        ref.area,
        `${ref.namespace}.${ref.member}.mdx`,
      )
    : join(pagesDir, "sdk", "typescript", ref.area, `${ref.namespace}.mdx`);

  return existsSync(pagePath);
}

/**
 * Run the drift check
 */
async function runDriftCheck(config: DriftCheckConfig): Promise<DriftResult> {
  const result: DriftResult = {
    timestamp: new Date().toISOString(),
    sdkPackage: config.sdkPackage,
    sdkVersion: await getSdkVersion(config.sdkPackage),
    summary: {
      total: 0,
      valid: 0,
      invalid: 0,
      missingPages: 0,
      undocumentedExports: 0,
    },
    errors: [],
    warnings: [],
    validRefs: [],
  };

  // Extract sidebar links
  const links = extractSidebarLinks(
    config.vocsConfigPath,
    config.sdkPathPrefix,
  );
  const refs = links
    .map((l) => parseLink(l, config.sdkPathPrefix))
    .filter((r): r is SidebarReference => r !== null);

  result.summary.total = refs.length;

  // Get SDK exports
  const exports = await getSdkExports(config.sdkPackage);

  // Track documented items for undocumented export detection
  const documented = new Set<string>();

  // Validate each reference
  for (const ref of refs) {
    const exportKey = `${ref.area}:${ref.namespace}`;
    const exportInfo = exports[exportKey];

    // Handle "Namespace.member" pattern where sidebar uses conceptual grouping
    // but SDK exports the member directly (e.g., "Method.tempo" -> SDK has `tempo`)
    if (!exportInfo && ref.member) {
      const directExportKey = `${ref.area}:${ref.member}`;
      const directExport = exports[directExportKey];
      if (directExport) {
        // The member is exported directly - this is valid (conceptual grouping in docs)
        documented.add(directExportKey);
        result.validRefs.push(ref.link);
        result.summary.valid++;
        continue;
      }
    }

    if (!exportInfo) {
      result.errors.push({
        type: "missing_export",
        link: ref.link,
        details: `Namespace "${ref.namespace}" not exported from ${config.sdkPackage}/${ref.area === "core" ? "" : ref.area}`,
      });
      result.summary.invalid++;
      continue;
    }

    if (ref.member && !exportInfo.members.includes(ref.member)) {
      result.errors.push({
        type: "missing_member",
        link: ref.link,
        details: `Member "${ref.member}" not found in ${ref.namespace}. Available: ${exportInfo.members.join(", ")}`,
      });
      result.summary.invalid++;
      continue;
    }

    // Check if page exists
    if (!pageExists(ref, config.pagesDir)) {
      result.errors.push({
        type: "missing_page",
        link: ref.link,
        details: `Documentation page not found for ${ref.link}`,
      });
      result.summary.missingPages++;
    }

    documented.add(ref.member ? `${exportKey}:${ref.member}` : exportKey);
    result.validRefs.push(ref.link);
    result.summary.valid++;
  }

  // Find undocumented exports (warnings, not errors)
  for (const [key, info] of Object.entries(exports)) {
    const [area, namespace] = key.split(":");

    // Check if namespace itself is documented
    if (!documented.has(key)) {
      // Check if any members are documented
      const hasDocumentedMembers = info.members.some((m) =>
        documented.has(`${key}:${m}`),
      );

      if (!hasDocumentedMembers && info.members.length > 0) {
        result.warnings.push({
          type: "undocumented_export",
          namespace,
          area,
        });
        result.summary.undocumentedExports++;
      }
    }

    // Check individual members
    for (const member of info.members) {
      if (!documented.has(`${key}:${member}`)) {
        result.warnings.push({
          type: "undocumented_export",
          namespace,
          member,
          area,
        });
        result.summary.undocumentedExports++;
      }
    }
  }

  return result;
}

/**
 * Format result for console output
 */
function formatConsoleOutput(result: DriftResult): string {
  const lines: string[] = [];

  lines.push("═".repeat(60));
  lines.push("SDK MANIFEST DRIFT CHECK");
  lines.push("═".repeat(60));
  lines.push(`Package: ${result.sdkPackage}@${result.sdkVersion}`);
  lines.push(`Timestamp: ${result.timestamp}`);
  lines.push("");

  lines.push("SUMMARY");
  lines.push("─".repeat(40));
  lines.push(`Total references: ${result.summary.total}`);
  lines.push(`Valid: ${result.summary.valid}`);
  lines.push(`Invalid: ${result.summary.invalid}`);
  lines.push(`Missing pages: ${result.summary.missingPages}`);
  lines.push(`Undocumented exports: ${result.summary.undocumentedExports}`);
  lines.push("");

  if (result.errors.length > 0) {
    lines.push("ERRORS");
    lines.push("─".repeat(40));
    for (const error of result.errors) {
      lines.push(`[ERROR] [${error.type}] ${error.link}`);
      lines.push(`   ${error.details}`);
    }
    lines.push("");
  }

  if (result.warnings.length > 0) {
    lines.push("WARNINGS (undocumented exports)");
    lines.push("─".repeat(40));
    const grouped = new Map<string, string[]>();
    for (const warn of result.warnings) {
      const key = `${warn.area}/${warn.namespace}`;
      if (!grouped.has(key)) grouped.set(key, []);
      if (warn.member) grouped.get(key)!.push(warn.member);
    }
    for (const [key, members] of grouped) {
      if (members.length > 0) {
        lines.push(`[WARN] ${key}: ${members.join(", ")}`);
      } else {
        lines.push(`[WARN] ${key} (entire namespace)`);
      }
    }
    lines.push("");
  }

  const status = result.summary.invalid > 0 ? "FAILED" : "PASSED";
  lines.push("═".repeat(60));
  lines.push(`STATUS: ${status}`);
  lines.push("═".repeat(60));

  return lines.join("\n");
}

/**
 * Emit GitHub Actions annotations for all errors and warnings
 */
function emitWorkflowAnnotations(
  result: DriftResult,
  vocsConfigPath: string,
): void {
  if (!isGitHubActions()) return;

  for (const error of result.errors) {
    const title =
      error.type === "missing_export"
        ? "Missing SDK Export"
        : error.type === "missing_member"
          ? "Missing SDK Member"
          : "Missing Documentation Page";

    emitAnnotation("error", error.details, {
      title,
      file: vocsConfigPath,
    });
  }

  const warnGroups = new Map<string, string[]>();
  for (const warn of result.warnings) {
    const key = `${warn.area}/${warn.namespace}`;
    if (!warnGroups.has(key)) warnGroups.set(key, []);
    if (warn.member) warnGroups.get(key)!.push(warn.member);
  }

  for (const [key, members] of warnGroups) {
    const msg =
      members.length > 0
        ? `${key}: ${members.join(", ")}`
        : `${key} (entire namespace)`;
    emitAnnotation("warning", `Undocumented export: ${msg}`, {
      title: "Undocumented Export",
    });
  }
}

async function main() {
  const config = getConfig();

  console.log(`Checking SDK manifest drift...`);
  console.log(`  Config: ${config.vocsConfigPath}`);
  console.log(`  Package: ${config.sdkPackage}`);
  console.log("");

  const result = await runDriftCheck(config);

  // Console output
  console.log(formatConsoleOutput(result));

  // Emit GitHub Actions annotations
  emitWorkflowAnnotations(result, config.vocsConfigPath);

  // Write JSON output if requested
  if (config.outputPath) {
    writeFileSync(config.outputPath, JSON.stringify(result, null, 2));
    console.log(`Results written to: ${config.outputPath}`);
  }

  // Exit codes:
  // 0 = no drift
  // 1 = drift detected (informational, not an error)
  // 2 = actual error (script failure)
  if (result.summary.invalid > 0) {
    process.exit(1);
  }
}

// Only run main when executed directly (not when imported for testing)
const isMain =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("check-sdk-drift.ts");

if (isMain) {
  main().catch((e) => {
    console.error("Drift check failed:", e);
    process.exit(2);
  });
}
