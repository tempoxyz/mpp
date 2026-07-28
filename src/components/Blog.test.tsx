// @vitest-environment happy-dom

import blogPosts from "virtual:blog-posts";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MdxPageContextProvider } from "vocs";
import { formatBlogPostDate } from "../lib/blog.js";
import { BlogPostLayout } from "./BlogPostLayout.js";
import { BlogPostList } from "./BlogPostList.js";

afterEach(cleanup);

describe("BlogPostLayout", () => {
  it("adds shared navigation and a semantic publish date to posts", () => {
    render(
      <MdxPageContextProvider
        frontmatter={{
          filePath: "blog/post.mdx",
          publishedAt: "2026-01-02",
        }}
      >
        <BlogPostLayout>Post content</BlogPostLayout>
      </MdxPageContextProvider>,
    );

    expect(
      screen.getByRole("link", { name: "Blog" }).getAttribute("href"),
    ).toBe("/blog");
    expect(screen.getByText("Post content").closest(".blog-narrow")).not.toBe(
      null,
    );

    const time = screen.getByText("January 2, 2026");
    expect(time.tagName).toBe("TIME");
    expect(time.getAttribute("datetime")).toBe("2026-01-02");
  });

  it("leaves the blog index outside the article layout", () => {
    const { container } = render(
      <MdxPageContextProvider frontmatter={{ filePath: "blog/index.mdx" }}>
        <BlogPostLayout>Index content</BlogPostLayout>
      </MdxPageContextProvider>,
    );

    expect(screen.getByText("Index content")).not.toBeNull();
    expect(container.querySelector(".blog-narrow")).toBeNull();
    expect(screen.queryByRole("link", { name: "Blog" })).toBeNull();
  });

  it("fails loudly when a post bypasses frontmatter validation", () => {
    expect(() =>
      render(
        <MdxPageContextProvider frontmatter={{ filePath: "blog/post.mdx" }}>
          <BlogPostLayout>Post content</BlogPostLayout>
        </MdxPageContextProvider>,
      ),
    ).toThrow("Blog posts require publishedAt frontmatter.");
  });
});

describe("BlogPostList", () => {
  it("renders every generated post in feed order", () => {
    const { container } = render(<BlogPostList />);
    const links = screen.getAllByRole("link");

    expect(links).toHaveLength(blogPosts.length);
    expect(container.querySelector(".blog-post-list")).not.toBeNull();

    for (const [index, post] of blogPosts.entries()) {
      const link = links[index];
      expect(link.getAttribute("href")).toBe(post.to);
      expect(link.textContent).toContain(formatBlogPostDate(post.date));
      expect(link.textContent).toContain(post.description);
      expect(link.textContent).toContain(post.title);
      expect(link.querySelector(".blog-post-row-arrow")).not.toBeNull();
    }
  });
});
