"use client";

import type { ReactNode } from "react";
import { MdxPageContext } from "vocs";
import { formatBlogDate, formatBlogPostDate } from "../lib/blog.js";

export function BlogPostLayout({ children }: { children: ReactNode }) {
  const { frontmatter } = MdxPageContext.use();

  // Vocs applies a directory wrapper to its index too. The index owns its
  // wider layout; only individual posts receive the shared article chrome.
  if (frontmatter?.filePath === "blog/index.mdx") return children;

  const publishedAt = frontmatter?.publishedAt;
  if (typeof publishedAt !== "string")
    throw new TypeError("Blog posts require publishedAt frontmatter.");

  return (
    <div className="blog-narrow">
      <a href="/blog" className="blog-back">
        <span className="blog-back-label">Blog</span>
      </a>
      <p className="blog-date">
        <time dateTime={publishedAt}>
          {formatBlogPostDate(formatBlogDate(publishedAt))}
        </time>
      </p>
      {children}
    </div>
  );
}
