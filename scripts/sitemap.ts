const URL_ENTRY = /\s*<url>[\s\S]*?<\/url>/g;
const LOC = /<loc>([^<]+)<\/loc>/;

function normalizeLocation(location: string): string {
  const url = new URL(location);
  url.hash = "";
  if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString();
}

export function pruneSitemapXml(sitemap: string): string {
  const seen = new Set<string>();

  return sitemap.replace(URL_ENTRY, (entry) => {
    const location = entry.match(LOC)?.[1];
    if (!location) return entry;

    const normalized = normalizeLocation(location);
    if (new URL(normalized).pathname === "/404" || seen.has(normalized)) {
      return "";
    }

    seen.add(normalized);
    return entry;
  });
}

export function assertSitemapXml(sitemap: string): void {
  const locations = Array.from(sitemap.matchAll(new RegExp(LOC, "g"))).map(
    (match) => normalizeLocation(match[1]),
  );
  const duplicates = locations.filter(
    (location, index) => locations.indexOf(location) !== index,
  );

  if (duplicates.length > 0) {
    throw new Error(`Duplicate sitemap locations: ${[...new Set(duplicates)]}`);
  }
  if (locations.some((location) => new URL(location).pathname === "/404")) {
    throw new Error("Sitemap must not contain /404");
  }
}
