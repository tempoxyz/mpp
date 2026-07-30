import { MarketingHead } from "../components/MarketingHead";
import { Footer } from "../components/marketing/Footer";
import { ServicesAgentDiscovery } from "../components/ServicesAgentDiscovery";
import { ServicesPage } from "../components/ServicesPage";

export default function ServicesRoute() {
  return (
    <>
      <MarketingHead
        description="Browse live MPP-enabled services that accept machine-to-machine payments. Discover APIs you can pay for with stablecoins, cards, or Bitcoin."
        imageDescription="Browse live APIs that accept machine payments"
        path="/services"
        title="Services"
      />
      <ServicesPage />
      <ServicesAgentDiscovery />
      <Footer />
    </>
  );
}
