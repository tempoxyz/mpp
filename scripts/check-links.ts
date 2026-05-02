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

type LinkOccurrence = {
  file: string;
  line: number;
  target: string;
};

type SourceLink = LinkOccurrence & {
  kind: "external" | "internal";
  normalizedTarget: string;
};

const PLACEHOLDER_HOST_PATTERN = /(^|\.)example\.(com|org|net)$/u;

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
      match.groups?.double ?? match.groups?.single ?? match.groups?.template;
    if (!target || match.index === undefined) continue;
    links.push({
      file,
      line: lineNumberForIndex(content, match.index),
      target: normalizeTarget(target),
    });
  }

  return links;
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
    if (INTERNAL_HOSTS.has(url.hostname)) {
      const normalizedTarget = `${url.pathname}${url.search}`;
      return { ...link, kind: "internal", normalizedTarget };
    }

    if (
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "0.0.0.0" ||
      url.hostname === "::1" ||
      url.hostname === "[::1]" ||
      PLACEHOLDER_HOST_PATTERN.test(url.hostname)
    ) {
      return null;
    }

    return { ...link, kind: "external", normalizedTarget: url.toString() };
  }

  return { ...link, kind: "internal", normalizedTarget: target };
}

async function getLinkSourceFiles() {
  const pageFiles = await collectPageFiles(PAGES_DIR);
  return [...SOURCE_FILES, ...pageFiles];
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
  const trimmedPath =
    cleanPath === "/" ? "/index" : cleanPath.replace(/\/$/, "");
  const withoutExtension = trimmedPath.replace(/\.(md|mdx)$/u, "");
  const candidates = [withoutExtension];

  if (!withoutExtension.endsWith("/index")) {
    candidates.push(`${withoutExtension}/index`);
  }

  return candidates;
}

async function internalTargetExists(
  target: string,
  sourceFile: string,
  redirects: Set<string>,
) {
  const [pathPart] = target.split(/[?#]/, 1);
  const cleanPath = pathPart || "/";
  if (redirects.has(cleanPath)) return true;
  if (GENERATED_PUBLIC_PATHS.has(cleanPath)) return true;

  if (cleanPath.startsWith("/")) {
    const absoluteRootPath = path.join(ROOT_DIR, cleanPath.slice(1));
    const absolutePublicPath = path.join(PUBLIC_DIR, cleanPath.slice(1));
    const absoluteDistPublicPath = path.join(
      DIST_PUBLIC_DIR,
      cleanPath.slice(1),
    );

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

function formatLocation({ file, line }: LinkOccurrence) {
  return `${path.relative(ROOT_DIR, file)}:${line}`;
}

export async function validateLinks() {
  const redirects = await loadRedirectSources();
  const allFiles = await getLinkSourceFiles();
  const internalFailures: string[] = [];

  for (const file of allFiles) {
    const content = await readFile(file, "utf8");
    for (const occurrence of extractLinks(content, file)) {
      const classified = classifyLink(occurrence);
      if (!classified) continue;
      if (classified.kind !== "internal") continue;

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
    }
  }

  if (internalFailures.length > 0) {
    console.error(`Broken internal links (${internalFailures.length}):`);
    for (const failure of internalFailures) console.error(`- ${failure}`);
    throw new Error("Link validation failed.");
  }

  console.log(
    `Validated ${allFiles.length} files for internal link integrity. External links are checked by lychee.`,
  );
}

if (import.meta.main) {
  validateLinks().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
