import { LandingPage } from "../components/LandingPage";
import { MarketingHead } from "../components/MarketingHead";
import { Footer } from "../components/marketing/Footer";

export default function HomePage() {
  return (
    <>
      <MarketingHead
        description="Charge for API requests, tool calls, and content with HTTP 402 payments co-developed by Tempo and Stripe."
        imageDescription="Charge for API requests with HTTP 402 payments"
        path="/"
        title="Machine Payments Protocol"
      />
      <LandingPage />
      <Footer />
    </>
  );
}
