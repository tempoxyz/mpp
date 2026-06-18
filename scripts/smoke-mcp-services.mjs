#!/usr/bin/env node

import { appendFile } from "node:fs/promises";

const DEFAULT_ENDPOINT = "https://mpp.dev/mcp/services";
const endpoint = normalizeEndpoint(
  process.env.MCP_SERVICES_URL ?? DEFAULT_ENDPOINT,
);
const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
const requestTimeoutMs = Number(process.env.MCP_SMOKE_TIMEOUT_MS ?? 30_000);
const maxCacheAgeSeconds = Number(
  process.env.MCP_SMOKE_MAX_CACHE_AGE_SECONDS ?? 3 * 60 * 60,
);

const requiredTools = [
  "list_services",
  "search_services",
  "search_offers",
  "recommend_services",
  "get_usage_recipe",
  "get_facets",
  "get_catalog_status",
  "get_service",
  "get_offers",
  "get_openapi",
];

const results = [];
const state = {
  catalogStatus: undefined,
  tools: undefined,
};
let requestId = 1;

async function main() {
  await check("server card GET", async () => {
    const { response, json } = await fetchJson(endpoint, { method: "GET" });
    expect(response.ok, `GET returned HTTP ${response.status}`);
    expect(json?.serverInfo?.name === "mpp-services-mcp", "unexpected server");
    expect(
      json?.transport?.type === "streamable-http",
      "missing streamable-http transport",
    );
    expect(
      String(json?.transport?.endpoint ?? "").endsWith("/mcp/services"),
      "server card endpoint must advertise /mcp/services",
    );
    if (endpoint === DEFAULT_ENDPOINT) {
      expect(
        json.transport.endpoint === DEFAULT_ENDPOINT,
        "production server card must advertise the production endpoint",
      );
    }
    const instructions = String(json?.instructions ?? "").toLowerCase();
    expect(instructions.includes("advisory"), "instructions must say advisory");
    expect(instructions.includes("402"), "instructions must mention 402");
    return `endpoint ${json.transport.endpoint}`;
  });

  await check("server card HEAD", async () => {
    const response = await fetchWithTimeout(endpoint, { method: "HEAD" });
    expect(response.ok, `HEAD returned HTTP ${response.status}`);
    return `HTTP ${response.status}`;
  });

  await check("initialize", async () => {
    const result = await rpc("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "mpp-services-smoke", version: "1.0.0" },
    });
    expect(result?.serverInfo?.name === "mpp-services-mcp", "wrong serverInfo");
    const instructions = String(result?.instructions ?? "").toLowerCase();
    expect(instructions.includes("advisory"), "instructions must say advisory");
    expect(instructions.includes("402"), "instructions must mention 402");
    return result.serverInfo.version
      ? `version ${result.serverInfo.version}`
      : "serverInfo ok";
  });

  await check("tools/list", async () => {
    const result = await rpc("tools/list", {});
    const tools = result?.tools;
    expect(Array.isArray(tools), "tools/list did not return tools");
    const toolNames = tools.map((tool) => tool.name).filter(Boolean);
    const missing = requiredTools.filter(
      (toolName) => !toolNames.includes(toolName),
    );
    expect(missing.length === 0, `missing tools: ${missing.join(", ")}`);
    expect(toolNames.length >= requiredTools.length, "unexpected tool count");
    state.tools = toolNames;
    return `${toolNames.length} tools`;
  });

  await check("list_services", async () => {
    const result = await toolCall("list_services", { limit: 10 });
    expectToolOk(result);
    const data = result.structuredContent;
    expect(data.total >= 100, `service total too low: ${data.total}`);
    expect(data.returned === 10, `expected returned=10, got ${data.returned}`);
    expect(Array.isArray(data.services), "services must be an array");
    expect(
      !Object.hasOwn(data, "count"),
      "list_services must not return count",
    );
    return `${data.returned} of ${data.total} services`;
  });

  await check("search_services", async () => {
    const result = await toolCall("search_services", {
      category: "ai",
      method: "tempo",
      limit: 10,
    });
    expectToolOk(result);
    const data = result.structuredContent;
    expect(data.total >= 5, `AI service total too low: ${data.total}`);
    expect(data.returned > 0, "expected at least one AI service");
    expect(
      data.appliedFilters?.category === "ai" &&
        data.appliedFilters?.method === "tempo",
      "filters were not echoed",
    );
    return `${data.returned} of ${data.total} AI services`;
  });

  await check("search_offers", async () => {
    const result = await toolCall("search_offers", {
      query: "email",
      category: "ai",
      method: "tempo",
      limit: 10,
    });
    expectToolOk(result);
    const data = result.structuredContent;
    expect(data.total > 0, "expected email payment offers");
    expect(data.returned > 0, "expected returned offers");
    expect(Array.isArray(data.offers), "offers must be an array");
    expect(
      data.offers.every((offer) => offer.service?.id && offer.payment?.method),
      "offers must include service and payment metadata",
    );
    return `${data.returned} of ${data.total} offers`;
  });

  await check("recommend_services", async () => {
    const result = await toolCall("recommend_services", {
      task: "send email from an AI agent",
      constraints: { category: "ai", method: "tempo", limit: 5 },
    });
    expectToolOk(result);
    const data = result.structuredContent;
    expect(data.total > 0, "expected recommendations");
    expect(
      Array.isArray(data.recommendations),
      "recommendations must be an array",
    );
    expect(
      data.recommendations.length > 0,
      "expected returned recommendations",
    );
    expect(
      data.recommendations.some(
        (recommendation) =>
          recommendation.service?.id && recommendation.reasons,
      ),
      "recommendations must include reasons",
    );
    return `${data.returned} of ${data.total} recommendations`;
  });

  await check("get_usage_recipe", async () => {
    const result = await toolCall("get_usage_recipe", {
      service: "agentmail",
      route: "POST /v0/inboxes",
    });
    expectToolOk(result);
    const data = result.structuredContent;
    expect(data.service?.id === "agentmail", "expected agentmail recipe");
    expect(
      Array.isArray(data.endpointCandidates),
      "missing endpoint candidates",
    );
    expect(
      data.endpointCandidates.length >= 1,
      "expected an endpoint candidate",
    );
    expect(
      data.endpointCandidates.some(
        (endpointCandidate) =>
          endpointCandidate.method === "POST" &&
          endpointCandidate.path === "/v0/inboxes",
      ),
      "expected POST /v0/inboxes candidate",
    );
    expect(
      data.recipe?.paymentAuthority
        ?.toLowerCase()
        .includes("402 challenge is authoritative"),
      "recipe must include payment authority warning",
    );
    return `${data.endpointCandidates.length} endpoint candidate(s)`;
  });

  await check("get_facets", async () => {
    const result = await toolCall("get_facets", {});
    expectToolOk(result);
    const data = result.structuredContent;
    expect(
      data.serviceCount >= 100,
      `serviceCount too low: ${data.serviceCount}`,
    );
    expect(data.offerCount >= 1000, `offerCount too low: ${data.offerCount}`);
    expect(
      facetValues(data.facets?.categories).includes("ai"),
      "missing ai category facet",
    );
    expect(
      facetValues(data.facets?.paymentMethods).includes("tempo"),
      "missing tempo payment method facet",
    );
    return `${data.serviceCount} services, ${data.offerCount} offers`;
  });

  await check("get_catalog_status", async () => {
    const result = await toolCall("get_catalog_status", {});
    expectToolOk(result);
    const data = result.structuredContent;
    expect(
      data.serviceCount >= 100,
      `serviceCount too low: ${data.serviceCount}`,
    );
    expect(data.offerCount >= 1000, `offerCount too low: ${data.offerCount}`);
    expect(
      typeof data.cacheAgeSeconds === "number",
      "cacheAgeSeconds must be numeric",
    );
    expect(
      data.cacheAgeSeconds <= maxCacheAgeSeconds,
      `cache age ${data.cacheAgeSeconds}s exceeds ${maxCacheAgeSeconds}s`,
    );
    expect(
      data.sourceUrl === "https://mpp.dev/api/services",
      "wrong source URL",
    );
    state.catalogStatus = data;
    return `${data.serviceCount} services, ${data.offerCount} offers, cache ${formatDuration(data.cacheAgeSeconds)}`;
  });

  await check("get_service", async () => {
    const result = await toolCall("get_service", { id_or_name: "agentmail" });
    expectToolOk(result);
    const data = result.structuredContent;
    expect(data.service?.id === "agentmail", "expected agentmail service");
    expect(Array.isArray(data.service.endpoints), "service endpoints missing");
    expect(data.service.endpoints.length > 0, "expected service endpoints");
    return `${data.service.endpoints.length} endpoints`;
  });

  await check("get_offers", async () => {
    const result = await toolCall("get_offers", {
      service: "agentmail",
      route: "POST /v0/inboxes",
    });
    expectToolOk(result);
    const data = result.structuredContent;
    expect(data.count >= 1, "expected at least one AgentMail offer");
    expect(Array.isArray(data.offers), "offers must be an array");
    expect(
      data.offers.some(
        (offer) =>
          offer.method === "POST" &&
          offer.path === "/v0/inboxes" &&
          offer.payment?.method,
      ),
      "expected paid POST /v0/inboxes offer",
    );
    return `${data.count} offers`;
  });

  await check("get_openapi", async () => {
    const openrouter = await toolCall("get_openapi", { service: "openrouter" });
    expectToolOk(openrouter);
    const openrouterData = openrouter.structuredContent;
    const openrouterText = toolText(openrouter).toLowerCase();
    expect(!openrouterText.includes("<html"), "OpenRouter returned HTML");
    expect(
      openrouterData.source === "registry" ||
        openrouterData.openapi?.source === "registry",
      "OpenRouter should fall back to registry data",
    );

    const agentmail = await toolCall("get_openapi", { service: "agentmail" });
    expectToolOk(agentmail);
    const agentmailData = agentmail.structuredContent;
    expect(agentmailData.openapi, "AgentMail OpenAPI response missing");
    expect(
      !toolText(agentmail).toLowerCase().includes("<html"),
      "AgentMail returned HTML",
    );
    return `openrouter ${openrouterData.source}, agentmail ${agentmailData.source}`;
  });

  await check("invalid category isError", async () => {
    const result = await toolCall("search_services", { category: "boguscat" });
    expect(result.isError === true, "invalid category must return isError");
    expect(
      result.structuredContent?.success === false,
      "invalid category should be structured as unsuccessful",
    );
    expect(
      String(result.structuredContent?.error ?? "").includes("Allowed values:"),
      "invalid category should include allowed values",
    );
    return "invalid enum rejected";
  });

  await reportToSlack();
  await writeStepSummary();

  const failed = results.filter((result) => !result.ok);
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

async function check(name, fn) {
  const startedAt = Date.now();
  try {
    const detail = await fn();
    results.push({
      name,
      ok: true,
      detail,
      durationMs: Date.now() - startedAt,
    });
    console.log(`ok - ${name}${detail ? `: ${detail}` : ""}`);
  } catch (error) {
    const message = errorMessage(error);
    results.push({
      name,
      ok: false,
      detail: message,
      durationMs: Date.now() - startedAt,
    });
    console.error(`not ok - ${name}: ${message}`);
  }
}

async function rpc(method, params) {
  const { response, json, text } = await fetchJson(endpoint, {
    method: "POST",
    headers: {
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: requestId++,
      method,
      params,
    }),
  });
  expect(
    response.ok,
    `POST ${method} returned HTTP ${response.status}: ${text}`,
  );
  expect(json?.jsonrpc === "2.0", `${method} returned invalid JSON-RPC`);
  if (json.error) {
    throw new Error(
      `${method} JSON-RPC error ${json.error.code}: ${json.error.message}`,
    );
  }
  return json.result;
}

async function toolCall(name, args) {
  return rpc("tools/call", { name, arguments: args });
}

async function fetchJson(url, init) {
  const response = await fetchWithTimeout(url, init);
  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    throw new Error(
      `expected JSON from ${init?.method ?? "GET"} ${url}, got ${snippet(text)}`,
    );
  }
  return { response, json, text };
}

async function fetchWithTimeout(url, init) {
  return fetch(url, {
    ...init,
    signal: AbortSignal.timeout(requestTimeoutMs),
  });
}

function expectToolOk(result) {
  expect(result && typeof result === "object", "tool returned no result");
  if (result.isError) {
    throw new Error(
      `tool returned isError: ${
        result.structuredContent?.error ?? toolText(result) ?? "unknown error"
      }`,
    );
  }
  expect(result.structuredContent, "missing structuredContent");
  expect(Array.isArray(result.content), "missing text content");
}

function expect(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function toolText(result) {
  return (result?.content ?? [])
    .map((content) => (content?.type === "text" ? content.text : ""))
    .filter(Boolean)
    .join("\n");
}

function facetValues(values) {
  return Array.isArray(values) ? values.map((entry) => entry.value) : [];
}

function normalizeEndpoint(value) {
  return value.replace(/\/+$/, "");
}

function formatDuration(seconds) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) {
    return "unknown";
  }
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  if (seconds < 60 * 60) {
    return `${Math.round(seconds / 60)}m`;
  }
  return `${(seconds / 3600).toFixed(1)}h`;
}

function snippet(text) {
  return JSON.stringify(String(text).slice(0, 240));
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function buildSummaryText() {
  const failed = results.filter((result) => !result.ok);
  const passed = results.length - failed.length;
  const status = failed.length > 0 ? "unhealthy" : "healthy";
  const catalog = state.catalogStatus;
  const runUrl =
    process.env.GITHUB_SERVER_URL &&
    process.env.GITHUB_REPOSITORY &&
    process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : undefined;
  const lines = [
    `MPP services MCP smoke: ${status}`,
    `Endpoint: ${endpoint}`,
    `Checks: ${passed}/${results.length} passed`,
  ];
  if (catalog) {
    lines.push(
      `Catalog: ${catalog.serviceCount} services, ${catalog.offerCount} offers, cache age ${formatDuration(catalog.cacheAgeSeconds)}`,
    );
  }
  if (state.tools) {
    lines.push(`Tools: ${state.tools.length}`);
  }
  if (failed.length > 0) {
    lines.push(
      `Failures: ${failed
        .slice(0, 5)
        .map((result) => `${result.name} (${result.detail})`)
        .join("; ")}`,
    );
  }
  if (runUrl) {
    lines.push(`Run: ${runUrl}`);
  }
  return lines.join("\n");
}

async function writeStepSummary() {
  if (!process.env.GITHUB_STEP_SUMMARY) {
    return;
  }
  const failed = results.filter((result) => !result.ok);
  const rows = results
    .map(
      (result) =>
        `| ${result.ok ? "pass" : "fail"} | ${result.name} | ${String(
          result.detail ?? "",
        ).replaceAll("|", "\\|")} | ${result.durationMs} |`,
    )
    .join("\n");
  const summary = [
    "# MPP services MCP smoke",
    "",
    buildSummaryText(),
    "",
    "| Status | Check | Detail | Duration ms |",
    "| --- | --- | --- | ---: |",
    rows,
    "",
    failed.length > 0 ? "Result: unhealthy" : "Result: healthy",
    "",
  ].join("\n");
  await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
}

async function reportToSlack() {
  if (!slackWebhookUrl) {
    console.log("SLACK_WEBHOOK_URL is not set; skipping Slack report.");
    return;
  }
  const startedAt = Date.now();
  try {
    const response = await fetchWithTimeout(slackWebhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: buildSummaryText() }),
    });
    if (!response.ok) {
      const text = await response.text();
      results.push({
        name: "Slack report",
        ok: false,
        detail: `Slack webhook returned HTTP ${response.status}: ${snippet(text)}`,
        durationMs: Date.now() - startedAt,
      });
      console.error(results.at(-1).detail);
      return;
    }
    console.log("ok - Slack report");
  } catch (error) {
    results.push({
      name: "Slack report",
      ok: false,
      detail: errorMessage(error),
      durationMs: Date.now() - startedAt,
    });
    console.error(results.at(-1).detail);
  }
}

main().catch((error) => {
  console.error(errorMessage(error));
  process.exitCode = 1;
});
