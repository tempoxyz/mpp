import { MarketingHead } from "../components/MarketingHead";
import { Footer } from "../components/marketing/Footer";
import { PlaygroundIndexC } from "../components/playground/PlaygroundIndexC";

/** Temporary route: design option C for /playground. */
export default function PlaygroundOptionCRoute() {
  return (
    <>
      <MarketingHead
        description="Try MPP in your browser: interactive demos that make real payments on Tempo testnet, from paid requests and sessions to agent identity."
        imageDescription="Try machine payments in your browser"
        path="/playground"
        title="MPP playground: interactive payment demos"
      />
      <PlaygroundIndexC />
      <Footer />
    </>
  );
}
