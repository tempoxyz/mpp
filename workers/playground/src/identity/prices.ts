// Each tier's price in OUSD: the Worker charges these (tiers.ts), and the page shows them
// before /api/config answers, so the tier tabs don't change width when it does.
export const prices = {
  anonymous: "0.03",
  email: "0.02",
  apiKey: "0.01",
} as const;
