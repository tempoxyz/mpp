import { describe, expect, it } from "vitest";
import type { Category, Endpoint, Service } from "../data/registry";
import {
  allCategories,
  buildTryCommands,
  CATEGORY_LABELS,
  formatPrice,
  PAGE_SIZE,
  providerUrl,
} from "./ServicesPage";

// ---------------------------------------------------------------------------
// formatPrice
// ---------------------------------------------------------------------------

describe("formatPrice", () => {
  const ep = (payment: Endpoint["payment"]): Endpoint => ({
    method: "GET",
    path: "/test",
    payment,
  });

  it("returns — when payment is null", () => {
    expect(formatPrice(ep(null))).toBe("—");
  });

  it("returns — when payment is undefined", () => {
    expect(formatPrice(ep(undefined))).toBe("—");
  });

  it("returns Varies when amount is missing", () => {
    expect(formatPrice(ep({ intent: "charge", method: "tempo" }))).toBe(
      "Varies",
    );
  });

  it("returns Varies when amount is empty string", () => {
    expect(
      formatPrice(ep({ intent: "charge", method: "tempo", amount: "" })),
    ).toBe("Varies");
  });

  it("formats integer dollar amounts", () => {
    expect(
      formatPrice(
        ep({
          intent: "charge",
          method: "tempo",
          amount: "5000000",
          decimals: 6,
        }),
      ),
    ).toBe("$5.00");
  });

  it("formats amounts >= $1 with 2 decimal places", () => {
    expect(
      formatPrice(
        ep({
          intent: "charge",
          method: "tempo",
          amount: "1500000",
          decimals: 6,
        }),
      ),
    ).toBe("$1.50");
  });

  it("formats sub-dollar amounts with trailing zeros stripped", () => {
    expect(
      formatPrice(
        ep({ intent: "charge", method: "tempo", amount: "1000", decimals: 6 }),
      ),
    ).toBe("$0.001");
  });

  it("formats sub-dollar amount of 0.0001", () => {
    expect(
      formatPrice(
        ep({ intent: "charge", method: "tempo", amount: "100", decimals: 6 }),
      ),
    ).toBe("$0.0001");
  });

  it("defaults decimals to 0 when not specified", () => {
    expect(
      formatPrice(ep({ intent: "charge", method: "tempo", amount: "10" })),
    ).toBe("$10.00");
  });

  it("returns — for NaN amount", () => {
    expect(
      formatPrice(ep({ intent: "charge", method: "tempo", amount: "abc" })),
    ).toBe("—");
  });

  it("formats zero amount as $0", () => {
    expect(
      formatPrice(
        ep({ intent: "charge", method: "tempo", amount: "0", decimals: 6 }),
      ),
    ).toBe("$0");
  });

  it("formats large amounts", () => {
    expect(
      formatPrice(
        ep({
          intent: "charge",
          method: "tempo",
          amount: "100000000",
          decimals: 6,
        }),
      ),
    ).toBe("$100.00");
  });
});

// ---------------------------------------------------------------------------
// allCategories
// ---------------------------------------------------------------------------

describe("allCategories", () => {
  const makeService = (categories?: Category[]): Service => ({
    id: "test",
    name: "Test",
    url: "https://test.com",
    categories,
    methods: {},
    endpoints: [],
  });

  it("returns categories when present", () => {
    expect(allCategories(makeService(["ai", "data"]))).toEqual(["ai", "data"]);
  });

  it("returns empty array when categories is undefined", () => {
    expect(allCategories(makeService(undefined))).toEqual([]);
  });

  it("returns empty array when categories is empty", () => {
    expect(allCategories(makeService([]))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// CATEGORY_LABELS
// ---------------------------------------------------------------------------

describe("CATEGORY_LABELS", () => {
  it("has a label for every Category value", () => {
    const categories: Category[] = [
      "ai",
      "blockchain",
      "compute",
      "data",
      "media",
      "search",
      "social",
      "storage",
      "web",
    ];
    for (const cat of categories) {
      expect(CATEGORY_LABELS[cat]).toBeDefined();
      expect(CATEGORY_LABELS[cat].length).toBeGreaterThan(0);
    }
  });

  it("labels are human-readable", () => {
    expect(CATEGORY_LABELS.ai).toBe("AI");
    expect(CATEGORY_LABELS.blockchain).toBe("Blockchain");
    expect(CATEGORY_LABELS.web).toBe("Web");
  });
});

// ---------------------------------------------------------------------------
// PAGE_SIZE
// ---------------------------------------------------------------------------

describe("PAGE_SIZE", () => {
  it("is a positive integer", () => {
    expect(PAGE_SIZE).toBeGreaterThan(0);
    expect(Number.isInteger(PAGE_SIZE)).toBe(true);
  });

  it("is 60", () => {
    expect(PAGE_SIZE).toBe(60);
  });
});

describe("providerUrl", () => {
  it("uses the provider website when present", () => {
    expect(
      providerUrl({
        provider: { name: "Modal", url: "https://modal.com" },
        url: "https://api.modal.com",
      }),
    ).toBe("https://modal.com");
  });

  it("falls back to the upstream URL without provider metadata", () => {
    expect(providerUrl({ url: "https://api.example.com" })).toBe(
      "https://api.example.com",
    );
  });
});

describe("buildTryCommands", () => {
  const service: Service = {
    endpoints: [],
    id: "test",
    methods: {},
    name: "Test",
    serviceUrl: "https://test.mpp.dev",
    url: "https://test.dev",
  };

  it("includes a JSON request for non-GET endpoints", () => {
    expect(
      buildTryCommands(service, {
        method: "POST",
        path: "/responses",
      }),
    ).toContain(
      'https://test.mpp.dev/responses \\\n    -X POST --json \'{"input":"Hello!"}\'',
    );
  });

  it("omits a request body for GET endpoints", () => {
    const commands = buildTryCommands(service, {
      method: "GET",
      path: "/search",
    });

    expect(commands).toContain("tempo run \\\n    https://test.mpp.dev/search");
    expect(commands).not.toContain("--json");
    expect(commands).not.toContain("-X GET");
  });
});
