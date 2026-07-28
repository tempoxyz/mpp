import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { Plugin } from "vite";
import { loadBlogPosts, renderBlogRss } from "./blog.js";

const BLOG_DIR = path.resolve(import.meta.dirname, "../src/pages/blog");
const BLOG_POSTS_MODULE_ID = "virtual:blog-posts";
const RESOLVED_BLOG_POSTS_MODULE_ID = `\0${BLOG_POSTS_MODULE_ID}`;
const RSS_PATH = "/rss.xml";

/**
 * Connects blog frontmatter to every generated surface.
 *
 * The virtual module gives browser components build-time metadata without
 * bundling Node.js or the YAML parser. The same parsed records feed RSS, so the
 * MDX files remain the only post catalog.
 */
export function blogContent(): Plugin {
  const loadPosts = () => loadBlogPosts({ blogDir: BLOG_DIR });

  return {
    name: "blog-content",
    resolveId: {
      filter: { id: new RegExp(`^${BLOG_POSTS_MODULE_ID}$`) },
      handler() {
        return RESOLVED_BLOG_POSTS_MODULE_ID;
      },
    },
    load: {
      filter: { id: new RegExp(`^${RESOLVED_BLOG_POSTS_MODULE_ID}$`) },
      handler() {
        return `export default ${JSON.stringify(loadPosts())}`;
      },
    },
    configureServer(server) {
      const reloadBlog = (filePath: string) => {
        if (
          path.dirname(filePath) !== BLOG_DIR ||
          path.extname(filePath) !== ".mdx"
        )
          return;

        // Vite cannot discover file dependencies read inside a virtual module.
        // Invalidate it explicitly so new, edited, and removed posts refresh.
        const module = server.moduleGraph.getModuleById(
          RESOLVED_BLOG_POSTS_MODULE_ID,
        );
        if (module) server.moduleGraph.invalidateModule(module);
        server.ws.send({ path: "*", type: "full-reload" });
      };

      server.watcher.add(BLOG_DIR);
      server.watcher.on("add", reloadBlog);
      server.watcher.on("change", reloadBlog);
      server.watcher.on("unlink", reloadBlog);
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url ?? "/", "http://localhost")
          .pathname;
        if (pathname !== RSS_PATH) {
          next();
          return;
        }

        response.setHeader(
          "Content-Type",
          "application/rss+xml; charset=utf-8",
        );
        response.end(renderBlogRss(loadPosts()));
      });
    },
    async writeBundle(options) {
      // Vite runs this plugin for several Waku environments. Only the public
      // bundle owns static assets; writing elsewhere creates duplicate feeds.
      if (!options.dir || path.basename(options.dir) !== "public") return;
      await fs.writeFile(
        path.join(options.dir, RSS_PATH.slice(1)),
        renderBlogRss(loadPosts()),
        "utf8",
      );
    },
  };
}
