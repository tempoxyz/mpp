import { mppx } from "../../../../mppx.server";

const poems = [
  {
    title: "The Road Not Taken",
    author: "Robert Frost",
    lines: [
      "Two roads diverged in a yellow wood,",
      "And sorry I could not travel both",
      "And be one traveler, long I stood",
      "And looked down one as far as I could",
      "To where it bent in the undergrowth;",
    ],
  },
  {
    title: "Hope is the thing with feathers",
    author: "Emily Dickinson",
    lines: [
      "Hope is the thing with feathers",
      "That perches in the soul,",
      "And sings the tune without the words,",
      "And never stops at all,",
    ],
  },
  {
    title: "Ozymandias",
    author: "Percy Bysshe Shelley",
    lines: [
      "I met a traveller from an antique land",
      "Who said: Two vast and trunkless legs of stone",
      "Stand in the desert. Near them, on the sand,",
      "Half sunk, a shattered visage lies, whose frown,",
      "And wrinkled lip, and sneer of cold command,",
    ],
  },
  {
    title: "Do Not Go Gentle into That Good Night",
    author: "Dylan Thomas",
    lines: [
      "Do not go gentle into that good night,",
      "Old age should burn and rave at close of day;",
      "Rage, rage against the dying of the light.",
    ],
  },
  {
    title: "Stopping by Woods on a Snowy Evening",
    author: "Robert Frost",
    lines: [
      "Whose woods these are I think I know.",
      "His house is in the village though;",
      "He will not see me stopping here",
      "To watch his woods fill up with snow.",
    ],
  },
];

function _delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function handler(request: Request) {
  const result = await mppx.session({
    amount: "0.001",
    unitType: "word",
  })(request);

  if (result.status === 402) return result.challenge;

  // POST = voucher update (no body needed)
  if (request.method === "POST") return result.withReceipt();

  // GET = stream a poem
  const poem = poems[Math.floor(Math.random() * poems.length)];
  const words = poem.lines.flatMap((line) => [...line.split(" "), "\\n"]);

  return result.withReceipt(async function* (stream) {
    yield JSON.stringify({ title: poem.title, author: poem.author });
    for (const word of words) {
      await stream.charge();
      yield word;
    }
  });
}
