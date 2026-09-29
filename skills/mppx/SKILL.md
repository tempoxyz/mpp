---
name: mppx
description: TypeScript SDK for the Payment HTTP Authentication Scheme. Handles 402 Payment Required flows with Tempo, Stripe, and other payment methods. Use when integrating payments or mppx into a client or server application.
---

# mppx

TypeScript SDK for the "Payment" HTTP Authentication Scheme. Full 402 flow: challenge → credential → receipt.

## What I can accomplish

- Add `402` payment handling to a client with `Fetch.polyfill` or `Fetch.from`.
- Protect HTTP routes with server-side MPP Challenges and Receipt responses.
- Accept one-time Tempo stablecoin payments with `tempo.charge`.
- Accept metered Tempo stablecoin payments with `tempo.session`.
- Accept one-time card payments with `stripe.charge`.
- Verify Credentials directly for custom transports or background workflows.
- Wrap MCP clients and servers so tool calls can require payment.

## Required inputs

- Client integrations need a signing account and one or more client payment methods.
- Server integrations need a recipient, amount, and `MPP_SECRET_KEY`. Tempo currency lists are optional.
- Tempo examples use chain ID `4217` unless a page explicitly covers Moderato testnet.
- Stripe examples need a configured Stripe account and Shared Payment Token flow.
- MCP integrations need the MCP client or server object to wrap.

## Constraints

- Keep `MPP_SECRET_KEY` server-side and out of logs.
- Never commit private keys or wallet seeds.
- Treat runtime `402` Challenges as authoritative for current payment terms.
- Return `id` and `opaque` unchanged when responding to a Challenge.
- Use OUSD in single-currency Tempo examples. Omit `currencies` to offer OUSD first with network-specific fallbacks.
- Factory `currencies` configures accepted tokens; wire requests and per-handler overrides retain singular `currency`.
- Use complete token addresses. Preserve provider-specific token requirements.

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
import { Mppx, Store, tempo } from 'mppx/server'
import { privateKeyToAccount } from 'viem/accounts'

const account = privateKeyToAccount('0x...')

const mppx = Mppx.create({
  methods: [
    tempo.charge({ recipient: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' }),
    tempo.session({
      account,
      chainId: 4217,
      recipient: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      store: Store.memory(),
    }),
  ],
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

Server `tempo()` returns a charge/session pair per accepted currency. Individual server `tempo.charge()` and `tempo.session()` factories return nonempty method arrays for their intent. `Mppx.create` flattens these groups. Mainnet defaults to OUSD then USDC.e; Moderato defaults to OUSD then pathUSD. Pass `currencies` to replace that list, for example `currencies: ['0x20c0000000000000000000006a37DA5C996874BE']` to accept only OUSD.

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

- [TypeScript SDK docs](https://mpp.dev/sdk/typescript)
- [Client quickstart](https://mpp.dev/quickstart/client)
- [Server quickstart](https://mpp.dev/quickstart/server)
- [mppx repository](https://github.com/wevm/mppx)
- [IETF Specification](https://paymentauth.org)
- [Tempo docs](https://docs.tempo.xyz)
