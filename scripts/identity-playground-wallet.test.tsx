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
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).includes("rpc.moderato.tempo.xyz")) {
        const request = JSON.parse(String(init?.body));
        const value =
          request.params?.[0]?.data === "0x313ce567" ? 6 : 1_000_000;
        return Response.json({
          id: request.id,
          jsonrpc: "2.0",
          result: `0x${value.toString(16).padStart(64, "0")}`,
        });
      }
      return Response.json({
        limit: 3,
        prices: { anonymous: "0.03", apiKey: "0.01", email: "0.02" },
      });
    }),
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

describe("identity playground example changes", () => {
  beforeEach(() => {
    mocks.wallet = {
      ...unloaded,
      address,
      connected: true,
      ready: true,
      mppx: async () => ({}),
    };
  });

  it("clears the previous error and topic when selecting another example", async () => {
    render(<App />);
    const buy = await screen.findByRole("button", { name: /Buy haiku/ });
    await waitFor(() =>
      expect((buy as HTMLButtonElement).disabled).toBe(false),
    );
    fireEvent.change(screen.getByLabelText("Topic"), {
      target: { value: "old topic" },
    });
    fireEvent.click(buy);
    await screen.findByText("Test response");
    fireEvent.click(screen.getByRole("button", { name: "Email 0.02" }));
    expect(screen.queryByText("Test response")).toBeNull();
    expect((screen.getByLabelText("Topic") as HTMLInputElement).value).toBe("");
  });

  it("clears the previous poem, receipt, and request history", async () => {
    mocks.create.mockImplementation((options) => async () => {
      await options.fetch("http://localhost/api/haiku");
      return Response.json(
        {
          haiku: ["Old poem", "Second line", "Third line"],
          remaining: 2,
        },
        {
          headers: {
            "Payment-Receipt": btoa(
              JSON.stringify({
                method: "tempo",
                reference: "0xreceipt",
                status: "success",
                timestamp: "2026-11-11T00:00:00Z",
              }),
            ),
          },
        },
      );
    });
    render(<App />);
    const buy = await screen.findByRole("button", { name: /Buy haiku/ });
    await waitFor(() =>
      expect((buy as HTMLButtonElement).disabled).toBe(false),
    );
    fireEvent.click(buy);
    await screen.findByText("Old poem");
    expect(screen.getByText("Requests")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "API key 0.01" }));
    expect(screen.queryByText("Old poem")).toBeNull();
    expect(screen.queryByText("Requests")).toBeNull();
    expect(screen.queryByRole("link", { name: "receipt" })).toBeNull();
    expect(screen.getByText("Buy a haiku to start.")).not.toBeNull();
  });

  it("offers a topic only to verified buyers", async () => {
    render(<App />);
    const topic = (await screen.findByLabelText("Topic")) as HTMLInputElement;
    expect(topic.disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "API key 0.01" }));
    expect((screen.getByLabelText("Topic") as HTMLInputElement).disabled).toBe(
      false,
    );
  });

  it("keeps the active example while a purchase is in flight", async () => {
    let finish!: (response: Response) => void;
    mocks.create.mockReturnValue(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    );
    render(<App />);
    const buy = await screen.findByRole("button", { name: /Buy haiku/ });
    await waitFor(() =>
      expect((buy as HTMLButtonElement).disabled).toBe(false),
    );
    fireEvent.click(buy);
    await screen.findByRole("button", { name: "Paying…" });
    expect(
      (screen.getByRole("button", { name: "Email 0.02" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    await waitFor(() => expect(finish).toBeDefined());
    finish(new Response("Test response", { status: 400 }));
    await waitFor(() =>
      expect(
        (
          screen.getByRole("button", {
            name: "Email 0.02",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false),
    );
  });
});
