# mpp-services-mcp

Read-only Cloudflare Worker MCP server for the MPP service discovery catalog.

Production endpoint:

```text
https://mpp.dev/mcp/services
```

The production URL is served by the `mpp.dev` Vercel app through a rewrite to
this Worker. Set the Vercel environment variable
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
- `get_service(id_or_name)`
- `get_offers(service, route?)`
- `get_openapi(service, raw?)`

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

Deploys are pinned to the Tempo Production Cloudflare account:

```text
Tempo Production Resources / ba6ee3674b03f08481e57ff9992c601e
```

Deploy:

```bash
pnpm --filter mpp-services-mcp deploy:dry-run
pnpm --filter mpp-services-mcp deploy
```

The deploy script creates `wrangler.deploy.jsonc` locally, resolving or creating
the production `MPP_CATALOG_CACHE` KV namespace before invoking Wrangler. It
requires `CLOUDFLARE_API_TOKEN` with Account Read, Workers Scripts Write, and
Workers KV Storage Write permissions. Zone permissions are not required.
