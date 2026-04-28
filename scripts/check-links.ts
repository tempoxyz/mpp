import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const PAGES_DIR = path.join(ROOT_DIR, "src/pages");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const DIST_PUBLIC_DIR = path.join(ROOT_DIR, "dist/public");
const SOURCE_FILES = [
  path.join(ROOT_DIR, "README.md"),
  path.join(ROOT_DIR, "vocs.config.ts"),
] as const;
const PAGE_EXTENSIONS = [".mdx", ".md", ".tsx", ".ts"] as const;
const INTERNAL_HOSTS = new Set(["mpp.dev", "www.mpp.dev"]);
const GENERATED_PUBLIC_PATHS = new Set(["/llms-full.txt", "/llms.txt"]);
const WARNING_STATUSES = new Set([401, 403, 429]);
const REQUEST_TIMEOUT_MS = 10_000;
const REQUEST_CONCURRENCY = 8;

type LinkOccurrence = {
  file: string;
  line: number;
  target: string;
};

type SourceLink = LinkOccurrence & {
  kind: "external" | "internal";
  normalizedTarget: string;
};

function lineNumberForIndex(content: string, index: number) {
  return content.slice(0, index).split("\n").length;
}

function normalizeTarget(target: string) {
  return target.startsWith("<") && target.endsWith(">")
    ? target.slice(1, -1)
    : target;
}

const markdownLinkPattern =
  /(?<!!)\[[^\]]*\]\((?<target><[^>]+>|[^)\s]+)(?:\s+['"][^'"]*['"])?\)/g;
const jsxLinkPattern =
  /\b(?:href|link|to)\s*(?:=|:)\s*(?:"(?<double>[^"]+)"|'(?<single>[^']+)'|`(?<template>[^`]+)`)/g;

export function extractLinks(content: string, file: string): LinkOccurrence[] {
  const links: LinkOccurrence[] = [];
  for (const match of content.matchAll(markdownLinkPattern)) {
    const target = match.groups?.target;
    if (!target || match.index === undefined) continue;
    links.push({
      file,
      line: lineNumberForIndex(content, match.index),
      target: normalizeTarget(target),
    });
  }

  for (const match of content.matchAll(jsxLinkPattern)) {
    const target =
      match.groups?.double ??
      match.groups?.single ??
      match.groups?.template;
    if (!target || match.index === undefined) continue;
    links.push({
      file,
      line: lineNumberForIndex(content, match.index),
      target: normalizeTarget(target),
    });
  }

  return links;
}

function isPlaceholderHost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "[::1]" ||
    hostname === "example.com" ||
    hostname.endsWith(".example.com") ||
    hostname === "example.org" ||
    hostname.endsWith(".example.org") ||
    hostname === "example.net" ||
    hostname.endsWith(".example.net")
  );
}

export function classifyLink(link: LinkOccurrence): SourceLink | null {
  const target = normalizeTarget(link.target.trim());
  if (!target) return null;
  if (target.startsWith("#")) return null;
  if (
    target.startsWith("data:") ||
    target.startsWith("javascript:") ||
    target.startsWith("mailto:") ||
    target.startsWith("tel:")
  ) {
    return null;
  }
  if (target.includes("${")) return null;

  if (/^https?:\/\//.test(target)) {
    const url = new URL(target);
    if (url.href === "http://www.w3.org/2000/svg") return null;
    if (isPlaceholderHost(url.hostname)) return null;

    if (INTERNAL_HOSTS.has(url.hostname)) {
      const normalizedTarget = `${url.pathname}${url.search}`;
      return { ...link, kind: "internal", normalizedTarget };
    }

    url.hash = "";
    return { ...link, kind: "external", normalizedTarget: url.toString() };
  }

  return { ...link, kind: "internal", normalizedTarget: target };
}

async function collectPageFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectPageFiles(fullPath)));
      continue;
    }

    if (entry.name.endsWith(".mdx") || entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }
  return files;
}

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadRedirectSources() {
  const configPath = path.join(ROOT_DIR, "vocs.config.ts");
  const content = await readFile(configPath, "utf8");
  const redirectPattern = /source:\s*["']([^"']+)["']/g;
  const sources = new Set<string>();
  for (const match of content.matchAll(redirectPattern)) {
    const source = match[1];
    if (source) sources.add(source);
  }
  return sources;
}

function pageCandidatesForPath(cleanPath: string) {
  const trimmedPath = cleanPath === "/" ? "/index" : cleanPath.replace(/\/$/, "");
  const withoutExtension = trimmedPath.replace(/\.(md|mdx)$/u, "");
  const candidates = [withoutExtension];

  if (!withoutExtension.endsWith("/index")) {
    candidates.push(`${withoutExtension}/index`);
  }

  return candidates;
}

async function internalTargetExists(target: string, sourceFile: string, redirects: Set<string>) {
  const [pathPart] = target.split(/[?#]/, 1);
  const cleanPath = pathPart || "/";
  if (redirects.has(cleanPath)) return true;
  if (GENERATED_PUBLIC_PATHS.has(cleanPath)) return true;

  if (cleanPath.startsWith("/")) {
    const absoluteRootPath = path.join(ROOT_DIR, cleanPath.slice(1));
    const absolutePublicPath = path.join(PUBLIC_DIR, cleanPath.slice(1));
    const absoluteDistPublicPath = path.join(DIST_PUBLIC_DIR, cleanPath.slice(1));

    if (await fileExists(absoluteRootPath)) return true;
    if (await fileExists(absolutePublicPath)) return true;
    if (await fileExists(absoluteDistPublicPath)) return true;

    for (const candidate of pageCandidatesForPath(cleanPath)) {
      const absolutePagesPath = path.join(PAGES_DIR, candidate);
      for (const extension of PAGE_EXTENSIONS) {
        if (await fileExists(`${absolutePagesPath}${extension}`)) return true;
      }
    }

    return false;
  }

  const sourceDir = path.dirname(sourceFile);
  const rawRelativePath = path.resolve(sourceDir, cleanPath);
  if (await fileExists(rawRelativePath)) return true;

  const relativePath = cleanPath.replace(/\.(md|mdx)$/u, "");
  for (const candidate of pageCandidatesForPath(relativePath)) {
    const resolvedPath = path.resolve(sourceDir, candidate);
    for (const extension of PAGE_EXTENSIONS) {
      if (await fileExists(`${resolvedPath}${extension}`)) return true;
    }
  }

  return false;
}

async function requestUrl(url: string, method: "HEAD" | "GET") {
  return fetch(url, {
    method,
    redirect: "follow",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      "user-agent": "mpp-docs-link-checker/1.0",
    },
  });
}

async function checkExternalUrl(url: string) {
  let lastFailureStatus: number | undefined;
  let lastNetworkError: string | undefined;

  for (const method of ["HEAD", "GET"] as const) {
    try {
      const response = await requestUrl(url, method);
      if (response.ok) return { ok: true as const, status: response.status };
      if (WARNING_STATUSES.has(response.status)) {
        return { ok: true as const, warning: `HTTP ${response.status}` };
      }
      if (response.status >= 500) {
        return { ok: true as const, warning: `HTTP ${response.status}` };
      }
      if (method === "HEAD" && response.status === 405) continue;
      if (method === "HEAD") {
        lastFailureStatus = response.status;
        continue;
      }

      return { ok: false as const, status: response.status };
    } catch (error) {
      lastNetworkError = error instanceof Error ? error.message : String(error);
    }
  }

  if (lastFailureStatus !== undefined) {
    return { ok: false as const, status: lastFailureStatus };
  }

  return {
    ok: true as const,
    warning: `request failed: ${lastNetworkError ?? "unknown error"}`,
  };
}

async function runLimited<T, R>(
  values: readonly T[],
  concurrency: number,
  worker: (value: T) => Promise<R>,
) {
  const results: R[] = new Array(values.length);
  let nextIndex = 0;

  async function runWorker() {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      if (currentIndex >= values.length) return;
      results[currentIndex] = await worker(values[currentIndex]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, () => runWorker()),
  );
  return results;
}

function formatLocation({ file, line }: LinkOccurrence) {
  return `${path.relative(ROOT_DIR, file)}:${line}`;
}

export async function validateLinks() {
  const redirects = await loadRedirectSources();
  const pageFiles = await collectPageFiles(PAGES_DIR);
  const allFiles = [...SOURCE_FILES, ...pageFiles];
  const internalFailures: string[] = [];
  const externalSources = new Map<string, LinkOccurrence[]>();

  for (const file of allFiles) {
    const content = await readFile(file, "utf8");
    for (const occurrence of extractLinks(content, file)) {
      const classified = classifyLink(occurrence);
      if (!classified) continue;

      if (classified.kind === "internal") {
        const exists = await internalTargetExists(
          classified.normalizedTarget,
          classified.file,
          redirects,
        );
        if (!exists) {
          internalFailures.push(
            `${formatLocation(classified)} → ${classified.target}`,
          );
        }
        continue;
      }

      const entries = externalSources.get(classified.normalizedTarget) ?? [];
      entries.push(classified);
      externalSources.set(classified.normalizedTarget, entries);
    }
  }

  const externalFailures: string[] = [];
  const warnings: string[] = [];
  const externalUrls = [...externalSources.keys()].sort();
  const externalResults = await runLimited(
    externalUrls,
    REQUEST_CONCURRENCY,
    async (url) => ({ url, result: await checkExternalUrl(url) }),
  );

  for (const { url, result } of externalResults) {
    const sources = externalSources.get(url) ?? [];
    const locations = sources.map(formatLocation).join(", ");
    if (result.ok && "warning" in result) {
      warnings.push(`${url} → ${result.warning} at ${locations}`);
      continue;
    }
    if (result.ok) continue;

    externalFailures.push(`${url} → HTTP ${result.status} at ${locations}`);
  }

  if (warnings.length > 0) {
    console.warn(`Link validation warnings (${warnings.length}):`);
    for (const warning of warnings) console.warn(`- ${warning}`);
  }

  if (internalFailures.length > 0 || externalFailures.length > 0) {
    if (internalFailures.length > 0) {
      console.error(`Broken internal links (${internalFailures.length}):`);
      for (const failure of internalFailures) console.error(`- ${failure}`);
    }

    if (externalFailures.length > 0) {
      console.error(`Broken external links (${externalFailures.length}):`);
      for (const failure of externalFailures) console.error(`- ${failure}`);
    }

    throw new Error("Link validation failed.");
  }

  console.log(
    `Validated ${allFiles.length} files and ${externalUrls.length} external links.`,
  );
}

if (import.meta.main) {
  validateLinks().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
