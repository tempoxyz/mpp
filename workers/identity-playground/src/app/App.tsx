import { File, MultiFileDiff } from "@pierre/diffs/react";
import { Receipt } from "mppx";
import { useEffect, useRef, useState } from "react";
import { createClient, type Hex as HexValue, http } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { Actions, Chain } from "viem/tempo";
import { useConnect, useConnection, useConnectors, useDisconnect } from "wagmi";
import { tempoModerato } from "wagmi/chains";

import * as Client from "../client.js";
import { ousd } from "./wallet.js";

type Tier = "anonymous" | "email" | "apiKey" | "link";
/** The Worker's tiers: Link is shown as code only until a Link OAuth client is configured. */
type Config = {
  issuer: string;
  limit: number;
  origin: string;
  prices: Record<Exclude<Tier, "link">, string>;
};
type Hop = { method: string; path: string; status: number };
type Result = {
  haiku: string[];
  model: string;
  price: string;
  receipt?: string;
  remaining?: number;
  seen: string[];
  tier: string;
  topic?: string;
};
type PendingCode = {
  email: string;
  message?: { code: string; subject: string } | undefined;
  resolve: (code: string | undefined) => void;
};

const rpc = createClient({
  chain: Chain.testnet,
  pollingInterval: 500,
  transport: http(),
});
const explorer = "https://explore.testnet.tempo.xyz";
/** Where mpp.dev serves the playground, with a trailing slash. */
const basePath = import.meta.env.BASE_URL;
const tiers: { id: Tier; label: string }[] = [
  { id: "anonymous", label: "Anonymous" },
  { id: "email", label: "Email" },
  { id: "apiKey", label: "API key" },
  { id: "link", label: "Link" },
];

/** A tier's name as the page shows it. */
function label(tier: string) {
  return tiers.find((t) => t.id === tier)?.label ?? tier;
}

export function App() {
  const f = useDemo();
  return (
    <>
      <Nav f={f} />
      <div className="page">
        <main className="main">
          <div className="intro">
            <span className="label">Playground</span>
            <h1 className="title">Identity</h1>
            <p className="lede">
              Buy a haiku. The more you prove, the less you pay and the more
              personal it gets.
            </p>
          </div>
          <div className="tabs">
            {tiers.map((t) => (
              <button
                key={t.id}
                className="tab"
                data-active={t.id === f.tier}
                onClick={() => f.setTier(t.id)}
                type="button"
              >
                {t.label}
                {t.id !== "link" && (
                  <span className="price">
                    {" "}
                    {f.config?.prices[t.id] ?? "…"}
                  </span>
                )}
              </button>
            ))}
          </div>
          <Panel f={f} />
          <Requests f={f} />
          <a className="link" href="https://mpp.dev/overview">
            Read the MPP docs →
          </a>
        </main>
        <aside>
          <Code f={f} />
        </aside>
      </div>
    </>
  );
}

type Demo = ReturnType<typeof useDemo>;

function Nav({ f }: { f: Demo }) {
  return (
    <header className="header">
      <a aria-label="MPP" className="logo" href="https://mpp.dev">
        <Logo />
      </a>
      <nav className="nav">
        {f.address && (
          <button className="nav-item" onClick={f.unlink} type="button">
            Unlink
          </button>
        )}
        <a className="nav-item" href="https://mpp.dev/overview">
          Docs
        </a>
        <a
          className="nav-item"
          href="https://github.com/tempoxyz/mpp/tree/main/workers/identity-playground"
          rel="noreferrer"
          target="_blank"
        >
          GitHub
        </a>
      </nav>
    </header>
  );
}

/** The haiku: output on top, the input row and wallet status underneath. */
function Panel({ f }: { f: Demo }) {
  return (
    <section className="panel">
      <PanelHead name="haiku" />
      <div className="panel-body">
        {f.tier === "link" ? (
          <div className="warning">
            Link isn't set up yet. To get Link attestations and claims, the page
            needs a Link OAuth client (login.link.com). For now the code shows
            how Link fits in.
          </div>
        ) : f.result ? (
          <Haiku f={f} />
        ) : f.pending ? (
          <div className="dim">
            Code sent to {f.pending.email}
            {f.pending.message && (
              <>
                {" "}
                (demo inbox:{" "}
                <span className="ink">{f.pending.message.code}</span>)
              </>
            )}
            .
          </div>
        ) : (
          <div className="placeholder">
            {f.address ? "Buy a haiku to start." : "Link a wallet to start."}
          </div>
        )}
        {f.error && <div className="error">{f.error}</div>}
      </div>
      {!f.address ? (
        <div className="panel-row">
          <span className="prompt">❯</span>
          <button
            className="action"
            disabled={f.connect.isPending}
            onClick={f.link}
            type="button"
          >
            {f.connect.isPending ? "Linking…" : "Link Tempo Wallet"}
          </button>
          <span className="dim">or</span>
          <button className="action" onClick={f.useTestWallet} type="button">
            use a test wallet
          </button>
        </div>
      ) : (
        <Composer f={f} />
      )}
      {!f.address && f.connect.error && (
        <div className="panel-row error">{f.connect.error.message}</div>
      )}
      <div className="panel-row panel-foot">
        <span className="dim">
          {f.address
            ? `${f.address.slice(0, 6)}…${f.address.slice(-4)}`
            : "no wallet"}
          {f.balance !== undefined && ` · ${f.balance} OUSD`}
          {` · ${label(f.tier)}`}
        </span>
        {f.low && (
          <button
            className="action"
            disabled={f.funding}
            onClick={f.fund}
            type="button"
          >
            {f.funding ? "funding…" : "get test OUSD"}
          </button>
        )}
      </div>
    </section>
  );
}

function Composer({ f }: { f: Demo }) {
  const { pending } = f;
  if (pending)
    return (
      <form
        className="panel-row"
        onSubmit={(e) => {
          e.preventDefault();
          pending.resolve(f.code || pending.message?.code);
        }}
      >
        <span className="prompt">❯</span>
        <input
          aria-label="One-time code"
          className="input"
          inputMode="numeric"
          placeholder={pending.message?.code ?? "8-digit code…"}
          value={f.code}
          onChange={(e) => f.setCode(e.target.value)}
        />
        <button className="button" type="submit">
          Verify
        </button>
      </form>
    );
  return (
    <form
      className="panel-row"
      onSubmit={(e) => {
        e.preventDefault();
        if (f.ready && !f.busy) f.buy();
      }}
    >
      <span className="prompt">❯</span>
      {f.tier === "email" && (
        <input
          aria-label="Email"
          className="input"
          placeholder="you@example.com…"
          type="email"
          value={f.email}
          onChange={(e) => f.setEmail(e.target.value)}
        />
      )}
      {f.tier === "apiKey" && (
        <input
          aria-label="API key"
          className="input"
          placeholder="API key…"
          value={f.apiKey}
          onChange={(e) => f.setApiKey(e.target.value)}
        />
      )}
      {f.tier === "anonymous" && (
        <span className="input dim">
          no proof, full price, {f.config?.limit ?? 3} a day
        </span>
      )}
      {f.tier === "link" && (
        <span className="input dim">needs a Link OAuth client</span>
      )}
      <button className="button" disabled={!f.ready || f.busy} type="submit">
        {f.busy
          ? "Paying…"
          : f.tier === "link"
            ? "Not set up"
            : `Buy haiku · ${f.price ?? "…"} OUSD`}
      </button>
      <div className="topic">
        <span className="dim">topic</span>
        <input
          aria-label="Topic"
          className="input"
          maxLength={40}
          placeholder={
            f.tier === "anonymous"
              ? "verified buyers only…"
              : "anything, such as the sea…"
          }
          value={f.topic}
          onChange={(e) => f.setTopic(e.target.value)}
        />
      </div>
    </form>
  );
}

function Haiku({ f }: { f: Demo }) {
  const { result } = f;
  if (!result) return null;
  return (
    <div className="result">
      <div className="haiku">
        {result.haiku.map((line, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: the lines never reorder
          <div key={i}>{line}</div>
        ))}
      </div>
      <div className="dim">
        {result.remaining !== undefined && `${result.remaining} left today · `}
        {result.receipt && (
          <a
            className="link"
            href={`${explorer}/tx/${result.receipt}`}
            rel="noreferrer"
            target="_blank"
          >
            receipt
          </a>
        )}
      </div>
    </div>
  );
}

function Requests({ f }: { f: Demo }) {
  if (f.hops.length === 0) return null;
  return (
    <div className="hops">
      <div className="label">Requests</div>
      {f.hops.map((hop, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: the requests never reorder
        <div key={i} className="hop">
          <span className="dim">{hop.method}</span>
          <span className="hop-path">
            {hop.path.replace(`${basePath}api/`, "/")}
          </span>
          <span
            data-status={
              hop.status < 300 ? "ok" : hop.status === 402 ? "pay" : "other"
            }
          >
            {hop.status}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Client code on top, server code below, each shown as additions to its anonymous base. */
function Code({ f }: { f: Demo }) {
  return (
    <div className="code-stack">
      <CodePanel name="client.ts" now={f.source.now} old={base} />
      <CodePanel name="server.ts" now={serverUsage(f.tier)} old={serverBase} />
    </div>
  );
}

function CodePanel({
  name,
  now,
  old,
}: {
  name: string;
  now: string;
  old: string;
}) {
  return (
    <section className="panel code">
      <PanelHead name={name} />
      <div className="code-body">
        {old === now ? (
          <File file={{ contents: now, name }} options={codeOptions} />
        ) : (
          <MultiFileDiff
            newFile={{ contents: now, name }}
            oldFile={{ contents: old, name }}
            options={{
              ...codeOptions,
              diffStyle: "unified",
              expandUnchanged: true,
            }}
          />
        )}
      </div>
    </section>
  );
}

/** Wallet, tier and request state shared by every layout. */
function useDemo() {
  const connection = useConnection();
  const connectors = useConnectors();
  const connect = useConnect();
  const disconnect = useDisconnect();
  const [testKey, setTestKey] = useState(
    () => localStorage.getItem("fortune.key") as HexValue | null,
  );
  const address =
    connection.address ??
    (testKey ? privateKeyToAccount(testKey).address : undefined);

  const [config, setConfig] = useState<Config>();
  const [balance, setBalance] = useState<string>();
  const [funding, setFunding] = useState(false);
  const [tier, setTier] = useState<Tier>("anonymous");
  const [email, setEmail] = useState("");
  const [apiKey, setApiKey] = useState("haiku-demo-key");
  const [topic, setTopic] = useState("");
  const [hops, setHops] = useState<Hop[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<Result>();
  const [pending, setPending] = useState<PendingCode>();
  const [code, setCode] = useState("");
  const hopsRef = useRef<Hop[]>([]);

  useEffect(() => {
    fetch(`${basePath}api/config`)
      .then((r) => r.json())
      .then(setConfig);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refetch only when the wallet changes
  useEffect(() => {
    setBalance(undefined);
    if (address) refreshBalance(address);
  }, [address]);

  // The client code for the current inputs; the panel shows it as additions to the anonymous base.
  const source = { now: usage(tier, email, apiKey, topic.trim()) };

  async function refreshBalance(account = address) {
    if (!account) return;
    const value = await Actions.token.getBalance(rpc, { account, token: ousd });
    setBalance((Number(value.amount) / 1e6).toFixed(2));
  }

  async function fund() {
    if (!address) return;
    setFunding(true);
    try {
      await Actions.faucet.fundSync(rpc, { account: address, timeout: 30_000 });
      await refreshBalance();
    } catch (e) {
      setError(`Faucet failed: ${String(e)}`);
    } finally {
      setFunding(false);
    }
  }

  function link() {
    setError(undefined);
    const connector = connectors[0];
    if (connector) connect.mutate({ chainId: tempoModerato.id, connector });
  }

  function useTestWallet() {
    const key = generatePrivateKey();
    localStorage.setItem("fortune.key", key);
    setTestKey(key);
  }

  function unlink() {
    if (connection.status === "connected") disconnect.mutate();
    localStorage.removeItem("fortune.key");
    setTestKey(null);
  }

  async function wallet(): Promise<Client.Options["wallet"]> {
    if (connection.status === "connected" && connection.connector) {
      const provider = (await connection.connector.getProvider()) as {
        getMppxParameters(): Client.Options["wallet"];
      };
      return provider.getMppxParameters();
    }
    return { account: privateKeyToAccount(testKey!) };
  }

  // Records each HTTP hop for the request list.
  const tracedFetch: typeof globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    const response = await fetch(request);
    const url = new URL(request.url);
    hopsRef.current = [
      ...hopsRef.current,
      {
        method: request.method,
        path: url.pathname + url.search,
        status: response.status,
      },
    ];
    setHops(hopsRef.current);
    return response;
  };

  const buyRef = useRef<
    { buy: (topic?: string) => Promise<Response>; key: string } | undefined
  >(undefined);

  async function buy() {
    if (!config || !address) return;
    setBusy(true);
    setError(undefined);
    setResult(undefined);
    hopsRef.current = [];
    setHops([]);
    try {
      // Reuse the client while its inputs hold: the email prover keeps its attestation,
      // so repeat purchases don't send a new code each time.
      const key = [tier, email, apiKey, address].join("|");
      if (buyRef.current?.key !== key)
        buyRef.current = {
          buy: Client.create({
            apiKey: tier === "apiKey" ? apiKey : undefined,
            email:
              tier === "email" && email
                ? { address: email, code: askForCode }
                : undefined,
            fetch: tracedFetch,
            endpoint: `${location.origin + basePath}api/haiku`,
            issuer: `${location.origin + basePath}issuer`,
            maxAmount: price
              ? BigInt(Math.round(Number(price) * 1e6))
              : undefined,
            origin: location.origin,
            wallet: await wallet(),
          }),
          key,
        };
      const response = await buyRef.current.buy(topic.trim() || undefined);
      // Rejections may be problem+json or plain text: show their reason either way.
      const text = await response.text();
      const body = (() => {
        try {
          return JSON.parse(text) as Result & {
            detail?: string;
            error?: string;
          };
        } catch {
          return undefined;
        }
      })();
      if (!response.ok || !body)
        throw new Error(
          body?.error ??
            body?.detail ??
            (response.headers.get("content-type")?.startsWith("text/plain") &&
            text
              ? text.slice(0, 300)
              : `${response.status} ${response.statusText}`),
        );
      setResult({ ...body, receipt: Receipt.fromResponse(response).reference });
      await refreshBalance();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      setPending(undefined);
    }
  }

  async function askForCode({ email, id }: { email: string; id: string }) {
    const message = await fetch(`${basePath}api/inbox/${id}`)
      .then((r) => (r.ok ? r.json() : undefined))
      .catch(() => undefined);
    return new Promise<string | undefined>((resolve) => {
      setCode("");
      setPending({ email, message, resolve });
    });
  }

  const price = tier === "link" ? undefined : config?.prices[tier];
  const low = balance !== undefined && Number(balance) < 0.05;
  const ready =
    tier !== "link" &&
    Boolean(config) &&
    Boolean(address) &&
    // OUSD pays the price; network fees are paid separately in pathUSD.
    (balance === undefined ||
      price === undefined ||
      Number(balance) >= Number(price)) &&
    (tier !== "email" || /@/.test(email)) &&
    (tier !== "apiKey" || Boolean(apiKey));

  return {
    address,
    apiKey,
    balance,
    busy,
    code,
    config,
    connect,
    buy,
    email,
    error,
    fund,
    funding,
    hops,
    link,
    low,
    pending,
    price,
    ready,
    result,
    setApiKey,
    setCode,
    setEmail,
    setTier,
    setTopic,
    source,
    tier,
    topic,
    unlink,
    useTestWallet,
  };
}

const codeOptions = {
  disableFileHeader: true,
  overflow: "wrap",
  theme: { dark: "pierre-dark", light: "pierre-light" },
  themeType: "system",
} as const;

/** A terminal window's title bar, as on mpp.dev's demos. */
function PanelHead({ name }: { name: string }) {
  return (
    <div className="panel-head">
      <span aria-hidden className="dots">
        <i />
        <i />
        <i />
      </span>
      <span>{name}</span>
    </div>
  );
}

/** mpp.dev's logo, in the current text color. */
function Logo() {
  return (
    <svg fill="currentColor" viewBox="0 0 81.2195 18">
      <title>MPP</title>
      <path d="M33.1162 17.9828H29.2324V2.84079e-05H51.2711C52.7167 2.84079e-05 53.8884 1.17531 53.8884 2.62538V8.65536C53.8884 10.1054 52.7167 11.2807 51.2711 11.2807H33.7302C33.3911 11.2807 33.1162 11.5556 33.1162 11.8948V17.9828ZM33.9887 7.62911H49.1322C49.6143 7.62911 50.0047 7.2375 50.0047 6.754V4.52674C50.0047 4.04324 49.6143 3.65162 49.1322 3.65162H33.9887C33.5066 3.65162 33.1162 4.04324 33.1162 4.52674V6.754C33.1162 7.2375 33.5066 7.62911 33.9887 7.62911Z" />
      <path d="M26.5978 17.9828H22.7141V5.6935C22.7141 5.30451 22.246 5.10892 21.9707 5.38284L16.511 10.8126C16.2658 11.0564 15.9347 11.1933 15.5897 11.1933H11.0099C10.6661 11.1933 10.3364 11.0577 10.0916 10.8157L4.62666 5.41609C4.35096 5.14349 3.88419 5.33952 3.88419 5.72763V17.9828H0V0H4.67988L11.8982 7.13351C12.0613 7.29496 12.2812 7.3851 12.5106 7.3851H14.0824C14.3123 7.3851 14.5334 7.29409 14.6966 7.13132L21.8669 0H26.5983V17.9828H26.5978Z" />
      <path d="M60.4063 17.9828H56.5226V2.84079e-05H78.5612C80.0068 2.84079e-05 81.1786 1.17531 81.1786 2.62538V8.65536C81.1786 10.1054 80.0068 11.2807 78.5612 11.2807H61.0204C60.6812 11.2807 60.4063 11.5556 60.4063 11.8948V17.9828ZM61.2788 7.62911H76.4223C76.9044 7.62911 77.2948 7.2375 77.2948 6.754V4.52674C77.2948 4.04324 76.9044 3.65162 76.4223 3.65162H61.2788C60.7968 3.65162 60.4063 4.04324 60.4063 4.52674V6.754C60.4063 7.2375 60.7968 7.62911 61.2788 7.62911Z" />
    </svg>
  );
}

/** The anonymous client: every tier's code is this plus added lines. */
const base = usage("anonymous", "");

/** The client code for a tier: the lines you'd write. */
function usage(tier: Tier, address: string, apiKey = "", topic = "") {
  return [
    "import { Mppx, tempo } from 'mppx/client'",
    ...(tier === "email"
      ? ["import { EmailOtp } from 'mppx/extensions/identity'"]
      : []),
    ...(tier === "link"
      ? [
          "import { Link } from '@stripe/link-sdk'",
          "import * as LinkProver from './link.js'",
        ]
      : []),
    "",
    ...(tier === "link"
      ? [
          "// Needs a Link OAuth client (login.link.com): not set up yet.",
          "// getAccessToken returns the signed-in Link customer's token.",
          "const link = new Link({ getAccessToken })",
          "",
        ]
      : []),
    ...(tier === "email"
      ? [
          "// Verify the email once, up front: every request then carries the proof.",
          "const { id } = await EmailOtp.Client.sendCode({",
          "  audience: location.origin,",
          `  email: '${address || "you@example.com"}',`,
          "  issuer,",
          "})",
          "const { attestation } = await EmailOtp.Client.verifyCode({",
          "  code: await askForCode(),",
          "  id,",
          "  issuer,",
          "})",
          "",
        ]
      : []),
    "// The linked Tempo Wallet: its access key pays each request without a prompt.",
    "const provider = await connector.getProvider()",
    "",
    "const mppx = Mppx.create({",
    ...(tier === "email"
      ? [
          "  identity: [",
          "    EmailOtp.Client.prover({",
          "      attestations: [attestation], // verified up front",
          "      code: askForCode,",
          `      email: '${address || "you@example.com"}',`,
          "      issuers: [issuer],",
          "    }),",
          "  ],",
        ]
      : []),
    ...(tier === "apiKey"
      ? [
          "  identity: [",
          "    // Sends your API key in the X-Api-Key header.",
          `    apiKeyProver('${apiKey}'),`,
          "  ],",
        ]
      : []),
    ...(tier === "link"
      ? [
          "  identity: [",
          "    // Attestation: a Link token showing Link vouches for this agent.",
          "    LinkProver.attestation({ link }),",
          "    // Claims: a verified email, signed by Link and this holder key.",
          "    LinkProver.claims({",
          "      link,",
          "      claims: ['email', 'email_verified'],",
          "    }),",
          "  ],",
        ]
      : []),
    "  methods: [",
    "    tempo(provider.getMppxParameters()),",
    "  ],",
    "})",
    "",
    `const url = new URL('${basePath}api/haiku', location.origin)`,
    ...(topic
      ? [
          "// Verified buyers only: anonymous gets a 403.",
          `url.searchParams.set('topic', ${JSON.stringify(topic).replaceAll('"', "'")})`,
        ]
      : []),
    "const res = await mppx.fetch(url)",
    "",
  ].join("\n");
}

/** The anonymous server: every tier's code is this plus added lines. */
const serverBase = serverUsage("anonymous");

/** The server code for a tier: the lines the Worker needs (src/server.ts and src/tiers.ts). */
function serverUsage(tier: Tier) {
  return [
    "import { Mppx, tempo } from 'mppx/server'",
    ...(tier === "email"
      ? ["import * as EmailOtp from 'mppx/extensions/identity/email-otp'"]
      : []),
    ...(tier === "apiKey" ? ["import * as Identity from 'mppx/identity'"] : []),
    ...(tier === "link"
      ? [
          "import { LinkVerifier } from '@stripe/agent-identity'",
          "import * as LinkIdentity from './link.js'",
        ]
      : []),
    "",
    "// The payee: receives OUSD for every haiku.",
    "const account = privateKeyToAccount(env.MPP_PRIVATE_KEY)",
    "",
    "const mppx = Mppx.create({",
    "  methods: [",
    "    tempo({",
    "      account,",
    "      chainId: 42431, // Tempo Moderato testnet",
    "      currency: OUSD,",
    "      recipient: account.address,",
    "    }),",
    "  ],",
    "  secretKey,",
    "})",
    "",
    ...(tier === "link"
      ? [
          "// Checks Link credentials with Link's public keys: no Stripe secret needed.",
          "const link = new LinkVerifier({ origin })",
          "",
        ]
      : []),
    "// What each tier costs, and what the caller must prove for it.",
    "const tiers = {",
    "  anonymous: {",
    "    amount: '0.03',",
    "  },",
    ...(tier === "email"
      ? [
          "  email: {",
          "    amount: '0.02',",
          "    identity: [",
          "      EmailOtp.Server.verifier({",
          "        audience: origin,",
          "        issuer,",
          "      }),",
          "    ],",
          "  },",
        ]
      : []),
    ...(tier === "apiKey"
      ? [
          "  apiKey: {",
          "    amount: '0.01',",
          "    identity: [",
          "      // Looks the X-Api-Key header up in our API key table.",
          "      Identity.from({",
          "        verify: (request) => {",
          "          const key = request.headers.get('X-Api-Key')",
          "          // Own keys only, so '__proto__' is not a key.",
          "          return key && Object.hasOwn(apiKeys, key) ? apiKeys[key] : undefined",
          "        },",
          "      }),",
          "    ],",
          "  },",
        ]
      : []),
    ...(tier === "link"
      ? [
          "  link: {",
          "    amount: '0.01',",
          "    identity: [",
          "      // Checks the Link attestation token.",
          "      LinkIdentity.attestation({ verifier: link }),",
          "      // Checks the presentation: email and email_verified, signed by Link.",
          "      LinkIdentity.claims({",
          "        claims: ['email', 'email_verified'],",
          "        purpose: 'Write a haiku about you',",
          "        verifier: link,",
          "      }),",
          "    ],",
          "  },",
        ]
      : []),
    "}",
    "",
    "export default {",
    "  async fetch(request) {",
    "    // The best tier the request's proofs verify: the client never asks for one.",
    "    const tier = await bestTier(request)",
    "    // Custom topics are for verified buyers: refused before any charge.",
    "    const topic = new URL(request.url).searchParams.get('topic')",
    "    if (topic && tier === 'anonymous')",
    "      return Response.json({ error: 'Verified buyers only.' }, { status: 403 })",
    "    // Anonymous buyers get 3 a day per IP; any verified proof lifts the limit.",
    "    if (tier === 'anonymous' && (await usedToday(request)) >= 3)",
    "      return Response.json({ error: 'Daily limit reached.' }, { status: 429 })",
    "    const result = await mppx.charge(tiers[tier])(request)",
    "    if (result.status === 402) return result.challenge",
    "    const haiku = await write(result.identity, topic)",
    "    return result.withReceipt(Response.json({ haiku }))",
    "  },",
    "}",
    "",
  ].join("\n");
}
