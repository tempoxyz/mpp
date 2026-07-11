<br>
<br>

<p align="center">
  <a href="https://mpp.dev">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="public/lockup-light.svg">
      <img alt="Machine Payments Protocol" src="public/lockup-dark.svg" width="auto" height="120">
    </picture>
  </a>
</p>

<br>
<br>

# mpp

The open protocol for machine-to-machine payments.

[![Website](https://img.shields.io/badge/website-mpp.dev-black)](https://mpp.dev)
[![IETF Spec](https://img.shields.io/badge/spec-paymentauth.org-blue)](https://paymentauth.org)
[![License](https://img.shields.io/badge/license-MIT%2FApache--2.0-blue)](LICENSE-MIT)

[MPP](https://mpp.dev), the Machine Payments Protocol, is an open standard for machine-to-machine payments co-authored by [Tempo](https://tempo.xyz) and [Stripe](https://stripe.com). Paid HTTP services typically require API keys, billing accounts, or checkout flows to be set up before a client can make a request. MPP lets agents, apps, and people pay inline with the request through an [HTTP `402 Payment Required` flow](https://mpp.dev/protocol/http-402). Common use cases include agentic payments, usage-based billing, and machine-to-machine commerce.

You can get started today by reading the [protocol overview](https://mpp.dev/protocol), jumping straight to the [quickstart](https://mpp.dev/quickstart), or exploring the [SDKs](https://mpp.dev/sdk).

## What's in this repo

This repository contains the source for [mpp.dev](https://mpp.dev). It is the primary home for MPP documentation, protocol explainers, SDK references, and the directory of live MPP-enabled services. Start here if you are new to MPP, regardless of the language or platform you use.

- **Documentation:** quickstart guides, protocol explainers, and SDK references
- **Service directory:** a registry of MPP-enabled services at [mpp.dev/services](https://mpp.dev/services)

## Development

```bash
pnpm install      # Install dependencies
pnpm run dev      # Start development server
pnpm run build    # Production build
pnpm run check:sdk-drift # Validate SDK reference pages against mppx exports
pnpm run preview  # Preview production build
```

## Contributing to the service directory

The service directory at [mpp.dev/services](https://mpp.dev/services) is curated for live, production-ready MPP services.

### Submit a pull request to this repo

If you want your service included in the curated `mpp.dev/services` list, open a PR and complete this checklist:

#### Required

- [ ] Your service is **live and accepting payments** via MPP (not a placeholder or coming-soon)
- [ ] You've added your entry to `schemas/services.ts`
- [ ] Types pass: `pnpm check:types`
- [ ] Build succeeds: `pnpm build`

#### Recommended

- [ ] Register your service on [MPPScan](https://www.mppscan.com/register) (by Merit Systems). It follows the standard MPP discovery format and makes your service discoverable by agents immediately, no PR required

#### Review criteria

We prioritize services that are **high quality and novel**. We may not approve services that duplicate existing functionality or aren't yet production-ready.

### Add a new service

1. **Edit `schemas/services.ts`:** add a new entry to the `services` array:

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

## Contributing

Contributions to documentation, the service directory, and site improvements are welcome.

### Pull request checklist

1. **Types pass**: `pnpm check:types`
2. **Build succeeds**: `pnpm build`
3. **Lint passes**: `pnpm check`
4. **SDK references stay in sync** (if touching SDK docs or `vocs.config.ts`): `pnpm check:sdk-drift`
5. **E2E tests pass** (if touching terminal or interactive components): `pnpm test:e2e`

### Types of contributions

| Change type | Process |
|-------------|---------|
| Typo or editorial fix | Direct PR to `main` |
| New documentation page | Follow existing page structure in `src/pages/` |
| New service listing | Register on [MPPScan](https://www.mppscan.com/register) for immediate discovery; open a PR to include it in the curated `mpp.dev/services` list |
| Service update | Edit the service entry in `schemas/services.ts`, regenerate, PR |
| New component | Follow patterns in `src/components/` |
| Site configuration | Open an issue first for discussion |

## SDKs

| Repository | Language |
|------------|----------|
| [wevm/mppx](https://github.com/wevm/mppx) | TypeScript |
| [tempoxyz/pympp](https://github.com/tempoxyz/pympp) | Python |
| [tempoxyz/mpp-rs](https://github.com/tempoxyz/mpp-rs) | Rust |
| [tempoxyz/mpp-go](https://github.com/tempoxyz/mpp-go) | Go |
| [stripe/mpp-rb](https://github.com/stripe/mpp-rb) | Ruby |
| [tempoxyz/mpp-specs](https://github.com/tempoxyz/mpp-specs) | Protocol specifications |

## Security

See [`SECURITY.md`](./SECURITY.md) for reporting vulnerabilities.

## License

Licensed under either of [Apache License, Version 2.0](./LICENSE-APACHE) or [MIT License](./LICENSE-MIT) at your option.

Unless you explicitly state otherwise, any contribution intentionally submitted
for inclusion in these crates by you, as defined in the Apache-2.0 license,
shall be dual licensed as above, without any additional terms or conditions.
