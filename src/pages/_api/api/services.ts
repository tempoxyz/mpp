import discovery from "../../../../schemas/discovery.json";

export function GET(request: Request) {
  const ids = new URL(request.url).searchParams
    .get("ids")
    ?.split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (ids?.length) {
    const servicesById = new Map(
      discovery.services.map((service) => [service.id, service]),
    );
    const services = ids.flatMap((id) => {
      const service = servicesById.get(id);
      if (!service) return [];
      return [
        {
          categories: service.categories,
          description: service.description,
          id: service.id,
          name: service.name,
          serviceUrl: service.serviceUrl,
          url: service.url,
        },
      ];
    });

    return Response.json(
      { services },
      { headers: { "Cache-Control": "public, max-age=60" } },
    );
  }

  return Response.json(discovery, {
    headers: { "Cache-Control": "public, max-age=60" },
  });
}
