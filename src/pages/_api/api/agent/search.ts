import { Expires } from "mppx/server";
import { mppx } from "../../../../mppx.server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "coffee";

  const result = await mppx.charge({
    amount: "0.002",
    currency: import.meta.env.VITE_DEFAULT_CURRENCY!,
    expires: Expires.minutes(5),
    description: `Search: ${query}`,
  })(request);

  if (result.status === 402) return result.challenge;

  const resultsByQuery: Record<
    string,
    {
      id: string;
      name: string;
      rating: number;
      distance: string;
      price: string;
    }[]
  > = {
    coffee: [
      {
        id: "place_001",
        name: "The Coffee Movement",
        rating: 4.6,
        distance: "0.4 mi",
        price: "$$",
      },
      {
        id: "place_008",
        name: "Sightglass Coffee",
        rating: 4.6,
        distance: "0.5 mi",
        price: "$$",
      },
      {
        id: "place_009",
        name: "Ritual Coffee Roasters",
        rating: 4.5,
        distance: "0.8 mi",
        price: "$$",
      },
    ],
    "italian restaurant": [
      {
        id: "place_002",
        name: "Flour + Water",
        rating: 4.7,
        distance: "0.8 mi",
        price: "$$$",
      },
      {
        id: "place_004",
        name: "Delfina",
        rating: 4.6,
        distance: "1.1 mi",
        price: "$$$",
      },
      {
        id: "place_005",
        name: "SPQR",
        rating: 4.5,
        distance: "1.3 mi",
        price: "$$$$",
      },
    ],
    "parking garage Union Square": [
      {
        id: "place_003",
        name: "Union Square Garage",
        rating: 4.2,
        distance: "0.2 mi",
        price: "$",
      },
      {
        id: "place_006",
        name: "Sutter Stockton Garage",
        rating: 4.0,
        distance: "0.3 mi",
        price: "$",
      },
      {
        id: "place_007",
        name: "Fifth & Mission Garage",
        rating: 3.9,
        distance: "0.5 mi",
        price: "$",
      },
    ],
    "weather forecast": [
      {
        id: "weather_001",
        name: "San Francisco Weather",
        rating: 5.0,
        distance: "local",
        price: "free",
      },
    ],
  };

  const results = resultsByQuery[query] || resultsByQuery.coffee;

  return result.withReceipt(
    Response.json({
      query,
      results,
      cost: "$0.002",
    }),
  );
}
