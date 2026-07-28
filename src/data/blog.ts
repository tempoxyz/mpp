import posts from "./blog.json";

export type BlogPost = {
  date: string;
  description: string;
  title: string;
  to: string;
};

export const BLOG_POSTS: readonly BlogPost[] = posts;

export function formatBlogPostDate(date: string) {
  return date.replace(/^[A-Za-z]+,\s*/, "");
}
