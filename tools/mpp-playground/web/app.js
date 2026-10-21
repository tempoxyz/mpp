/**
 * MPP Playground Client Logic
 */

let activeInvoice = null;

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initFlowListeners();
  initStreamListeners();
  loadStreams();
});

function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t === tab));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.id === `tab-${tab.dataset.tab}`));
    });
  });
}

function initFlowListeners() {
  // Step 1: Request -> Generates 402 Challenge
  document.getElementById('btn-step-1').addEventListener('click', async () => {
    const path = document.getElementById('req-path-input').value;
    const btn = document.getElementById('btn-step-1');
    btn.disabled = true;

    try {
      const res = await fetch('/api/mpp/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, amount: '0.005', currency: 'USD' }),
      });
      const data = await res.json();

      activeInvoice = data.invoice;

      // Update Step 2 Card
      document.getElementById('box-402-header').textContent = `402 Payment Required\n${data.headers['WWW-Authenticate']}`;
      document.getElementById('card-step-2').classList.remove('disabled');
      document.getElementById('card-step-2').classList.add('active');
      document.getElementById('btn-step-2').disabled = false;
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      btn.disabled = false;
    }
  });

  // Step 2: Sign Proof & Settle 200 OK
  document.getElementById('btn-step-2').addEventListener('click', async () => {
    if (!activeInvoice) return;
    const btn = document.getElementById('btn-step-2');
    btn.disabled = true;
    btn.textContent = '⏳ Signing & Settling on Tempo...';

    try {
      // 1. Sign
      const signRes = await fetch('/api/mpp/sign-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: activeInvoice.invoiceId }),
      });
      const signData = await signRes.json();

      // 2. Verify on Tempo
      const verifyRes = await fetch('/api/mpp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proofHeader: signData.proof.proofHeader }),
      });
      const settleData = await verifyRes.json();

      // Update Step 3 Card
      document.getElementById('box-settle-result').textContent = `200 OK (Settled in ${settleData.settlementTimeMs}ms)\nChannel: Tempo Moderato Sub-second\nInvoice: ${settleData.invoice.invoiceId}`;
      document.getElementById('card-step-3').classList.remove('disabled');
      document.getElementById('card-step-3').classList.add('active');
    } catch (err) {
      alert(`Settlement Error: ${err.message}`);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Sign Payment Proof ✍️';
    }
  });
}

function initStreamListeners() {
  document.getElementById('stream-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-start-stream');
    const resultBox = document.getElementById('stream-result-box');

    const agentName = document.getElementById('stream-agent-name').value;
    const task = document.getElementById('stream-task').value;
    const tokenCount = parseInt(document.getElementById('stream-tokens').value, 10);

    btn.disabled = true;
    btn.textContent = '⏳ Streaming Micro-Payments...';

    try {
      const res = await fetch('/api/agent/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentName, task, tokenCount }),
      });
      const data = await res.json();

      if (data.success) {
        resultBox.innerHTML = `
          <div class="card" style="border-color: #635bff; background: rgba(99, 91, 255, 0.08);">
            <strong style="color: #a5b4fc;">⚡ Payment Stream Completed Successfully!</strong>
            <p class="mt-2" style="font-size: 0.9rem;">Agent: <strong>${data.stream.agentName}</strong></p>
            <div class="mono" style="font-size: 0.8rem; color: #34d399;">Total Paid: ${data.stream.totalPaid} (${data.stream.chunks.length} micro-chunks)</div>
          </div>
        `;
        loadStreams();
      }
    } catch (err) {
      resultBox.innerHTML = `<div class="badge red">Stream Error: ${err.message}</div>`;
    } finally {
      btn.disabled = false;
      btn.textContent = '⚡ Start Agent Payment Stream';
    }
  });
}

async function loadStreams() {
  try {
    const res = await fetch('/api/agent/streams');
    const streams = await res.json();
    const list = document.getElementById('streams-list');

    if (!streams || streams.length === 0) return;
    list.innerHTML = '';

    streams.forEach(s => {
      const row = document.createElement('div');
      row.className = 'ledger-row';
      row.innerHTML = `
        <div>
          <div style="font-size: 0.9rem; font-weight: 600;">${s.agentName} • ${s.task}</div>
          <div class="mono text-muted" style="font-size: 0.72rem;">${s.streamId}</div>
        </div>
        <div style="text-align: right;">
          <div style="color: #34d399; font-weight: 700; font-family: var(--font-mono);">${s.totalPaid}</div>
          <div class="text-muted" style="font-size: 0.75rem;">${new Date(s.timestamp).toLocaleTimeString()}</div>
        </div>
      `;
      list.appendChild(row);
    });
  } catch (e) {
    console.warn(e);
  }
}
