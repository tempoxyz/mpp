import type { Plugin } from "vite";

// Vocs serializes codeHighlight.langs into the shared config, including the
// full Ruby grammar and its dependencies (~2.45 MB). Client highlighting loads
// languages separately; only aliases and themes are read from this config.
// Keep the registrations in the server config for MDX/build-time highlighting.
export function clientConfig(): Plugin {
  return {
    name: "mpp:client-config",
    enforce: "pre",
    transform(code, id) {
      if (this.environment.name !== "client" || id !== "\0virtual:vocs/config")
        return;

      const prefix = "export const config = ";
      if (!code.startsWith(prefix))
        throw new Error("Unexpected Vocs config format; review clientConfig");

      const config = JSON.parse(code.slice(prefix.length));
      if (config.codeHighlight) config.codeHighlight.langs = [];
      return { code: `${prefix}${JSON.stringify(config)}`, map: null };
    },
  };
}
