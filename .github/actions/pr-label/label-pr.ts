#!/usr/bin/env npx tsx
/**
 * PR Auto-Labeler
 *
 * Labels pull requests based on changed file paths, with fallback to
 * token matching in the PR title and body.
 *
 * Phase 1: Match changed file paths against glob-style patterns
 * Phase 2: If no labels matched, scan title + body for tokens
 *
 * Usage:
 *   npx tsx .github/actions/pr-label/label-pr.ts
 *
 * Environment (set by GitHub Actions):
 *   GITHUB_TOKEN:      PAT or default token
 *   GITHUB_REPOSITORY: owner/repo
 *   PR_NUMBER:         pull request number
 */

export interface Rule {
  paths: string[];
  tokens: string[];
}

/**
 * Label rules. Each key is the label name.
 * `paths` are glob patterns matched against changed files (primary).
 * `tokens` are matched case-insensitively against PR title + body (fallback).
 */
export const RULES: Record<string, Rule> = {
  "service-directory": {
    paths: ["schemas/services.ts", "schemas/discovery.*"],
    tokens: ["[service]", "service directory", "add service"],
  },
  docs: {
    paths: ["src/pages/**"],
    tokens: ["[docs]", "documentation"],
  },
  "sdk-docs": {
    paths: ["src/pages/sdk/**"],
    tokens: ["[sdk]", "sdk docs"],
  },
  components: {
    paths: ["src/components/**"],
    tokens: ["[component]", "[ui]"],
  },
  infra: {
    paths: [".github/**", "scripts/**"],
    tokens: ["[infra]", "[ci]", "workflow", "github action"],
  },
  config: {
    paths: [
      "biome.json",
      "package.json",
      "tsconfig.json",
      "vocs.config.*",
      "vercel.json",
      "vite.config.*",
      "vitest.config.*",
    ],
    tokens: ["[config]"],
  },
  llms: {
    paths: ["**/llms*", "src/snippets/**"],
    tokens: ["[llms]", "llms.txt"],
  },
};

/**
 * Simple glob matcher supporting:
 *   *   — one path segment (no /)
 *   **  — any depth
 *   .   — literal dot (escaped)
 */
export function matchesGlob(filePath: string, pattern: string): boolean {
  const regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*\//g, "{{GLOBSTAR_SLASH}}")
    .replace(/\*\*/g, "{{GLOBSTAR}}")
    .replace(/\*/g, "[^/]*")
    .replace(/\{\{GLOBSTAR_SLASH\}\}/g, "(.+/)?")
    .replace(/\{\{GLOBSTAR\}\}/g, ".*");
  return new RegExp(`^${regexStr}$`).test(filePath);
}

/**
 * Determine labels from changed file paths.
 */
export function labelsFromPaths(files: string[]): string[] {
  const matched = new Set<string>();
  for (const file of files) {
    for (const [label, rule] of Object.entries(RULES)) {
      if (rule.paths.some((pattern) => matchesGlob(file, pattern))) {
        matched.add(label);
      }
    }
  }
  return [...matched];
}

/**
 * Determine labels from PR title + body tokens.
 */
export function labelsFromTokens(title: string, body: string): string[] {
  const text = `${title}\n${body}`.toLowerCase();
  const matched = new Set<string>();
  for (const [label, rule] of Object.entries(RULES)) {
    if (rule.tokens.some((token) => text.includes(token.toLowerCase()))) {
      matched.add(label);
    }
  }
  return [...matched];
}

/**
 * Core logic: get labels for a PR given its files, title, and body.
 * Path rules are always applied. Token rules only fire when path rules
 * produce no labels (fallback).
 */
export function getLabels(
  files: string[],
  title: string,
  body: string,
): string[] {
  const pathLabels = labelsFromPaths(files);
  if (pathLabels.length > 0) return pathLabels;
  return labelsFromTokens(title, body);
}

// --- GitHub API helpers (only used at runtime, not in tests) ---

async function fetchJSON(url: string, options?: RequestInit) {
  const token = process.env.GITHUB_TOKEN;
  const res = await fetch(url, {
    ...options,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function getPRFiles(repo: string, pr: number): Promise<string[]> {
  const files: string[] = [];
  let page = 1;
  while (true) {
    const data: Array<{ filename: string }> = await fetchJSON(
      `https://api.github.com/repos/${repo}/pulls/${pr}/files?per_page=100&page=${page}`,
    );
    files.push(...data.map((f) => f.filename));
    if (data.length < 100) break;
    page++;
  }
  return files;
}

async function getPR(
  repo: string,
  pr: number,
): Promise<{ title: string; body: string }> {
  const data = await fetchJSON(
    `https://api.github.com/repos/${repo}/pulls/${pr}`,
  );
  return { title: data.title ?? "", body: data.body ?? "" };
}

async function addLabels(
  repo: string,
  pr: number,
  labels: string[],
): Promise<void> {
  await fetchJSON(`https://api.github.com/repos/${repo}/issues/${pr}/labels`, {
    method: "POST",
    body: JSON.stringify({ labels }),
  });
}

async function main() {
  const repo = process.env.GITHUB_REPOSITORY;
  const prNumber = Number(process.env.PR_NUMBER);

  if (!repo || !prNumber) {
    console.error("Missing GITHUB_REPOSITORY or PR_NUMBER");
    process.exit(1);
  }

  console.log(`Labeling PR #${prNumber} in ${repo}`);

  const [files, pr] = await Promise.all([
    getPRFiles(repo, prNumber),
    getPR(repo, prNumber),
  ]);

  console.log(`Changed files (${files.length}): ${files.join(", ")}`);
  console.log(`Title: ${pr.title}`);

  const labels = getLabels(files, pr.title, pr.body);

  if (labels.length === 0) {
    console.log("No labels matched");
    return;
  }

  console.log(`Applying labels: ${labels.join(", ")}`);
  await addLabels(repo, prNumber, labels);
  console.log("Done");
}

const isMain =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("label-pr.ts");

if (isMain) {
  main().catch((e) => {
    console.error("PR labeler failed:", e);
    process.exit(1);
  });
}
