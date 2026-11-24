import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Service id → static logo path, as built by `scripts/build-logos.ts`.
 * Server-only. Empty when the logos weren't built, so every service falls back
 * to `/api/icon`.
 */
export function readServiceLogos(): Record<string, string> {
  try {
    return JSON.parse(
      readFileSync(
        resolve(process.cwd(), "public/services/logos.json"),
        "utf8",
      ),
    );
  } catch {
    return {};
  }
}
