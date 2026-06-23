const DEFAULT_SITE = "us5.datadoghq.com";
const DEFAULT_SERVICE = "mpp-discovery-service-mcp";
const DEFAULT_ENV = "production";
const DEFAULT_ALERT_TARGET = "@slack-eng-developers-monitor";

const apiKey = requiredEnv("DATADOG_API_KEY");
const appKey = requiredEnv("DATADOG_APP_KEY");
const site = process.env.DATADOG_SITE || DEFAULT_SITE;
const service = process.env.DATADOG_SERVICE || DEFAULT_SERVICE;
const env = process.env.DATADOG_ENV || DEFAULT_ENV;
const alertTarget = process.env.DATADOG_ALERT_TARGET || DEFAULT_ALERT_TARGET;
const apiBase = datadogApiBase(site);
const metricFilter = `service:${service},env:${env}`;
const monitorTags = [`service:${service}`, `env:${env}`, "managed_by:repo"];

const monitors = [
  {
    name: "MPP Discovery Service MCP health failing",
    type: "metric alert",
    query: `avg(last_3m):avg:mpp.discovery_mcp.health.ok{${metricFilter}} < 1`,
    message: [
      `MPP Discovery Service MCP public health is failing. ${alertTarget}`,
      "",
      "The Cloudflare cron check calls https://mpp.dev/mcp/services and validates the MCP card, initialize, tools/list, catalog status, and search_services.",
    ].join("\n"),
    options: {
      thresholds: { critical: 1 },
      notify_no_data: true,
      no_data_timeframe: 5,
      renotify_interval: 60,
      include_tags: true,
    },
  },
  {
    name: "MPP Discovery Service MCP catalog cache stale",
    type: "metric alert",
    query: `avg(last_5m):max:mpp.discovery_mcp.catalog.cache_age_seconds{${metricFilter}} > 10800`,
    message: `MPP Discovery Service MCP catalog cache is older than 3 hours. ${alertTarget}`,
    options: {
      thresholds: { critical: 10800 },
      notify_no_data: false,
      renotify_interval: 60,
      include_tags: true,
    },
  },
  {
    name: "MPP Discovery Service MCP service count low",
    type: "metric alert",
    query: `avg(last_15m):min:mpp.discovery_mcp.catalog.services{${metricFilter}} < 100`,
    message: `MPP Discovery Service MCP catalog has fewer than 100 services. ${alertTarget}`,
    options: {
      thresholds: { critical: 100 },
      notify_no_data: false,
      renotify_interval: 60,
      include_tags: true,
    },
  },
  {
    name: "MPP Discovery Service MCP offer count low",
    type: "metric alert",
    query: `avg(last_15m):min:mpp.discovery_mcp.catalog.offers{${metricFilter}} < 1000`,
    message: `MPP Discovery Service MCP catalog has fewer than 1000 payment offers. ${alertTarget}`,
    options: {
      thresholds: { critical: 1000 },
      notify_no_data: false,
      renotify_interval: 60,
      include_tags: true,
    },
  },
  {
    name: "MPP Discovery Service MCP server errors",
    type: "metric alert",
    query: `sum(last_5m):sum:mpp.discovery_mcp.mcp.error.count{${metricFilter},error_class:server}.as_count() > 0`,
    message: `MPP Discovery Service MCP is returning server-side MCP errors. ${alertTarget}`,
    options: {
      thresholds: { critical: 0 },
      notify_no_data: false,
      renotify_interval: 60,
      include_tags: true,
    },
  },
];

const existing = await listManagedMonitors();
for (const monitor of monitors) {
  const match = existing.find((item) => item.name === monitor.name);
  if (match) {
    await datadogRequest(`/api/v1/monitor/${match.id}`, {
      method: "PUT",
      body: { ...monitor, tags: monitorTags },
    });
    console.log(`Updated monitor ${monitor.name} (${match.id})`);
  } else {
    const created = await datadogRequest("/api/v1/monitor", {
      method: "POST",
      body: { ...monitor, tags: monitorTags },
    });
    console.log(`Created monitor ${monitor.name} (${created.id})`);
  }
}

async function listManagedMonitors() {
  const query = new URLSearchParams({
    monitor_tags: "managed_by:repo",
    name: "MPP Discovery Service MCP",
  });
  return datadogRequest(`/api/v1/monitor?${query.toString()}`, {
    method: "GET",
  });
}

async function datadogRequest(path, { method, body }) {
  const response = await fetch(`${apiBase}${path}`, {
    method,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "DD-API-KEY": apiKey,
      "DD-APPLICATION-KEY": appKey,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : undefined;
  if (!response.ok) {
    throw new Error(
      `Datadog API ${method} ${path} failed: ${response.status} ${text}`,
    );
  }
  return payload;
}

function datadogApiBase(value) {
  if (/^https?:\/\//i.test(value)) return value.replace(/\/+$/, "");
  if (value.startsWith("api.")) return `https://${value}`;
  return `https://api.${value}`;
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}
