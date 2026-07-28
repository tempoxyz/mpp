import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BlogPost } from "../src/lib/blog.js";
import { blogContent } from "./vite-blog.js";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0))
    rmSync(directory, { force: true, recursive: true });
});

describe("blog Vite plugin", () => {
  it("exposes validated posts through the virtual browser module", async () => {
    const plugin = blogContent();

    expect(idFilter(plugin.resolveId).test("virtual:blog-posts")).toBe(true);
    expect(idFilter(plugin.resolveId).test("virtual:other")).toBe(false);
    expect(idFilter(plugin.load).test("\0virtual:blog-posts")).toBe(true);

    expect(await runHook(plugin.resolveId, "virtual:blog-posts")).toBe(
      "\0virtual:blog-posts",
    );

    const source = await runHook(plugin.load, "\0virtual:blog-posts");
    expect(typeof source).toBe("string");

    const posts = JSON.parse(
      (source as string).replace("export default ", ""),
    ) as BlogPost[];
    expect(posts.length).toBeGreaterThan(0);
    expect(posts.map((post) => post.publishedAt)).toEqual(
      posts
        .map((post) => post.publishedAt)
        .toSorted()
        .reverse(),
    );
  });

  it("invalidates virtual metadata for every MDX file event", () => {
    const { listeners, moduleGraph, server, ws } = createServer();
    runHook(blogContent().configureServer, server);

    for (const event of ["add", "change", "unlink"]) {
      listeners.get(event)?.(resolve("src/pages/blog/post.mdx"));
    }

    expect(moduleGraph.invalidateModule).toHaveBeenCalledTimes(3);
    expect(ws.send).toHaveBeenCalledTimes(3);
    expect(ws.send).toHaveBeenLastCalledWith({
      path: "*",
      type: "full-reload",
    });
  });

  it("ignores watcher events outside blog MDX files", () => {
    const { listeners, moduleGraph, server, ws } = createServer();
    runHook(blogContent().configureServer, server);

    listeners.get("change")?.(resolve("src/pages/blog/README.md"));
    listeners.get("change")?.(resolve("src/pages/overview.mdx"));

    expect(moduleGraph.invalidateModule).not.toHaveBeenCalled();
    expect(ws.send).not.toHaveBeenCalled();
  });

  it("serves RSS in development and delegates other requests", () => {
    const { getMiddleware, server } = createServer();
    runHook(blogContent().configureServer, server);

    const middleware = getMiddleware();
    const response = {
      end: vi.fn(),
      setHeader: vi.fn(),
    };
    const next = vi.fn();

    middleware({ url: "/rss.xml?preview=1" }, response, next);
    expect(response.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/rss+xml; charset=utf-8",
    );
    expect(response.end).toHaveBeenCalledWith(
      expect.stringContaining("<title>MPP Blog</title>"),
    );
    expect(next).not.toHaveBeenCalled();

    middleware({ url: "/blog" }, response, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("writes RSS only to the public production bundle", async () => {
    const root = createTemporaryDirectory();
    const publicDirectory = join(root, "public");
    const serverDirectory = join(root, "server");
    mkdirSync(publicDirectory);
    mkdirSync(serverDirectory);

    const plugin = blogContent();
    await runHook(plugin.writeBundle, { dir: serverDirectory }, {});
    await runHook(plugin.writeBundle, { dir: publicDirectory }, {});

    expect(existsSync(join(serverDirectory, "rss.xml"))).toBe(false);
    expect(readFileSync(join(publicDirectory, "rss.xml"), "utf8")).toContain(
      '<atom:link href="https://mpp.dev/rss.xml" rel="self"',
    );
  });
});

type Hook = (...args: unknown[]) => unknown;

function idFilter(hook: unknown): RegExp {
  if (
    hook &&
    typeof hook === "object" &&
    "filter" in hook &&
    hook.filter &&
    typeof hook.filter === "object" &&
    "id" in hook.filter &&
    hook.filter.id instanceof RegExp
  )
    return hook.filter.id;
  throw new TypeError("Expected a Vite ID hook filter.");
}

function runHook(hook: unknown, ...args: unknown[]): unknown {
  if (typeof hook === "function") return (hook as Hook)(...args);
  if (hook && typeof hook === "object" && "handler" in hook)
    return (hook as { handler: Hook }).handler(...args);
  throw new TypeError("Expected a Vite plugin hook.");
}

function createServer() {
  const listeners = new Map<string, (filePath: string) => void>();
  const module = {};
  const moduleGraph = {
    getModuleById: vi.fn(() => module),
    invalidateModule: vi.fn(),
  };
  let middleware:
    | ((
        request: { url?: string },
        response: { end: Hook; setHeader: Hook },
        next: Hook,
      ) => void)
    | undefined;
  const watcher = {
    add: vi.fn(),
    on: vi.fn((event: string, listener: (filePath: string) => void) => {
      listeners.set(event, listener);
    }),
  };
  const ws = { send: vi.fn() };
  const server = {
    middlewares: {
      use: vi.fn((handler: typeof middleware) => {
        middleware = handler;
      }),
    },
    moduleGraph,
    watcher,
    ws,
  };

  return {
    getMiddleware() {
      if (!middleware) throw new Error("Middleware was not configured.");
      return middleware;
    },
    listeners,
    moduleGraph,
    server,
    ws,
  };
}

function createTemporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), "mpp-vite-blog-"));
  temporaryDirectories.push(directory);
  return directory;
}
