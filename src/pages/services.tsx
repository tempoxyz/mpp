import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { MarketingHead } from "../components/MarketingHead";
import { Footer } from "../components/marketing/Footer";
import { ServicesAgentDiscovery } from "../components/ServicesAgentDiscovery";
import { ServicesPage } from "../components/ServicesPage";
import type { Service } from "../data/registry";

async function loadServices(): Promise<Service[]> {
  const catalog = JSON.parse(
    await readFile(
      resolve(process.cwd(), "public/services/catalog.json"),
      "utf8",
    ),
  ) as { services: Service[] };
  return catalog.services.map((service) => ({
    categories: service.categories,
    description: service.description,
    docs: service.docs,
    endpoints: [],
    id: service.id,
    methods: {},
    name: service.name,
    provider: service.provider,
    serviceUrl: service.serviceUrl,
    url: service.url,
  }));
}

export default async function ServicesRoute() {
  const services = await loadServices();

  return (
    <>
      <MarketingHead
        description="Browse live MPP-enabled services that accept machine-to-machine payments. Discover APIs you can pay for with stablecoins, cards, or Bitcoin."
        imageDescription="Browse live APIs that accept machine payments"
        path="/services"
        title="MPP services: APIs that accept MPP payments"
      />
      <ServicesPage initialServices={services} />
      <ServicesAgentDiscovery />
      <Footer />
    </>
  );
}
