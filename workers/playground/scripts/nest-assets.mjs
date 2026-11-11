// Vite writes the pages under dist/client/, but they reference their files under the
// /playground/ base they are served at. Move them there so Workers Static Assets serves
// each file at the path the page asks for.
import { mkdirSync, readdirSync, renameSync } from "node:fs";
import { join } from "node:path";

const client = "dist/client";
const target = join(client, "playground");
mkdirSync(target, { recursive: true });
for (const entry of readdirSync(client)) {
  // .assetsignore and _headers stay at the assets root, where Wrangler reads them.
  if (["playground", ".assetsignore", "_headers"].includes(entry)) continue;
  renameSync(join(client, entry), join(target, entry));
}
