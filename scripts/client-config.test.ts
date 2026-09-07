import { describe, expect, it } from "vitest";
import { clientConfig } from "./client-config";

const prefix = "export const config = ";
const config = {
  codeHighlight: {
    langs: [{ name: "ruby", repository: { pattern: "grammar" } }],
    langAlias: { rb: "ruby" },
    themes: { light: "github-light", dark: "github-dark" },
  },
  sidebar: [{ text: "Ruby", link: "/sdk/ruby" }],
};
const source = `${prefix}${JSON.stringify(config)}`;

function transform(
  environment: string,
  id = "\0virtual:vocs/config",
  code = source,
) {
  const plugin = clientConfig();
  if (typeof plugin.transform !== "function")
    throw new Error("Expected transform");
  return plugin.transform.call(
    { environment: { name: environment } } as never,
    code,
    id,
  );
}

describe("client config", () => {
  it("omits duplicate registrations while preserving themes, aliases, and navigation", async () => {
    const result = await transform("client");
    expect(result).toMatchObject({
      code: `${prefix}${JSON.stringify({
        ...config,
        codeHighlight: { ...config.codeHighlight, langs: [] },
      })}`,
    });
  });

  it.each([
    "rsc",
    "ssr",
  ])("preserves %s registrations for server highlighting", (environment) => {
    expect(transform(environment)).toBeUndefined();
  });

  it("leaves the lazy grammar module untouched", () => {
    expect(transform("client", "\0virtual:vocs/langs")).toBeUndefined();
  });

  it("fails visibly if a framework upgrade changes the serialization format", () => {
    expect(() => transform("client", undefined, "export default {}")).toThrow(
      "Unexpected Vocs config format",
    );
  });
});
