import discovery from "../../../../schemas/discovery.json";

export function GET() {
  return Response.json(discovery, {
    headers: { "Cache-Control": "public, max-age=60" },
  });
}
