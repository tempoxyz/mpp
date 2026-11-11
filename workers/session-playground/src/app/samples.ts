// The code beside the demo: what the page runs, as a buyer (client.ts) and a seller (server.ts).
// Each block names the demo steps it belongs to, so the pane can light up the lines that run.

/** A step of the session the demo walks through. */
export type Step = "open" | "stream" | "topUp" | "close";

/** A run of lines, and the steps that run them. */
export type Block = { code: string; steps?: readonly Step[] | undefined };

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
      steps: ["open"],
    },
    {
      code: `    topUpAmount: '0.05', // added when a story runs past the deposit`,
      steps: ["open", "topUp"],
    },
    { code: "  })\n", steps: ["open"] },
    {
      code: `  // The first request opens a channel; every word after that
  // is paid with an off-chain voucher.
  const stream = await session.sse(baseUrl + '/api/story')`,
      steps: ["open", "stream"],
    },
    {
      code: `  for await (const word of stream) render(word)
`,
      steps: ["stream"],
    },
    {
      code: `  // Add to the deposit without opening a new channel.
  await session.topUp('0.05')
`,
      steps: ["topUp"],
    },
    {
      code: `  // Settle what you spent and get the rest back.
  return session.close()`,
      steps: ["close"],
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
      steps: ["open"],
    },
    {
      code: `    // Opens, vouchers, top-ups and closes carry their own response.
    try {
      return await result.withReceipt()
    } catch (error) {
      if (!Mppx.isMissingReceiptResponseError(error)) throw error
    }
`,
      steps: ["open", "stream", "topUp", "close"],
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
      steps: ["stream"],
    },
  ];
}

/** A sample's source, as the pane shows it. */
export function source(blocks: readonly Block[]): string {
  return `${blocks.map((block) => block.code).join("\n")}\n`;
}

/** The 1-based lines each step runs. */
export function stepLines(blocks: readonly Block[]): Record<Step, Set<number>> {
  const lines: Record<Step, Set<number>> = {
    close: new Set(),
    open: new Set(),
    stream: new Set(),
    topUp: new Set(),
  };
  let line = 1;
  for (const block of blocks) {
    const count = block.code.split("\n").length;
    for (const step of block.steps ?? [])
      for (let i = 0; i < count; i++) lines[step].add(line + i);
    line += count;
  }
  return lines;
}
