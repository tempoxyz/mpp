import { describe, expect, it } from "vitest";
import vocsConfig from "../vocs.config.ts";

const permanentContentMoves = [
  {
    source: "/docs",
    destination: "/overview",
    status: 308,
  },
  {
    source: "/guides/upgrade-x402",
    destination: "/guides/use-mpp-with-x402",
    status: 308,
  },
  {
    source: "/protocol/discovery",
    destination: "/extensions/discovery",
    status: 308,
  },
  ...["discovery", "identity", "payment-hooks", "refunds", "relays"].map(
    (page) =>
      ({
        source: `/advanced/${page}`,
        destination: `/extensions/${page}`,
        status: 308,
      }) as const,
  ),
  {
    source: "/payment-methods/evm/charge",
    destination: "/payment-methods/evm#charge",
    status: 308,
  },
  {
    source: "/payment-methods/card/charge",
    destination: "/payment-methods/card#charge",
    status: 308,
  },
  {
    source: "/payment-methods/stripe/charge",
    destination: "/payment-methods/stripe#charge",
    status: 308,
  },
  {
    source: "/payment-methods/lightning/charge",
    destination: "/payment-methods/lightning#charge",
    status: 308,
  },
  {
    source: "/payment-methods/lightning/session",
    destination: "/payment-methods/lightning#session",
    status: 308,
  },
  {
    source: "/payment-methods/solana/charge",
    destination: "/payment-methods/solana#charge",
    status: 308,
  },
  {
    source: "/payment-methods/solana/session",
    destination: "/payment-methods/solana#session",
    status: 308,
  },
  {
    source: "/payment-methods/xrpl/charge",
    destination: "/payment-methods/xrpl#charge",
    status: 308,
  },
  {
    source: "/payment-methods/xrpl/session",
    destination: "/payment-methods/xrpl#session",
    status: 308,
  },
  {
    source: "/payment-methods/stellar/charge",
    destination: "/payment-methods/stellar#charge",
    status: 308,
  },
  {
    source: "/payment-methods/stellar/session",
    destination: "/payment-methods/stellar#session",
    status: 308,
  },
  {
    source: "/payment-methods/monad/charge",
    destination: "/payment-methods/monad#charge",
    status: 308,
  },
  {
    source: "/payment-methods/nearintents/charge",
    destination: "/payment-methods/nearintents#charge",
    status: 308,
  },
  {
    source: "/payment-methods/redotpay/charge",
    destination: "/payment-methods/redotpay#charge",
    status: 308,
  },
  {
    source: "/guides/pay-as-you-go",
    destination: "/guides/usage-based#per-request",
    status: 308,
  },
  {
    source: "/guides/streamed-payments",
    destination: "/guides/usage-based#streaming",
    status: 308,
  },
  {
    source: "/protocol/transports/http",
    destination: "/protocol/transports#http",
    status: 308,
  },
  {
    source: "/protocol/transports/mcp",
    destination: "/protocol/transports#mcp-and-json-rpc",
    status: 308,
  },
  {
    source: "/protocol/transports/websocket",
    destination: "/protocol/transports#websocket",
    status: 308,
  },
  {
    source: "/extensions/identity/email-otp",
    destination: "/extensions/identity#email-otp",
    status: 308,
  },
  {
    source: "/extensions/identity/agent-signatures",
    destination: "/extensions/identity#agent-signatures",
    status: 308,
  },
  {
    source: "/extensions/identity/custom",
    destination: "/extensions/identity#your-own-identity-provider",
    status: 308,
  },
  {
    source: "/extensions/identity/payer",
    destination: "/extensions/identity#payer-identity",
    status: 308,
  },
  {
    source: "/sdk/python/core",
    destination: "/sdk/python#core-types",
    status: 308,
  },
  {
    source: "/sdk/python/client",
    destination: "/sdk/python#client",
    status: 308,
  },
  {
    source: "/sdk/python/server",
    destination: "/sdk/python#server",
    status: 308,
  },
  {
    source: "/sdk/rust/core",
    destination: "/sdk/rust#core-types",
    status: 308,
  },
  {
    source: "/sdk/rust/client",
    destination: "/sdk/rust#client",
    status: 308,
  },
  {
    source: "/sdk/rust/server",
    destination: "/sdk/rust#server",
    status: 308,
  },
  {
    source: "/sdk/go/core",
    destination: "/sdk/go#core-types",
    status: 308,
  },
  {
    source: "/sdk/go/client",
    destination: "/sdk/go#client",
    status: 308,
  },
  {
    source: "/sdk/go/server",
    destination: "/sdk/go#server",
    status: 308,
  },
  {
    source: "/sdk/ruby/core",
    destination: "/sdk/ruby#core-types",
    status: 308,
  },
  {
    source: "/sdk/ruby/client",
    destination: "/sdk/ruby#client",
    status: 308,
  },
  {
    source: "/sdk/ruby/server",
    destination: "/sdk/ruby#server",
    status: 308,
  },
] as const;

describe("permanent content redirects", () => {
  it("uses 308 only for the confirmed permanent moves", () => {
    const redirects = (vocsConfig.redirects ?? [])
      .filter((redirect) => redirect.status === 308)
      .map(({ source, destination, status }) => ({
        source,
        destination,
        status,
      }))
      .sort((a, b) => a.source.localeCompare(b.source));

    // Pages merged into a parent (anchored destination) also redirect their
    // Markdown URL to the parent's Markdown.
    const markdownTwins = permanentContentMoves
      .filter(({ destination }) => destination.includes("#"))
      .map(({ source, destination }) => ({
        source: `${source}.md`,
        destination: `${destination.split("#")[0]}.md`,
        status: 308,
      }));

    expect(redirects).toEqual(
      [...permanentContentMoves, ...markdownTwins].sort((a, b) =>
        a.source.localeCompare(b.source),
      ),
    );
  });
});
