import { Mpay, tempo } from 'mpay/server'
import { createClient, http } from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { tempoModerato } from 'viem/chains'
import { Actions } from 'viem/tempo'

const account = privateKeyToAccount(generatePrivateKey())
const currency = '0x20c0000000000000000000000000000000000000' as const

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

  if (url.pathname === '/api/scrape') {
    const target = url.searchParams.get('url') ?? 'https://example.com'

    const result = await mpay.stream({
      amount: '0.002',
      unitType: 'page',
    })(request)

    if (result.status === 402) return result.challenge as globalThis.Response

    const html = scrapePage(target)

    return result.withReceipt(Response.json({ url: target, html }))
  }

  return null
}

function scrapePage(url: string): string {
  return `<html><head><title>${url}</title></head><body><h1>Scraped content from ${url}</h1><p>This is mock scraped content.</p></body></html>`
}

console.log(`Server recipient: ${account.address}`)
await Actions.faucet.fundSync(client, { account, timeout: 30_000 })
console.log('Server account funded')
