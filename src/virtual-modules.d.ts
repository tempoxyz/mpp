declare module "virtual:blog-posts" {
  const posts: readonly import("./lib/blog.js").BlogPost[];
  export default posts;
}
