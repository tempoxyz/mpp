// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import {
  COMPANIES,
  COST_PER_TOKEN,
  INITIAL_BALANCE,
  LOOKUP_COST,
  linkPattern,
  lookupCompany,
  normalizeUrl,
  type Run,
  randomStripeId,
  randomTxHash,
  runCost,
  SERVICE_LABELS,
  serviceLabel,
  shuffle,
  Terminal,
  timeAgo,
} from "./Terminal";

// ---------------------------------------------------------------------------
// timeAgo
// ---------------------------------------------------------------------------

describe("timeAgo", () => {
  it("returns seconds ago for recent timestamps", () => {
    const now = new Date();
    now.setSeconds(now.getSeconds() - 30);
    expect(timeAgo(now.toISOString())).toBe("30s ago");
  });

  it("returns minutes ago", () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - 5);
    expect(timeAgo(now.toISOString())).toBe("5m ago");
  });

  it("returns hours ago", () => {
    const now = new Date();
    now.setHours(now.getHours() - 3);
    expect(timeAgo(now.toISOString())).toBe("3h ago");
  });

  it("returns days ago", () => {
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const past = new Date(Date.now() - sevenDaysMs);
    expect(timeAgo(past.toISOString())).toBe("7d ago");
  });

  it("returns 0s ago for current time", () => {
    expect(timeAgo(new Date().toISOString())).toBe("0s ago");
  });
});

// ---------------------------------------------------------------------------
// normalizeUrl
// ---------------------------------------------------------------------------

describe("normalizeUrl", () => {
  it("strips https protocol", () => {
    expect(normalizeUrl("https://example.com/path")).toBe("example.com");
  });

  it("strips http protocol", () => {
    expect(normalizeUrl("http://example.com")).toBe("example.com");
  });

  it("strips www prefix", () => {
    expect(normalizeUrl("https://www.example.com")).toBe("example.com");
  });

  it("strips path", () => {
    expect(normalizeUrl("https://example.com/foo/bar")).toBe("example.com");
  });

  it("lowercases the result", () => {
    expect(normalizeUrl("HTTPS://EXAMPLE.COM")).toBe("example.com");
  });

  it("trims whitespace", () => {
    expect(normalizeUrl("  example.com  ")).toBe("example.com");
  });

  it("handles bare domain", () => {
    expect(normalizeUrl("stripe.com")).toBe("stripe.com");
  });
});

// ---------------------------------------------------------------------------
// lookupCompany
// ---------------------------------------------------------------------------

describe("lookupCompany", () => {
  it("returns company info for a known domain", () => {
    const lines = lookupCompany("https://stripe.com");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain("Stripe");
    expect(lines[2]).toContain("https://stripe.com");
  });

  it("handles www prefix", () => {
    const lines = lookupCompany("https://www.stripe.com");
    expect(lines[0]).toContain("Stripe");
  });

  it("returns fallback for unknown domain", () => {
    const lines = lookupCompany("https://unknown-domain.test");
    expect(lines[0]).toContain("unknown-domain.test");
    expect(lines[1]).toContain("No description available");
  });

  it("returns info for all known companies", () => {
    for (const domain of Object.keys(COMPANIES)) {
      const lines = lookupCompany(domain);
      expect(lines).toHaveLength(3);
      expect(lines[0]).toContain(COMPANIES[domain].title);
    }
  });
});

// ---------------------------------------------------------------------------
// serviceLabel
// ---------------------------------------------------------------------------

describe("serviceLabel", () => {
  it("matches /article endpoint", () => {
    expect(serviceLabel("/api/article/summarize")).toBe(
      "parallel.ai article extraction",
    );
  });

  it("matches /image endpoint", () => {
    expect(serviceLabel("/api/image/generate")).toBe("fal.ai image generation");
  });

  it("matches /search endpoint", () => {
    expect(serviceLabel("/api/search/query")).toBe("parallel.ai web search");
  });

  it("matches /ascii endpoint", () => {
    expect(serviceLabel("/api/ascii/art")).toBe("fal.ai image generation");
  });

  it("returns undefined for unmatched endpoints", () => {
    expect(serviceLabel("/api/unknown")).toBeUndefined();
  });

  it("matches /lookup endpoint", () => {
    expect(serviceLabel("/api/lookup/company")).toBe(
      "parallel.ai article extraction",
    );
  });
});

// ---------------------------------------------------------------------------
// runCost
// ---------------------------------------------------------------------------

describe("runCost", () => {
  const makeRun = (step: Run["step"], output: string[] = [""]): Run => ({
    step,
    output,
    key: 0,
  });

  it("calculates token-based cost for Chat with AI", () => {
    const output = ["Hello world! This is a test response."];
    const run = makeRun(Terminal.chat(), output);
    const tokens = Math.ceil(output.join("\n").length / 4);
    expect(runCost(run)).toBe(tokens * COST_PER_TOKEN);
  });

  it("returns fixed cost for Generate image", () => {
    expect(runCost(makeRun(Terminal.image()))).toBe(0.003);
  });

  it("returns fixed cost for Search the web", () => {
    expect(runCost(makeRun(Terminal.search()))).toBe(0.005);
  });

  it("returns LOOKUP_COST for Summarize article", () => {
    expect(runCost(makeRun(Terminal.article()))).toBe(LOOKUP_COST);
  });

  it("calculates token-based cost for Write poem", () => {
    const output = ["Roses are red"];
    const run = makeRun(Terminal.poem(), output);
    const tokens = Math.ceil(output.join("\n").length / 4);
    expect(runCost(run)).toBe(tokens * COST_PER_TOKEN);
  });

  it("returns fixed cost for Create ASCII art", () => {
    expect(runCost(makeRun(Terminal.ascii()))).toBe(0.001);
  });

  it("returns LOOKUP_COST for Lookup company", () => {
    expect(runCost(makeRun(Terminal.lookup()))).toBe(LOOKUP_COST);
  });

  it("handles multi-line output for token-based cost", () => {
    const output = ["line one", "line two", "line three"];
    const run = makeRun(Terminal.chat(), output);
    const tokens = Math.ceil(output.join("\n").length / 4);
    expect(runCost(run)).toBe(tokens * COST_PER_TOKEN);
  });
});

// ---------------------------------------------------------------------------
// randomTxHash
// ---------------------------------------------------------------------------

describe("randomTxHash", () => {
  it("starts with 0x", () => {
    expect(randomTxHash()).toMatch(/^0x/);
  });

  it("is 66 characters long (0x + 64 hex chars)", () => {
    expect(randomTxHash()).toHaveLength(66);
  });

  it("contains only valid hex characters after 0x", () => {
    const hash = randomTxHash();
    expect(hash.slice(2)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces different values on successive calls", () => {
    const a = randomTxHash();
    const b = randomTxHash();
    expect(a).not.toBe(b);
  });
});

// ---------------------------------------------------------------------------
// randomStripeId
// ---------------------------------------------------------------------------

describe("randomStripeId", () => {
  it("starts with the given prefix", () => {
    expect(randomStripeId("pi_")).toMatch(/^pi_/);
  });

  it("produces correct length (prefix + 24 chars)", () => {
    expect(randomStripeId("pi_")).toHaveLength(3 + 24);
  });

  it("contains only alphanumeric characters after prefix", () => {
    const id = randomStripeId("ch_");
    expect(id.slice(3)).toMatch(/^[A-Za-z0-9]{24}$/);
  });

  it("works with empty prefix", () => {
    expect(randomStripeId("")).toHaveLength(24);
  });
});

// ---------------------------------------------------------------------------
// shuffle
// ---------------------------------------------------------------------------

describe("shuffle", () => {
  it("returns an array of the same length", () => {
    expect(shuffle([1, 2, 3, 4, 5])).toHaveLength(5);
  });

  it("contains the same elements", () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffle(arr).sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it("does not mutate the original array", () => {
    const arr = [1, 2, 3];
    const copy = [...arr];
    shuffle(arr);
    expect(arr).toEqual(copy);
  });

  it("returns empty array for empty input", () => {
    expect(shuffle([])).toEqual([]);
  });

  it("returns single-element array unchanged", () => {
    expect(shuffle([42])).toEqual([42]);
  });
});

// ---------------------------------------------------------------------------
// linkPattern
// ---------------------------------------------------------------------------

describe("linkPattern", () => {
  it("matches https URLs", () => {
    linkPattern.lastIndex = 0;
    expect(linkPattern.test("https://example.com")).toBe(true);
  });

  it("matches mpp.dev URLs", () => {
    linkPattern.lastIndex = 0;
    expect(linkPattern.test("mpp.dev/services")).toBe(true);
  });

  it("matches mpp.sh URLs", () => {
    linkPattern.lastIndex = 0;
    expect(linkPattern.test("mpp.sh/docs")).toBe(true);
  });

  it("matches Tempo.xyz", () => {
    linkPattern.lastIndex = 0;
    expect(linkPattern.test("Tempo.xyz")).toBe(true);
  });

  it("matches Stripe.com", () => {
    linkPattern.lastIndex = 0;
    expect(linkPattern.test("Stripe.com")).toBe(true);
  });

  it("matches parallel.ai", () => {
    linkPattern.lastIndex = 0;
    expect(linkPattern.test("parallel.ai")).toBe(true);
  });

  it("matches fal.ai", () => {
    linkPattern.lastIndex = 0;
    expect(linkPattern.test("fal.ai")).toBe(true);
  });

  it("does not match plain text", () => {
    linkPattern.lastIndex = 0;
    expect(linkPattern.test("hello world")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe("constants", () => {
  it("INITIAL_BALANCE is 100", () => {
    expect(INITIAL_BALANCE).toBe(100);
  });

  it("COST_PER_TOKEN is 0.0001", () => {
    expect(COST_PER_TOKEN).toBe(0.0001);
  });

  it("LOOKUP_COST is 1.0", () => {
    expect(LOOKUP_COST).toBe(1.0);
  });

  it("COMPANIES contains expected domains", () => {
    expect(Object.keys(COMPANIES)).toContain("stratechery.com");
    expect(Object.keys(COMPANIES)).toContain("stripe.com");
    expect(Object.keys(COMPANIES)).toContain("tempo.xyz");
    expect(Object.keys(COMPANIES)).toContain("openai.com");
  });

  it("step builders have correct methodLabels", () => {
    expect(Terminal.chat().methodLabel).toBe("Tempo");
    expect(Terminal.image().methodLabel).toBe("Tempo");
    expect(Terminal.search().methodLabel).toBe("Tempo");
    expect(Terminal.article().methodLabel).toBe("Stripe");
    expect(Terminal.poem().methodLabel).toBe("Tempo session");
    expect(Terminal.lookup().methodLabel).toBe("Stripe charge");
  });

  it("SERVICE_LABELS is a non-empty array of tuples", () => {
    expect(SERVICE_LABELS.length).toBeGreaterThan(0);
    for (const [key, val] of SERVICE_LABELS) {
      expect(key).toMatch(/^\//);
      expect(val.length).toBeGreaterThan(0);
    }
  });
});
