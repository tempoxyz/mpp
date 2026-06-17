import { Expires } from "mppx/server";
import { mppx } from "../../../../mppx.server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const destination = url.searchParams.get("to") || "The Coffee Movement";

  const result = await mppx.charge({
    amount: "0.002",
    currency: import.meta.env.VITE_DEFAULT_CURRENCY!,
    expires: Expires.minutes(5),
    description: `Directions to ${destination}`,
  })(request);

  if (result.status === 402) return result.challenge;

  const directionsByDest: Record<
    string,
    { duration: string; distance: string; steps: string[] }
  > = {
    "The Coffee Movement": {
      duration: "8 min walk",
      distance: "0.4 mi",
      steps: [
        "Head north on Market St",
        "Turn left onto Grant Ave through Chinatown",
        "Turn right onto Washington St",
        "Destination at 1030 Washington St, Nob Hill",
      ],
    },
    "Flour + Water": {
      duration: "15 min walk",
      distance: "0.8 mi",
      steps: [
        "Head south on Mission St",
        "Turn left onto 20th St",
        "Continue to Harrison St",
        "Destination on right",
      ],
    },
    "Union Square Garage": {
      duration: "3 min drive",
      distance: "0.2 mi",
      steps: [
        "Turn right on Geary St",
        "Continue for 2 blocks",
        "Garage entrance on left at 450 Post St",
      ],
    },
    forecast: {
      duration: "N/A",
      distance: "local",
      steps: [
        "Rain expected around 4pm",
        "Clear skies by evening",
        "Bring light jacket",
      ],
    },
  };

  const directions =
    directionsByDest[destination] || directionsByDest["The Coffee Movement"];

  return result.withReceipt(
    Response.json({
      destination,
      ...directions,
      cost: "$0.002",
    }),
  );
}
