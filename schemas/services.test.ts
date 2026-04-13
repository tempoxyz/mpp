import { describe, expect, it } from "vitest";
import {
  CATEGORIES,
  HTTP_METHODS,
  INTEGRATIONS,
  services,
} from "./services.ts";

// --- helpers ---
const SERVICE_ID_RE = /^[a-z0-9-]+$/;
const ROUTE_RE = new RegExp(
  `^(${HTTP_METHODS.join("|")}) /[a-zA-Z0-9/_:.\\-*]*$`,
);
const NUMERIC_RE = /^\d+$/;
const TAG_RE = /^[a-z0-9-]+$/;

describe("services registry", () => {
  // ── Global uniqueness ────────────────────────────────────────────────

  it("has no duplicate service IDs", () => {
    const ids = services.map((s) => s.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes, `Duplicate service IDs: ${dupes.join(", ")}`).toEqual([]);
  });

  it("has no duplicate service names", () => {
    const names = services.map((s) => s.name);
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    expect(dupes, `Duplicate service names: ${dupes.join(", ")}`).toEqual([]);
  });

  it("has no duplicate serviceUrls", () => {
    const urls = services.map((s) => s.serviceUrl);
    const dupes = urls.filter((u, i) => urls.indexOf(u) !== i);
    expect(dupes, `Duplicate serviceUrls: ${dupes.join(", ")}`).toEqual([]);
  });

  // ── Per-service checks ──────────────────────────────────────────────

  for (const svc of services) {
    describe(`service: ${svc.id}`, () => {
      // ID format
      it("has a valid ID (lowercase alphanumeric + hyphens)", () => {
        expect(svc.id).toMatch(SERVICE_ID_RE);
      });

      // URLs
      it("url is a valid HTTPS URL", () => {
        expect(() => new URL(svc.url)).not.toThrow();
        expect(svc.url).toMatch(/^https:\/\//);
      });

      it("serviceUrl is a valid HTTPS URL", () => {
        expect(() => new URL(svc.serviceUrl)).not.toThrow();
        expect(svc.serviceUrl).toMatch(/^https:\/\//);
      });

      // Description
      it("has a non-empty description", () => {
        expect(svc.description.trim().length).toBeGreaterThan(0);
      });

      // Categories
      it("has at least one category", () => {
        expect(svc.categories.length).toBeGreaterThan(0);
      });

      it("all categories are valid", () => {
        const validSet = new Set<string>(CATEGORIES);
        for (const cat of svc.categories) {
          expect(
            validSet.has(cat),
            `Invalid category "${cat}" — valid: ${CATEGORIES.join(", ")}`,
          ).toBe(true);
        }
      });

      it("has no duplicate categories", () => {
        const dupes = svc.categories.filter(
          (c, i) => svc.categories.indexOf(c) !== i,
        );
        expect(dupes).toEqual([]);
      });

      // Integration
      it("has a valid integration type", () => {
        const validSet = new Set<string>(INTEGRATIONS);
        expect(
          validSet.has(svc.integration),
          `Invalid integration "${svc.integration}"`,
        ).toBe(true);
      });

      // Tags
      it("tags are lowercase kebab-case", () => {
        for (const tag of svc.tags) {
          expect(tag, `Tag "${tag}" is not lowercase kebab-case`).toMatch(
            TAG_RE,
          );
        }
      });

      it("has no duplicate tags", () => {
        const dupes = svc.tags.filter((t, i) => svc.tags.indexOf(t) !== i);
        expect(dupes, `Duplicate tags: ${dupes.join(", ")}`).toEqual([]);
      });

      // Payment
      it("has at least one payment method", () => {
        expect(svc.payments.length).toBeGreaterThan(0);
        for (const pm of svc.payments) {
          expect(pm.method).toBeTruthy();
          expect(pm.currency).toBeTruthy();
          expect(pm.decimals).toBeGreaterThanOrEqual(0);
        }
      });

      it("has realm and intent", () => {
        expect(svc.realm).toBeTruthy();
        expect(svc.intent).toBeTruthy();
      });

      // Provider
      if (svc.provider) {
        it("provider has name and valid URL", () => {
          expect(svc.provider!.name.trim().length).toBeGreaterThan(0);
          expect(() => new URL(svc.provider!.url)).not.toThrow();
        });
      }

      // Endpoints
      it("has at least one endpoint", () => {
        expect(svc.endpoints.length).toBeGreaterThan(0);
      });

      it("has no duplicate routes", () => {
        const routes = svc.endpoints.map((e) => e.route);
        const dupes = routes.filter((r, i) => routes.indexOf(r) !== i);
        expect(
          dupes,
          `Duplicate routes in ${svc.id}: ${dupes.join(", ")}`,
        ).toEqual([]);
      });

      for (const ep of svc.endpoints) {
        describe(`endpoint: ${ep.route}`, () => {
          it("route matches METHOD /path format", () => {
            expect(ep.route, `Invalid route format: "${ep.route}"`).toMatch(
              ROUTE_RE,
            );
          });

          it("has a non-empty description", () => {
            expect(ep.desc.trim().length).toBeGreaterThan(0);
          });

          it("amount is a numeric string when present", () => {
            if (ep.amount !== undefined) {
              expect(
                ep.amount,
                `Amount "${ep.amount}" is not a numeric string`,
              ).toMatch(NUMERIC_RE);
              expect(
                Number(ep.amount),
                `Amount "${ep.amount}" must be >= 0`,
              ).toBeGreaterThanOrEqual(0);
            }
          });

          it("does not have both amount and dynamic", () => {
            if (ep.amount !== undefined && ep.dynamic === true) {
              expect.fail(
                `Endpoint "${ep.route}" has both amount (${ep.amount}) and dynamic: true`,
              );
            }
          });

          it("does not have amountHint without dynamic", () => {
            if (ep.amountHint !== undefined && ep.dynamic !== true) {
              expect.fail(
                `Endpoint "${ep.route}" has amountHint without dynamic: true`,
              );
            }
          });
        });
      }
    });
  }

  // ── Aggregate sanity checks ─────────────────────────────────────────

  it("all routes are globally unique (service:route pairs)", () => {
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    for (const svc of services) {
      for (const ep of svc.endpoints) {
        const key = `${svc.serviceUrl} ${ep.route}`;
        if (seen.has(key)) {
          dupes.push(`${key} (in ${seen.get(key)} and ${svc.id})`);
        }
        seen.set(key, svc.id);
      }
    }
    expect(dupes, `Duplicate global routes:\n${dupes.join("\n")}`).toEqual([]);
  });

  it("total services is reasonable (> 0)", () => {
    expect(services.length).toBeGreaterThan(0);
  });
});
