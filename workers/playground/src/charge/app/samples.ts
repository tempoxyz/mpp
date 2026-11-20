// The code beside the demo: what the page runs, as a buyer (client.ts) and a seller (server.ts).
import type { Note } from "../../shared/code.js";

export const client = `import { Receipt } from 'mppx'
import { Mppx, tempo } from 'mppx/client'

// Pass the connected Tempo Wallet's provider.getMppxParameters().
type Wallet = NonNullable<Parameters<typeof tempo>[0]>

export async function buyFortune(wallet: Wallet) {
  const mppx = Mppx.create({
    methods: [tempo(wallet)],
    polyfill: false, // leave globalThis.fetch alone
  })

  // One call: a 402 comes back, mppx pays it and retries.
  const response = await mppx.fetch(
    location.origin + '/playground/charge/api/fortune',
  )

  // The Receipt names the transaction that paid.
  const receipt = Receipt.fromResponse(response)
  const { fortune } = await response.json()
  return { fortune, transaction: receipt.reference }
}
`;

export const server = `import { Mppx, Store, tempo } from 'mppx/server'
import { privateKeyToAccount } from 'viem/accounts'

type Env = {
  MPP_PRIVATE_KEY: \`0x\${string}\`
  MPP_SECRET_KEY: string
  CHARGE_STORE: Store.durableObject.Namespace
}

declare function drawFortune(): { fortune: string }

export default {
  async fetch(request: Request, env: Env) {
    const account = privateKeyToAccount(env.MPP_PRIVATE_KEY)
    const mppx = Mppx.create({
      methods: [
        tempo.charge({
          currency: '0x20c0000000000000000000006a37DA5C996874BE', // OUSD on Tempo
          recipient: account.address,
          store: Store.durableObject(env.CHARGE_STORE),
          testnet: true,
        }),
      ],
      realm: 'mpp.dev', // the host buyers pay at, behind its proxy
      secretKey: env.MPP_SECRET_KEY,
    })

    // Not paid yet: answer 402 with a charge Challenge.
    const result = await mppx.charge({
      amount: '0.01',
      description: 'A fortune',
    })(request)
    if (result.status === 402) return result.challenge

    // Paid: deliver the fortune with a Receipt.
    return result.withReceipt(Response.json(drawFortune()))
  },
}
`;

export const notes: readonly Note[] = [
  [
    "methods: [tempo(wallet)]",
    "The client can pay Tempo Challenges. Add more methods and mppx picks one the server offers.",
  ],
  [
    "const response = await mppx.fetch(",
    "The first try gets a 402 with a Challenge: amount, currency, recipient and expiry. mppx signs a payment for exactly that and retries with it as a Credential.",
  ],
  [
    "const receipt = Receipt.fromResponse(",
    "The server answers 200 with a Payment-Receipt header: proof the payment settled, with the transaction as its reference.",
  ],
  [
    "tempo.charge({",
    "The charge intent: one payment per request, settled on its own. No channel, no deposit to manage.",
  ],
  [
    "store: Store.durableObject(",
    "Remembers spent Credentials, so one payment can't be replayed for a second fortune.",
  ],
  [
    "const result = await mppx.charge({",
    "Prices this request. Without a valid Credential it returns a 402 Challenge; with one it verifies and settles the payment.",
  ],
  [
    "return result.withReceipt(",
    "Attaches the Receipt to whatever you return: JSON, a stream, a file.",
  ],
];
