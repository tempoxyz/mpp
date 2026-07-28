import { describe, expect, it } from "vitest";
import { BLOG_POSTS, formatBlogPostDate } from "./blog";

describe("BLOG_POSTS", () => {
  it("contains unique posts in reverse chronological order", () => {
    const routes = BLOG_POSTS.map((post) => post.to);
    const timestamps = BLOG_POSTS.map((post) => Date.parse(post.date));

    expect(new Set(routes).size).toBe(routes.length);
    expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a));
  });
});

describe("formatBlogPostDate", () => {
  it("removes the weekday", () => {
    expect(formatBlogPostDate("Monday, July 27, 2026")).toBe("July 27, 2026");
  });
});
