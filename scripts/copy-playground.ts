// Copies the playgrounds' built assets into mpp.dev's own build, so Vercel serves them from its
// edge instead of proxying each request to the Worker (src/pages/_api/playground/).
import { cpSync, existsSync, rmSync } from "node:fs";

const from = "workers/playground/dist/client/playground";
const to = "public/playground";
for (const page of ["identity", "session", "charge", "discovery", "zones"])
  if (!existsSync(`${from}/${page}/index.html`))
    throw new Error(
      `Build the playgrounds first: ${from}/${page}/index.html is missing`,
    );
for (const dir of ["assets", "fonts"]) {
  rmSync(`${to}/${dir}`, { force: true, recursive: true });
  cpSync(`${from}/${dir}`, `${to}/${dir}`, { recursive: true });
}
console.log(`copied the playgrounds' assets to ${to}`);
