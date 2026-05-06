// @ts-nocheck – server-only, uses Vite ?raw import and resvg native module
import { initWasm, Resvg } from "@resvg/resvg-wasm";
import resvgWasm from "@resvg/resvg-wasm/index_bg.wasm?url";
import imageDescriptions from "../../../generated/og-descriptions.json";
import templateSvg from "./og-template.svg?raw";

const BLOB = "https://wgfdjv2jfqz2dlpx.public.blob.vercel-storage.com";

const sidebarCategories: Record<string, string> = {
  "/overview": "Introduction",
  "/faq": "Introduction",
  "/quickstart": "Quick Start",
  "/guides": "Guides",
  "/protocol": "Protocol",
  "/payment-methods": "Payment Methods",
  "/intents": "Payment Methods",
  "/sdk": "SDKs",
  "/brand": "Resources",
  "/services": "Services",
};

const sidebarSubcategories: Record<string, string> = {
  "/payment-methods/tempo": "Tempo",
  "/payment-methods/stripe": "Stripe",
  "/payment-methods/card": "Card",
  "/payment-methods/lightning": "Lightning",
  "/payment-methods/solana": "Solana",
  "/payment-methods/monad": "Monad",
  "/payment-methods/redotpay": "RedotPay",
  "/payment-methods/custom": "Custom",
  "/intents": "Intents",
  "/protocol/transports": "Transports",
  "/sdk/typescript": "TypeScript",
  "/sdk/python": "Python",
  "/sdk/rust": "Rust",
};

function getCategoryForPath(p: string): string | null {
  for (const [k, v] of Object.entries(sidebarCategories))
    if (p === k || p.startsWith(`${k}/`)) return v;
  return null;
}
function getSubcategoryForPath(p: string): string | null {
  for (const [k, v] of Object.entries(sidebarSubcategories))
    if (p === k || p.startsWith(`${k}/`)) return v;
  return null;
}

let fontCache: Buffer[] | null = null;
async function loadFonts(): Promise<Buffer[]> {
  if (fontCache) return fontCache;
  const [r, b] = await Promise.all([
    fetch(`${BLOB}/fonts/VTCDuBois-Regular.ttf`).then((r) => r.arrayBuffer()),
    fetch(`${BLOB}/fonts/VTCDuBois-Bold.ttf`).then((r) => r.arrayBuffer()),
  ]);
  fontCache = [Buffer.from(r), Buffer.from(b)];
  return fontCache;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function balanceLines(text: string, fontSize: number): string[] {
  const words = text.split(" ");
  if (words.length <= 2) return [text];
  const maxWidth = 1050;
  const avgCharWidth = fontSize * 0.58;
  const charsPerLine = Math.floor(maxWidth / avgCharWidth);
  if (text.length <= charsPerLine) return [text];
  const needsThreeLines = text.length > charsPerLine * 2;
  if (needsThreeLines) {
    const target = text.length / 3;
    let bestI = 0,
      bestJ = 1,
      bestScore = Number.POSITIVE_INFINITY;
    for (let i = 0; i < words.length - 2; i++) {
      const line1 = words.slice(0, i + 1).join(" ");
      for (let j = i + 1; j < words.length - 1; j++) {
        const line2 = words.slice(i + 1, j + 1).join(" ");
        const line3 = words.slice(j + 1).join(" ");
        const score =
          Math.abs(line1.length - target) +
          Math.abs(line2.length - target) +
          Math.abs(line3.length - target);
        if (score < bestScore) {
          bestScore = score;
          bestI = i;
          bestJ = j;
        }
      }
    }
    return [
      words.slice(0, bestI + 1).join(" "),
      words.slice(bestI + 1, bestJ + 1).join(" "),
      words.slice(bestJ + 1).join(" "),
    ];
  }
  let bestSplit = 0,
    bestDiff = Number.POSITIVE_INFINITY;
  for (let i = 0; i < words.length - 1; i++) {
    const left = words.slice(0, i + 1).join(" ");
    const right = words.slice(i + 1).join(" ");
    const diff = Math.abs(left.length - right.length);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestSplit = i;
    }
  }
  return [
    words.slice(0, bestSplit + 1).join(" "),
    words.slice(bestSplit + 1).join(" "),
  ];
}

function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (lines.length >= maxLines - 1 && `${cur} ${w}`.length > maxChars) {
      lines.push(`${(`${cur} ${w}`).slice(0, maxChars - 1)}\u2026`);
      return lines;
    }
    if (cur && `${cur} ${w}`.length > maxChars) {
      lines.push(cur);
      cur = w;
    } else {
      cur = cur ? `${cur} ${w}` : w;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, maxLines);
}

function buildSvg(
  category: string | null,
  subcategory: string | null,
  title: string,
  description: string,
): string {
  let svg = templateSvg;
  svg = svg.replace(/VTC Du Bois Trial/g, "VTC Du Bois");

  // --- Category (top-left, y=94) ---
  if (category) {
    const catUp = esc(category.toUpperCase());
    svg = svg.replace(
      /<tspan x="132" y="94">CATEGORY<\/tspan>/,
      `<tspan x="132" y="94">${catUp}</tspan>`,
    );
    if (subcategory) {
      const subUp = esc(subcategory.toUpperCase());
      const subX = 132 + catUp.length * 16 + 48;
      svg = svg.replace(
        /<tspan x="305" y="94">SUBCATEGORY<\/tspan>/,
        `<tspan x="${subX}" y="94">${subUp}</tspan>`,
      );
      const chevX = 132 + catUp.length * 16 + 18;
      svg = svg.replace(
        /<tspan x="276" y="92\.4058">/,
        `<tspan x="${chevX}" y="92.4058">`,
      );
    } else {
      svg = svg.replace(/<text id="SUBCATEGORY"[^>]*>.*?<\/text>/, "");
      svg = svg.replace(/<text id="&#194;&#187;"[^>]*>.*?<\/text>/, "");
      svg = svg.replace(
        /id="CATEGORY" opacity="0.5"/,
        'id="CATEGORY" opacity="0.8"',
      );
    }
  } else {
    svg = svg.replace(/<text id="CATEGORY"[^>]*>.*?<\/text>/, "");
    svg = svg.replace(/<text id="SUBCATEGORY"[^>]*>.*?<\/text>/, "");
    svg = svg.replace(/<text id="&#194;&#187;"[^>]*>.*?<\/text>/, "");
    svg = svg.replace(/<g id="folder"[^>]*>[\s\S]*?<\/g>/, "");
  }

  // --- Title ---
  const titleLines = balanceLines(title, 99);
  const needsWrap = titleLines.length > 1;
  if (titleLines.length >= 3) {
    svg = svg.replace(
      /<text id="Route title"[^>]*>.*?<\/text>/,
      `<text fill="black" xml:space="preserve" font-family="VTC Du Bois" font-size="99" letter-spacing="-0.02em"><tspan x="77" y="220">${esc(titleLines[0])}</tspan><tspan x="77" y="309">${esc(titleLines[1])}</tspan><tspan x="77" y="398">${esc(titleLines[2])}</tspan></text>`,
    );
  } else if (titleLines.length === 2) {
    svg = svg.replace(
      /<text id="Route title"[^>]*>.*?<\/text>/,
      `<text fill="black" xml:space="preserve" font-family="VTC Du Bois" font-size="99" letter-spacing="-0.02em"><tspan x="77" y="264.15">${esc(titleLines[0])}</tspan><tspan x="77" y="353.15">${esc(titleLines[1])}</tspan></text>`,
    );
  } else {
    svg = svg.replace(
      /<text id="Route title"[^>]*>.*?<\/text>/,
      `<text fill="black" xml:space="preserve" font-family="VTC Du Bois" font-size="99" letter-spacing="-0.02em"><tspan x="77" y="272.15">${esc(title)}</tspan></text>`,
    );
  }

  // --- Description ---
  const descY = needsWrap ? 430.05 : 349.05;
  if (description) {
    const lines = wrapText(description, 41, 3);
    const tspans = lines
      .map((l, i) => `<tspan x="77" y="${descY + i * 52}">${esc(l)}</tspan>`)
      .join("");
    svg = svg.replace(
      /<text id="Description[^>]*>.*?<\/text>/,
      `<text opacity="0.7" fill="black" xml:space="preserve" font-family="VTC Du Bois" font-size="43" letter-spacing="0em">${tspans}</text>`,
    );
  } else {
    svg = svg.replace(/<text id="Description[^>]*>.*?<\/text>/, "");
  }

  return svg;
}

let wasmInitialized = false;

export async function GET(request: Request) {
  if (!wasmInitialized) {
    const wasmBuf = await fetch(new URL(resvgWasm, request.url)).then((r) =>
      r.arrayBuffer(),
    );
    await initWasm(wasmBuf);
    wasmInitialized = true;
  }
  const url = new URL(request.url);
  const title = url.searchParams.get("title") || "Untitled";
  const rawDescription = url.searchParams.get("description") || "";
  const path = decodeURIComponent(url.searchParams.get("path") || "");
  const description =
    (imageDescriptions as Record<string, string>)[path] || rawDescription;
  const category = getCategoryForPath(path);
  const subcategory = getSubcategoryForPath(path);

  const fonts = await loadFonts();
  const svg = buildSvg(category, subcategory, title, description);

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
    font: { fontBuffers: fonts, loadSystemFonts: false },
  });

  return new Response(resvg.render().asPng(), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, s-maxage=31536000, stale-while-revalidate",
    },
  });
}

export async function HEAD(request: Request) {
  const response = await GET(request);
  return new Response(null, {
    headers: response.headers,
  });
}
