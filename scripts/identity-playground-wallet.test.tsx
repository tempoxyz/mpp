// @vitest-environment happy-dom
/// <reference path="../workers/identity-playground/src/app/virtual.d.ts" />

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../workers/identity-playground/src/app/App.js";
import {
  unloaded,
  type Wallet,
} from "../workers/identity-playground/src/app/wallet-state.js";

const mocks = vi.hoisted(() => ({
  wallet: {} as Wallet,
  create: vi.fn(),
  privateKeyToAccount: vi.fn(),
}));

vi.mock("../workers/identity-playground/src/app/CodeLines.js", () => ({
  CodeLines: () => null,
}));
vi.mock("../workers/identity-playground/src/app/WalletBridge.js", () => ({
  default: ({ onChange }: { onChange: (wallet: Wallet) => void }) => {
    useEffect(() => onChange(mocks.wallet), [onChange]);
    return null;
  },
}));
vi.mock("../workers/identity-playground/src/app/chain.js", () => ({
  Actions: { token: { getBalance: async () => ({ amount: 1_000_000n }) } },
  privateKeyToAccount: mocks.privateKeyToAccount,
  rpc: {},
}));
vi.mock("../workers/identity-playground/src/client.js", () => ({
  create: mocks.create,
}));

const address = "0x0000000000000000000000000000000000000001";

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  mocks.wallet = { ...unloaded, ready: true };
  mocks.create.mockReturnValue(
    async () => new Response("Test response", { status: 400 }),
  );
  mocks.privateKeyToAccount.mockReturnValue({ address });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        limit: 3,
        prices: { anonymous: "0.03", apiKey: "0.01", email: "0.02" },
      }),
    ),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("identity playground wallet selection", () => {
  it.each([
    false,
    true,
  ])("does not buy with a restored but disconnected address (reconnecting: %s)", async (linking) => {
    mocks.wallet = { ...mocks.wallet, address, linking };
    render(<App />);
    await screen.findByRole("button", {
      name: linking ? "Linking…" : "Link Tempo Wallet",
    });
    expect(screen.queryByRole("button", { name: /Buy haiku/ })).toBeNull();
    expect(mocks.privateKeyToAccount).not.toHaveBeenCalled();
  });

  it("uses the connected wallet without a test key", async () => {
    const parameters = { getClient: vi.fn() };
    mocks.wallet = {
      ...mocks.wallet,
      address,
      connected: true,
      mppx: async () => parameters,
    };
    render(<App />);
    const buy = await screen.findByRole("button", { name: /Buy haiku/ });
    await waitFor(() =>
      expect((buy as HTMLButtonElement).disabled).toBe(false),
    );
    fireEvent.click(buy);
    await waitFor(() =>
      expect(mocks.create).toHaveBeenCalledWith(
        expect.objectContaining({ wallet: parameters }),
      ),
    );
    expect(mocks.privateKeyToAccount).not.toHaveBeenCalled();
  });

  it("asks to relink when the connected signer disappears", async () => {
    mocks.wallet = { ...mocks.wallet, address, connected: true };
    render(<App />);
    const buy = await screen.findByRole("button", { name: /Buy haiku/ });
    await waitFor(() =>
      expect((buy as HTMLButtonElement).disabled).toBe(false),
    );
    fireEvent.click(buy);
    await screen.findByText(
      "Wallet disconnected. Link Tempo Wallet and try again.",
    );
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.privateKeyToAccount).not.toHaveBeenCalled();
  });

  it("keeps a stored test wallet usable without a linked wallet", async () => {
    localStorage.setItem("fortune.key", `0x${"01".repeat(32)}`);
    localStorage.setItem("fortune.address", address);
    render(<App />);
    const buy = await screen.findByRole("button", { name: /Buy haiku/ });
    await waitFor(() =>
      expect((buy as HTMLButtonElement).disabled).toBe(false),
    );
    fireEvent.click(buy);
    await waitFor(() =>
      expect(mocks.create).toHaveBeenCalledWith(
        expect.objectContaining({ wallet: { account: { address } } }),
      ),
    );
  });
});
