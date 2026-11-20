// What the charge playground sells: one fortune per payment, no model needed.
export const fortunes = [
  "A small payment today opens a large door tomorrow.",
  "Your next request will be answered with exactly what you paid for.",
  "The machine that pays its own way goes far.",
  "Settle quickly, and you will never owe.",
  "Good things come to those who send the right header.",
  "A receipt in hand is worth two promises in the inbox.",
  "You will find value where others see a 402.",
  "Every cent you spend this week comes back as something useful.",
  "An agent with a budget is an agent with a plan.",
  "Ask once, pay once, receive once.",
  "Your patience will be rewarded in under a second.",
  "Fortune favours the well-funded wallet.",
  "What you pay for, you can prove.",
  "A stranger's API will brighten your afternoon.",
  "Today is a good day to price something by the request.",
  "The cheapest call is the one that tells you its price first.",
  "Luck is a payment that arrives right on time.",
  "You are one transaction away from a good idea.",
  "Trust the Challenge; verify the Receipt.",
  "A penny for your thoughts is now a protocol.",
] as const;

/** A fortune and three lucky numbers. */
export function draw() {
  const fortune = fortunes[Math.floor(Math.random() * fortunes.length)]!;
  const lucky = Array.from(
    { length: 3 },
    () => 1 + Math.floor(Math.random() * 99),
  );
  return { fortune, lucky };
}
