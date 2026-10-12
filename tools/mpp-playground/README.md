# ⚡ Machine Payments Protocol (MPP) Playground

An interactive testing ground and agent payment simulator for the **Machine Payments Protocol (MPP)** — the open standard co-authored by **Stripe** and **Tempo Labs** for autonomous AI agent micropayments and HTTP 402 settlements.

---

## 🌟 Features

- ⚡ **HTTP 402 Flow Simulator**: Experience the full request -> `WWW-Authenticate: MPP ...` -> `Authorization: MPP-Proof ...` -> `200 OK` cycle.
- 🤖 **AI Agent Payment Streaming**: Simulate continuous per-token and per-inference micro-settlements on Tempo Moderato.
- 🌐 **Interactive Web Playground**: Visual step-by-step inspector on `http://localhost:3407`.
- ⌨️ **Universal CLI (`mpp-cli`)**: Terminal utility for challenges, proof generation, and streaming simulations.

---

## 🚀 Quickstart

```bash
# Launch Web Playground
npm start
# Open http://localhost:3407

# Or use CLI
node bin/mpp-cli.js challenge /v1/ai/gpt4
node bin/mpp-cli.js stream "Code Review" 200
```
