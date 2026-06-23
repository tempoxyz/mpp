type JsonObject = Record<string, unknown>;

type RpcRequest = {
  method: string;
  params?: JsonObject;
};

const DEFAULT_TIMEOUT_MS = 10000;

export class HttpMcpClient {
  constructor(
    private readonly endpoint: string,
    private readonly timeoutMs = DEFAULT_TIMEOUT_MS,
  ) {}

  async serverCard(): Promise<JsonObject> {
    const response = await this.fetch({
      headers: { accept: "application/json" },
    });
    if (response.status !== 200) {
      throw new Error(`expected 200, received ${response.status}`);
    }
    return object(await response.json());
  }

  async head(): Promise<void> {
    const response = await this.fetch({ method: "HEAD" });
    if (response.status !== 200) {
      throw new Error(`expected 200, received ${response.status}`);
    }
  }

  initialize(): Promise<JsonObject> {
    return this.rpc({ method: "initialize", params: {} });
  }

  listTools(): Promise<JsonObject> {
    return this.rpc({ method: "tools/list", params: {} });
  }

  callTool(name: string, args: JsonObject): Promise<JsonObject> {
    return this.rpc({
      method: "tools/call",
      params: { name, arguments: args },
    });
  }

  private async rpc(request: RpcRequest): Promise<JsonObject> {
    const response = await this.fetch({
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: request.method,
        params: request.params ?? {},
      }),
    });

    if (response.status !== 200) {
      throw new Error(`expected 200, received ${response.status}`);
    }

    const body = object(await response.json());
    if (body.error) {
      throw new Error(
        `json-rpc error: ${stringValue(object(body.error).message)}`,
      );
    }
    return object(body.result);
  }

  private async fetch(init?: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await fetch(this.endpoint, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function object(value: unknown): JsonObject {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as JsonObject;
  }
  return {};
}

export function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
