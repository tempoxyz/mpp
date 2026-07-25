/**
 * Generate check-in goldens for each MPP social-card layout.
 *
 * Start the docs server first, then run `pnpm og:generate`. Set OG_ALL=1 to
 * render every route locally without checking every image into the repository.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const baseUrl = process.env.OG_BASE_URL ?? "http://localhost:5173";
const outputDir = resolve(process.env.OG_OUTPUT_DIR ?? "public/og-goldens");
const pagesDir = resolve(import.meta.dirname, "../src/pages");
const samplePaths = [
  "/overview",
  "/advanced/security",
  "/blog",
  "/blog/sessions-improved",
  "/guides/accept-card-payments",
  "/protocol/challenges",
  "/sdk/typescript",
  "/services",
];

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = join(dir, entry.name);
    if (entry.isDirectory())
      return entry.name.startsWith("_") ? [] : walk(file);
    return entry.name.endsWith(".mdx") ? [file] : [];
  });
}

function routeForFile(file: string): string {
  const route = relative(pagesDir, file)
    .replace(/\.mdx$/, "")
    .replace(/\/index$/, "");
  return route === "index" ? "/" : `/${route}`;
}

function titleForFile(file: string): string {
  const content = readFileSync(file, "utf8");
  const frontmatterTitle = content.match(/^title:\s*"(.+)"$/m)?.[1];
  const heading = content
    .match(/^#\s+(.+?)(?:\s+\[[^\]]+\])?\s*$/m)?.[1]
    ?.replaceAll("`", "");
  return frontmatterTitle ?? heading ?? routeForFile(file);
}

async function writeImage(path: string, title: string, destination: string) {
  const query = new URLSearchParams({ path, title });
  const response = await fetch(`${baseUrl}/api/og?${query}`);
  if (!response.ok)
    throw new Error(`${path}: ${response.status} ${response.statusText}`);
  writeFileSync(destination, Buffer.from(await response.arrayBuffer()));
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function galleryHtml(
  cards: { filename: string; path: string; title: string }[],
): string {
  const cardMarkup = cards
    .map(
      ({ filename, path, title }) => `<figure>
  <img src="${filename}.png" alt="${escapeHtml(title)} social card" />
  <figcaption><code>${escapeHtml(path)}</code><span>${escapeHtml(title)}</span></figcaption>
</figure>`,
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>MPP social card goldens</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #f3f3f3; color: #010101; font: 16px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; }
  main { max-width: 1560px; margin: 0 auto; padding: 48px 24px 80px; }
  h1 { margin: 0; font: 500 clamp(32px, 5vw, 64px)/1.05 Arial, sans-serif; letter-spacing: -0.06em; }
  p { color: #555; margin: 12px 0 36px; }
  h2 { margin: 52px 0 16px; font: 600 14px/1.2 inherit; text-transform: uppercase; }
  .assets, .cards { display: grid; gap: 20px; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
  .asset, figure { margin: 0; background: #fff; border: 1px solid #ddd; border-radius: 12px; overflow: hidden; }
  .asset { padding: 28px; min-height: 180px; display: grid; place-items: center; }
  .asset.dark { background: #010101; }
  .asset img { max-width: 88%; max-height: 96px; }
  figure img { display: block; width: 100%; height: auto; }
  figcaption { display: grid; gap: 5px; padding: 12px 14px 16px; }
  figcaption span { color: #555; font: 13px/1.3 Arial, sans-serif; }
  code { font-size: 12px; }
</style>
<main>
  <h1>MPP social card goldens</h1>
  <p>${cards.length} representative card layouts plus every primary brand asset.</p>
  <h2>Brand assets</h2>
  <section class="assets">
    <div class="asset"><img src="../logo-dark.svg" alt="MPP black logo" /></div>
    <div class="asset dark"><img src="../logo-light.svg" alt="MPP white logo" /></div>
    <div class="asset"><img src="../lockup-dark.svg" alt="MPP black lockup" /></div>
    <div class="asset dark"><img src="../lockup-light.svg" alt="MPP white lockup" /></div>
    <div class="asset dark"><img src="../avatar.svg" alt="MPP avatar" /></div>
    <div class="asset"><img src="../og.png" alt="MPP home social card" /></div>
  </section>
  <h2>Card layouts</h2>
  <section class="cards">${cardMarkup}</section>
</main>
</html>`;
}

mkdirSync(outputDir, { recursive: true });
const pages = walk(pagesDir).sort();
const pagesByRoute = new Map(pages.map((file) => [routeForFile(file), file]));
const selectedPaths =
  process.env.OG_ALL === "1" ? [...pagesByRoute.keys()] : samplePaths;
const cards: { filename: string; path: string; title: string }[] = [];

for (const path of selectedPaths) {
  const file = pagesByRoute.get(path);
  if (!file) throw new Error(`No page found for golden route: ${path}`);
  const filename = path === "/" ? "index" : path.slice(1).replaceAll("/", "--");
  const title = path === "/" ? "Machine Payments Protocol" : titleForFile(file);
  await writeImage(path, title, join(outputDir, `${filename}.png`));
  cards.push({ filename, path, title });
  console.log(`Generated ${filename}.png`);
}

await writeImage("/", "Machine Payments Protocol", resolve("public/og.png"));
writeFileSync(join(outputDir, "index.html"), galleryHtml(cards));
console.log(`Generated ${cards.length} goldens in ${outputDir}`);
