// Who the caller proved they are, and what that buys them.
//
//   anonymous  nothing                                  0.03 OUSD, a haiku for a stranger
//   email      a verified email (Identity-Attestation)  0.02 OUSD, a haiku about you
//   apiKey     an API key, or an @tempo.xyz email 0.01 OUSD, inside jokes
//
// Each tier above anonymous is an mppx identity verifier: `EmailOtp.Server.verifier`
// for email, and `Identity.from` over the member table for API keys.
import * as EmailOtp from "mppx/extensions/identity/email-otp";
import * as Identity from "mppx/identity";

import * as Issuer from "./issuer.js";
import type { Trace } from "./trace.js";

export type Tier = "anonymous" | "email" | "apiKey";

/** Price per haiku, in OUSD. */
/** Haikus an anonymous caller (one IP, or one IPv6 /64) may buy per UTC day. Verified tiers have no limit. */
export const anonymousDailyLimit = 3;

/** A custom topic: a few words, letters and digits only, so it can't steer the prompt. */
export function topic(value: string | null): string | undefined {
  const trimmed = value?.trim().replace(/\s+/g, " ");
  return trimmed && /^[\p{L}\p{N} ,'-]{1,40}$/u.test(trimmed)
    ? trimmed
    : undefined;
}

export const prices = {
  anonymous: "0.03",
  email: "0.02",
  apiKey: "0.01",
} as const satisfies Record<Tier, string>;

const rank: Record<Tier, number> = { anonymous: 0, email: 1, apiKey: 2 };

/** A member, as the server's own database knows them. */
export type Member = { name: string; team: string; role: string };

/** The member database: a table keyed by API key. Real apps look this up in their own store. */
export const members: Record<string, Member> = {
  "haiku-demo-key": {
    name: "Satoshi",
    team: "Payments",
    role: "protocol engineer",
  },
};

/** Members by email domain: every verified @tempo.xyz address is a member. */
const memberDomains: Record<string, Omit<Member, "name">> = {
  "tempo.xyz": { team: "Tempo", role: "teammate" },
};

/** The verifiers of one deployment, bound to its origin and issuer. */
export function create(parameters: {
  audience: string;
  issuer: string;
  env: Issuer.Env;
}) {
  const { audience, env, issuer } = parameters;

  // step: identity.email
  const email = EmailOtp.Server.verifier({
    audience,
    issuer,
    // The issuer runs in this Worker, so its key is read directly.
    keyResolver: Issuer.keyResolver(env),
  });

  // step: identity.member
  const apiKey = Identity.from({
    verify(request) {
      const key = request.headers.get("X-Api-Key");
      if (!key) return undefined;
      // Own keys only: '__proto__' or 'toString' must not match an inherited property.
      const member = Object.hasOwn(members, key) ? members[key] : undefined;
      if (!member)
        throw new Identity.Rejection("Unknown API key.", {
          status: "forbidden",
        });
      return member;
    },
  });
  const memberEmail = EmailOtp.Server.verifier({
    audience,
    issuer,
    keyResolver: Issuer.keyResolver(env),
    allow: (address) =>
      Object.hasOwn(memberDomains, address.split("@")[1] ?? ""),
  });
  const member = Identity.anyOf(apiKey, memberEmail);

  /** The verifier a tier requires; none for anonymous. */
  const verifiers = { anonymous: undefined, email, apiKey: member } as const;

  return {
    verifiers,
    /** Why a member proof the request carries failed, if it carries one that did. */
    async rejection(
      request: Request,
    ): Promise<{ code: number; reason: string } | undefined> {
      if (!request.headers.has("X-Api-Key")) return undefined;
      const result = await apiKey.verify(request.clone());
      if (result.status === "valid" || result.status === "missing")
        return undefined;
      return {
        code: result.status === "forbidden" ? 403 : 401,
        reason: result.reason,
      };
    },
    /**
     * The highest tier the request's proofs verify. A missing, invalid or disallowed
     * proof never blocks the request: it falls back to the tier below.
     */
    async resolve(request: Request, trace: Trace): Promise<Tier> {
      const [asMember, asEmail] = await Promise.all([
        member.verify(request.clone()),
        email.verify(request.clone()),
      ]);
      if (asMember.status === "valid") {
        trace.step("identity.member", "member proof verified");
        return "apiKey";
      }
      if (asMember.status !== "missing")
        trace.step("identity.member", asMember.reason);
      if (asEmail.status === "valid") {
        trace.step("identity.email", `verified ${asEmail.value.email}`);
        return "email";
      }
      if (asEmail.status !== "missing")
        trace.step("identity.email", asEmail.reason);
      return "anonymous";
    },
    /** The caller's identity details the haiku may use, from a settled charge. */
    profile(results: Identity.Results | undefined): Profile {
      const key = results?.get(apiKey);
      if (key)
        return { kind: "member", ...key, seen: ["name", "team", "role"] };
      const address =
        results?.get(memberEmail)?.email ?? results?.get(email)?.email;
      if (!address) return { kind: "anonymous", seen: [] };
      const [local, domain] = address.split("@") as [string, string];
      const name = local
        .split(/[.+_-]/)[0]!
        .replace(/^./, (c) => c.toUpperCase());
      const known = Object.hasOwn(memberDomains, domain)
        ? memberDomains[domain]
        : undefined;
      if (known)
        return { kind: "member", name, ...known, domain, seen: ["email"] };
      return { kind: "email", name, domain, seen: ["email"] };
    },
  };
}

/** What the haiku knows about the caller, and which verified claims it came from. */
export type Profile =
  | { kind: "anonymous"; seen: string[] }
  | { kind: "email"; name: string; domain: string; seen: string[] }
  | ({ kind: "member"; domain?: string; seen: string[] } & Member);

/** Whether `tier` is above `other`. */
export function above(tier: Tier, other: Tier) {
  return rank[tier] > rank[other];
}

/** Parses a requested tier, ignoring unknown values. */
export function parse(value: string | null): Tier | undefined {
  return value === "anonymous" || value === "email" || value === "apiKey"
    ? value
    : undefined;
}
