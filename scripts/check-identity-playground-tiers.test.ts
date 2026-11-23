import { describe, expect, it } from "vitest";
import * as Issuer from "../workers/playground/src/identity/issuer.js";
import * as Tiers from "../workers/playground/src/identity/tiers.js";
import type { Trace } from "../workers/playground/src/identity/trace.js";

const audience = "https://mpp.dev";
const issuer = "https://mpp.dev/playground/identity/issuer";
const env = {
  MPP_PRIVATE_KEY:
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
};
const sent: string[] = [];
const emailing = {
  ...env,
  EMAIL: {
    async send(message: Record<string, string>) {
      sent.push(message.text!);
    },
  },
  EMAIL_FROM: "playground@mpp.dev",
};
const trace = { step() {} } as unknown as Trace;

function memory() {
  const values = new Map<string, unknown>();
  return {
    async delete(key: string) {
      values.delete(key);
    },
    async get(key: string) {
      return values.get(key) ?? null;
    },
    async put(key: string, value: unknown) {
      values.set(key, value);
    },
    async update<result>(
      key: string,
      fn: (
        current: unknown,
      ) =>
        | { op: "noop"; result: result }
        | { op: "set"; value: unknown; result: result }
        | { op: "delete"; result: result },
    ) {
      const change = fn(values.get(key) ?? null);
      if (change.op === "set") values.set(key, change.value);
      if (change.op === "delete") values.delete(key);
      return change.result;
    },
  };
}

/** A request carrying an attestation the issuer signed for `email`, through its OTP flow. */
async function request(environment: Issuer.Env, email: string) {
  const store = memory();
  const call = async (pathname: string, body: unknown) => {
    const response = await Issuer.handle(
      new Request(`${audience}${Issuer.path}${pathname}`, {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
      { env: environment, issuer, store, trace },
    );
    return (await response!.json()) as Record<string, string>;
  };
  const { id } = await call("/email/otp", { audience, email });
  const record = (await store.get(`otp:${id}`)) as {
    inbox?: { code: string };
  };
  const code = record.inbox?.code ?? sent.at(-1)!.match(/\d{8}/)![0];
  const { attestation } = await call("/email/verify", { code, id });
  return new Request(`${audience}/playground/identity/api/haiku`, {
    headers: { "Identity-Attestation": attestation! },
  });
}

function tiers(environment: Issuer.Env) {
  return Tiers.create({
    audience,
    env: environment,
    issuer,
    store: memory() as never,
  });
}

describe("identity playground tiers", () => {
  it("prices an emailed @tempo.xyz address as a member", async () => {
    const tier = await tiers(emailing).resolve(
      await request(emailing, "ada@tempo.xyz"),
      trace,
    );
    expect(tier).toBe("apiKey");
  });

  it("prices a demo inbox @tempo.xyz address as email", async () => {
    const tier = await tiers(env).resolve(
      await request(env, "ada@tempo.xyz"),
      trace,
    );
    expect(tier).toBe("email");
  });

  it("prices another verified address as email", async () => {
    const tier = await tiers(emailing).resolve(
      await request(emailing, "ada@example.com"),
      trace,
    );
    expect(tier).toBe("email");
  });

  it("prices a known API key as a member", async () => {
    const tier = await tiers(env).resolve(
      new Request(`${audience}/playground/identity/api/haiku`, {
        headers: { "X-Api-Key": "haiku-demo-key" },
      }),
      trace,
    );
    expect(tier).toBe("apiKey");
  });
});
