# Playground

One Cloudflare Worker for every MPP playground under [mpp.dev/playground](https://mpp.dev/playground):

- **Identity** ([/playground/identity](https://mpp.dev/playground/identity), `src/identity/`): pay for a haiku as an anonymous, API-key or verified-email buyer and see each tier's price, limits and Receipt. Email codes go to the demo inbox on the page, not to real email.
- **Sessions** ([/playground/session](https://mpp.dev/playground/session), `src/session/`): open a payment channel, stream a story paid by the word with vouchers, top up and close. Each word costs 0.001 OUSD on Moderato testnet (chain 42431).
- **Charge** ([/playground/charge](https://mpp.dev/playground/charge), `src/charge/`): buy a fortune for 0.01 OUSD and see the round trip: the 402 Challenge, the Credential that pays it and the Receipt.
- **Discovery** ([/playground/discovery](https://mpp.dev/playground/discovery), `src/discovery/`): a registry of five small paid APIs, each publishing an OpenAPI document with `x-payment-info` and its own request schema. The page builds a form from each schema and pays the call.
- **Zones** ([/playground/zones](https://mpp.dev/playground/zones), `src/zones/`): move pathUSD into a Tempo Zone, then buy a fortune from inside it. The page shows what the buyer, the merchant and Tempo each see (`?view=windows`), and a "spot the buyer" game over the merchant's payments on Tempo (`?view=spot`); the default shows both.

Charge and discovery share `src/shared/` (the charge server, wallet and code panes) and one Durable Object store, `CHARGE_STORE`.

`src/index.ts` routes each playground's path to its server. Each has its own Durable Object store (`MPPX_STORE` for identity, `SESSION_STORE` for sessions); both share the Workers AI binding and the payee key. Vite builds both pages (`identity/index.html`, `session/index.html`) with shared assets under `/playground/assets/`.

`src/pages/_api/playground/` proxies `/playground/*` on mpp.dev to the Worker at `https://mpp-playground.porto.workers.dev` (`PLAYGROUND_WORKER_ORIGIN` overrides it).

## Commands

```bash
pnpm playground:check   # types, samples and build, from the repository root
pnpm playground:deploy  # build and wrangler deploy
```

The **Deploy MPP playground** workflow deploys on pushes to `main` that touch this directory.

mpp.dev serves the pages itself (built with the site, cached at Vercel's edge until the next deploy), while their APIs come from this Worker, so the two deploy separately and can briefly run different commits. Keep each API backward compatible: add fields and routes rather than renaming or removing them, and remove one only after a deploy of mpp.dev that no longer uses it has gone out.

The session API takes the topic in the path (`/api/story/<topic>`), never a query string: mppx treats a POST with a query as a content request, so each voucher POST would open a new stream.

## Setup

1. The deploy workflow generates the payee key with Foundry (`cast wallet new`) and stores it as the `MPP_PRIVATE_KEY` Worker secret the first time; later deploys keep it. To rotate, delete the secret and rerun the workflow.
2. Production deployments of mpp.dev proxy to that Worker by default; set `PLAYGROUND_WORKER_ORIGIN` in Vercel only to point elsewhere. Preview deployments answer 404: identity attestations are bound to `https://mpp.dev`, and session Challenges name `mpp.dev` as their realm (`MPP_REALM` overrides it).

## Zones

The zones server is stock `tempo.charge({ zones: [ZONE_ID] })`. It needs a Zone whose sequencer we run; configure it with these vars:

| Var | Meaning |
| --- | --- |
| `ZONE_ID`, `ZONE_CHAIN_ID`, `ZONE_RPC_URL` | The Zone and its (redacted) RPC. Without them the page shows the Zone as not configured. |
| `ZONE_RPC_API_KEY` | Optional secret, sent upstream as `tempo-api-key`. |
| `ZONE_NAME`, `ZONE_CURRENCY` | Display name, and the TIP-20 to charge in (default pathUSD, which also pays Zone gas). |
| `TEMPO_RPC_URL`, `TEMPO_CHAIN_ID` | Tempo itself (default Moderato). |

The page reaches both chains through `/playground/zones/api/rpc/{tempo,zone}`, an allowlisted JSON-RPC proxy that forwards the buyer's `x-authorization-token`.

The client in `src/zones/zone.ts` pays without `WithdrawalRequested`, which a redacted Zone RPC hides from logs: it derives the sender tag from the outbox's `lastFallbackNonce()` and matches `WithdrawalProcessed` on Tempo. Drop it for mppx's zone client once mppx does the same.

To run it locally, start a Tempo dev node and a `tempo-zone` dev sequencer, point the vars above at them in `.dev.vars`, then `pnpm build` and `npx vite preview --port 8790`.

## Local development

Create `.dev.vars` with `PUBLIC_ORIGIN=http://localhost:8790`, `TRUST_PROXY_IP=false`, `MPP_REALM=localhost` and `MPP_PRIVATE_KEY`, then run `PLAYGROUND_LOCAL=1 pnpm dev` and open `/playground/identity/` or `/playground/session/`. `PLAYGROUND_LOCAL=1` drops the AI binding.
