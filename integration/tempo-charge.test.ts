import { Receipt } from "mppx";
import { Mppx as ClientMppx, tempo as clientTempo } from "mppx/client";
import { Mppx as ServerMppx, tempo as serverTempo } from "mppx/server";
import {
  type Address,
  createClient,
  defineChain,
  type Hash,
  http,
  parseUnits,
} from "viem";
import { mnemonicToAccount } from "viem/accounts";
import { readContract, waitForTransactionReceipt } from "viem/actions";
import { beforeAll, describe, expect, test } from "vitest";

const rpcUrl = process.env.TEMPO_RPC_URL ?? "http://127.0.0.1:18545";
const pathUsd = "0x20c0000000000000000000000000000000000000";
const mnemonic = "test test test test test test test test test test test junk";
const payer = mnemonicToAccount(mnemonic, { accountIndex: 1 });
const recipient = mnemonicToAccount(mnemonic, { accountIndex: 2 });

const chain = defineChain({
  id: 1337,
  name: "Tempo Localnet",
  nativeCurrency: { decimals: 18, name: "USD", symbol: "USD" },
  rpcUrls: { default: { http: [rpcUrl] } },
});
const transport = http(rpcUrl, { retryCount: 0, timeout: 30_000 });
const payerClient = createClient({ account: payer, chain, transport });
const publicClient = createClient({ chain, transport });

const balanceOfAbi = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

beforeAll(async () => {
  const hashes = (await publicClient.request({
    method: "tempo_fundAddress",
    params: [payer.address],
  } as never)) as Hash[];

  for (const hash of hashes) {
    await waitForTransactionReceipt(publicClient, { hash, timeout: 30_000 });
  }
});

describe("Tempo charge integration", () => {
  test("settles a paid request and returns an MPP Receipt", async () => {
    const amount = parseUnits("0.01", 6);
    const recipientBefore = await balanceOf(recipient.address);
    const payment = ServerMppx.create({
      methods: [
        serverTempo.charge({
          chainId: chain.id,
          currency: pathUsd,
          getClient: () => publicClient,
          recipient: recipient.address,
        }),
      ],
      realm: "local.mpp.dev",
      secretKey: "local-integration-secret-key-32-bytes",
    });
    const paid = payment.charge({ amount: "0.01" });

    const appFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const result = await paid(new Request(input, init));
      if (result.status === 402) return result.challenge;
      return result.withReceipt(Response.json({ paid: true }));
    };
    const client = ClientMppx.create({
      fetch: appFetch,
      methods: [
        clientTempo.charge({
          account: payer,
          expectedChainId: chain.id,
          getClient: () => payerClient,
          mode: "push",
        }),
      ],
      polyfill: false,
    });

    const response = await client.fetch("https://local.mpp.dev/paid");

    expect(response.status).toBe(200);
    expect(await response.clone().json()).toEqual({ paid: true });
    expect(Receipt.fromResponse(response)).toMatchObject({
      method: "tempo",
      status: "success",
    });
    expect(await balanceOf(recipient.address)).toBe(recipientBefore + amount);
  });
});

function balanceOf(address: Address) {
  return readContract(publicClient, {
    abi: balanceOfAbi,
    address: pathUsd,
    args: [address],
    functionName: "balanceOf",
  });
}
