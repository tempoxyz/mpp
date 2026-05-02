import { describe, expect, it } from "vitest";
import { classifyLink, extractLinks } from "./check-links.ts";

describe("extractLinks", () => {
  it("finds markdown and jsx links", () => {
    const links = extractLinks(
      [
        "Read [the docs](https://paymentauth.org)",
        '<SpecCard to="/protocol/http-402" />',
        '<a href="https://tempo.xyz">Tempo</a>',
      ].join("\n"),
      "/tmp/example.mdx",
    );

    expect(links.map((link) => link.target)).toEqual([
      "https://paymentauth.org",
      "/protocol/http-402",
      "https://tempo.xyz",
    ]);
    expect(links.map((link) => link.line)).toEqual([1, 2, 3]);
  });
});

describe("classifyLink", () => {
  it("treats mpp.dev links as internal", () => {
    const link = classifyLink({
      file: "/tmp/example.mdx",
      line: 1,
      target: "https://mpp.dev/protocol/http-402",
    });

    expect(link).toMatchObject({
      kind: "internal",
      normalizedTarget: "/protocol/http-402",
    });
  });

  it("skips placeholder urls", () => {
    const link = classifyLink({
      file: "/tmp/example.mdx",
      line: 1,
      target: "https://api.example.com/resource",
    });

    expect(link).toBeNull();
  });

  it("skips loopback ipv6 urls", () => {
    const link = classifyLink({
      file: "/tmp/example.mdx",
      line: 1,
      target: "http://[::1]/docs",
    });

    expect(link).toBeNull();
  });

  it("keeps real external urls for lychee", () => {
    const link = classifyLink({
      file: "/tmp/example.mdx",
      line: 1,
      target: "https://paymentauth.org/draft-payment-intent-charge-00",
    });

    expect(link).toMatchObject({
      kind: "external",
      normalizedTarget:
        "https://paymentauth.org/draft-payment-intent-charge-00",
    });
  });
});
