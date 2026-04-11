---
name: agenttax
description: Tax compliance middleware for MPP. Calculates US sales tax per-transaction, splits tax into a reserve wallet, tracks economic nexus, and attaches audit-ready receipts. Use when adding tax compliance to any MPP-powered payment endpoint.
---

# @agenttax/mppx

Tax compliance middleware for MPP. Wraps `mppx.charge()` to calculate US sales tax, split tax into a reserve wallet, and attach audit-ready receipts — one line of code.

## Why

MPP enables AI agents to pay for services programmatically. Every transaction is a potentially taxable digital service in most US states. This middleware fills the tax compliance gap.

## Install

```sh
npm install @agenttax/mppx
```

## Quick Start

```ts
import { Mppx, tempo } from 'mppx/express'
import { agentTax } from '@agenttax/mppx'

const mppx = Mppx.create({
  secretKey: process.env.MPP_SECRET_KEY,
  methods: [tempo({ recipient: '0x...', currency: USDC })],
})

const tax = agentTax({
  apiKey: process.env.AGENTTAX_API_KEY,
  transactionType: 'compute',
  workType: 'compute',
})

// Replace mppx.charge() with tax.charge()
app.get('/api/gpu-hour',
  tax.charge(mppx, { amount: '1.00', description: 'GPU compute hour' }),
  (req, res) => res.json({ result: '...' })
)
```

## What It Does

1. **Resolves buyer jurisdiction** — IP geolocation, `X-Buyer-State`/`X-Buyer-Zip` headers, datacenter IP detection
2. **Calculates tax** — calls AgentTax API for the buyer's state, zip (for local rates), work type, and amount
3. **Adjusts the charge** — increases the MPP charge amount to include tax
4. **Splits payment** — optionally routes tax portion to a separate reserve wallet
5. **Attaches receipt** — base64-encoded `X-Tax-Receipt` header with full audit trail
6. **Tracks nexus** — every transaction accumulates toward state economic nexus thresholds

## Wallet Split

Route collected tax to a dedicated reserve wallet:

```ts
const tax = agentTax({
  apiKey: process.env.AGENTTAX_API_KEY,
  transactionType: 'saas',
  workType: 'research',
  taxReserveWallet: '0xYOUR_TAX_RESERVE_ADDRESS',
})
```

When tax is calculated, the middleware adds a `splits` directive to the MPP charge:
- Revenue portion → your main wallet
- Tax portion → your reserve wallet

## Capital Gains Tracking

For endpoints that involve digital asset trades:

```ts
const tax = agentTax({
  apiKey: process.env.AGENTTAX_API_KEY,
  transactionType: 'compute',
  workType: 'trading',
  asset: {
    symbol: 'GPU_HOUR',
    trackGains: true,
    accountingMethod: 'fifo',
    residentState: 'CA',
  },
})
```

The middleware logs each transaction as a buy or sell to the AgentTax Gains Tracker (FIFO, LIFO, or Specific ID).

## Config Reference

```ts
agentTax({
  apiKey: string,                     // AgentTax API key (required)
  baseUrl?: string,                   // Default: 'https://agenttax.io'
  transactionType: string,            // 'compute' | 'saas' | 'data' | 'api_call'
  workType: string,                   // 'compute' | 'research' | 'content' | 'consulting' | 'trading'
  role?: 'seller' | 'buyer',         // Default: 'seller'
  isB2B?: boolean,                    // Default: false
  defaultState?: string,              // Fallback state if jurisdiction can't be resolved
  taxReserveWallet?: string,          // Wallet address for tax split
  counterpartyIdFrom?: string,        // 'header' | 'ip' | 'source' (default: 'source')
  onTaxUnavailable?: 'reject'|'allow',// Default: 'reject' — rejects charge if tax can't be calculated
  asset?: {                           // Capital gains tracking config
    symbol: string,
    trackGains: boolean,
    accountingMethod?: 'fifo'|'lifo'|'specific_id',
    residentState?: string,
  },
})
```

## Tax Receipt

Every response includes an `X-Tax-Receipt` header (base64 JSON):

```json
{
  "engine_version": "1.5",
  "base_amount": "1.00",
  "tax_amount": "0.08",
  "total_charged": "1.08",
  "sales_tax": {
    "jurisdiction": "Texas",
    "state_rate": 0.0625,
    "local_rate": 0.02,
    "combined_rate": 0.0825,
    "classification": "data_processing"
  },
  "transaction_id": "txn_abc123",
  "timestamp": "2026-04-11T00:00:00.000Z"
}
```

## References

- AgentTax: https://agenttax.io
- API Docs: https://agenttax.io/api-docs
- npm: https://www.npmjs.com/package/@agenttax/mppx
- GitHub: https://github.com/AgentTax/agenttax-mppx
- 51-jurisdiction guide: https://agenttax.io/classification
