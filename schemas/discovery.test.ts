import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));

const schema = JSON.parse(
  readFileSync(resolve(__dirname, "discovery.schema.json"), "utf-8"),
);
const example = JSON.parse(
  readFileSync(resolve(__dirname, "discovery.example.json"), "utf-8"),
);

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);

describe("discovery schema", () => {
  it("example validates against schema", () => {
    const valid = validate(example);
    if (!valid) console.error(validate.errors);
    expect(valid).toBe(true);
  });

  it("rejects missing required fields", () => {
    expect(validate({})).toBe(false);
    expect(validate({ version: 1 })).toBe(false);
    expect(validate({ version: 1, services: [{}] })).toBe(false);
  });

  it("rejects invalid service id pattern", () => {
    const invalid = {
      version: 1,
      services: [
        {
          id: "INVALID ID",
          name: "Test",
          url: "https://example.com",
          endpoints: [],
          methods: {},
        },
      ],
    };
    expect(validate(invalid)).toBe(false);
  });

  it("accepts a minimal valid service", () => {
    const minimal = {
      version: 1,
      services: [
        {
          id: "test",
          name: "Test Service",
          url: "https://example.com",
          endpoints: [],
          methods: {},
        },
      ],
    };
    expect(validate(minimal)).toBe(true);
  });
});
