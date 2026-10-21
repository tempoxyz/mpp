import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import mcpLimits from "../src/middleware/mcp-limits.js";

function createApp() {
  const app = new Hono();
  app.use(mcpLimits());
  app.post("*", async (context) => context.text(await context.req.raw.text()));
  return app;
}

describe("docs MCP request limits", () => {
  it.each([
    "/api/mcp",
    "/api/mcp/messages?sessionId=test",
    "/api/%6dcp",
  ])("preserves normal request bodies at %s", async (path) => {
    const body = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: "search_docs", arguments: { query: "payments" } },
    });
    const response = await createApp().request(path, { method: "POST", body });
    expect(response.status).toBe(200);
    expect(await response.text()).toBe(body);
  });

  it("rejects oversized streamed bodies without trusting Content-Length", async () => {
    const bytes = new TextEncoder().encode(
      JSON.stringify("x".repeat(32 * 1024)),
    );
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(bytes.subarray(0, 100));
        controller.enqueue(bytes.subarray(100));
        controller.close();
      },
    });
    const request = new Request("http://localhost/api/mcp", {
      method: "POST",
      headers: { "content-length": "100" },
      body,
      // @ts-expect-error Node requires duplex for streamed request bodies.
      duplex: "half",
    });
    const response = await createApp().fetch(request);
    expect(response.status).toBe(413);
    expect(await response.text()).toBe("MCP request body too large");
  });

  it.each([
    Array(1001).fill(0),
    Object.fromEntries(Array.from({ length: 1001 }, (_, i) => [i, 0])),
  ])("rejects excessive array elements or object keys before SDK validation", async (argumentsValue) => {
    const response = await createApp().request("/api/mcp/messages", {
      method: "POST",
      body: JSON.stringify({
        method: "tools/call",
        params: { arguments: argumentsValue },
      }),
    });
    expect(response.status).toBe(413);
    expect(await response.text()).toBe(
      "MCP request has too many input elements",
    );
  });

  it("rejects malformed JSON", async () => {
    const response = await createApp().request("/api/mcp", {
      method: "POST",
      body: "{",
    });
    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Invalid MCP JSON");
  });

  it("leaves other POST routes unchanged", async () => {
    const body = "x".repeat(40 * 1024);
    const response = await createApp().request("/api/photo", {
      method: "POST",
      body,
    });
    expect(response.status).toBe(200);
    expect(await response.text()).toBe(body);
  });
});
