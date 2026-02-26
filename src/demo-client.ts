"use client";

import { Mppx, stripe, tempo } from "mppx/client";
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
    fetch: globalThis.fetch,
    polyfill: false,
    methods: [tempo({ account, maxDeposit, getClient })],
  });

  const session = tempo.session({
    account,
    maxDeposit,
    getClient,
    fetch: globalThis.fetch,
  });

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

  const { fetch: _stripeFetch } = Mppx.create({
    polyfill: false,
    methods: [
      stripe({
        createToken: async (params) => {
          const res = await globalThis.fetch("/api/demo/create-spt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: params.amount,
              currency: params.currency,
              expiresAt: params.expiresAt,
              metadata: params.metadata,
              networkId: params.networkId,
              paymentMethod: params.paymentMethod,
            }),
          });
          if (!res.ok) {
            const err = (await res.json()) as { error: string };
            throw new Error(err.error);
          }
          const { spt } = (await res.json()) as { spt: string };
          return spt;
        },
        paymentMethod: "pm_card_visa",
      }),
    ],
  });

  async function stripeFetch(url: string, paymentMethod?: string) {
    return _stripeFetch(url, {
      context: paymentMethod ? { paymentMethod } : undefined,
    });
  }

  return {
    address: account.address,
    account,
    fetch,
    session,
    fundWallet,
    stripeFetch,
  };
}
