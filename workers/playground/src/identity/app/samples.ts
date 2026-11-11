/** Tiers with compilable examples; the live Link integration is coming soon. */
export type SampleTier = "anonymous" | "email" | "apiKey" | "link";

/** Generates the complete client example shown in the playground. */
export function usage(tier: SampleTier, email = "", apiKey = "", topic = "") {
  return `import { Mppx, tempo } from 'mppx/client'
${tier === "email" ? "import * as EmailOtp from 'mppx/extensions/identity/email-otp'\n" : ""}${tier === "apiKey" ? "import type * as Identity from 'mppx/identity'\n" : ""}${tier === "link" ? "import * as Link from 'mppx/extensions/identity/link'\n" : ""}
// Pass the connected Tempo Wallet's provider.getMppxParameters().
type Wallet = NonNullable<Parameters<typeof tempo>[0]>

export async function buyHaiku(
  wallet: Wallet,${tier === "link" ? "\n  getLinkToken: () => Promise<string | undefined>," : ""}
) {
  const origin = location.origin
  const baseUrl = origin + '/playground/identity'
${
  tier === "email"
    ? `  const issuer = baseUrl + '/issuer'
  const email = ${JSON.stringify(email || "you@example.com")}
  const askForCode = async () => prompt('Email verification code') ?? undefined
  const { id } = await EmailOtp.Client.sendCode({
    audience: origin,
    email,
    issuer,
  })
  const code = await askForCode()
  if (!code) throw new Error('No code entered.')
  const { attestation } = await EmailOtp.Client.verifyCode({
    code,
    id,
    issuer,
  })
`
    : ""
}${
  tier === "apiKey"
    ? `  const apiKey: Identity.Prover = {
    headers: ['x-api-key'],
    prove(request) {
      const headers = new Headers(request.headers)
      headers.set('X-Api-Key', ${JSON.stringify(apiKey || "haiku-demo-key")})
      return new Request(request, { headers })
    },
    scope: [origin],
  }
`
    : ""
}  const mppx = Mppx.create({
${
  tier === "email"
    ? `    identity: [EmailOtp.Client.prover({
      attestations: [attestation],
      code: askForCode,
      email,
      issuers: [issuer],
      scope: [origin],
    })],
`
    : tier === "apiKey"
      ? "    identity: [apiKey],\n"
      : tier === "link"
        ? `    // Supply a token from your Link integration.
    identity: [Link.Client.attestation({
      scope: [origin],
      token: getLinkToken,
    })],
`
        : ""
}    methods: [tempo(wallet)],
    polyfill: false,
  })
  const url = new URL(baseUrl + '/api/haiku')
${topic ? `  url.searchParams.set('topic', ${JSON.stringify(topic)})\n` : ""}  return mppx.fetch(url)
}
`;
}

/** Generates a complete payment handler; the caller supplies its haiku writer. */
export function serverUsage(tier: SampleTier) {
  return `import type * as Identity from 'mppx/identity'
${tier === "email" ? "import * as EmailOtp from 'mppx/extensions/identity/email-otp'\n" : ""}${tier === "apiKey" ? "import { from } from 'mppx/identity'\n" : ""}${tier === "link" ? "import * as Link from 'mppx/extensions/identity/link'\n" : ""}import { Mppx, tempo } from 'mppx/server'
import { type Address, createClient, http } from 'viem'
import { tempoModerato } from 'viem/chains'

export function createHandler(options: {
  recipient: Address
  secretKey: string
  write: (identity: Identity.Results | undefined) => Promise<string[]>
}) {
  const client = createClient({ chain: tempoModerato, transport: http() })
  const mppx = Mppx.create({
    methods: [tempo({
      chainId: tempoModerato.id, // 42431: Tempo Moderato testnet
      currency: '0x20c0000000000000000000006a37DA5C996874BE', // OUSD on Tempo
      getClient: () => client,
      recipient: options.recipient,
    })],
${tier === "link" ? "    requiresAuth: true, // Keep Link tokens in Authorization.\n" : ""}    secretKey: options.secretKey,
  })

  return async (request: Request): Promise<Response> => {
${
  tier === "email"
    ? `    const origin = new URL(request.url).origin
    const issuer = origin + '/playground/identity/issuer'
    const verifier = EmailOtp.Server.verifier({
      audience: origin,
      issuer,
    })
`
    : tier === "apiKey"
      ? `    // Replace this demo key table with your own member lookup.
    const members: Record<string, { name: string }> = {
      'haiku-demo-key': { name: 'Satoshi' },
    }
    const verifier = from({
      verify(request) {
        const key = request.headers.get('X-Api-Key')
        return key && Object.hasOwn(members, key) ? members[key] : undefined
      },
    })
`
      : tier === "link"
        ? "    const verifier = Link.Server.attestation()\n"
        : ""
}${
  tier !== "anonymous"
    ? `    const verified = (await verifier.verify(request.clone())).status === 'valid'
`
    : ""
}    const result = await mppx.charge({
      amount: ${tier === "anonymous" ? "'0.03'" : `verified ? '${tier === "email" ? "0.02" : "0.01"}' : '0.03'`},
${tier !== "anonymous" ? "      ...(verified && { identity: [verifier] }),\n" : ""}    })(request)
    if (result.status === 402) return result.challenge
    const haiku = await options.write(result.identity)
    return result.withReceipt(Response.json({ haiku }))
  }
}
`;
}

/** Anchors explanations to source text so edits cannot silently shift the notes. */
export function explanations(source: string) {
  const notes = [
    [
      "token: getLinkToken",
      "Your Link integration supplies an agent token. This attests the agent without disclosing personal details.",
    ],
    [
      "requiresAuth:",
      "Keep the Link token in Authorization; payment Credentials use Payment-Authorization.",
    ],
    [
      "const { attestation } =",
      "Verify the email code once to receive a reusable attestation.",
    ],
    ["identity: [apiKey]", "Attach the API key as a scoped identity proof."],
    [
      "methods: [tempo(wallet)]",
      "Use the connected wallet to pay Tempo payment Challenges.",
    ],
    [
      "return mppx.fetch(url)",
      "Handle the payment Challenge and retry the request with a Credential.",
    ],
    [
      "currency:",
      "Price payments in OUSD on Tempo Moderato. The recipient is the address receiving payment.",
    ],
    [
      "const verified =",
      "Verify the caller's proof before choosing the lower price.",
    ],
    [
      "return result.withReceipt",
      "Return the haiku with a payment Receipt after successful verification.",
    ],
  ] as const;
  return source.split("\n").flatMap((line, index) => {
    const note = notes.find(([prefix]) => line.trimStart().startsWith(prefix));
    return note ? [{ lineNumber: index + 1, metadata: note[1] }] : [];
  });
}
