// @ts-nocheck – server-only, uses Vite asset imports and resvg WASM.
import { initWasm, Resvg } from "@resvg/resvg-wasm";
import resvgWasm from "@resvg/resvg-wasm/index_bg.wasm?arraybuffer";
import geist from "../../../assets/Geist-Variable.woff2?arraybuffer";
import geistMono from "../../../assets/GeistMono-Variable.woff2?arraybuffer";
import mppLogo from "../../../assets/logo-dark.svg?raw";
import ogPattern from "../../../assets/og-pattern.png?inline";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function balanceLines(title: string): string[] {
  const words = title.split(" ");
  const lineCount = title.length > 76 ? 3 : title.length > 26 ? 2 : 1;
  if (lineCount === 1) return [title];

  const targetLength = Math.ceil(title.length / lineCount);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (
      line &&
      line.length + word.length + 1 > targetLength &&
      lines.length < lineCount - 1
    ) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function categoryForPath(path: string): string {
  if (path === "/blog" || path.startsWith("/blog/")) return "BLOG";
  if (path.startsWith("/advanced")) return "ADVANCED";
  if (path.startsWith("/guides")) return "GUIDES";
  if (path.startsWith("/protocol")) return "PROTOCOL";
  if (path.startsWith("/sdk")) return "SDK";
  if (path.startsWith("/services")) return "SERVICES";
  if (path.startsWith("/specs")) return "SPECIFICATION";
  return "DOCUMENTATION";
}

function buildSvg(category: string, title: string): string {
  const lines = balanceLines(title).slice(0, 3);
  const fontSize = lines.length === 3 ? 56 : 76;
  const titleY = lines.length === 3 ? 360 : 440;
  const lineHeight = Math.round(fontSize * 1.1);
  const tspans = lines
    .map(
      (line, index) =>
        `<tspan x="40" y="${titleY + index * lineHeight}">${escapeXml(line)}</tspan>`,
    )
    .join("");
  const logo = Buffer.from(mppLogo.replaceAll("#010101", "#ebebeb")).toString(
    "base64",
  );

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#010101"/>
  <clipPath id="pattern"><rect width="1200" height="320"/></clipPath>
  <image href="${ogPattern}" x="0" y="0" width="1920" height="640" clip-path="url(#pattern)"/>
  <text fill="#ebebeb" font-family="Geist" font-size="${fontSize}" font-weight="500" letter-spacing="-${Math.round(fontSize * 0.05)}">${tspans}</text>
  <text fill="#ebebeb" font-family="Geist Mono" font-size="21" font-weight="600"><tspan x="40" y="570">${escapeXml(category)}</tspan></text>
  <image href="data:image/svg+xml;base64,${logo}" x="1044" y="555" width="100" height="22"/>
</svg>`;
}

let wasmInitialized = false;

export async function GET(request: Request) {
  if (!wasmInitialized) {
    await initWasm(resvgWasm);
    wasmInitialized = true;
  }

  const url = new URL(request.url);
  const path = decodeURIComponent(url.searchParams.get("path") || "");
  const title = url.searchParams.get("title") || "Machine Payments Protocol";
  const svg = buildSvg(categoryForPath(path), title);
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
    font: {
      fontBuffers: [Buffer.from(geist), Buffer.from(geistMono)],
      loadSystemFonts: false,
    },
  });

  return new Response(resvg.render().asPng(), {
    headers: {
      "Cache-Control": "public, s-maxage=31536000, stale-while-revalidate",
      "Content-Type": "image/png",
    },
  });
}

export async function HEAD(request: Request) {
  const response = await GET(request);
  return new Response(null, { headers: response.headers });
}
