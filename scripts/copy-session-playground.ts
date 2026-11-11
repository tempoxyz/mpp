// Copies the session playground's built page into mpp.dev's own build, so Vercel serves it
// from its edge instead of proxying each request to the Worker (src/pages/_api/playground/).
import { cpSync, existsSync, rmSync } from "node:fs";

const from = "workers/session-playground/dist/client/playground/session";
const to = "public/playground/session";
if (!existsSync(`${from}/index.html`))
  throw new Error(
    `Build the session playground first: ${from}/index.html is missing`,
  );
rmSync(to, { force: true, recursive: true });
for (const dir of ["assets", "fonts"])
  cpSync(`${from}/${dir}`, `${to}/${dir}`, { recursive: true });
console.log(`copied the session playground's assets to ${to}`);
