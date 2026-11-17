import type { MiddlewareHandler } from "hono";

const MAX_BODY_BYTES = 32 * 1024;
const MAX_INPUT_ELEMENTS = 1000;

// Vocs creates its own McpServer and does not expose maxToolInputElements.
// Bound the entire message before its transport or SDK validation sees it.
export default function mcpLimits(): MiddlewareHandler {
  return async (context, next) => {
    if (context.req.method !== "POST") return next();

    let pathname: string;
    try {
      pathname = decodeURIComponent(context.req.path);
    } catch {
      return context.text("Invalid request path", 400);
    }
    if (!/^\/api\/mcp(?:\/|$)/.test(pathname)) return next();

    const request = context.req.raw;
    const reader = request.body?.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    if (reader) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > MAX_BODY_BYTES) {
            await reader.cancel();
            return context.text("MCP request body too large", 413);
          }
          chunks.push(value);
        }
      } finally {
        reader.releaseLock();
      }
    }

    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    let body: unknown;
    try {
      body = size ? JSON.parse(new TextDecoder().decode(bytes)) : {};
    } catch {
      return context.text("Invalid MCP JSON", 400);
    }

    const pending = [body];
    let elements = 0;
    while (pending.length) {
      if (++elements > MAX_INPUT_ELEMENTS)
        return context.text("MCP request has too many input elements", 413);
      const value = pending.pop();
      if (value && typeof value === "object")
        pending.push(...Object.values(value));
    }

    context.req.raw = new Request(request, { body: bytes });
    return next();
  };
}
