import { discovery } from "mppx/nextjs";
import { mppx } from "../../../mppx.server";

const USDCe = "0x20c000000000000000000000b9537d11c60e8b50";

const discoveryRoute = discovery(mppx, {
  info: { title: "mpp.dev", version: "1.0.0" },
  routes: [
    {
      handler: mppx.charge({
        amount: "0.1",
        currency: USDCe,
        description: "Ping endpoint access",
      }),
      method: "get",
      path: "/api/ping/paid",
      summary: "Paid ping — returns a greeting after payment",
    },
  ],
  serviceInfo: {
    categories: ["web"],
    docs: {
      homepage: "https://mpp.dev",
      llms: "https://mpp.dev/llms.txt",
    },
  },
});

export async function GET(request: Request) {
  const response = await discoveryRoute(request);
  const document = (await response.json()) as Record<string, unknown>;

  normalizeDiscoveryDocument(document);

  return Response.json(document, {
    headers: new Headers(response.headers),
    status: response.status,
  });
}

function normalizeDiscoveryDocument(document: Record<string, unknown>) {
  const paths = document.paths;
  if (!isRecord(paths)) return;

  for (const pathItem of Object.values(paths)) {
    if (!isRecord(pathItem)) continue;

    for (const operation of Object.values(pathItem)) {
      if (!isRecord(operation)) continue;

      const paymentInfo = operation["x-payment-info"];
      if (!isRecord(paymentInfo) || "offers" in paymentInfo) continue;

      operation["x-payment-info"] = { offers: [paymentInfo] };
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
