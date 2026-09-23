/**
 * MPP Challenge & Proof Unit Tests
 */

import { defaultMppChallenge } from '../src/core/mpp-challenge.js';

async function runChallengeTests() {
  console.log('Testing MPP HTTP 402 Challenge & Proof Handler...');

  // 1. Challenge
  const ch = defaultMppChallenge.generateChallenge('/api/v1/agent/inference', '0.01', 'USD');
  if (ch.statusCode !== 402 || !ch.headers['WWW-Authenticate'].includes('MPP')) {
    throw new Error('Challenge header generation failed');
  }

  // 2. Client Proof
  const proof = defaultMppChallenge.createPaymentProof(ch.invoice.invoiceId);
  if (!proof.proofHeader.startsWith('MPP-Proof')) {
    throw new Error('Payment proof generation failed');
  }

  // 3. Server Verification
  const verification = defaultMppChallenge.verifyPaymentProof(proof.proofHeader);
  if (!verification.verified || verification.statusCode !== 200) {
    throw new Error('Payment verification failed');
  }

  console.log(`✅ MPP Challenge -> Proof -> Settlement Cycle Passed (Latency: ${verification.settlementTimeMs}ms)!`);
}

runChallengeTests().catch(e => {
  console.error('❌ Challenge Test Failed:', e);
  process.exit(1);
});
