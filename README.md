# Machine Payments Protocol (MPP)

The marketing site, developer documentation, and service directory for the Machine Payments Protocol.

## Overview

This repository contains:

* **Documentation** — quickstart guides, protocol explainers, and SDK references
* **Service Directory** — a registry of MPP-enabled services

## Development

```bash
pnpm install      # Install dependencies
pnpm run dev      # Start development server
pnpm run build    # Production build
pnpm run preview  # Preview production build
```

## Contributing to the service directory

The service directory at [mpp.dev/services](https://mpp.dev/services) lists all MPP-enabled services. To add or update a service, edit the registry source file and open a pull request.

### Add a new service

1. **Edit `schemas/services.ts`** — add a new entry to the `services` array:

```ts
{
  id: "my-service",
  name: "My Service",
  url: "https://example.com",
  serviceUrl: "https://api.example.com",
  description: "What your service does.",
  categories: ["ai"],
  integration: "first-party",
  tags: ["llm", "chat"],
  docs: {
    homepage: "https://docs.example.com",
    llmsTxt: "https://docs.example.com/llms.txt",
  },
  provider: { name: "Example Inc.", url: "https://example.com" },
  realm: MPP_REALM,
  intent: "charge",
  payment: TEMPO_PAYMENT,
  endpoints: [
    { route: "POST /v1/completions", desc: "Generate completions", amount: "5000" },
    { route: "GET /v1/models", desc: "List models" },
  ],
}
```

1. **Regenerate the discovery file**:

```bash
node scripts/generate-discovery.ts
```

1. **Validate** — the build runs schema validation automatically:

```bash
pnpm check:types
pnpm build
```

1. **Open a pull request** with both `schemas/services.ts` and `schemas/discovery.json` changes.

### Service schema

Each service entry requires:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | URL-safe unique identifier (`^[a-z0-9-]+$`) |
| `name` | `string` | Human-readable display name |
| `serviceUrl` | `string` | MPP service URL |
| `endpoints` | `EndpointDef[]` | List of API endpoints with pricing |
| `intent` | `"charge" \| "session"` | Default payment intent |
| `payment` | `PaymentDefaults` | Payment method, currency, and decimals |

See [`schemas/discovery.schema.json`](schemas/discovery.schema.json) for the full JSON Schema.

### Endpoint pricing

Prices are specified in **base units** of the currency. For USDC (6 decimals):

| Amount | Human-readable |
|--------|---------------|
| `"1000"` | $0.001 |
| `"5000"` | $0.005 |
| `"100000"` | $0.10 |
| `"1000000"` | $1.00 |

Set `dynamic: true` for endpoints where pricing varies by request (for example, per-token LLM pricing).

## Contributing

We welcome contributions to documentation, the service directory, and site improvements.

### Pull request checklist

1. **Types pass**: `pnpm check:types`
2. **Build succeeds**: `pnpm build`
3. **Lint passes**: `pnpm check`
4. **E2E tests pass** (if touching terminal or interactive components): `pnpm test:e2e`

### Types of changes

| Change type | Process |
|-------------|---------|
| Typo or editorial fix | Direct PR to `main` |
| New documentation page | Follow existing page structure in `src/pages/` |
| New service listing | Edit `schemas/services.ts`, regenerate, PR |
| Service update | Edit the service entry in `schemas/services.ts`, regenerate, PR |
| New component | Follow patterns in `src/components/` |
| Site configuration | Open an issue first for discussion |

## Related repositories

| Repository | Description |
|------------|-------------|
| [tempoxyz/mpp-specs](https://github.com/tempoxyz/mpp-specs) | IETF specifications |
| [wevm/mppx](https://github.com/wevm/mppx) | TypeScript SDK |
| [tempoxyz/pympp](https://github.com/tempoxyz/pympp) | Python SDK |
| [tempoxyz/mpp-rs](https://github.com/tempoxyz/mpp-rs) | Rust SDK |

## License

Documentation content: [Apache 2.0](LICENSE-APACHE) or [MIT](LICENSE-MIT), at your option

Code and tooling: [Apache 2.0](LICENSE-APACHE) or [MIT](LICENSE-MIT), at your option
