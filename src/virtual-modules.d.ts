declare module "virtual:blog-posts" {
  // Supplied at build time by scripts/vite-blog.ts from validated MDX files.
  const posts: readonly import("./lib/blog.js").BlogPost[];
  export default posts;
}
