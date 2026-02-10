import { Mpay, tempo } from 'mpay/server'
import { createClient, http } from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { tempoModerato } from 'viem/chains'
import { Actions } from 'viem/tempo'

const account = privateKeyToAccount(generatePrivateKey())
const currency = '0x20c0000000000000000000000000000000000000' as const
const pricePerToken = '0.000075'

const client = createClient({
  chain: tempoModerato,
  pollingInterval: 1_000,
  transport: http(),
})

const storage = tempo.memoryStorage()

const mpay = Mpay.create({
  methods: [
    tempo.stream({
      currency,
      getClient: () => client,
      recipient: account.address,
      storage,
      testnet: true,
    }),
  ],
})

export async function handler(request: Request): Promise<Response | null> {
  const url = new URL(request.url)

  if (url.pathname === '/api/health') return Response.json({ status: 'ok' })

  if (url.pathname === '/api/chat') {
    const prompt = url.searchParams.get('prompt') ?? 'Hello!'

    const result = await mpay.stream({
      amount: pricePerToken,
      unitType: 'token',
    })(request)

    if (result.status === 402) return result.challenge as globalThis.Response

    return tempo.Sse.from({ request, storage }).sse(async function* (stream) {
      for await (const token of generateTokens(prompt)) {
        await stream.charge()
        yield token
      }
    })
  }

  return null
}

async function* generateTokens(prompt: string): AsyncGenerator<string> {
  const words = [
    'The',
    ' question',
    ' you',
    ' asked',
    '—"',
    prompt,
    '"—is',
    ' a',
    ' fascinating',
    ' one.',
    '\n\n',
    'In',
    ' short,',
    ' the',
    ' answer',
    ' depends',
    ' on',
    ' context.',
    ' Let',
    ' me',
    ' explain',
    ' with',
    ' a',
    ' few',
    ' key',
    ' points:',
    '\n\n',
    '1.',
    ' First,',
    ' consider',
    ' the',
    ' underlying',
    ' assumptions.',
    '\n',
    '2.',
    ' Then,',
    ' evaluate',
    ' the',
    ' available',
    ' evidence.',
    '\n',
    '3.',
    ' Finally,',
    ' draw',
    ' your',
    ' own',
    ' conclusions.',
    '\n\n',
    'Hope',
    ' that',
    ' helps!',
  ]
  for (const word of words) {
    yield word
    await new Promise((r) => setTimeout(r, 20 + Math.random() * 60))
  }
}

console.log(`Server recipient: ${account.address}`)
await Actions.faucet.fundSync(client, { account, timeout: 30_000 })
console.log('Server account funded')
