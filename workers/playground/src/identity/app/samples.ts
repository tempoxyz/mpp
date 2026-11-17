/** Tiers with compilable examples; the live Link integration is coming soon. */
export type SampleTier =
  | "anonymous"
  | "email"
  | "apiKey"
  | "poppy"
  | "erc8004"
  | "webBotAuth"
  | "link";

/** Each tier's import lines in client.ts, after mppx/client's. */
const clientImports: Partial<Record<SampleTier, string>> = {
  apiKey: "import type * as Identity from 'mppx/identity'\n",
  email: "import * as EmailOtp from 'mppx/extensions/identity/email-otp'\n",
  erc8004:
    "import * as Erc8004 from 'mppx/extensions/identity/erc8004'\nimport type { LocalAccount } from 'viem'\n",
  link: "import * as Link from 'mppx/extensions/identity/link'\n",
  poppy: "import * as Poppy from 'mppx/extensions/identity/poppy'\n",
  webBotAuth:
    "import * as WebBotAuth from 'mppx/extensions/identity/web-bot-auth'\n",
};

/** Each tier's extra parameters of buyHaiku, after the wallet. */
const clientParameters: Partial<Record<SampleTier, string>> = {
  erc8004: "\n  agent: { account: LocalAccount; id: bigint },",
  link: "\n  getLinkToken: () => Promise<string | undefined>,",
  poppy:
    "\n  agent: { delegation: () => Promise<string>; key: CryptoKeyPair; userId: string },",
  webBotAuth: "\n  botKey: CryptoKeyPair,",
};

/** Each tier's provers: the identity line of Mppx.create. */
const clientIdentity: Partial<Record<SampleTier, string>> = {
  apiKey: "    identity: [apiKey],\n",
  email: `    identity: [EmailOtp.Client.prover({
      attestations: [attestation],
      code: askForCode,
      email,
      issuers: [issuer],
      scope: [origin],
    })],
`,
  erc8004: `    // An agent in the ERC-8004 Identity Registry signs each request with its wallet.
    identity: [Erc8004.Client.prover({
      account: agent.account,
      agentId: agent.id,
      chainId: 42431, // Tempo Moderato testnet
      registry: '0x8004A818BFB912233c491871b3d84c89A494BD9e', // ERC-8004 Identity Registry
      scope: [origin],
    })],
`,
  link: `    // Supply a token from your Link integration.
    identity: [Link.Client.attestation({
      scope: [origin],
      token: getLinkToken,
    })],
`,
  poppy: `    // Your Personal Agent delegated this key: it signs a Session for each request.
    identity: [Poppy.Client.prover({
      audience: origin,
      clientId: 'https://mpp.dev/playground/identity/api/agent.json',
      delegation: agent.delegation, // Returns a current delegation, renewed before it expires.
      key: {
        jwk: await crypto.subtle.exportKey('jwk', agent.key.publicKey),
        privateKey: agent.key.privateKey,
      },
      scope: [origin],
      userId: agent.userId,
    })],
`,
  webBotAuth: `    // Sign each request with a key your bot's HTTPS directory publishes.
    identity: [WebBotAuth.Client.prover({
      key: botKey,
      scope: [origin],
      signatureAgent: 'https://http-message-signatures-example.research.cloudflare.com',
    })],
`,
};

/** Generates the complete client example shown in the playground. */
export function usage(tier: SampleTier, email = "", apiKey = "", topic = "") {
  return `import { Mppx, tempo } from 'mppx/client'
${clientImports[tier] ?? ""}
// Pass the connected Tempo Wallet's provider.getMppxParameters().
type Wallet = NonNullable<Parameters<typeof tempo>[0]>

export async function buyHaiku(
  wallet: Wallet,${clientParameters[tier] ?? ""}
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
${clientIdentity[tier] ?? ""}    methods: [tempo(wallet)],
    polyfill: false,
  })
  const url = new URL(baseUrl + '/api/haiku')
${topic ? `  url.searchParams.set('topic', ${JSON.stringify(topic)})\n` : ""}  return mppx.fetch(url)
}
`;
}

/** Each tier's import line in server.ts. */
const serverImports: Partial<Record<SampleTier, string>> = {
  apiKey: "import { from } from 'mppx/identity'\n",
  email: "import * as EmailOtp from 'mppx/extensions/identity/email-otp'\n",
  erc8004: "import * as Erc8004 from 'mppx/extensions/identity/erc8004'\n",
  link: "import * as Link from 'mppx/extensions/identity/link'\n",
  poppy: "import * as Poppy from 'mppx/extensions/identity/poppy'\n",
  webBotAuth:
    "import * as WebBotAuth from 'mppx/extensions/identity/web-bot-auth'\n",
};

/** Each tier's verifier, built per request. */
const serverVerifier: Partial<Record<SampleTier, string>> = {
  apiKey: `    // Replace this demo key table with your own member lookup.
    const members: Record<string, { name: string }> = {
      'haiku-demo-key': { name: 'Satoshi' },
    }
    const verifier = from({
      verify(request) {
        const key = request.headers.get('X-Api-Key')
        return key && Object.hasOwn(members, key) ? members[key] : undefined
      },
    })
`,
  email: `    const origin = new URL(request.url).origin
    const issuer = origin + '/playground/identity/issuer'
    const verifier = EmailOtp.Server.verifier({
      audience: origin,
      issuer,
    })
`,
  erc8004: `    // Reads the agent's wallet from the registry and checks its signature, once per nonce.
    const verifier = Erc8004.Server.create({
      chainId: 42431, // Tempo Moderato testnet
      registry: '0x8004A818BFB912233c491871b3d84c89A494BD9e', // ERC-8004 Identity Registry
      rpcUrl: 'https://rpc.moderato.tempo.xyz',
      store,
    }).verifier
`,
  link: "    const verifier = Link.Server.attestation()\n",
  poppy: `    // Accept Sessions from the Personal Agents you trust, by client_id.
    const verifier = Poppy.Server.verifier({
      audience: new URL(request.url).origin,
      clients: ['https://mpp.dev/playground/identity/api/agent.json'],
    })
`,
  webBotAuth: `    // Trust keys from the bot directories you know, never one a caller names.
    const verifier = WebBotAuth.Server.verifier({
      keyResolver: ({ signatureAgent }) =>
        signatureAgent ===
        'https://http-message-signatures-example.research.cloudflare.com'
          ? options.botKey
          : undefined,
      nonceStore: store,
    })
`,
};

/** What a verified caller pays, in OUSD. */
const serverPrice: Record<SampleTier, string> = {
  anonymous: "0.03",
  apiKey: "0.01",
  email: "0.02",
  erc8004: "0.02",
  link: "0.01",
  poppy: "0.02",
  webBotAuth: "0.02",
};

/** Signatures with one-time nonces: the charge verifies them, so the handler only checks they're there. */
const signedHeaders: Partial<Record<SampleTier, string>> = {
  erc8004: "request.headers.has('Agent-Signature')",
  webBotAuth: "request.headers.has('Signature-Agent')",
};

/** Generates a complete payment handler; the caller supplies its haiku writer. */
export function serverUsage(tier: SampleTier) {
  const nonce = tier === "erc8004" || tier === "webBotAuth";
  return `import type * as Identity from 'mppx/identity'
${serverImports[tier] ?? ""}import { Mppx, ${nonce ? "Store, " : ""}tempo } from 'mppx/server'
import { type Address, createClient, http } from 'viem'
import { tempoModerato } from 'viem/chains'

export function createHandler(options: {
${tier === "webBotAuth" ? "  botKey: CryptoKey\n" : ""}  recipient: Address
  secretKey: string
  write: (identity: Identity.Results | undefined) => Promise<string[]>
}) {
  const client = createClient({ chain: tempoModerato, transport: http() })
${nonce ? "  // Use a shared store in production, such as a Durable Object or Redis.\n  const store = Store.memory()\n" : ""}  const mppx = Mppx.create({
    methods: [tempo({
      chainId: tempoModerato.id, // 42431: Tempo Moderato testnet
      currency: '0x20c0000000000000000000006a37DA5C996874BE', // OUSD on Tempo
      getClient: () => client,
      recipient: options.recipient,
    })],
${tier === "link" ? "    requiresAuth: true, // Keep Link tokens in Authorization.\n" : ""}    secretKey: options.secretKey,
  })

  return async (request: Request): Promise<Response> => {
${serverVerifier[tier] ?? ""}${
  tier === "anonymous"
    ? ""
    : signedHeaders[tier]
      ? `    const verified = ${signedHeaders[tier]}\n`
      : "    const verified = (await verifier.verify(request.clone())).status === 'valid'\n"
}    const result = await mppx.charge({
      amount: ${tier === "anonymous" ? "'0.03'" : `verified ? '${serverPrice[tier]}' : '0.03'`},
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
      "identity: [Poppy.Client.prover",
      "Sign a short-lived Session for each request with the key your Personal Agent delegated. The service learns a pseudonymous user ID, not who the user is.",
    ],
    [
      "identity: [Erc8004.Client.prover",
      "Sign each request with the wallet the ERC-8004 Identity Registry lists for your agent.",
    ],
    [
      "identity: [WebBotAuth.Client.prover",
      "Sign each request (RFC 9421) with a key your bot's HTTPS directory publishes.",
    ],
    [
      "const verifier = Poppy.Server.verifier",
      "Accept Sessions only from the Personal Agents you list, by client_id.",
    ],
    [
      "const verifier = Erc8004.Server.create",
      "Read the agent's wallet from the registry, check its signature and spend its nonce.",
    ],
    [
      "const verifier = WebBotAuth.Server.verifier",
      "Resolve keys only from bot directories you trust; the nonce store stops replays.",
    ],
    [
      "const verified = request.headers.has",
      "These signatures carry one-time nonces, so the charge verifies them once instead of checking twice.",
    ],
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
