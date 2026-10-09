#!/usr/bin/env node

/**
 * MPP Universal CLI Tool (Stripe + Tempo)
 */

import { defaultMppChallenge } from '../src/core/mpp-challenge.js';
import { defaultAgentStreamer } from '../src/core/agent-streaming.js';

const args = process.argv.slice(2);
const command = args[0] || 'help';

async function main() {
  switch (command.toLowerCase()) {
    case 'challenge': {
      const path = args[1] || '/v1/ai/gpt4-stream';
      const amount = args[2] || '0.005';
      console.log(`\n⚡ Generating HTTP 402 MPP Challenge for ${path}...`);
      const ch = defaultMppChallenge.generateChallenge(path, amount, 'USD');
      console.log(`  HTTP Status:      ${ch.statusCode} ${ch.statusText}`);
      console.log(`  WWW-Authenticate: ${ch.headers['WWW-Authenticate']}`);
      console.log(`  Invoice ID:       ${ch.invoice.invoiceId}\n`);
      break;
    }

    case 'pay': {
      const invId = args[1];
      if (!invId) {
        console.error('Usage: mpp-cli pay <invoiceId>');
        process.exit(1);
      }
      console.log(`\n💳 Signing MPP-Proof for invoice ${invId}...`);
      const proof = defaultMppChallenge.createPaymentProof(invId);
      console.log(`  Authorization: ${proof.proofHeader}`);
      console.log(`\nVerifying on Tempo Moderato channel...`);
      const res = defaultMppChallenge.verifyPaymentProof(proof.proofHeader);
      console.log(`  Status:        ${res.statusCode} OK (Settled)`);
      console.log(`  Latency:       ${res.settlementTimeMs} ms\n`);
      break;
    }

    case 'stream': {
      const task = args[1] || 'Agent Code Review & Fix';
      const tokens = parseInt(args[2] || '250', 10);
      console.log(`\n🤖 Streaming micro-payments for task '${task}' (${tokens} tokens)...`);
      const stream = defaultAgentStreamer.simulateAgentStream({ task, tokenCount: tokens });
      console.log(`  Stream ID:   ${stream.streamId}`);
      console.log(`  Total Paid:  ${stream.totalPaid}`);
      console.log(`  Chunks:      ${stream.chunks.length} micro-settlements (avg 18ms latency)\n`);
      break;
    }

    case 'studio': {
      console.log('\n🌐 Launching MPP Interactive Playground on :3407...');
      await import('../src/server/studio.js');
      break;
    }

    default: {
      console.log(`
╔══════════════════════════════════════════════════════════════════╗
║             ⚡ MACHINE PAYMENTS PROTOCOL (MPP) CLI               ║
║           Co-Authored by Stripe & Tempo for AI Agents            ║
╚══════════════════════════════════════════════════════════════════╝

Commands:
  mpp-cli challenge [path] [amount]   Simulate server HTTP 402 challenge
  mpp-cli pay <invoiceId>             Sign and verify MPP payment proof
  mpp-cli stream [task] [tokens]      Simulate real-time agent payment stream
  mpp-cli studio                      Launch Web Playground on :3407
      `);
      break;
    }
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
