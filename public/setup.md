---
name: mpp
description: "Machine Payments Protocol — install presto CLI, discover paid API services, make HTTP requests with automatic stablecoin payment on Tempo. No API keys needed."
---

# MPP Setup

> Machine Payments Protocol — an open standard for HTTP-native machine payments using the `402 Payment Required` status code. Payment-method agnostic (Tempo stablecoins today, Stripe coming soon), designed as an IETF standard. Flow: Challenge → Credential → Receipt via `WWW-Authenticate` / `Authorization` headers.

## Install presto

```bash
curl -fsSL https://raw.githubusercontent.com/tempoxyz/presto/main/install.sh | bash
presto login     # Connect Tempo wallet via browser
presto whoami    # Verify wallet + balances
```

- Binary installs to `/usr/local/bin/presto`
- Wallet config saved to `~/.presto/config.toml` (one-time setup)
- Install auto-bundles the AI skill to `~/.claude/skills/presto/`

Fund your wallet with pathUSD on Tempo. For testnet, use the faucet at https://faucet.tempo.xyz.

## Service discovery

The live service directory at `payments.tempo.xyz` is the source of truth. Always query it for the latest services and pricing rather than relying on a hardcoded list.

```bash
# Machine-readable JSON — all services with routes, pricing, descriptions
curl -s https://payments.tempo.xyz/services | jq '.[].id'

# Details + pricing for a specific service
curl -s https://payments.tempo.xyz/services/openai | jq

# LLM-friendly plain-text listing
curl -s https://payments.tempo.xyz/llms.txt
```

Each service is accessed at `https://{service}.payments.tempo.xyz`, replacing the upstream API domain. Use the same API paths as the upstream service.

## Making paid requests

`presto` is wget for payments. It detects `402 Payment Required` responses, fulfills payment, and retries automatically.

```bash
# Simple GET — presto auto-handles 402 + payment
presto query https://openai.payments.tempo.xyz/v1/models

# POST with JSON body
presto query -X POST --json '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Hello"}]}' \
  https://openai.payments.tempo.xyz/v1/chat/completions

# Dry run to preview cost
presto query -D https://openai.payments.tempo.xyz/v1/chat/completions

# Set spending cap (atomic units, 6 decimals — 1000000 = $1.00)
presto query -M 50000 -X POST --json '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Hello"}]}' \
  https://openai.payments.tempo.xyz/v1/chat/completions

# Inspect payment requirements without paying
presto inspect https://openai.payments.tempo.xyz/v1/chat/completions

# Check wallet balance
presto balance
```

### Key flags

| Flag | Description |
|------|-------------|
| `-D` | Dry run — preview cost without paying |
| `-y` | Require confirmation before payment |
| `-M <amount>` | Maximum payment amount (atomic units, 6 decimals) |
| `-v` / `-vv` | Verbose output |
| `-i` | Include response headers |
| `-o <file>` | Save response to file |
| `-X <method>` | HTTP method (GET, POST, etc.) |
| `--json <data>` | Send JSON body (sets Content-Type automatically) |
| `-H <header>` | Custom header |
| `-n <network>` | Filter to specific network (tempo, tempo-moderato) |

### Environment variables

| Variable | Description |
|----------|-------------|
| `PRESTO_PRIVATE_KEY` | Private key for signing (alternative to `presto login`) |
| `PRESTO_MAX_AMOUNT` | Default spending cap |
| `PRESTO_NETWORK` | Default network (tempo, tempo-moderato) |
| `PRESTO_RPC_URL` | Override RPC endpoint |

## Payment sessions

Some services (OpenRouter, Tempo RPC) use session-based payments. The first request opens an on-chain payment channel; subsequent requests reuse off-chain vouchers for lower latency and cost.

```bash
# First request opens channel, subsequent requests reuse it
presto query -X POST --json '{"model":"claude-sonnet-4-20250514","messages":[{"role":"user","content":"Hello"}]}' \
  https://openrouter.payments.tempo.xyz/v1/chat/completions

# Make more requests on the same session
presto query -X POST --json '{"model":"claude-sonnet-4-20250514","messages":[{"role":"user","content":"Follow up"}]}' \
  https://openrouter.payments.tempo.xyz/v1/chat/completions

# List active sessions
presto session list

# Close a session (settles remaining balance)
presto session close https://openrouter.payments.tempo.xyz
```

## How the 402 flow works

Understanding this helps agents debug payment issues:

1. Agent sends request → server returns `402 Payment Required` with `WWW-Authenticate: Payment ...` containing a Challenge (amount, recipient, currency, network)
2. `presto` parses the Challenge and signs a Credential (on-chain transaction or off-chain voucher)
3. `presto` retries with `Authorization: Payment <credential>`
4. Server verifies payment, returns the resource with a `Payment-Receipt` header

`presto` handles this entire flow automatically. If a request returns `402`, it pays and retries. If it returns `200`, it passes through unchanged.

## Available services

Every service is accessed via `https://{service}.payments.tempo.xyz`. Query `https://payments.tempo.xyz/services` for the live list with full pricing.

### AI & LLMs

| Service | Endpoint | Description |
|---------|----------|-------------|
| OpenRouter | `openrouter.payments.tempo.xyz` | 100+ LLM models (Claude, GPT-4o, Llama, etc.) |
| Anthropic | `anthropic.payments.tempo.xyz` | Claude models directly |
| OpenAI | `openai.payments.tempo.xyz` | GPT-4, embeddings, DALL-E, Whisper, TTS |
| fal.ai | `fal.payments.tempo.xyz` | FLUX, Stable Diffusion, Recraft, video generation |
| ElevenLabs | `elevenlabs.payments.tempo.xyz` | Text-to-speech, speech-to-text, voice cloning |

### Web & Data

| Service | Endpoint | Description |
|---------|----------|-------------|
| Firecrawl | `firecrawl.payments.tempo.xyz` | Web scraping, crawling, search, extraction |
| Browserbase | `browserbase.payments.tempo.xyz` | Headless browser sessions |
| Exa | `exa.payments.tempo.xyz` | AI-native search, content retrieval, answers |

### Blockchain & Data

| Service | Endpoint | Description |
|---------|----------|-------------|
| Codex | `codex.payments.tempo.xyz` | GraphQL blockchain data (tokens, trades, NFTs) |
| Alchemy | `alchemy.payments.tempo.xyz` | Multi-chain JSON-RPC and NFT APIs |
| Tempo RPC | `rpc.payments.tempo.xyz` | Tempo network JSON-RPC |

### Communications

| Service | Endpoint | Description |
|---------|----------|-------------|
| Twilio | `twilio.payments.tempo.xyz` | SMS and MMS messaging |
| X (Twitter) | `twitter.payments.tempo.xyz` | Tweets, users, search |

### Infrastructure

| Service | Endpoint | Description |
|---------|----------|-------------|
| Object Storage | `storage.payments.tempo.xyz` | S3-compatible object storage |

## Example requests

All proxy endpoints use the same API as the upstream service. Replace the upstream base URL with the proxy endpoint.

```bash
# OpenAI chat completion
presto query https://openai.payments.tempo.xyz/v1/chat/completions \
  -X POST --json '{"model":"gpt-4o","messages":[{"role":"user","content":"Explain quantum computing in one sentence"}]}'

# Anthropic messages
presto query https://anthropic.payments.tempo.xyz/v1/messages \
  -X POST -H "anthropic-version: 2023-06-01" \
  --json '{"model":"claude-sonnet-4-20250514","max_tokens":1024,"messages":[{"role":"user","content":"Write a haiku about payments"}]}'

# fal.ai image generation
presto query https://fal.payments.tempo.xyz/fal-ai/flux/schnell \
  -X POST --json '{"prompt":"A futuristic cityscape at sunset, cyberpunk style","image_size":"landscape_16_9"}'

# Firecrawl web scraping
presto query https://firecrawl.payments.tempo.xyz/v1/scrape \
  -X POST --json '{"url":"https://example.com"}'

# Exa search
presto query https://exa.payments.tempo.xyz/search \
  -X POST --json '{"query":"latest developments in quantum computing","num_results":5}'

# ElevenLabs text-to-speech
presto query https://elevenlabs.payments.tempo.xyz/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM \
  -X POST --json '{"text":"Hello, this is a test of text to speech."}' -o speech.mp3

# Twilio SMS
presto query https://twilio.payments.tempo.xyz/Messages.json \
  -X POST --json '{"To":"+1234567890","From":"+0987654321","Body":"Hello from MPP"}'

# X (Twitter) search
presto query "https://twitter.payments.tempo.xyz/2/tweets/search/recent?query=MPP%20payments"
```

## SDK integration

For building services or custom clients, use an SDK.

| SDK | Language | Install | Repo |
|-----|----------|---------|------|
| mppx | TypeScript | `npm install mppx viem` | [wevm/mppx](https://github.com/wevm/mppx) |
| pympay | Python | `pip install pympay` | [tempoxyz/pympay](https://github.com/tempoxyz/pympay) |
| mpay-rs | Rust | `cargo add mpay` | [tempoxyz/mpay-rs](https://github.com/tempoxyz/mpay-rs) |

### TypeScript client

```typescript
import { Mppx, tempo } from 'mppx/client'
import { privateKeyToAccount } from 'viem/accounts'

const account = privateKeyToAccount('0x...')

// Polyfill global fetch — payments happen automatically on 402
Mppx.create({ methods: [tempo({ account })] })

const response = await fetch('https://openai.payments.tempo.xyz/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Hello!' }],
  }),
})
```

### TypeScript server

```typescript
import { Mppx, tempo } from 'mppx/hono'
import { Hono } from 'hono'

const app = new Hono()
const mppx = Mppx.create({
  methods: [tempo({
    currency: '0x20c0000000000000000000000000000000000000',
    recipient: '0xYourAddress',
  })],
})

app.get('/resource', mppx.charge({ amount: '0.1' }), (c) =>
  c.json({ data: 'paid content' }),
)
```

### Python client

```python
from pympay.client import Client
from pympay.methods.tempo import tempo

client = Client(methods=[tempo(private_key="0x...")])
response = client.fetch("https://openai.payments.tempo.xyz/v1/chat/completions", json={
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}],
})
```

## Full documentation & MCP server

```bash
# Full docs in one file (paste into agent context)
curl https://mpp.tempo.xyz/llms-full.txt

# Add MCP server for live doc search
claude mcp add --transport http mpp https://mpp.tempo.xyz/api/mcp

# Install agent skills
npx skills install wevm/mppx -g
```

## IETF specs

- Core: [Payment HTTP Authentication Scheme](https://github.com/tempoxyz/payment-auth-spec)
- Charge intent, Tempo method, Session method specs in the same repo
- Conformance test vectors: [tempoxyz/mpay-sdks](https://github.com/tempoxyz/mpay-sdks)

## Resources

- Documentation: https://mpp.tempo.xyz
- Full docs for LLMs: https://mpp.tempo.xyz/llms-full.txt
- Service directory (JSON): https://payments.tempo.xyz/services
- Service directory (text): https://payments.tempo.xyz/llms.txt
- presto CLI: https://github.com/tempoxyz/presto
- TypeScript SDK: https://github.com/wevm/mppx
- Python SDK: https://github.com/tempoxyz/pympay
- Rust SDK: https://github.com/tempoxyz/mpay-rs
- Protocol spec: https://github.com/tempoxyz/payment-auth-spec
- Testnet faucet: https://faucet.tempo.xyz
