/**
 * Agent Streaming Tests
 */

import { defaultAgentStreamer } from '../src/core/agent-streaming.js';

async function runStreamTests() {
  console.log('Testing Agent Payment Stream Simulator...');

  const stream = defaultAgentStreamer.simulateAgentStream({
    agentName: 'Test Swarm Agent',
    task: 'Continuous Document Indexing',
    tokenCount: 500,
  });

  if (stream.chunks.length !== 5 || !stream.totalPaid) {
    throw new Error('Streaming simulation failed');
  }

  console.log(`✅ Agent Stream Passed: ${stream.totalPaid} over ${stream.chunks.length} micro-payments!`);
}

runStreamTests().catch(e => {
  console.error('❌ Stream Test Failed:', e);
  process.exit(1);
});
