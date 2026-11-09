import { RpcRequestError, TimeoutError } from "viem";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fund = vi.fn();
const getBalance = vi.fn();

vi.mock("viem/tempo", () => ({
  Actions: {
    faucet: { fund: (...args: unknown[]) => fund(...args) },
    token: { getBalance: (...args: unknown[]) => getBalance(...args) },
  },
}));

const address = "0x1234567890123456789012345678901234567890";

function rpcError(code: number) {
  return new RpcRequestError({
    body: {},
    error: { code, message: "upstream" },
    url: "https://rpc.moderato.tempo.xyz",
  });
}

async function load() {
  vi.resetModules();
  return (await import("./pages/_api/api/wallet")).POST;
}

function createRequest(
  body: unknown,
  options: { headers?: Record<string, string>; raw?: boolean } = {},
) {
  return new Request("https://mpp.dev/api/wallet", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://mpp.dev",
      "Sec-Fetch-Site": "same-origin",
      "X-Forwarded-For": "203.0.113.1",
      ...options.headers,
    },
    body: options.raw ? (body as string) : JSON.stringify(body),
  });
}

describe("api/wallet", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    fund.mockReset();
    getBalance.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("funds a valid address", async () => {
    fund.mockResolvedValue(["0xabc"]);
    const POST = await load();

    const response = await POST(createRequest({ action: "fund", address }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, txHash: "0xabc" });
    expect(fund).toHaveBeenCalledWith(expect.anything(), { account: address });
  });

  it("returns the balance of a valid address", async () => {
    getBalance.mockResolvedValue(42n);
    const POST = await load();

    const response = await POST(createRequest({ action: "balance", address }));

    expect(await response.json()).toEqual({ balance: "42" });
  });

  it.each([
    "fund",
    "balance",
  ])("rejects an invalid %s address", async (action) => {
    const POST = await load();

    const response = await POST(createRequest({ action, address: "0xnope" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid address" });
    expect(fund).not.toHaveBeenCalled();
    expect(getBalance).not.toHaveBeenCalled();
  });

  it("rejects invalid JSON", async () => {
    const POST = await load();

    const response = await POST(createRequest("{", { raw: true }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid request body" });
  });

  it("rejects an unknown action", async () => {
    const POST = await load();

    const response = await POST(createRequest({ action: "drain", address }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid action" });
  });

  it.each([
    { "Sec-Fetch-Site": "cross-site", Origin: "https://evil.example" },
    { "Sec-Fetch-Site": "same-site", Origin: "https://mpp.dev" },
    { "Sec-Fetch-Site": "", Origin: "https://evil.example" },
    { "Sec-Fetch-Site": "", Origin: "" },
  ])("rejects cross-site requests (%o)", async (headers) => {
    const POST = await load();
    const request = createRequest({ action: "fund", address }, { headers });
    for (const [name, value] of Object.entries(headers))
      if (!value) request.headers.delete(name);

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(fund).not.toHaveBeenCalled();
  });

  it("enforces the per-address cooldown", async () => {
    fund.mockResolvedValue(["0xabc"]);
    const POST = await load();

    await POST(createRequest({ action: "fund", address }));
    const response = await POST(
      createRequest(
        { action: "fund", address },
        { headers: { "X-Forwarded-For": "203.0.113.2" } },
      ),
    );

    expect(response.status).toBe(409);
    expect(fund).toHaveBeenCalledTimes(1);
  });

  it("allows back-to-back demo runs from one IP", async () => {
    fund.mockResolvedValue(["0xabc"]);
    const POST = await load();

    await POST(createRequest({ action: "fund", address }));
    const response = await POST(
      createRequest({
        action: "fund",
        address: "0x0000000000000000000000000000000000000001",
      }),
    );

    expect(response.status).toBe(200);
  });

  it("enforces the per-IP limit", async () => {
    fund.mockResolvedValue(["0xabc"]);
    const POST = await load();

    const statuses: number[] = [];
    for (let i = 1; i <= 21; i++) {
      const response = await POST(
        createRequest({
          action: "fund",
          address: `0x${i.toString(16).padStart(40, "0")}`,
        }),
      );
      statuses.push(response.status);
    }

    expect(statuses.filter((status) => status === 200)).toHaveLength(20);
    expect(statuses.at(-1)).toBe(429);
    expect(fund).toHaveBeenCalledTimes(20);
  });

  it("applies only the per-address limit without a client IP", async () => {
    fund.mockResolvedValue(["0xabc"]);
    const POST = await load();

    const responses = [];
    for (let i = 1; i <= 21; i++) {
      const request = createRequest({
        action: "fund",
        address: `0x${i.toString(16).padStart(40, "0")}`,
      });
      request.headers.delete("X-Forwarded-For");
      responses.push((await POST(request)).status);
    }

    expect(responses.every((status) => status === 200)).toBe(true);
  });

  it("hides upstream errors and releases the cooldown on a rejection", async () => {
    fund.mockRejectedValueOnce(rpcError(-32000));
    fund.mockResolvedValueOnce(["0xabc"]);
    const POST = await load();

    const failed = await POST(createRequest({ action: "fund", address }));
    expect(failed.status).toBe(500);
    expect(await failed.json()).toEqual({ error: "Funding failed" });

    const retried = await POST(createRequest({ action: "fund", address }));
    expect(retried.status).toBe(200);
  });

  it.each([
    ["a timeout", new TimeoutError({ body: {}, url: "https://rpc" })],
    ["an internal error", rpcError(-32603)],
    ["an unknown error", new Error("socket hang up")],
  ])("keeps the cooldown after %s, which may follow a funding", async (_, err) => {
    fund.mockRejectedValueOnce(err);
    fund.mockResolvedValue(["0xabc"]);
    const POST = await load();

    expect(
      (await POST(createRequest({ action: "fund", address }))).status,
    ).toBe(500);
    const retried = await POST(createRequest({ action: "fund", address }));
    expect(retried.status).toBe(409);
    expect(fund).toHaveBeenCalledTimes(1);
  });
});
