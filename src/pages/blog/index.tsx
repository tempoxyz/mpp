import { BlogIndexPage } from "../../components/BlogIndexPage";
import { MarketingHead } from "../../components/MarketingHead";
import { Footer } from "../../components/marketing/Footer";

export default function BlogRoute() {
  return (
    <>
      <MarketingHead
        description="Updates from the MPP team on protocol development, integrations, and the future of machine payments."
        imageDescription="Updates on the Machine Payments Protocol"
        path="/blog"
        title="MPP Blog: HTTP 402 payment protocol updates"
      />
      <BlogIndexPage />
      <Footer />
    </>
  );
}
