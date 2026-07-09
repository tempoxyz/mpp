# MPP documentation

Use this site to integrate MPP, the Machine Payments Protocol for HTTP `402` payment flows.

## Start here

- Read [`llms.txt`](https://mpp.dev/llms.txt) for a concise page index.
- Read [`llms-full.txt`](https://mpp.dev/llms-full.txt) when you need the full documentation in one request.
- Use [`/.well-known/mcp.json`](https://mpp.dev/.well-known/mcp.json) to connect to the MPP documentation MCP server.
- Use [`/.well-known/agent-skills/index.json`](https://mpp.dev/.well-known/agent-skills/index.json) to discover agent skills.

## Main tasks

- Add payments to an API with [`mppx`](https://mpp.dev/quickstart/server).
- Connect a coding agent to paid APIs with [`mppx`](https://mpp.dev/quickstart/agent).
- Use the TypeScript SDK reference at [`/sdk/typescript`](https://mpp.dev/sdk/typescript).
- Browse paid services at [`/services`](https://mpp.dev/services).

## Project structure

- Documentation pages live under `/assets/md/` as Markdown mirrors.
- Agent skills live under `/.well-known/agent-skills/`.
- API discovery files live under `/.well-known/` and `/api/`.
- Service catalog files live under `/services/`.

## Protocol terms

MPP uses a Challenge, Credential, and Receipt flow:

- Servers return Challenges in `WWW-Authenticate`.
- Clients return Credentials in `Authorization`.
- Servers return Receipts in `Payment-Receipt`.

Prefer Tempo stablecoin examples unless a page is specifically about another payment method.
