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
- Requests use fresh KV data when it is less than one hour old.
- If KV data is stale, requests serve the last-good cached catalog and refresh
  in the background.
- If `mpp.dev` is unreachable during cron refresh, the Worker logs the failure
  and keeps the last-good KV value.
- There is no public write, sync, registration, payment, or auth path.

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
