// The email worker: a minimal MPP identity issuer running in the same Worker.
//
//   POST /issuer/email/otp             {email, audience} -> emails an 8-digit code: {id, expires_at}
//   POST /issuer/email/verify          {id, code}        -> {attestation, expires_at}
//   GET  /issuer/.well-known/jwks.json                   -> the key attestations verify with
//
// It speaks the same protocol as tempoxyz/tempo-apps apps/mpp-identity, so
// `EmailOtp.Client.prover` and the curl flow work against either. Attestations are
// signed with `Attestation.sign` from mppx. Without an `EMAIL` binding, codes go to
// a demo inbox the page shows instead of being emailed.
import * as Attestation from "mppx/extensions/identity/attestation";

import * as Keys from "./keys.js";
import type { Trace } from "./trace.js";

/** What the issuer needs from the Worker's environment. */
export type Env = {
  /** Payee account key; the issuer's Ed25519 key is derived from it. */
  MPP_PRIVATE_KEY: string;
  /** Ed25519 private key as a JWK (JSON). Optional: overrides the derived key. */
  ISSUER_PRIVATE_KEY?: string | undefined;
  /** Cloudflare Email Service binding. Optional: without it codes go to the demo inbox. */
  EMAIL?:
    | { send(message: Record<string, string>): Promise<unknown> }
    | undefined;
  /** Sender address for EMAIL. */
  EMAIL_FROM?: string | undefined;
};

/**
 * Where pending codes live: an atomic key-value store such as the mppx Durable Object
 * store. Counters go through `update` so concurrent requests can't race past the limits.
 */
export type Store = {
  get(key: string): Promise<unknown>;
  put(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
  update<result>(
    key: string,
    fn: (
      current: unknown,
    ) =>
      | { op: "noop"; result: result }
      | { op: "set"; value: unknown; result: result }
      | { op: "delete"; result: result },
  ): Promise<result>;
};

type Code = {
  codeHash: string;
  email: string;
  audience: string;
  expiresAt: number;
  attempts: number;
  /** Demo inbox only: the message that would have been emailed. */
  inbox?:
    | { to: string; subject: string; text: string; code: string }
    | undefined;
};

const codeTtl = 10 * 60 * 1000;
const maxAttempts = 5;
const attestationTtl = 60 * 60;
/** Codes per mailbox per 10 minutes. */
const sendLimit = 3;
/** Codes per client IP per 10 minutes: low, so a handful of IPs can't use up `emailLimit`. */
const clientLimit = 5;
/** Real emails across all callers per 10 minutes. */
const emailLimit = 100;

/** Path prefix of the issuer, so its URL is `<origin>/issuer`. */
export const path = "/issuer";

/** The issuer's signing key, its public JWK and key ID (RFC 7638 thumbprint). */
type IssuerKeys = {
  keyId: string;
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  publicJwk: { crv: string; kty: string; x: string };
};
let keys: Promise<IssuerKeys> | undefined;

/** Loads the issuer's key once per isolate. */
export function key(env: Env): Promise<IssuerKeys> {
  keys ??= (async () => {
    // Only the key material: runtimes disagree on the "alg" an Ed25519 JWK carries.
    const { crv, d, kty, x } = env.ISSUER_PRIVATE_KEY
      ? (JSON.parse(env.ISSUER_PRIVATE_KEY) as JsonWebKey)
      : await Keys.issuerJwk(env.MPP_PRIVATE_KEY);
    const publicJwk = { crv: "Ed25519", kty: "OKP", x: x! };
    const privateKey = await crypto.subtle.importKey(
      "jwk",
      { crv, d, kty, x },
      { name: "Ed25519" },
      false,
      ["sign"],
    );
    const publicKey = await crypto.subtle.importKey(
      "jwk",
      publicJwk,
      { name: "Ed25519" },
      true,
      ["verify"],
    );
    // RFC 7638: the SHA-256 of the required members in lexicographic order.
    const keyId = base64url(
      await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(JSON.stringify(publicJwk)),
      ),
    );
    return { keyId, privateKey, publicKey, publicJwk };
  })();
  return keys;
}

/**
 * Resolves the issuer's key without a network round trip: the verifier and the issuer
 * share this Worker, and a Worker cannot fetch its own workers.dev URL.
 */
export function keyResolver(env: Env): Attestation.KeyResolver {
  return async ({ keyId }) => {
    const { keyId: id, publicKey } = await key(env);
    return keyId === id ? publicKey : undefined;
  };
}

/** Handles an issuer request, or returns `undefined` for another path. */
export async function handle(
  request: Request,
  parameters: { env: Env; issuer: string; store: Store; trace: Trace },
): Promise<Response | undefined> {
  const { env, issuer, store, trace } = parameters;
  const url = new URL(request.url);

  if (
    request.method === "GET" &&
    url.pathname === `${path}/.well-known/jwks.json`
  ) {
    const { keyId, publicJwk } = await key(env);
    return Response.json({
      keys: [{ ...publicJwk, alg: "EdDSA", kid: keyId, use: "sig" }],
    });
  }

  // JSON only: a cross-site form can send text/plain without a preflight, not application/json.
  if (
    request.method === "POST" &&
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    return Response.json(
      { error: "Content-Type must be application/json." },
      { status: 415 },
    );

  if (request.method === "POST" && url.pathname === `${path}/email/otp`) {
    const body = await json(request);
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    // http(s) only: other schemes (data:, mailto:) have the origin "null".
    const audience =
      typeof body.audience === "string" &&
      URL.canParse(body.audience) &&
      /^https?:$/.test(new URL(body.audience).protocol)
        ? new URL(body.audience).origin
        : "";
    // Length first, and labels that can't contain dots, so the pattern can't backtrack.
    // A bare addr-spec only: no display names or brackets that slip past the mailbox limit.
    if (
      email.length > 254 ||
      !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(email)
    )
      return Response.json(
        { error: "Invalid email address." },
        { status: 400 },
      );
    // Only this deployment's own origin: codes go to a public demo inbox, so an attestation
    // for another audience would let anyone claim any email there.
    if (!audience || audience !== new URL(issuer).origin)
      return Response.json({ error: "Invalid audience." }, { status: 400 });

    // step: issuer.otp
    // One allowance per client, for everyone (real email only) and per mailbox (ignoring
    // +tags and dots), so neither address variants nor many recipients get around it.
    // The mailbox goes last: a request another limit refuses must not spend a victim's slots.
    const client = clientKey(request);
    const limits: [string, number][] = [
      [`sent-ip:${client}`, clientLimit],
      ...(env.EMAIL && env.EMAIL_FROM
        ? [["sent-all", emailLimit] as [string, number]]
        : []),
      [`sent:${mailbox(email)}`, sendLimit],
    ];
    let allowed = true;
    for (const [key, limit] of limits)
      if (allowed) allowed = await take(store, key, limit);
    if (!allowed)
      return Response.json(
        { error: "Too many codes. Try again later." },
        { status: 429 },
      );

    const id = base64url(crypto.getRandomValues(new Uint8Array(16)));
    const code = String(
      crypto.getRandomValues(new Uint32Array(1))[0]! % 100_000_000,
    ).padStart(8, "0");
    const host = new URL(audience).host;
    const message = {
      to: email,
      subject: `Your verification code for ${host}`,
      text: `Your verification code for ${host} is: ${code}\n\nIt expires in 10 minutes.`,
    };
    const record: Code = {
      attempts: 0,
      audience,
      codeHash: await hash(env, id + code),
      email,
      expiresAt: Date.now() + codeTtl,
    };
    // step: issuer.email
    // Store the code before emailing it, so a failed write never sends a dead code.
    const email_ = Boolean(env.EMAIL && env.EMAIL_FROM);
    if (!email_) record.inbox = { ...message, code };
    await store.put(`otp:${id}`, record);
    if (email_) {
      await env.EMAIL!.send({ ...message, from: env.EMAIL_FROM! });
      trace.step("issuer.email", `emailed a code to ${email}`);
    } else trace.step("issuer.email", `demo inbox: code for ${email}`);
    trace.step("issuer.otp", `code request ${id.slice(0, 6)}… for ${host}`);
    return Response.json({
      id,
      expires_at: new Date(record.expiresAt).toISOString(),
    });
  }

  if (request.method === "POST" && url.pathname === `${path}/email/verify`) {
    const body = await json(request);
    const id = typeof body.id === "string" ? body.id : "";
    const code = typeof body.code === "string" ? body.code : "";
    const invalid = () =>
      Response.json({ error: "Invalid or expired code." }, { status: 400 });
    if (!id) return invalid();
    const codeHash = await hash(env, id + code);
    const now = Date.now();
    // One atomic step checks the code and spends an attempt or the code itself, so
    // parallel guesses can't exceed maxAttempts and a code verifies at most once.
    const record = await store.update(`otp:${id}`, (current) => {
      const record = current as Code | null;
      if (!record) return { op: "noop", result: undefined };
      // Spent or expired codes are removed rather than kept forever.
      if (record.expiresAt < now || record.attempts >= maxAttempts)
        return { op: "delete", result: undefined };
      if (codeHash !== record.codeHash)
        return {
          op: "set",
          result: undefined,
          value: { ...record, attempts: record.attempts + 1 },
        };
      return { op: "delete", result: record };
    });
    if (!record) {
      trace.step("issuer.verify", "wrong or expired code");
      return invalid();
    }
    trace.step("issuer.verify", `code accepted for ${record.email}`);

    // step: issuer.sign
    const { keyId, privateKey } = await key(env);
    const iat = Math.floor(Date.now() / 1000);
    const attestation = await Attestation.sign(
      {
        aud: record.audience,
        exp: iat + attestationTtl,
        iat,
        iss: issuer,
        jti: base64url(crypto.getRandomValues(new Uint8Array(16))),
        sub: record.email,
        type: "email",
      },
      { key: privateKey, keyId },
    );
    trace.step(
      "issuer.sign",
      `signed an email attestation for ${record.audience}`,
    );
    return Response.json({
      attestation,
      expires_at: new Date((iat + attestationTtl) * 1000).toISOString(),
    });
  }

  return undefined;
}

/** The demo inbox message for a pending code request, while it is pending. */
export async function inbox(store: Store, id: string) {
  const record = (await store.get(`otp:${id}`)) as Code | null;
  if (!record?.inbox || record.expiresAt < Date.now()) return undefined;
  return record.inbox;
}

/**
 * When an issuer record stops mattering, so its storage can be freed: a code at its expiry,
 * a send counter 10 minutes after its last send. Undefined for keys the issuer doesn't own.
 */
export function expiry(key: string, value: unknown): number | undefined {
  if (
    key.startsWith("otp:") &&
    value &&
    typeof (value as Code).expiresAt === "number"
  )
    return (value as Code).expiresAt;
  if (key.startsWith("sent") && Array.isArray(value) && value.length > 0)
    return Math.max(...(value as number[])) + codeTtl;
  // A daily quota counter: the end of its UTC day.
  if (
    key.startsWith("quota:") &&
    value &&
    typeof (value as { day?: unknown }).day === "string"
  )
    return Date.parse((value as { day: string }).day) + 24 * 60 * 60 * 1000;
  return undefined;
}

/** The caller's IP as Cloudflare saw it, which callers can't forge. */
export function clientIp(request: Request) {
  return request.headers.get("cf-connecting-ip") ?? "local";
}

/**
 * The rate-limit key for the caller: its IP (or IPv6 /64), under the proxy that forwarded it
 * when there is one. A direct caller that forges a forwarded IP lands under its own address,
 * never in the bucket of the user it names.
 */
export function clientKey(request: Request) {
  const client = prefix(clientIp(request));
  const via = request.headers.get("x-playground-via");
  return via ? `${prefix(via)}>${client}` : client;
}

/** An IPv6 address's /64, which one host usually controls whole; IPv4 addresses as they are. */
export function prefix(ip: string) {
  if (!ip.includes(":")) return ip;
  // An IPv4-mapped address (::ffff:1.2.3.4) is that IPv4 address.
  if (ip.includes(".")) return ip.slice(ip.lastIndexOf(":") + 1);
  const [head = "", tail = ""] = ip.toLowerCase().split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const groups = ip.includes("::")
    ? [...left, ...Array(8 - left.length - right.length).fill("0"), ...right]
    : left;
  return `${groups
    .slice(0, 4)
    .map((group) => group.replace(/^0+(?=.)/, ""))
    .join(":")}::/64`;
}

/** Records a send under key if fewer than limit happened in the last 10 minutes. */
function take(store: Store, key: string, limit: number) {
  const now = Date.now();
  return store.update(key, (current) => {
    const recent = ((current as number[] | null) ?? []).filter(
      (at) => at > now - codeTtl,
    );
    if (recent.length >= limit) return { op: "noop", result: false };
    return { op: "set", result: true, value: [...recent, now] };
  });
}

/** The mailbox an address delivers to: without a +tag or dots in the local part. */
function mailbox(email: string) {
  const at = email.lastIndexOf("@");
  return (
    email.slice(0, at).split("+")[0]!.replaceAll(".", "") + email.slice(at)
  );
}

const maxBody = 4096;

/** Reads at most maxBody bytes, so an oversized body is never buffered whole. */
async function json(request: Request): Promise<Record<string, unknown>> {
  try {
    if (Number(request.headers.get("content-length") ?? 0) > maxBody) return {};
    const reader = request.body?.getReader();
    if (!reader) return {};
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBody) {
        await reader.cancel();
        return {};
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const value = JSON.parse(new TextDecoder().decode(bytes));
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

/**
 * Keyed hash of a pending code (HMAC-SHA-256 with a key derived from MPP_PRIVATE_KEY),
 * so someone who can read the store still can't brute-force its 10^8 codes offline.
 */
async function hash(env: Env, value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(Keys.derive(env.MPP_PRIVATE_KEY, "otp-hmac")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return base64url(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)),
  );
}

function base64url(bytes: ArrayBuffer | Uint8Array) {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}
