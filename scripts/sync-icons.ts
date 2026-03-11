import * as fs from "node:fs";
import * as path from "node:path";
import { put } from "@vercel/blob";
import discovery from "../schemas/discovery.json" with { type: "json" };

const LOGOLINK_KEY = process.env.BRANDDEV_LOGOLINK_KEY;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

if (!LOGOLINK_KEY) {
  console.error("BRANDDEV_LOGOLINK_KEY required");
  process.exit(1);
}
if (!BLOB_TOKEN) {
  console.error("BLOB_READ_WRITE_TOKEN required");
  process.exit(1);
}

interface ServiceEntry {
  id: string;
  name: string;
  url: string;
  provider?: { name?: string; url?: string };
}

const iconsDir = path.resolve(import.meta.dirname, "../public/icons");

function domainFor(service: ServiceEntry): string | null {
  const raw = service.provider?.url ?? service.url;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

function styledSvg(logoDataUri: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><defs><filter id="mono" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="table" tableValues="1 0.16"/><feFuncG type="table" tableValues="1 0.16"/><feFuncB type="table" tableValues="1 0.16"/></feComponentTransfer></filter></defs><rect fill="#2A2A2A" width="512" height="512" rx="64"/><image href="${logoDataUri}" x="96" y="96" width="320" height="320" preserveAspectRatio="xMidYMid meet" filter="url(#mono)"/></svg>`;
}

async function fetchIcon(domain: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://logos.brand.dev/?publicClientId=${LOGOLINK_KEY}&domain=${domain}`,
    );
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "image/png";
    const buf = await res.arrayBuffer();
    if (buf.byteLength < 100) return null;
    return `data:${ct};base64,${Buffer.from(buf).toString("base64")}`;
  } catch (e) {
    console.error(`  brand.dev error for ${domain}:`, e);
    return null;
  }
}

async function main() {
  const services = (discovery as unknown as { services: ServiceEntry[] })
    .services;

  console.log(`\n  ${services.length} services to process\n`);

  const domainCache = new Map<string, string | null>();
  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (const service of services) {
    const domain = domainFor(service);
    if (!domain) {
      console.log(`  skip  ${service.id} (no domain)`);
      skipped++;
      continue;
    }

    let dataUri: string | null;
    if (domainCache.has(domain)) {
      dataUri = domainCache.get(domain)!;
    } else {
      dataUri = await fetchIcon(domain);
      domainCache.set(domain, dataUri);
    }

    if (!dataUri) {
      console.log(`  fail  ${service.id} (${domain})`);
      failed++;
      continue;
    }

    const svg = styledSvg(dataUri);

    fs.writeFileSync(path.join(iconsDir, `${service.id}.svg`), svg);

    const { url } = await put(`icons/${service.id}.svg`, svg, {
      access: "public",
      allowOverwrite: true,
      contentType: "image/svg+xml",
      addRandomSuffix: false,
      token: BLOB_TOKEN,
    });

    console.log(`  done  ${service.id} → ${url}`);
    ok++;
  }

  console.log(`\n  ${ok} ok, ${skipped} skipped, ${failed} failed\n`);
}

main();
