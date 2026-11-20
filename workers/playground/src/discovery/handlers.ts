// What each discovery service returns once paid. Deterministic toys: no outside APIs.

/** A small stable hash, so the same input gives the same answer. */
function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seeded(seed: string) {
  let state = hash(seed) || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

type Input = Record<string, unknown>;

function forecast(input: Input) {
  const city = String(input.city);
  const days = Number(input.days);
  const imperial = input.units === "imperial";
  const today = new Date().toISOString().slice(0, 10);
  const random = seeded(`${city.toLowerCase()}|${today}`);
  const skies = ["sunny", "partly cloudy", "cloudy", "showers", "windy"];
  const base = 8 + random() * 20;
  return {
    city,
    units: imperial ? "imperial" : "metric",
    days: Array.from({ length: days }, (_, i) => {
      const date = new Date(Date.now() + i * 86_400_000)
        .toISOString()
        .slice(0, 10);
      const high = base + random() * 6;
      const low = high - 4 - random() * 6;
      const convert = (c: number) =>
        Math.round((imperial ? (c * 9) / 5 + 32 : c) * 10) / 10;
      return {
        date,
        high: convert(high),
        low: convert(low),
        sky: skies[Math.floor(random() * skies.length)],
      };
    }),
  };
}

/** Indicative units per USD: a toy table, not market data. */
const perUsd: Record<string, number> = {
  BRL: 5.4,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 151.2,
  MXN: 18.1,
  USD: 1,
};

function quote(input: Input) {
  const from = String(input.from);
  const to = String(input.to);
  const amount = Number(input.amount);
  const rate = perUsd[to]! / perUsd[from]!;
  return {
    from,
    to,
    amount,
    rate: Math.round(rate * 1e6) / 1e6,
    converted: Math.round(amount * rate * 100) / 100,
    asOf: new Date().toISOString(),
    note: "Indicative demo rates.",
  };
}

const palettes: Record<string, string[]> = {
  forest: ["#1b4332", "#2d6a4f", "#52b788", "#b7e4c7"],
  mono: ["#111111", "#444444", "#999999", "#eeeeee"],
  ocean: ["#03045e", "#0077b6", "#00b4d8", "#90e0ef"],
  sunset: ["#3d0c11", "#d62828", "#f77f00", "#fcbf49"],
};

function avatar(input: Input) {
  const seed = String(input.seed);
  const size = Number(input.size ?? 128);
  const colors = palettes[String(input.palette ?? "ocean")]!;
  const rounded = input.rounded !== false;
  const random = seeded(seed);
  const cell = size / 8;
  const fg = colors[1 + Math.floor(random() * 3)]!;
  const cells: string[] = [];
  // A mirrored 8x8 grid, like an identicon.
  for (let y = 1; y < 7; y++)
    for (let x = 1; x < 4; x++)
      if (random() > 0.45)
        for (const cx of [x, 7 - x])
          cells.push(
            `<rect x="${cx * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="${fg}"/>`,
          );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" rx="${rounded ? size / 5 : 0}" fill="${colors[0]}"/>${cells.join("")}</svg>`;
}

function style(input: Input) {
  const text = String(input.text);
  switch (input.style) {
    case "shout":
      return { text: `${text.toUpperCase()}!` };
    case "whisper":
      return { text: `${text.toLowerCase()}…` };
    case "reverse":
      return { text: [...text].reverse().join("") };
    case "mock":
      return {
        text: [...text]
          .map((c, i) => (i % 2 ? c.toUpperCase() : c.toLowerCase()))
          .join(""),
      };
    default:
      return { text: text.split(/\s+/).join(" 👏 ") };
  }
}

function roll(input: Input) {
  const dice = input.dice as string[];
  const modifier = Number(input.modifier ?? 0);
  const rolls = dice.map((die) => {
    const sides = Number(die.slice(1));
    const value = new Uint32Array(1);
    crypto.getRandomValues(value);
    return 1 + (value[0]! % sides);
  });
  return {
    dice,
    rolls,
    modifier,
    total: rolls.reduce((a, b) => a + b, 0) + modifier,
  };
}

/** Each service's handler, by slug: JSON, or an SVG string for the avatar. */
export const handlers: Record<string, (input: Input) => unknown> = {
  avatar,
  dice: roll,
  forecast,
  fx: quote,
  text: style,
};
