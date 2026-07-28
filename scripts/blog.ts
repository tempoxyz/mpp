import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { parse } from "yaml";
import { type BlogPost, formatBlogDate } from "../src/lib/blog.js";

const DEFAULT_BLOG_DIR = resolve(process.cwd(), "src/pages/blog");
const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const REQUIRED_PAGE_SETTINGS = {
  layout: "minimal",
  outline: false,
  showAskAi: false,
  showFeedback: false,
  showSearch: false,
} as const;

type Frontmatter = {
  description?: unknown;
  imageDescription?: unknown;
  publishedAt?: unknown;
  title?: unknown;
  [key: string]: unknown;
};

export function loadBlogPosts(
  options: { blogDir?: string; missing?: "empty" | "throw" } = {},
): BlogPost[] {
  const blogDir = options.blogDir ?? DEFAULT_BLOG_DIR;
  if (!existsSync(blogDir)) {
    if (options.missing === "empty") return [];
    throw new Error(`Blog directory not found: ${blogDir}`);
  }

  const posts = readdirSync(blogDir)
    .filter((file) => file.endsWith(".mdx") && file !== "index.mdx")
    .map((file) => loadBlogPost(join(blogDir, file)));

  const routes = new Set<string>();
  for (const post of posts) {
    if (routes.has(post.to))
      throw new Error(`Duplicate blog route: ${post.to}`);
    routes.add(post.to);
  }

  return posts.sort(
    (left, right) =>
      right.publishedAt.localeCompare(left.publishedAt) ||
      left.to.localeCompare(right.to),
  );
}

export function renderBlogRss(
  posts: readonly BlogPost[],
  siteUrl = "https://mpp.dev",
): string {
  const baseUrl = siteUrl.replace(/\/+$/, "");
  const latest = posts.at(0);
  const items = posts
    .map((post) => {
      const url = `${baseUrl}${post.to}`;
      const publishedAt = new Date(
        `${post.publishedAt}T00:00:00Z`,
      ).toUTCString();
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${publishedAt}</pubDate>
    </item>`;
    })
    .join("\n");

  const lastBuildDate = latest
    ? new Date(`${latest.publishedAt}T00:00:00Z`).toUTCString()
    : new Date(0).toUTCString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>MPP Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Updates from the MPP team on protocol development, integrations, and the future of machine payments.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}

function loadBlogPost(filePath: string): BlogPost {
  const content = readFileSync(filePath, "utf8");
  const match = content.match(FRONTMATTER_PATTERN);
  if (!match) throw new Error(`${basename(filePath)}: missing frontmatter`);

  const parsed = parse(match[1]) as Frontmatter | null;
  if (!parsed || typeof parsed !== "object")
    throw new Error(`${basename(filePath)}: frontmatter must be an object`);

  const description = requireString(parsed, "description", filePath);
  const imageDescription = requireString(parsed, "imageDescription", filePath);
  const publishedAt = requireString(parsed, "publishedAt", filePath);
  const title = requireString(parsed, "title", filePath);

  if (description.length > 160)
    throw new Error(
      `${basename(filePath)}: description exceeds 160 characters`,
    );
  if (imageDescription.length > 80)
    throw new Error(
      `${basename(filePath)}: imageDescription exceeds 80 characters`,
    );
  if (!isValidIsoDate(publishedAt))
    throw new Error(
      `${basename(filePath)}: publishedAt must be a valid YYYY-MM-DD date`,
    );

  for (const [key, expected] of Object.entries(REQUIRED_PAGE_SETTINGS)) {
    if (parsed[key] !== expected)
      throw new Error(
        `${basename(filePath)}: ${key} must be ${JSON.stringify(expected)}`,
      );
  }

  const body = content.slice(match[0].length);
  const heading = body.match(/^#\s+(.+?)(?:\s+\[.*\])?\s*$/m)?.[1]?.trim();
  if (heading !== title)
    throw new Error(
      `${basename(filePath)}: first H1 must match frontmatter title`,
    );

  const slug = basename(filePath, ".mdx");
  return {
    date: formatBlogDate(publishedAt),
    description,
    publishedAt,
    title,
    to: `/blog/${slug}`,
  };
}

function requireString(
  frontmatter: Frontmatter,
  key: "description" | "imageDescription" | "publishedAt" | "title",
  filePath: string,
): string {
  const value = frontmatter[key];
  if (typeof value !== "string" || value.trim().length === 0)
    throw new Error(`${basename(filePath)}: ${key} must be a non-empty string`);
  return value;
}

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().startsWith(value);
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
