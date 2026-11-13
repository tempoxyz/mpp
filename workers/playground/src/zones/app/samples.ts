// The code beside the demo: a buyer paying from a Zone (client.ts) and a seller that accepts it
// (server.ts).
import type { Note } from "../../shared/code.js";

export const client = `import { Mppx, tempo } from 'mppx/client'
import { createClient } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { Actions, http, Zone } from 'viem/tempo'

const account = privateKeyToAccount('0x…') // your test wallet

// The Zone is its own chain. Its RPC answers only with a token
// signed by the account, and only about that account.
const zone = createClient({
  account,
  chain: Zone.from({ id: 1424310009, name: 'Playground Zone', sourceId: 42431 }),
  transport: http('https://mpp.dev/playground/zones/api/rpc/zone'),
})
await Actions.zone.signAuthorizationToken(zone)

const mppx = Mppx.create({
  methods: [tempo({ account, zone: { client: zone } })],
  polyfill: false,
})

// The 402 accepts the Zone, so mppx withdraws to the merchant
// with a memo bound to the Challenge, waits for Tempo, and retries.
const response = await mppx.fetch(
  'https://mpp.dev/playground/zones/api/fortune',
)
const { fortune } = await response.json()
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
          currency: '0x20c0000000000000000000000000000000000000', // pathUSD
          recipient: account.address,
          store: Store.durableObject(env.CHARGE_STORE),
          testnet: true,
          zones: [9], // accept payments from this Zone
        }),
      ],
      realm: 'mpp.dev',
      secretKey: env.MPP_SECRET_KEY,
    })

    const result = await mppx.charge({
      amount: '0.01',
      description: 'A private fortune',
    })(request)
    if (result.status === 402) return result.challenge

    // Paid from the Zone: the Credential names the withdrawal,
    // not the account that paid.
    return result.withReceipt(Response.json(drawFortune()))
  },
}
`;

export const notes: readonly Note[] = [
  [
    "const zone = createClient({",
    "A client for the Zone's own chain. The Zone keeps balances and activity private: its RPC scopes every answer to the account that signed the token.",
  ],
  [
    "await Actions.zone.signAuthorizationToken(",
    "Signs the token the transport sends as X-Authorization-Token. It authenticates reads, not payments.",
  ],
  [
    "methods: [tempo({ account, zone: { client: zone } })]",
    "Pay from the Zone whenever a Challenge accepts it. Other Challenges still pay from the account on Tempo.",
  ],
  [
    "const response = await mppx.fetch(",
    "The withdrawal pays the merchant through the Zone's portal on Tempo. Tempo shows the portal and a sender tag, never your address.",
  ],
  [
    "zones: [9],",
    "The Zones this server accepts. zones: true accepts any Zone that settles on the Challenge's chain.",
  ],
  [
    "store: Store.durableObject(",
    "Claims each withdrawal's sender tag, so one payment can't be replayed for a second fortune.",
  ],
  [
    "return result.withReceipt(",
    "The Receipt names the Tempo transaction that paid. Neither it nor the Credential names the payer.",
  ],
];
