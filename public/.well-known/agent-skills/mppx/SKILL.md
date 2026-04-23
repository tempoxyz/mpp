---
name: mppx
description: TypeScript SDK for the Payment HTTP Authentication Scheme. Handles 402 Payment Required flows with Tempo, Stripe, and other payment methods. Use when integrating payments or mppx into a client or server application.
---

# mppx

TypeScript SDK for the "Payment" HTTP Authentication Scheme. Full 402 flow: challenge → credential → receipt.

## Client

```ts
import { Mppx, tempo } from 'mppx/client'

// Polyfills globalThis.fetch to handle 402 automatically
Mppx.create({
  methods: [tempo({ account })],
})

const res = await fetch('https://api.example.com/resource')
```

Without polyfilling:

```ts
const mppx = Mppx.create({
  methods: [tempo({ account })],
  polyfill: false,
})

const res = await mppx.fetch('https://api.example.com/resource')
```

## Server

```ts
import { Mppx, tempo } from 'mppx/server'

const mppx = Mppx.create({
  methods: [tempo({ currency: '0x...', recipient: '0x...' })],
  secretKey: process.env.MPP_SECRET_KEY,
})

async function handler(request: Request): Promise<Response> {
  const result = await mppx.charge({ amount: '1.00' })(request)
  if (result.status === 402) return result.challenge
  return result.withReceipt(Response.json({ data: '...' }))
}
```

## Methods

| Method | Intent | Description |
|---|---|---|
| `tempo.charge` | `charge` | One-time stablecoin payment (TIP-20 token transfer on Tempo) |
| `tempo.session` | `session` | Streaming payments via payment channels on Tempo |
| `stripe.charge` | `charge` | One-time payment via Stripe |

`tempo()` returns `[tempo.charge, tempo.session]` as a tuple. Use `tempo.charge()` or `tempo.session()` individually if you only need one intent.

## Exports

| Path | Purpose |
|---|---|
| `mppx` | Core primitives (`Challenge`, `Credential`, `Method`, `Receipt`, `PaymentRequest`) |
| `mppx/client` | `Mppx`, `tempo`, `stripe`, `session`, `Transport` |
| `mppx/server` | `Mppx`, `tempo`, `stripe`, `Transport`, `Store`, `NodeListener` |
| `mppx/hono` | Hono middleware |
| `mppx/express` | Express middleware |
| `mppx/nextjs` | Next.js middleware |
| `mppx/elysia` | Elysia middleware |

## CLI

`mppx` includes a CLI for making paid requests during development:

```sh
npx mppx account create        # create wallet
npx mppx mpp.dev/api/ping/paid # make paid request
npx mppx example.com -v        # verbose output
```

## References

- Docs: https://mpp.dev/sdk/typescript
- Repo: https://github.com/wevm/mppx
- Spec: https://github.com/tempoxyz/payment-auth-spec
- Tempo: https://docs.tempo.xyz
