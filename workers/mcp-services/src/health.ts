import { gauge, type MetricPoint } from "./datadog.js";
import {
  arrayValue,
  HttpMcpClient,
  numberValue,
  object,
  stringValue,
} from "./mcp-client.js";
import type { WorkerEnv } from "./types.js";

type CheckFn = () => Promise<MetricPoint[] | undefined>;

type HealthCheckResult = {
  name: string;
  ok: boolean;
  durationMs: number;
  error?: string;
  metrics?: MetricPoint[];
};

const MAX_CACHE_AGE_SECONDS = 3 * 60 * 60;
const MIN_SERVICE_COUNT = 100;
const MIN_OFFER_COUNT = 1000;
const REQUIRED_TOOLS = [
  "list_services",
  "search_services",
  "get_catalog_status",
];

export class McpHealthChecker {
  private readonly client: HttpMcpClient;

  constructor(private readonly endpoint: string) {
    this.client = new HttpMcpClient(endpoint);
  }

  static fromEnv(env: WorkerEnv): McpHealthChecker {
    return new McpHealthChecker(
      env.PUBLIC_MCP_ENDPOINT || "https://mpp.dev/mcp/services",
    );
  }

  async metrics(): Promise<MetricPoint[]> {
    const results = await this.runChecks();
    const failures = results.filter((result) => !result.ok);
    const metrics = [
      gauge("health.ok", failures.length === 0 ? 1 : 0, ["endpoint:public"]),
      gauge("health.failure.count", failures.length, ["endpoint:public"]),
    ];

    for (const result of results) {
      const tags = [`check:${result.name}`, "endpoint:public"];
      metrics.push(
        gauge("health.check.ok", result.ok ? 1 : 0, tags),
        gauge("health.check.duration_ms", result.durationMs, tags),
        ...(result.metrics ?? []),
      );
    }

    if (failures.length > 0) {
      console.error(
        JSON.stringify({
          message: "mcp.health_failed",
          endpoint: this.endpoint,
          failures: failures.map((failure) => ({
            check: failure.name,
            error: failure.error,
          })),
        }),
      );
    }

    return metrics;
  }

  private runChecks(): Promise<HealthCheckResult[]> {
    return this.sequential([
      ["get_card", () => this.assertServerCard()],
      ["head", () => this.assertHead()],
      ["initialize", () => this.assertInitialize()],
      ["tools_list", () => this.checkToolsList()],
      ["get_catalog_status", () => this.checkCatalogStatus()],
      ["search_services", () => this.assertSearchServices()],
    ]);
  }

  private async sequential(
    checks: Array<[string, CheckFn]>,
  ): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];
    for (const [name, check] of checks) {
      results.push(await this.measured(name, check));
    }
    return results;
  }

  private async measured(
    name: string,
    check: CheckFn,
  ): Promise<HealthCheckResult> {
    const startedAt = Date.now();
    try {
      const metrics = await check();
      return {
        name,
        ok: true,
        durationMs: Date.now() - startedAt,
        ...(metrics ? { metrics } : {}),
      };
    } catch (error) {
      return {
        name,
        ok: false,
        durationMs: Date.now() - startedAt,
        error: errorMessage(error),
      };
    }
  }

  private async assertServerCard(): Promise<undefined> {
    const card = await this.client.serverCard();
    const transport = object(card.transport);
    if (stringValue(object(card.serverInfo).name) !== "mpp-services-mcp") {
      throw new Error("server card name mismatch");
    }
    if (stringValue(transport.endpoint) !== this.endpoint) {
      throw new Error("server card endpoint mismatch");
    }
    if (!stringValue(card.instructions).includes("402")) {
      throw new Error("server card is missing payment authority instructions");
    }
    return undefined;
  }

  private async assertHead(): Promise<undefined> {
    await this.client.head();
    return undefined;
  }

  private async assertInitialize(): Promise<undefined> {
    const result = await this.client.initialize();
    if (stringValue(object(result.serverInfo).name) !== "mpp-services-mcp") {
      throw new Error("initialize serverInfo mismatch");
    }
    if (!stringValue(result.instructions).includes("402")) {
      throw new Error("initialize instructions missing 402 authority text");
    }
    return undefined;
  }

  private async checkToolsList(): Promise<MetricPoint[]> {
    const result = await this.client.listTools();
    const tools = arrayValue(result.tools);
    const names = new Set(
      tools
        .map((tool) => object(tool).name)
        .filter((name): name is string => typeof name === "string"),
    );
    for (const required of REQUIRED_TOOLS) {
      if (!names.has(required)) throw new Error(`missing tool ${required}`);
    }
    return [gauge("tools.advertised", tools.length)];
  }

  private async checkCatalogStatus(): Promise<MetricPoint[]> {
    const result = await this.checkedTool("get_catalog_status", {});
    const content = object(result.structuredContent);
    const serviceCount = numberValue(content.serviceCount);
    const offerCount = numberValue(content.offerCount);
    const cacheAgeSeconds = numberValue(content.cacheAgeSeconds);

    if (serviceCount < MIN_SERVICE_COUNT) {
      throw new Error(`serviceCount below ${MIN_SERVICE_COUNT}`);
    }
    if (offerCount < MIN_OFFER_COUNT) {
      throw new Error(`offerCount below ${MIN_OFFER_COUNT}`);
    }
    if (cacheAgeSeconds > MAX_CACHE_AGE_SECONDS) {
      throw new Error(`cacheAgeSeconds above ${MAX_CACHE_AGE_SECONDS}`);
    }

    return [
      gauge("catalog.services", serviceCount),
      gauge("catalog.offers", offerCount),
      gauge("catalog.cache_age_seconds", cacheAgeSeconds),
    ];
  }

  private async assertSearchServices(): Promise<undefined> {
    const result = await this.checkedTool("search_services", {
      category: "ai",
      limit: 1,
    });
    const content = object(result.structuredContent);
    if (numberValue(content.total) <= 0) {
      throw new Error("expected at least one ai service");
    }
    if (numberValue(content.returned) <= 0) {
      throw new Error("expected one returned ai service");
    }
    return undefined;
  }

  private async checkedTool(name: string, args: Record<string, unknown>) {
    const result = await this.client.callTool(name, args);
    if (result.isError === true) {
      throw new Error(`tool returned isError: ${name}`);
    }
    return result;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
