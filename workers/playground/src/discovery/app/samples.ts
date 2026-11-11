// The code beside the demo: how a buyer finds services and reads what they cost (client.ts), and how one
// service publishes its discovery document (server.ts).
import type { Note } from "../../shared/code.js";

export const client = `type Offer = { amount: string; currency: string; intent: string; method: string }
type Service = { url: string; title: string; path: string; offer: Offer; schema: unknown }

const origin = location.origin

// 1. Find services: a registry lists where each one lives.
export async function findServices(): Promise<Service[]> {
  const registry = origin + '/playground/discovery/api/registry'
  const { services } = await fetch(registry).then((r) => r.json())
  return Promise.all(
    services.map(async ({ url }: { url: string }) => {
      // 2. Read each one's discovery document: paths, schemas, prices.
      const doc = await fetch(origin + url + '/openapi.json').then((r) => r.json())
      const [[path, { post }]] = Object.entries<any>(doc.paths)
      const offer: Offer = post['x-payment-info'].offers[0]
      const schema = post.requestBody.content['application/json'].schema
      return { url, title: doc.info.title, path, offer, schema }
    }),
  )
}
`;

export const server = `import { generate } from 'mppx/discovery'
import { Mppx, Store, tempo } from 'mppx/server'
import { privateKeyToAccount } from 'viem/accounts'

type Env = {
  MPP_PRIVATE_KEY: \`0x\${string}\`
  MPP_SECRET_KEY: string
  CHARGE_STORE: Store.durableObject.Namespace
}

declare function forecast(input: unknown): unknown

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
      realm: 'mpp.dev',
      secretKey: env.MPP_SECRET_KEY,
    })

    // One handler both charges for the route and describes it.
    const pay = mppx.charge({
      amount: '0.002',
      description: "Forecast a city's weather",
    })

    if (new URL(request.url).pathname.endsWith('/openapi.json'))
      return Response.json(
        generate(mppx, {
          info: { title: 'Forecast API', version: '1.0.0' },
          routes: [
            {
              handler: pay,
              method: 'post',
              path: '/v1/forecast',
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        city: { type: 'string' },
                        days: { type: 'integer', minimum: 1, maximum: 7 },
                        units: { type: 'string', enum: ['metric', 'imperial'] },
                      },
                      required: ['city', 'days'],
                    },
                  },
                },
              },
            },
          ],
          serviceInfo: { categories: ['weather', 'data'] },
        }),
      )

    const result = await pay(request)
    if (result.status === 402) return result.challenge
    return result.withReceipt(Response.json(forecast(await request.json())))
  },
}
`;

export const notes: readonly Note[] = [
  [
    "const { services } = await fetch(registry)",
    "Registries such as MPPScan and mpp.dev/services aggregate services. Here the registry is one small JSON list.",
  ],
  [
    "const doc = await fetch(origin + url + '/openapi.json')",
    "Every MPP service can publish an OpenAPI document at /openapi.json. No account or API key is needed to read it.",
  ],
  [
    "const offer: Offer = post['x-payment-info']",
    "x-payment-info lists what each operation costs: amount in base units, currency, method and intent.",
  ],
  [
    "const schema = post.requestBody",
    "The request schema tells a buyer, or an agent, how to build a valid call without reading any docs.",
  ],
  [
    "const pay = mppx.charge({",
    "The same handler prices the route and feeds the discovery document, so the two can't drift apart.",
  ],
  [
    "generate(mppx, {",
    "Builds an OpenAPI 3.1 document with x-payment-info from your routes. The Hono, Express and Next.js adapters serve it for you with discovery().",
  ],
  [
    "serviceInfo:",
    "x-service-info: categories and docs links that registries use to list and search services.",
  ],
  [
    "const result = await pay(request)",
    "The live route: a 402 Challenge until it's paid, then the result with a Receipt.",
  ],
];

/** Notes for the live openapi.json pane, by the key that starts the line. */
export const documentNotes: readonly Note[] = [
  ['"servers"', "Where the service lives. Paths below are relative to it."],
  [
    '"requestBody"',
    "The request schema: every field, its type and limits. Enough to build a valid call without reading any docs.",
  ],
  [
    '"x-payment-info"',
    "The price tag. Clients read it before paying; the 402 Challenge stays authoritative.",
  ],
  ['"amount"', "In base units: OUSD has 6 decimals, so 1000 is 0.001."],
  [
    '"intent"',
    "charge: one payment per call. A session offer would bill per unit over a channel.",
  ],
  ['"402"', "Paid operations must document the 402 response."],
  [
    '"x-service-info"',
    "Service-level metadata registries use to categorize and link the service.",
  ],
];
