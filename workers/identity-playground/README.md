# Identity playground

The MPP identity playground at [mpp.dev/playground/identity](https://mpp.dev/playground/identity): pay for a haiku as an anonymous, API-key or verified-email buyer and see each tier's price, limits and Receipt.

- A Cloudflare Worker with static assets, an AI binding for the haiku and a Durable Object for mppx state.
- `vercel.ts` rewrites `/playground/identity/*` on mpp.dev to the Worker at `https://mpp-identity-playground.porto.workers.dev` (`IDENTITY_PLAYGROUND_WORKER_ORIGIN` overrides it), so every path lives under `/playground/identity`.
- Email codes go to the demo inbox on the page, not to real email.

## Commands

```bash
pnpm identity-playground:check   # types and build, from the repository root
pnpm identity-playground:deploy  # build and wrangler deploy
```

The **Deploy MPP identity playground** workflow deploys on pushes to `main` that touch this directory.

## Setup

1. The deploy workflow generates the payee key with Foundry (`cast wallet new`) and stores it as the `MPP_PRIVATE_KEY` Worker secret the first time; later deploys keep it. To rotate, delete the secret and rerun the workflow.
2. Production deployments of mpp.dev rewrite to that Worker by default; set `IDENTITY_PLAYGROUND_WORKER_ORIGIN` in Vercel only to point elsewhere. Preview deployments skip the rewrite: attestations are bound to `https://mpp.dev`.

## Local development

Create `.dev.vars` with `PUBLIC_ORIGIN=http://localhost:8790`, `TRUST_PROXY_IP=false` and `MPP_PRIVATE_KEY`, then run `PLAYGROUND_LOCAL=1 pnpm dev`. `PLAYGROUND_LOCAL=1` drops the AI binding.

