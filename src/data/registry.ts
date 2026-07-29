// ---------------------------------------------------------------------------
// API config
// The directory uses a generated static catalog to avoid serverless cold starts.
// The public /api/services endpoint remains available for external consumers.
// ---------------------------------------------------------------------------

import { useEffect, useState } from "react";

const API_URL = "/api/services";
const CACHE_TTL_MS = 5 * 60_000;
const CATALOG_URL = "/services/catalog.json";

// ---------------------------------------------------------------------------
// Types (mirrors the discovery JSON Schema)
// ---------------------------------------------------------------------------

export type Category =
  | "ai"
  | "blockchain"
  | "compute"
  | "data"
  | "media"
  | "search"
  | "social"
  | "storage"
  | "web";

export interface EndpointPayment {
  intent: string;
  method: string;
  amount?: string;
  currency?: string;
  decimals?: number;
  recipient?: string;
  unitType?: string;
  description?: string;
  dynamic?: true;
  amountHint?: string;
}

export interface Endpoint {
  method: string;
  path: string;
  description?: string;
  payment?: EndpointPayment | null;
  docs?: string;
}

export interface Service {
  id: string;
  name: string;
  url: string;
  serviceUrl?: string;
  description?: string;
  icon?: string;
  categories?: Category[];
  integration?: "first-party" | "third-party";
  tags?: string[];
  status?: "active" | "beta" | "deprecated" | "maintenance";
  docs?: {
    homepage?: string;
    llmsTxt?: string;
    openapi?: string;
    apiReference?: string;
  };
  methods: Record<string, { intents: string[]; assets?: string[] }>;
  realm?: string;
  endpoints: Endpoint[];
  provider?: { name?: string; url?: string; icon?: string };
}

export type FeaturedService = Pick<
  Service,
  "categories" | "description" | "id" | "name" | "serviceUrl" | "url"
>;

// ---------------------------------------------------------------------------
// Module-level cache for rate limiting
// ---------------------------------------------------------------------------

let cached: { data: Service[]; ts: number } | null = null;
let inflight: Promise<Service[]> | null = null;
const featuredCached = new Map<
  string,
  { data: FeaturedService[]; ts: number }
>();
const featuredInflight = new Map<string, Promise<FeaturedService[]>>();

async function fetchCatalog(): Promise<Service[]> {
  const res = await fetch(CATALOG_URL);
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  const json = await res.json();
  return json.services;
}

// ---------------------------------------------------------------------------
// Public API — cached, deduped, rate-limited
// ---------------------------------------------------------------------------

const SESSION_KEY = "mpp-services-cache";

function readSessionCache<T>(key: string): T | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts < CACHE_TTL_MS) return data;
  } catch {}
  return null;
}

function writeSessionCache<T>(key: string, data: T) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

// ---------------------------------------------------------------------------
// Logo helpers
// ---------------------------------------------------------------------------

export function iconUrl(serviceId: string): string {
  return `/api/icon?id=${encodeURIComponent(serviceId)}`;
}

export function serviceIconUrl(service: Pick<Service, "id">): string {
  return iconUrl(service.id);
}

export function useIsDark(): boolean {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const check = () => {
      const scheme = document.documentElement.style.colorScheme;
      setDark(
        scheme === "dark" ||
          (!scheme &&
            window.matchMedia("(prefers-color-scheme: dark)").matches),
      );
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
    });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", check);
    return () => {
      observer.disconnect();
      mq.removeEventListener("change", check);
    };
  }, []);
  return dark;
}

// ---------------------------------------------------------------------------
// Icon manifest (transparency + background data from sync-logos)
// ---------------------------------------------------------------------------

export interface IconManifest {
  transparent: Set<string>;
  lightBg: Set<string>;
}

const EMPTY_MANIFEST: IconManifest = {
  transparent: new Set(),
  lightBg: new Set(),
};

let manifestCache: { data: IconManifest; ts: number } | null = null;
let manifestInflight: Promise<IconManifest> | null = null;

export async function fetchIconManifest(): Promise<IconManifest> {
  if (manifestCache && Date.now() - manifestCache.ts < CACHE_TTL_MS) {
    return manifestCache.data;
  }

  if (manifestInflight) return manifestInflight;

  manifestInflight = fetch("/api/icon-manifest")
    .then((res) => (res.ok ? res.json() : { transparent: [], lightBg: [] }))
    .then((json: { transparent: string[]; lightBg?: string[] }) => {
      const manifest: IconManifest = {
        transparent: new Set(json.transparent),
        lightBg: new Set(json.lightBg ?? []),
      };
      manifestCache = { data: manifest, ts: Date.now() };
      manifestInflight = null;
      return manifest;
    })
    .catch(() => {
      manifestInflight = null;
      return EMPTY_MANIFEST;
    });

  return manifestInflight;
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

export async function fetchServices(): Promise<Service[]> {
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }

  const fromSession = readSessionCache<Service[]>(SESSION_KEY);
  if (fromSession) {
    cached = { data: fromSession, ts: Date.now() };
    return fromSession;
  }

  if (inflight) return inflight;

  inflight = fetchCatalog()
    .then((services) => {
      const cleaned = services.map((s) => ({
        ...s,
        name: s.name.replace(/ \(New\)$/i, ""),
      }));
      cached = { data: cleaned, ts: Date.now() };
      writeSessionCache(SESSION_KEY, cleaned);
      inflight = null;
      return cleaned;
    })
    .catch((err) => {
      inflight = null;
      throw err;
    });

  return inflight;
}

export async function fetchFeaturedServices(
  ids: readonly string[],
): Promise<FeaturedService[]> {
  const idsKey = ids.join(",");
  const memoryEntry = featuredCached.get(idsKey);
  if (memoryEntry && Date.now() - memoryEntry.ts < CACHE_TTL_MS) {
    return memoryEntry.data;
  }

  const cacheKey = `${SESSION_KEY}:featured:${idsKey}`;
  const sessionEntry = readSessionCache<FeaturedService[]>(cacheKey);
  if (sessionEntry) {
    featuredCached.set(idsKey, { data: sessionEntry, ts: Date.now() });
    return sessionEntry;
  }

  const pending = featuredInflight.get(idsKey);
  if (pending) return pending;

  const search = new URLSearchParams({ ids: idsKey });
  const request = fetch(`${API_URL}?${search}`)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`API ${response.status}: ${response.statusText}`);
      }

      const json = (await response.json()) as {
        services: FeaturedService[];
      };
      const services = json.services.map((service) => ({
        ...service,
        name: service.name.replace(/ \(New\)$/i, ""),
      }));
      featuredCached.set(idsKey, { data: services, ts: Date.now() });
      writeSessionCache(cacheKey, services);
      featuredInflight.delete(idsKey);
      return services;
    })
    .catch((error) => {
      featuredInflight.delete(idsKey);
      throw error;
    });
  featuredInflight.set(idsKey, request);
  return request;
}
