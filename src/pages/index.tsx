import { LandingPage } from "../components/LandingPage";
import { MarketingHead } from "../components/MarketingHead";
import { Footer } from "../components/marketing/Footer";
import { StructuredData } from "../components/StructuredData";

const homepageStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@id": "https://mpp.dev/#organization",
      "@type": "Organization",
      logo: "https://mpp.dev/marketing/mpp-logo.svg",
      name: "MPP",
      sameAs: ["https://github.com/tempoxyz/mpp", "https://x.com/mpp"],
      url: "https://mpp.dev/",
    },
    {
      "@id": "https://mpp.dev/#website",
      "@type": "WebSite",
      description:
        "The open standard for machine-to-machine payments over HTTP 402.",
      name: "MPP — Machine Payments Protocol",
      publisher: { "@id": "https://mpp.dev/#organization" },
      url: "https://mpp.dev/",
    },
    {
      "@id": "https://mpp.dev/sdk/typescript/#software",
      "@type": ["SoftwareApplication", "SoftwareSourceCode"],
      applicationCategory: "DeveloperApplication",
      codeRepository: "https://github.com/wevm/mppx",
      description:
        "TypeScript SDK for clients and servers that use the Machine Payments Protocol.",
      name: "mppx",
      offers: {
        "@type": "Offer",
        price: 0,
        priceCurrency: "USD",
      },
      operatingSystem: "Any",
      url: "https://mpp.dev/sdk/typescript/",
    },
  ],
} as const;

export default function HomePage() {
  return (
    <>
      <MarketingHead
        description="Charge for API requests, tool calls, and content with HTTP 402 payments co-developed by Tempo and Stripe."
        imageDescription="Charge for API requests with HTTP 402 payments"
        path="/"
        title="Machine Payments Protocol"
      />
      <StructuredData data={homepageStructuredData} />
      <LandingPage />
      <Footer />
    </>
  );
}
