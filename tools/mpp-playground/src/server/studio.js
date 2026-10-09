/**
 * MPP Playground & Agent Simulator Web Server
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { MPP_CONFIG } from '../config.js';
import { defaultMppChallenge } from '../core/mpp-challenge.js';
import { defaultAgentStreamer } from '../core/agent-streaming.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WEB_ROOT = path.join(__dirname, '../../web');

const app = express();
const PORT = process.env.PORT || 3407;

app.use(cors());
app.use(express.json());
app.use(express.static(WEB_ROOT));

// 1. Get Protocol Config
app.get('/api/config', (req, res) => {
  res.json({
    protocol: MPP_CONFIG.protocol,
    network: MPP_CONFIG.network,
    paymentMethods: MPP_CONFIG.paymentMethods,
  });
});

// 2. Simulate HTTP 402 Challenge Generation
app.post('/api/mpp/challenge', (req, res) => {
  const { path: resourcePath, amount, currency } = req.body;
  const challenge = defaultMppChallenge.generateChallenge(resourcePath || '/api/ai/synthesize', amount, currency);
  res.status(402).json(challenge);
});

// 3. Client Sign Payment Proof
app.post('/api/mpp/sign-proof', (req, res) => {
  const { invoiceId, payer } = req.body;
  try {
    const proof = defaultMppChallenge.createPaymentProof(invoiceId, payer);
    res.json({ success: true, proof });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 4. Server Verify Proof & Settle 200 OK
app.post('/api/mpp/verify', (req, res) => {
  const { proofHeader } = req.body;
  try {
    const settlement = defaultMppChallenge.verifyPaymentProof(proofHeader);
    res.json(settlement);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 5. Simulate Agent Payment Stream
app.post('/api/agent/stream', (req, res) => {
  const stream = defaultAgentStreamer.simulateAgentStream(req.body);
  res.json({ success: true, stream });
});

// 6. Get Stream History
app.get('/api/agent/streams', (req, res) => {
  res.json(defaultAgentStreamer.getStreams());
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`⚡ Machine Payments Protocol (MPP) Playground Running!`);
    console.log(`🌐 Web Dashboard: http://localhost:${PORT}`);
    console.log(`🤝 Co-Authored by: Stripe & Tempo Ecosystem`);
    console.log(`======================================================\n`);
  });
}

export default app;
