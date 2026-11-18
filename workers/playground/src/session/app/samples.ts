// The code beside the demo: what the page runs, as a buyer (client.ts) and a seller (server.ts).

/** A run of lines. */
export type Block = { code: string };

/** The buyer, with the most the visitor lets the channel hold. */
export function clientBlocks(maxDeposit = "0.25"): Block[] {
  return [
    {
      code: `import { tempo } from 'mppx/client'

// Pass the connected Tempo Wallet's provider.getMppxParameters().
type Wallet = Parameters<typeof tempo.session.manager>[0]

export async function readStory(
  wallet: Wallet,
  render: (word: string) => void,
) {
  const baseUrl = location.origin + '/playground/session'
`,
    },
    {
      code: `  const session = tempo.session.manager({
    ...wallet,
    allowedChainIds: [42431], // Moderato testnet
    maxDeposit: '${maxDeposit}', // the most the channel may ever hold`,
    },
    {
      code: `    topUpAmount: '0.05', // added when a story runs past the deposit`,
    },
    { code: "  })\n" },
    {
      code: `  // The first request opens a channel; every word after that
  // is paid with an off-chain voucher.
  const stream = await session.sse(baseUrl + '/api/story')`,
    },
    {
      code: `  for await (const word of stream) render(word)
`,
    },
    {
      code: `  // Add to the deposit without opening a new channel.
  await session.topUp('0.05')
`,
    },
    {
      code: `  // Settle what you spent and get the rest back.
  return session.close()`,
    },
    { code: "}" },
  ];
}

/** The seller: the Worker's story route, without its config and fallbacks. */
export function serverBlocks(): Block[] {
  return [
    {
      code: `import { Mppx, Store, tempo } from 'mppx/server'
import { privateKeyToAccount } from 'viem/accounts'

type Env = {
  MPP_PRIVATE_KEY: \`0x\${string}\`
  MPP_SECRET_KEY: string
  MPPX_STORE: Store.durableObject.Namespace
}

declare function writeStory(): Promise<string[]>

export default {
  async fetch(request: Request, env: Env) {
    const mppx = Mppx.create({
      methods: [
        tempo.session({
          account: privateKeyToAccount(env.MPP_PRIVATE_KEY),
          chainId: 42431, // Moderato testnet
          currencies: ['0x20c0000000000000000000006a37DA5C996874BE'], // OUSD on Tempo
          sse: { poll: true }, // Workers poll for the next voucher
          store: Store.durableObject(env.MPPX_STORE),
          voucherStateMaxAge: 60_000, // no chain read per word
        }),
      ],
      realm: 'mpp.dev', // the host buyers pay at, behind its proxy
      secretKey: env.MPP_SECRET_KEY,
    })
`,
    },
    {
      code: `    // No channel yet: answer with a session Challenge.
    const result = await mppx.session({
      amount: '0.001',
      suggestedDeposit: '0.05',
      unitType: 'word',
    })(request)
    if (result.status === 402) return result.challenge
`,
    },
    {
      code: `    // Opens, vouchers, top-ups and closes carry their own response.
    try {
      return await result.withReceipt()
    } catch (error) {
      if (!Mppx.isMissingReceiptResponseError(error)) throw error
    }
`,
    },
    {
      code: `    // Charge each word before sending it.
    const words = await writeStory()
    return result.withReceipt(async function* (stream) {
      for (const word of words) {
        await stream.charge()
        yield word
      }
    })
  },
}`,
    },
  ];
}

/** A sample's source, as the pane shows it. */
export function source(blocks: readonly Block[]): string {
  return `${blocks.map((block) => block.code).join("\n")}\n`;
}

/** Notes under the lines that matter, anchored to their text so edits can't shift them. */
export function explanations(source: string) {
  const notes = [
    [
      "const session = tempo.session.manager(",
      "One manager per server: it opens the channel on the first request, signs a voucher for each word and tops up when the deposit runs low.",
    ],
    [
      "maxDeposit:",
      "A ceiling, not a payment: the channel opens with the server's suggested deposit and never holds more than this.",
    ],
    [
      "topUpAmount:",
      "When a story runs past the deposit, the manager adds this on-chain and the stream carries on.",
    ],
    [
      "const stream = await session.sse(",
      "The first request opens the channel: one transaction. Every word after it is a voucher, a signed message that costs no gas.",
    ],
    [
      "await session.topUp(",
      "Adds to the same channel, so vouchers keep counting up from where they were.",
    ],
    [
      "return session.close()",
      "Settles the latest voucher on-chain: the server is paid what you spent, and the rest of the deposit comes back.",
    ],
    [
      "tempo.session({",
      "Buyers lock stablecoins in a payment channel once, then pay each word with a voucher instead of a transaction.",
    ],
    [
      "sse: { poll: true }",
      "A Worker can't hand a promise from one request to another, so the stream polls the store for the next voucher.",
    ],
    [
      "store: Store.durableObject(",
      "Channel state lives in a Durable Object, so every request sees the latest voucher.",
    ],
    [
      "voucherStateMaxAge:",
      "Checks each voucher against channel state read in the last minute instead of reading the chain for every word.",
    ],
    [
      "suggestedDeposit:",
      "What buyers reserve when they open: enough for most of a story at 0.001 a word.",
    ],
    [
      "return await result.withReceipt()",
      "Opens, vouchers, top-ups and closes are management requests: each gets its own response, not a story.",
    ],
    [
      "await stream.charge()",
      "Takes one word's price from the latest voucher, and waits for the buyer's next voucher when it runs out.",
    ],
  ] as const;
  return source.split("\n").flatMap((line, index) => {
    const note = notes.find(([prefix]) => line.trimStart().startsWith(prefix));
    return note ? [{ lineNumber: index + 1, metadata: note[1] }] : [];
  });
}
