import { MarketingHead } from "../../components/MarketingHead";
import { Footer } from "../../components/marketing/Footer";
import { PlaygroundIndexA } from "../../components/playground/PlaygroundIndexA";

export default function PlaygroundRoute() {
  return (
    <>
      <MarketingHead
        description="Try MPP in your browser: interactive demos that make real payments on Tempo testnet, from paid requests and sessions to agent identity."
        imageDescription="Try machine payments in your browser"
        path="/playground"
        title="MPP playground: interactive payment demos"
      />
      <PlaygroundIndexA />
      <Footer />
    </>
  );
}
