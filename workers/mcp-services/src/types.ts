export const CATEGORIES = [
  "ai",
  "blockchain",
  "compute",
  "data",
  "media",
  "search",
  "social",
  "storage",
  "web",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const INTEGRATIONS = ["first-party", "third-party"] as const;
export type Integration = (typeof INTEGRATIONS)[number];

export const STATUSES = [
  "active",
  "beta",
  "deprecated",
  "maintenance",
] as const;
export type Status = (typeof STATUSES)[number];

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
  integration?: Integration;
  tags?: string[];
  status?: Status;
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

export interface ServicesResponse {
  version: number;
  services: Service[];
}

export type WorkerEnv = Omit<
  Env,
  | "DATADOG_ENABLED"
  | "DATADOG_ENV"
  | "DATADOG_SERVICE"
  | "DATADOG_SITE"
  | "PUBLIC_MCP_ENDPOINT"
> & {
  DATADOG_API_KEY?: string;
  DATADOG_ENABLED?: string;
  DATADOG_ENV?: string;
  DATADOG_SERVICE?: string;
  DATADOG_SITE?: string;
  POSTHOG_HOST?: string;
  POSTHOG_KEY?: string;
  PUBLIC_MCP_ENDPOINT?: string;
  VITE_POSTHOG_HOST?: string;
  VITE_POSTHOG_KEY?: string;
};
