import { Expires } from "mppx/server";
import { mppx } from "../../../../mppx.server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const placeId = url.searchParams.get("place") || "place_001";

  const result = await mppx.charge({
    amount: "0.003",
    currency: import.meta.env.VITE_DEFAULT_CURRENCY!,
    expires: Expires.minutes(5),
    description: `Reviews for ${placeId}`,
  })(request);

  if (result.status === 402) return result.challenge;

  const reviewsByPlace: Record<
    string,
    {
      summary: string;
      sentiment: string;
      highlights: string[];
      reviewCount: number;
      averageRating: number;
    }
  > = {
    place_001: {
      summary:
        "Outstanding specialty coffee in Nob Hill. Known for pour-overs, single-origin beans, and a warm neighborhood vibe. Baristas are knowledgeable and passionate.",
      sentiment: "very_positive",
      highlights: [
        "specialty pour-over",
        "single-origin beans",
        "knowledgeable baristas",
        "Nob Hill neighborhood gem",
      ],
      reviewCount: 729,
      averageRating: 4.6,
    },
    place_002: {
      summary:
        "Outstanding Italian cuisine with house-made pasta. Reservations recommended. Great wine selection.",
      sentiment: "very_positive",
      highlights: [
        "fresh pasta",
        "cozy atmosphere",
        "excellent wine",
        "attentive service",
      ],
      reviewCount: 2412,
      averageRating: 4.7,
    },
    place_003: {
      summary:
        "Convenient downtown parking with good availability. Easy entrance and exit. Clean facility.",
      sentiment: "positive",
      highlights: ["good rates", "clean", "secure", "easy access"],
      reviewCount: 892,
      averageRating: 4.2,
    },
    weather_001: {
      summary:
        "Partly cloudy with mild temperatures. Low chance of rain in the afternoon.",
      sentiment: "neutral",
      highlights: ["58°F high", "45°F low", "10% rain chance", "light breeze"],
      reviewCount: 1,
      averageRating: 5.0,
    },
  };

  const review = reviewsByPlace[placeId] || reviewsByPlace.place_001;

  return result.withReceipt(
    Response.json({
      placeId,
      ...review,
      cost: "$0.003",
    }),
  );
}
