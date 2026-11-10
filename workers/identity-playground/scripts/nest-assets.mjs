// Vite writes the page under dist/client/, but it references its files under the
// /playground/identity/ base it is served at. Move them there so Workers Static
// Assets serves each file at the path the page asks for.
import { mkdirSync, readdirSync, renameSync } from "node:fs";
import { join } from "node:path";

const client = "dist/client";
const target = join(client, "playground/identity");
mkdirSync(target, { recursive: true });
for (const entry of readdirSync(client)) {
  // .assetsignore and _headers stay at the assets root, where Wrangler reads them.
  if (["playground", ".assetsignore", "_headers"].includes(entry)) continue;
  renameSync(join(client, entry), join(target, entry));
}
