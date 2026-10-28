/**
 * Snapshots the Tempo MPP proxy's discovery manifest into schemas/mpp-proxy.json.
 * scripts/generate-discovery.ts merges the snapshot into the service catalog.
 *
 * Usage:
 *   node scripts/sync-mpp-proxy.ts          # update the snapshot
 *   node scripts/sync-mpp-proxy.ts --check  # exit 1 if the live manifest differs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  MPP_PROXY_MANIFEST_URL,
  mergeMppProxyCatalog,
} from "../src/mpp-proxy-catalog.ts";

const MPP_PROXY_SNAPSHOT = resolve(
  import.meta.dirname,
  "../schemas/mpp-proxy.json",
);

/** Serializes the manifest the way the snapshot is checked in. */
function formatSnapshot(manifest: unknown): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

async function fetchManifest(): Promise<unknown> {
  const response = await fetch(MPP_PROXY_MANIFEST_URL, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`${MPP_PROXY_MANIFEST_URL} returned ${response.status}`);
  }
  const manifest: unknown = await response.json();
  // Rejects a malformed or empty manifest before it reaches the snapshot.
  mergeMppProxyCatalog({ version: 1, services: [] }, manifest);
  return manifest;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--check")) {
    throw new Error("Usage: node scripts/sync-mpp-proxy.ts [--check]");
  }
  const live = formatSnapshot(await fetchManifest());

  if (args.includes("--check")) {
    const current = readFileSync(MPP_PROXY_SNAPSHOT, "utf8");
    if (current !== live) {
      console.error(
        `${MPP_PROXY_SNAPSHOT} is out of date with ${MPP_PROXY_MANIFEST_URL}. Run \`pnpm sync:mpp-proxy\`.`,
      );
      process.exit(1);
    }
    console.log(`${MPP_PROXY_SNAPSHOT} matches ${MPP_PROXY_MANIFEST_URL}`);
    return;
  }

  writeFileSync(MPP_PROXY_SNAPSHOT, live);
  const count = (JSON.parse(live) as { services: unknown[] }).services.length;
  console.log(`Wrote ${MPP_PROXY_SNAPSHOT} (${count} services)`);
}

await main();
