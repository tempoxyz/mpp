# Session playground

The MPP session playground at [mpp.dev/playground/session](https://mpp.dev/playground/session): open a payment channel, stream a story paid by the word with off-chain vouchers, top up and close.

- A Cloudflare Worker with static assets, an AI binding for the story and a Durable Object for mppx state.
- Each word costs 0.001 OUSD on Moderato testnet (chain 42431). The payee funds itself from the testnet faucet.
- `src/pages/_api/playground/` proxies `/playground/session/*` on mpp.dev to the Worker at `https://mpp-session-playground.porto.workers.dev` (`SESSION_PLAYGROUND_WORKER_ORIGIN` overrides it).
- The story API takes the topic in the path (`/api/story/<topic>`), never a query string: mppx treats a POST with a query as a content request, so each voucher POST would open a new stream.

## Commands

```bash
pnpm session-playground:check   # types, samples and build, from the repository root
pnpm session-playground:deploy  # build and wrangler deploy
```

mpp.dev serves the page itself, while its API comes from this Worker, so keep the Worker's API backward compatible: add fields and routes rather than renaming or removing them.

## Setup

1. Set the payee key as the `MPP_PRIVATE_KEY` Worker secret, and `MPP_SECRET_KEY` for mppx.
2. Production and preview deployments of mpp.dev proxy to that Worker by default; set `SESSION_PLAYGROUND_WORKER_ORIGIN` in Vercel only to point elsewhere.

## Local development

Create `.dev.vars` with `MPP_PRIVATE_KEY` and `MPP_SECRET_KEY`, then run `pnpm dev`. Without the AI binding the story falls back to a built-in one.
