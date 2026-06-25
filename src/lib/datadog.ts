import { client, v2 } from "@datadog/datadog-api-client";

type MetricType = "count" | "gauge";

export type DatadogMetric = {
  name: string;
  value: number;
  type: MetricType;
  tags?: string[];
};

export type DatadogClientOptions = {
  apiKey?: string;
  enabled?: string | boolean;
  env?: string;
  service?: string;
  site?: string;
  repository?: string;
  component?: string;
  fetch?: typeof fetch;
};

const DEFAULT_DATADOG_SITE = "us5.datadoghq.com";
const DEFAULT_ENV = "production";
const DEFAULT_REPOSITORY = "mpp";

let singletonClient: DatadogMetricsClient | undefined;
let singletonKey: string | undefined;

export function configureDatadogMetrics(
  options: DatadogClientOptions,
): DatadogMetricsClient {
  const key = clientKey(options);
  if (!singletonClient || singletonKey !== key || options.fetch) {
    singletonClient = new DatadogMetricsClient(options);
    singletonKey = key;
  }
  return singletonClient;
}

export function datadogMetrics(): DatadogMetricsClient {
  if (!singletonClient) singletonClient = new DatadogMetricsClient({});
  return singletonClient;
}

export function resetDatadogMetricsForTest(): void {
  singletonClient = undefined;
  singletonKey = undefined;
}

export class DatadogMetricsClient {
  private readonly api?: v2.MetricsApi;
  private readonly baseTags: string[];
  private readonly enabledSetting?: string | boolean;
  private readonly namespaceParts: string[];

  constructor(private readonly options: DatadogClientOptions) {
    this.enabledSetting = options.enabled;
    this.namespaceParts = [options.repository ?? DEFAULT_REPOSITORY];
    if (options.component) this.namespaceParts.push(options.component);
    this.baseTags = [
      `repository:${options.repository ?? DEFAULT_REPOSITORY}`,
      `env:${options.env || DEFAULT_ENV}`,
      ...(options.service ? [`service:${options.service}`] : []),
      ...(options.component ? [`component:${options.component}`] : []),
    ];

    if (options.apiKey) {
      const configuration = client.createConfiguration({
        authMethods: {
          apiKeyAuth: options.apiKey,
        },
        enableRetry: true,
        fetch: options.fetch ?? fetch,
        httpConfig: {
          compress: false,
        },
        maxRetries: 2,
      });
      configuration.setServerVariables({
        site: options.site || DEFAULT_DATADOG_SITE,
      });
      this.api = new v2.MetricsApi(configuration);
    }
  }

  gauge(name: string, value: number, tags?: string[]): DatadogMetric {
    return { name, type: "gauge", value, tags };
  }

  count(name: string, value = 1, tags?: string[]): DatadogMetric {
    return { name, type: "count", value, tags };
  }

  queue(
    waitUntil: (promise: Promise<unknown>) => void,
    metrics: DatadogMetric[],
  ): void {
    if (!this.enabled || metrics.length === 0) return;

    waitUntil(
      this.submit(metrics).catch((error) => {
        console.error(
          JSON.stringify({
            message: "datadog.metrics_failed",
            error: errorMessage(error),
          }),
        );
      }),
    );
  }

  async submit(metrics: DatadogMetric[]): Promise<void> {
    if (!this.enabled || metrics.length === 0) return;

    if (!this.api) {
      console.warn(
        JSON.stringify({
          message: "datadog.metrics_skipped",
          reason: "missing_api_key",
        }),
      );
      return;
    }

    await this.api.submitMetrics({
      body: this.payload(metrics),
    });
  }

  get enabled(): boolean {
    if (typeof this.enabledSetting === "boolean") return this.enabledSetting;
    const configured = String(this.enabledSetting ?? "")
      .trim()
      .toLowerCase();
    if (configured === "true") return true;
    if (configured === "false") return false;
    return Boolean(this.options.apiKey);
  }

  metricName(name: string): string {
    return [...this.namespaceParts, name].join(".");
  }

  private payload(metrics: DatadogMetric[]): v2.MetricPayload {
    const timestamp = Math.floor(Date.now() / 1000);
    return {
      series: metrics.map((metric) => ({
        metric: this.metricName(metric.name),
        points: [{ timestamp, value: metric.value }],
        tags: [...this.baseTags, ...(metric.tags ?? [])],
        type: metric.type === "count" ? 1 : 3,
      })),
    };
  }
}

function clientKey(options: DatadogClientOptions): string {
  return JSON.stringify({
    apiKey: options.apiKey,
    component: options.component,
    enabled: options.enabled,
    env: options.env,
    repository: options.repository,
    service: options.service,
    site: options.site,
    fetch: Boolean(options.fetch),
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
