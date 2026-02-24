import { mppx } from "../../../../mppx.server";

const poems = [
  [
    "In circuits deep where data streams,",
    "A payment flows like whispered dreams,",
    "No card, no form, no human hand—",
    "Just code that speaks, and coins that land.",
    "The wallet signs without a sound,",
    "A fraction spent, a verse is found.",
    "No ledger clerk, no bank in sight,",
    "Just protocol and cryptic light.",
    "The merchant nods, the stream flows on,",
    "A micropayment here, then gone.",
  ],
  [
    "A merchant waits behind a gate,",
    "Four-oh-two, the price of fate.",
    "A coin slides through the wire thin,",
    "The door swings wide — the stream begins.",
    "Each byte that passes, paid in kind,",
    "A trustless deal, by code designed.",
    "No middleman to claim a share,",
    "Just sender, service, open air.",
    "The channel hums from end to end,",
    "A cent to spend, a thought to send.",
  ],
  [
    "Ones and zeros, wallets hum,",
    "Micro-pennies, here they come.",
    "Each token spent, a verse returned,",
    "A fair exchange, autonomously earned.",
    "The wire sings a quiet tune,",
    "A stablecoin beneath the moon.",
    "No invoice filed, no receipt lost,",
    "The chain remembers every cost.",
    "From node to node the signal flies,",
    "A paid-for truth that never lies.",
  ],
  [
    "No invoice sent, no bill to pay,",
    "The protocol knows the way.",
    "A handshake signed in cryptic light,",
    "Two machines agree: the price is right.",
    "The voucher lands, the balance shifts,",
    "A stream of data onward drifts.",
    "No human hand to slow the pace,",
    "Just math and trust in empty space.",
    "The escrow holds, the channel clears,",
    "A settlement in milliseconds, not years.",
  ],
  [
    "From wallet A to wallet B,",
    "A fraction of a cent runs free.",
    "The API responds in kind,",
    "A paid-for thought, from mind to mind.",
    "The signature was small and tight,",
    "A voucher sealed in morning light.",
    "The server checked, the proof was sound,",
    "And fresh-minted data was found.",
    "No debt accrued, no tab to close,",
    "Just value moving as it flows.",
  ],
  [
    "The ledger hums beneath the wire,",
    "A thousand calls, they never tire.",
    "Each micropayment, signed and sealed,",
    "A trustless bond the chain revealed.",
    "No middleman to slow the trade,",
    "No paper trail, no debt unpaid.",
    "The protocol speaks clear and true—",
    "A cent for me, a byte for you.",
    "The channel opened, tokens flowed,",
    "A silent pact on every road.",
  ],
  [
    "A key was born at half past three,",
    "Derived from entropy and sea.",
    "It signed a channel, locked a bond,",
    "And whispered to the world beyond.",
    "The service answered, line by line,",
    "Each response worth a fraction fine.",
    "When all was spent, the channel closed,",
    "And both sides settled, well-disposed.",
    "No court, no clerk, no arbiter—",
    "Just math, and trust in what they were.",
  ],
];

function tokenize(text: string): string[] {
  const tokens: string[] = [];
  for (let i = 0; i < text.length; i += 4) {
    tokens.push(text.slice(i, i + 4));
  }
  return tokens;
}

export default async function handler(request: Request) {
  const result = await mppx.session({
    amount: "0.0001",
    unitType: "token",
  })(request);

  if (result.status === 402) return result.challenge;

  // POST = voucher update (no body needed)
  if (request.method === "POST") return result.withReceipt();

  // GET = stream a poem
  const poem = poems[Math.floor(Math.random() * poems.length)];
  const text = poem.join("\t");
  const tokens = tokenize(text);

  return result.withReceipt(async function* (stream) {
    for (const token of tokens) {
      await stream.charge();
      yield token;
    }
  });
}
