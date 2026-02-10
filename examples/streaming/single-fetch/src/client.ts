import { tempo } from 'mpay/client'
import { createClient, type Hex, http } from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { tempoModerato } from 'viem/chains'
import { Actions } from 'viem/tempo'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173'
const currency = '0x20c0000000000000000000000000000000000000' as const

const account = privateKeyToAccount((process.env.PRIVATE_KEY as Hex) ?? generatePrivateKey())

const client = createClient({
  account,
  chain: tempoModerato,
  pollingInterval: 1_000,
  transport: http(),
})

console.log(`Client account: ${account.address}`)
console.log('Funding account via faucet...')
await Actions.faucet.fundSync(client, { account, timeout: 30_000 })

const getBalance = () => Actions.token.getBalance(client, { account, token: currency })
const fmt = (b: bigint) => `${Number(b) / 1e6} pathUSD`

const balanceBefore = await getBalance()
console.log(`Balance: ${fmt(balanceBefore)}`)

const s = tempo.session({
  account,
  getClient: () => client,
  maxDeposit: 10_000_000n,
})

const url = process.argv[2] ?? 'https://example.com'
console.log(`\nScraping: ${url}`)

const response = await s.fetch(`${BASE_URL}/api/scrape?url=${encodeURIComponent(url)}`)

if (!response.ok) {
  console.error(`Error: ${response.status}`)
  console.error(await response.text())
  process.exit(1)
}

const receipt = response.headers.get('Payment-Receipt')
if (receipt) console.log(`Payment-Receipt: ${receipt.slice(0, 40)}...`)

const body = await response.json()
console.log(`\nScraped ${body.url}:`)
console.log(body.html)

await s.close()

const balanceAfter = await getBalance()
console.log(
  `\nBalance: ${fmt(balanceBefore)} → ${fmt(balanceAfter)} (spent ${fmt(balanceBefore - balanceAfter)})`,
)
