import { createMetrics } from "cloudflare-worker-metrics";

type EmptyTags = Record<string, never>;
type EndpointTags = { endpoint: string };
type HealthCheckTags = EndpointTags & { check: string };
type HttpTags = {
  method: string;
  route: string;
  status_class: string;
};
type JsonRpcErrorTags = {
  error_code: string;
  mcp_method: string;
  tool_name: string;
};
type ToolTags = {
  outcome: string;
  tool_name: string;
};

export type MppWorkerMetricRegistry = {
  mpp_discovery_mcp_http_request_count: HttpTags;
  mpp_discovery_mcp_http_response_duration_ms: HttpTags;
  mpp_discovery_mcp_http_error_count: HttpTags & { error_class: string };
  mpp_discovery_mcp_health_ok: EndpointTags;
  mpp_discovery_mcp_health_duration_ms: EndpointTags;
  mpp_discovery_mcp_health_check_ok: HealthCheckTags;
  mpp_discovery_mcp_health_check_duration_ms: HealthCheckTags;
  mpp_discovery_mcp_jsonrpc_error_count: JsonRpcErrorTags;
  mpp_discovery_mcp_tool_call_count: ToolTags;
  mpp_discovery_mcp_tool_duration_ms: ToolTags;
  mpp_discovery_mcp_catalog_services: EndpointTags;
  mpp_discovery_mcp_catalog_offers: EndpointTags;
  mpp_discovery_mcp_catalog_cache_age_seconds: EndpointTags;
  mpp_discovery_mcp_catalog_refresh_ok: EmptyTags;
  mpp_discovery_mcp_catalog_refresh_duration_ms: EmptyTags;
};

export const workerMetrics = createMetrics<MppWorkerMetricRegistry>({
  globalTags: {
    component: "discovery_mcp",
    repository: "mpp",
    service: "mpp-discovery-service-mcp",
  },
});

export function flushWorkerMetrics(): void {
  workerMetrics.flush();
}
