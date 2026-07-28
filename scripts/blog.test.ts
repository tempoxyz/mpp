import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
  it("loads and sorts every post from frontmatter", () => {
    const posts = loadBlogPosts();

    expect(
      posts.map(({ publishedAt, title, to }) => ({
        publishedAt,
        title,
        to,
      })),
    ).toEqual([
      {
        publishedAt: "2026-07-27",
        title: "mppx for agent SDKs and harnesses",
        to: "/blog/mppx-agent-runtimes",
      },
      {
        publishedAt: "2026-06-17",
        title: "An improved sessions experience",
        to: "/blog/sessions-improved",
      },
      {
        publishedAt: "2026-06-08",
        title: "EVM and x402 support",
        to: "/blog/evm-x402-support",
      },
      {
        publishedAt: "2026-05-21",
        title: "Payment hooks",
        to: "/blog/payment-hooks",
      },
      {
        publishedAt: "2026-05-12",
        title: "Subscriptions",
        to: "/blog/subscriptions",
      },
      {
        publishedAt: "2026-04-28",
        title: "Multi-method discovery",
        to: "/blog/multi-method-discovery",
      },
      {
        publishedAt: "2026-04-21",
        title: "Go and Ruby SDKs",
        to: "/blog/go-and-ruby-sdks",
      },
    ]);
    expect(posts[0]?.date).toBe("Monday, July 27, 2026");
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
      name: "incorrect page settings",
      overrides: { layout: "full" },
    },
  ])("rejects $name", ({ expected, overrides }) => {
    const blogDir = createBlogDirectory();
    writePost(blogDir, "invalid", overrides);

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

    expect(loadBlogPosts({ blogDir, missing: "empty" })).toEqual([]);
    expect(() => loadBlogPosts({ blogDir })).toThrow(
      `Blog directory not found: ${blogDir}`,
    );
  });
});

describe("blog RSS", () => {
  it("renders deterministic, escaped items", () => {
    const posts: BlogPost[] = [
      {
        date: "Thursday, January 2, 2025",
        description: "Use <MPP> & charge",
        publishedAt: "2025-01-02",
        title: "MPP & APIs",
        to: "/blog/mpp-apis",
      },
    ];

    const rss = renderBlogRss(posts, "https://example.com/");

    expect(rss).toContain("<lastBuildDate>Thu, 02 Jan 2025 00:00:00 GMT");
    expect(rss).toContain("<title>MPP &amp; APIs</title>");
    expect(rss).toContain(
      "<description>Use &lt;MPP&gt; &amp; charge</description>",
    );
    expect(rss).toContain(
      '<atom:link href="https://example.com/rss.xml" rel="self"',
    );
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
