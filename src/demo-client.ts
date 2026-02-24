"use client";

import { Mppx, tempo } from "mppx/client";
import { createClient, http } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { tempoModerato } from "viem/chains";

export const DEMO_LIVE = import.meta.env.VITE_DEMO_LIVE !== "false";

const maxDeposit = "1";

export async function createDemoClient() {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);

  const getClient = () =>
    createClient({ chain: tempoModerato, transport: http() });

  const { fetch } = Mppx.create({
    polyfill: false,
    methods: [tempo({ account, maxDeposit, getClient })],
  });

  const session = tempo.session({ account, maxDeposit, getClient });

  async function fundWallet() {
    const res = await globalThis.fetch("/api/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "fund", address: account.address }),
    });
    const data = (await res.json()) as { success?: boolean; error?: string };
    if (!data.success) throw new Error(data.error ?? "Funding failed");

    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 1_000));
      const balRes = await globalThis.fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "balance", address: account.address }),
      });
      const bal = (await balRes.json()) as { balance?: string };
      if (bal.balance && bal.balance !== "0") return;
    }
    throw new Error("Timed out waiting for funds");
  }

  return { address: account.address, account, fetch, session, fundWallet };
}
