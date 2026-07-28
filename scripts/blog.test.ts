import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { stringify } from "yaml";
import type { BlogPost } from "../src/lib/blog.js";
import { loadBlogPosts, renderBlogRss } from "./blog.js";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0))
    rmSync(directory, { force: true, recursive: true });
});

describe("blog metadata", () => {
  it("discovers every post without a manually maintained catalog", () => {
    const posts = loadBlogPosts();
    const expectedRoutes = readdirSync(resolve("src/pages/blog"))
      .filter((file) => file.endsWith(".mdx") && file !== "index.mdx")
      .map((file) => `/blog/${basename(file, ".mdx")}`);

    expect(posts.map((post) => post.to).toSorted()).toEqual(
      expectedRoutes.toSorted(),
    );
    expect(posts.map((post) => post.publishedAt)).toEqual(
      posts
        .map((post) => post.publishedAt)
        .toSorted()
        .reverse(),
    );
    expect(posts.every((post) => post.date.includes(","))).toBe(true);
  });

  it("keeps the authoring template compatible with validation", () => {
    const blogDir = createBlogDirectory();
    const template = readFileSync(
      resolve("templates/blog-post.mdx"),
      "utf8",
    ).replace("YYYY-MM-DD", "2026-01-02");
    writeFileSync(join(blogDir, "template.mdx"), template);

    expect(loadBlogPosts({ blogDir })).toEqual([
      {
        date: "Friday, January 2, 2026",
        description: "Describe the reader benefit in under 160 characters.",
        publishedAt: "2026-01-02",
        title: "Post title",
        to: "/blog/template",
      },
    ]);
  });

  it.each([
    {
      expected: "publishedAt must be a non-empty string",
      name: "missing dates",
      overrides: { publishedAt: undefined },
    },
    {
      expected: "publishedAt must be a valid YYYY-MM-DD date",
      name: "invalid dates",
      overrides: { publishedAt: "2026-02-31" },
    },
    {
      expected: "description exceeds 160 characters",
      name: "long descriptions",
      overrides: { description: "a".repeat(161) },
    },
    {
      expected: "imageDescription exceeds 80 characters",
      name: "long image descriptions",
      overrides: { imageDescription: "a".repeat(81) },
    },
    {
      expected: 'layout must be "minimal"',
      name: "incorrect layouts",
      overrides: { layout: "full" },
    },
    {
      expected: "outline must be false",
      name: "enabled outlines",
      overrides: { outline: true },
    },
    {
      expected: "showAskAi must be false",
      name: "enabled Ask AI controls",
      overrides: { showAskAi: true },
    },
    {
      expected: "showFeedback must be false",
      name: "enabled feedback controls",
      overrides: { showFeedback: true },
    },
    {
      expected: "showSearch must be false",
      name: "enabled search controls",
      overrides: { showSearch: true },
    },
  ])("rejects $name", ({ expected, overrides }) => {
    const blogDir = createBlogDirectory();
    writePost(blogDir, "invalid", overrides);

    expect(() => loadBlogPosts({ blogDir })).toThrow(expected);
  });

  it.each([
    "description",
    "imageDescription",
    "publishedAt",
    "title",
  ])("requires a non-empty %s", (field) => {
    const blogDir = createBlogDirectory();
    writePost(blogDir, "empty", { [field]: "  " });

    expect(() => loadBlogPosts({ blogDir })).toThrow(
      `${field} must be a non-empty string`,
    );
  });

  it("accepts descriptions at their exact limits", () => {
    const blogDir = createBlogDirectory();
    writePost(blogDir, "limits", {
      description: "a".repeat(160),
      imageDescription: "b".repeat(80),
    });

    expect(loadBlogPosts({ blogDir })[0]).toMatchObject({
      description: "a".repeat(160),
      title: "Test post",
    });
  });

  it("ignores the index and non-MDX files", () => {
    const blogDir = createBlogDirectory();
    writePost(blogDir, "post");
    writeFileSync(join(blogDir, "index.mdx"), "not valid frontmatter");
    writeFileSync(join(blogDir, "notes.md"), "not a post");
    writeFileSync(join(blogDir, "_mdx-wrapper.tsx"), "not a post");

    expect(loadBlogPosts({ blogDir }).map((post) => post.to)).toEqual([
      "/blog/post",
    ]);
  });

  it("uses routes as a stable tie-breaker for posts on the same date", () => {
    const blogDir = createBlogDirectory();
    writePost(blogDir, "z-last");
    writePost(blogDir, "a-first");

    expect(loadBlogPosts({ blogDir }).map((post) => post.to)).toEqual([
      "/blog/a-first",
      "/blog/z-last",
    ]);
  });

  it.each([
    {
      content: "# Missing frontmatter",
      expected: "missing frontmatter",
      name: "missing frontmatter",
    },
    {
      content: "---\nscalar\n---\n\n# Scalar",
      expected: "frontmatter must be an object",
      name: "scalar frontmatter",
    },
  ])("rejects $name", ({ content, expected }) => {
    const blogDir = createBlogDirectory();
    writeFileSync(join(blogDir, "invalid.mdx"), content);

    expect(() => loadBlogPosts({ blogDir })).toThrow(expected);
  });

  it("requires the H1 and frontmatter titles to match", () => {
    const blogDir = createBlogDirectory();
    writePost(blogDir, "mismatch", {}, "Different title");

    expect(() => loadBlogPosts({ blogDir })).toThrow(
      "first H1 must match frontmatter title",
    );
  });

  it("optionally ignores a missing directory in bundled runtime config", () => {
    const blogDir = join(createBlogDirectory(), "missing");

    expect(loadBlogPosts({ blogDir, missingDirectory: "empty" })).toEqual([]);
    expect(() => loadBlogPosts({ blogDir })).toThrow(
      `Blog directory not found: ${blogDir}`,
    );
  });
});

describe("blog RSS", () => {
  it("renders deterministic items and escapes every XML entity", () => {
    const posts: BlogPost[] = [
      {
        date: "Thursday, January 2, 2025",
        description: `Use <MPP> & "charge" with 'receipts'`,
        publishedAt: "2025-01-02",
        title: `MPP & "APIs"`,
        to: "/blog/mpp-apis?a=1&b=2",
      },
    ];

    const rss = renderBlogRss(posts, "https://example.com/");

    expect(rss).toContain("<lastBuildDate>Thu, 02 Jan 2025 00:00:00 GMT");
    expect(rss).toContain("<title>MPP &amp; &quot;APIs&quot;</title>");
    expect(rss).toContain(
      "<description>Use &lt;MPP&gt; &amp; &quot;charge&quot; with &apos;receipts&apos;</description>",
    );
    expect(rss).toContain(
      "<link>https://example.com/blog/mpp-apis?a=1&amp;b=2</link>",
    );
    expect(rss).toContain(
      '<atom:link href="https://example.com/rss.xml" rel="self"',
    );
  });

  it("renders a deterministic empty feed", () => {
    const rss = renderBlogRss([], "https://example.com");

    expect(rss).toContain(
      "<lastBuildDate>Thu, 01 Jan 1970 00:00:00 GMT</lastBuildDate>",
    );
    expect(rss).not.toContain("<item>");
  });
});

function createBlogDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), "mpp-blog-"));
  temporaryDirectories.push(directory);
  return directory;
}

function writePost(
  blogDir: string,
  slug: string,
  overrides: Record<string, unknown> = {},
  heading = "Test post",
) {
  const frontmatter = {
    description: "Test description",
    imageDescription: "Test image description",
    layout: "minimal",
    outline: false,
    publishedAt: "2026-01-02",
    showAskAi: false,
    showFeedback: false,
    showSearch: false,
    title: "Test post",
    ...overrides,
  };
  writeFileSync(
    join(blogDir, `${slug}.mdx`),
    `---\n${stringify(frontmatter)}---\n\n# ${heading} [Test tagline]\n`,
  );
}
