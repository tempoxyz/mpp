import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import * as z from "zod";
import { registry } from "./registry";

const __dirname = dirname(fileURLToPath(import.meta.url));

const rawSchema = JSON.parse(
  readFileSync(
    resolve(__dirname, "../../schemas/discovery.schema.json"),
    "utf-8",
  ),
);

const DiscoverySchema = z.fromJSONSchema(rawSchema);

describe("registry", () => {
  it("validates against the discovery JSON schema", () => {
    const result = DiscoverySchema.safeParse(registry);
    if (!result.success) console.error(result.error.issues);
    expect(result.success).toBe(true);
  });

  it("has at least one service", () => {
    expect(registry.services.length).toBeGreaterThan(0);
  });

  it("every service has unique id", () => {
    const ids = registry.services.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
