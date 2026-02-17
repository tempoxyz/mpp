import * as child_process from "node:child_process";
import react from "@vitejs/plugin-react";
import Icons from "unplugin-icons/vite";
import { defineConfig } from "vite";
import { vocs } from "vocs/vite";

const commitSha = child_process
  .execSync("git rev-parse --short HEAD")
  .toString()
  .trim();
const commitTimestamp = child_process
  .execSync("git log -1 --format=%cI")
  .toString()
  .trim();

export default defineConfig({
  define: {
    __COMMIT_SHA__: JSON.stringify(commitSha),
    __COMMIT_TIMESTAMP__: JSON.stringify(commitTimestamp),
  },
  optimizeDeps: {
    include: [
      "@braintree/sanitize-url",
      "beautiful-mermaid",
      "dayjs",
      "mermaid",
    ],
  },
  plugins: [
    Icons({ compiler: "jsx", jsx: "react" }),
    nodeLoaderCloudflare({
      environments: ["rsc"],
      build: true,
      // https://developers.cloudflare.com/workers/wrangler/api/#getplatformproxy
      getPlatformProxyOptions: {
        persist: {
          path: ".wrangler/state/v3",
        },
      },
    }),
    react(),
    vocs({
      unstable_adapter: "waku/adapters/cloudflare",
    }),
  ],
});
