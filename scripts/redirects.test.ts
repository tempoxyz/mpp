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
    destination: "/advanced/discovery",
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

    expect(redirects).toEqual(
      [...permanentContentMoves].sort((a, b) =>
        a.source.localeCompare(b.source),
      ),
    );
  });
});
