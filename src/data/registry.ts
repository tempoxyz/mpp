// ---------------------------------------------------------------------------
// API config
// Uses the local /api/services route which proxies discovery.json (same origin,
// no CORS). In production this serves from the same Vercel deployment.
// To point at an external API instead, change API_URL to the full URL.
// ---------------------------------------------------------------------------

const API_URL = "/api/services";
const CACHE_TTL_MS = 60_000;

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

// ---------------------------------------------------------------------------
// Module-level cache for rate limiting
// ---------------------------------------------------------------------------

let cached: { data: Service[]; ts: number } | null = null;
let inflight: Promise<Service[]> | null = null;

async function fetchFromApi(): Promise<Service[]> {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  const json = await res.json();
  return json.services;
}

// ---------------------------------------------------------------------------
// Public API — cached, deduped, rate-limited
// ---------------------------------------------------------------------------

export async function fetchServices(): Promise<Service[]> {
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }

  if (inflight) return inflight;

  inflight = fetchFromApi()
    .then((services) => {
      cached = { data: services, ts: Date.now() };
      inflight = null;
      return services;
    })
    .catch((err) => {
      inflight = null;
      throw err;
    });

  return inflight;
}
