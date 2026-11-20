// The discovery playground's code panes, highlighted at build time (vite.config.ts uses it).
import { prerenderCode as prerender } from "../shared/prerender-code.ts";

export function prerenderCode() {
  return prerender("discovery", async () => {
    // By file URL: Vite's bundled config and Node both load the .ts source from there.
    const samples = (await import(
      new URL("./app/samples.ts", import.meta.url).href
    )) as typeof import("./app/samples.js");
    return { "client.ts": samples.client, "server.ts": samples.server };
  });
}
