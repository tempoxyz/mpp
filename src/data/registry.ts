import discovery from "../../schemas/discovery.json";

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
// Public API — static import, no network request
// ---------------------------------------------------------------------------

export async function fetchServices(): Promise<Service[]> {
  return discovery.services as unknown as Service[];
}
