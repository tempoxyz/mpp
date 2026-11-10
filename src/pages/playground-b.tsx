import { MarketingHead } from "../components/MarketingHead";
import { Footer } from "../components/marketing/Footer";
import { PlaygroundIndexB } from "../components/playground/PlaygroundIndexB";

/** Temporary route: design option B for /playground. */
export default function PlaygroundOptionBRoute() {
  return (
    <>
      <MarketingHead
        description="Try MPP in your browser: interactive demos that make real payments on Tempo testnet, from paid requests and sessions to agent identity."
        imageDescription="Try machine payments in your browser"
        path="/playground"
        title="MPP playground: interactive payment demos"
      />
      <PlaygroundIndexB />
      <Footer />
    </>
  );
}
