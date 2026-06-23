# mpp-services-mcp

Read-only Cloudflare Worker MCP server for the MPP service discovery catalog.

Production endpoint:

```text
https://mpp.dev/mcp/services
```

The production URL is served by the `mpp.dev` Vercel app through its MCP
services proxy route. Set the Vercel environment variable
`MPP_SERVICES_MCP_WORKER_ORIGIN` to the production Worker origin.

Dev mirror:

```text
https://mpp-discovery-mcp.tempo-dev.workers.dev/mcp
```

The dev mirror remains deployed from `tempoxyz/mpp-discovery-mcp`.

## Data source

The Worker reads `GET https://mpp.dev/api/services`, which returns:

```ts
{ version: number, services: Service[] }
```

Offers are read from `service.endpoints[].payment`. The Worker does not fetch
per-service `/openapi.json` files while refreshing the catalog.

Discovery is advisory. The runtime `402 Challenge` from the target paid API is
authoritative.

## Refresh model

- KV binding: `MPP_CATALOG_CACHE`
- Cache key: `mpp:services:v1`
- Hourly cron: `0 * * * *`
- Health cron: `* * * * *`
- Requests use fresh KV data when it is less than one hour old.
- If KV data is stale, requests serve the last-good cached catalog and refresh
  in the background.
- If `mpp.dev` is unreachable during cron refresh, the Worker logs the failure
  and keeps the last-good KV value.
- There is no public write, sync, registration, payment, or auth path.

## Datadog monitoring

The Worker emits custom Datadog metrics directly from production. Runtime
request metrics are emitted with `ctx.waitUntil()` so user-facing MCP responses
do not wait on Datadog ingestion.

The one-minute health cron calls the public endpoint
`https://mpp.dev/mcp/services`, then checks:

- `GET /mcp/services`
- `HEAD /mcp/services`
- JSON-RPC `initialize`
- JSON-RPC `tools/list`
- JSON-RPC `tools/call` for `get_catalog_status`
- JSON-RPC `tools/call` for `search_services`

Metrics use the `mpp.discovery_mcp.*` namespace. Important metrics include:

- `mpp.discovery_mcp.http.request.count`
- `mpp.discovery_mcp.http.response.duration_ms`
- `mpp.discovery_mcp.mcp.request.count`
- `mpp.discovery_mcp.mcp.response.duration_ms`
- `mpp.discovery_mcp.mcp.error.count`
- `mpp.discovery_mcp.health.ok`
- `mpp.discovery_mcp.health.check.ok`
- `mpp.discovery_mcp.health.check.duration_ms`
- `mpp.discovery_mcp.catalog.services`
- `mpp.discovery_mcp.catalog.offers`
- `mpp.discovery_mcp.catalog.cache_age_seconds`
- `mpp.discovery_mcp.catalog.refresh.ok`

Production Worker vars:

```text
DATADOG_ENABLED=true
DATADOG_ENV=production
DATADOG_SERVICE=mpp-discovery-service-mcp
DATADOG_SITE=us5.datadoghq.com
```

Production Worker secret:

```text
DATADOG_API_KEY=<datadog-api-key>
```

Only the Worker metrics API key is required by this package. Configure Datadog
notifications manually from these emitted metrics.

## Tools

All tool responses include `structuredContent`, an `outputSchema`, and a text
summary. Discovery is advisory; the runtime `402 Challenge` from the target
paid API remains authoritative.

- `list_services(limit?, offset?)`
- `search_services(query?, category?, method?, integration?, status?, limit?, offset?)`
- `search_offers(query?, category?, method?, currency?, maxAmount?, unitType?, dynamic?, recipient?, integration?, status?, limit?, offset?)`
- `recommend_services(task, constraints?)`
- `get_usage_recipe(service, route?)`
- `get_facets()`
- `get_services_by_recipient(recipient, limit?, offset?)`
- `get_catalog_status()`
- `get_service(id_or_name)`
- `get_offers(service, route?)`
- `get_openapi(service, raw?)`

`search_offers` is the preferred tool when an agent needs to choose a payable
endpoint rather than a provider. It returns endpoint-level offers with service
metadata, normalized display pricing where possible, match metadata, and
ranking signals such as active status, first-party integration, fixed pricing,
and OpenAPI availability.

`recommend_services` is the preferred tool when an agent has a natural-language
task and needs a ranked shortlist. It applies optional exact constraints and
returns reasons, matched task terms, top payment offers, and follow-up MCP
actions.

`get_usage_recipe` is the preferred follow-up after an agent chooses a service.
It returns payable endpoint candidates, target URLs, and the HTTP/`402` steps
needed to use the service. It does not proxy requests or execute payments.

## MCP client config

```json
{
  "mcpServers": {
    "mpp-services": {
      "url": "https://mpp.dev/mcp/services"
    }
  }
}
```

## Development

```bash
pnpm install
pnpm --filter mpp-services-mcp check
pnpm --filter mpp-services-mcp dev
```

Production deploys run from the `production` GitHub Environment. Configure:

```text
CLOUDFLARE_ACCOUNT_ID=<production-account-id>  # GitHub Environment variable
CLOUDFLARE_API_TOKEN=<deploy-token>            # GitHub Environment secret
```

The token is provisioned through `tempoxyz/secrets`; request `account: prd`
with `account_settings_read`, `workers_scripts_write`, and
`workers_kv_storage_write`.

Local deployments use the same environment variables:

```bash
export CLOUDFLARE_ACCOUNT_ID=<account-id>
export CLOUDFLARE_API_TOKEN=<deploy-token>
pnpm --filter mpp-services-mcp deploy:dry-run
pnpm --filter mpp-services-mcp deploy
```

The deploy script creates `wrangler.deploy.jsonc` locally, resolving or creating
the production `MPP_CATALOG_CACHE` KV namespace before invoking Wrangler. It
requires `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` with Account Read,
Workers Scripts Write, and Workers KV Storage Write permissions. Zone
permissions are not required.
