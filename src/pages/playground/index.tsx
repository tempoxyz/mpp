import { MarketingHead } from "../../components/MarketingHead";
import { Footer } from "../../components/marketing/Footer";
import { PlaygroundIndex } from "../../components/playground/PlaygroundIndex";

export default function PlaygroundRoute() {
  return (
    <>
      <MarketingHead
        description="Interactive MPP demos that make real payments on Tempo testnet."
        imageDescription="Try MPP in your browser"
        path="/playground"
        title="MPP playground"
      />
      <PlaygroundIndex />
      <Footer />
    </>
  );
}
