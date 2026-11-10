import { File, MultiFileDiff } from "@pierre/diffs/react";
import { Receipt } from "mppx";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { createClient, type Hex as HexValue, http } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { Actions, Chain } from "viem/tempo";
import { useConnect, useConnection, useConnectors } from "wagmi";
import { tempoModerato } from "wagmi/chains";

import * as Client from "../client.js";
import { explanations, serverUsage, usage } from "./samples.js";
import { ousd } from "./wallet.js";

type Tier = "anonymous" | "email" | "apiKey" | "link";
/** The Worker's active tiers; Link is not implemented yet. */
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

export function App() {
  const f = useDemo();
  return (
    <>
      <Nav />
      <div className="page">
        <main className="main">
          <div className="intro">
            <span className="label">Playground</span>
            <h1 className="title">Identity</h1>
            <p className="lede">
              Buy a haiku using MPP. The more you prove, the less you pay and
              the more personal it gets.
            </p>
          </div>
          <div className="tabs">
            {tiers.map((t) => (
              <button
                key={t.id}
                className="tab"
                data-active={t.id === f.tier}
                data-tier={t.id}
                onClick={() => f.setTier(t.id)}
                type="button"
              >
                {t.label}
                {t.id === "link" && " (coming soon)"}
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
          <a className="link" href="https://mpp.dev/extensions/identity">
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

function Nav() {
  return (
    <header className="header">
      <a aria-label="MPP" className="logo" href="https://mpp.dev">
        <Logo />
      </a>
      <nav aria-label="Main navigation" className="nav">
        {[
          ["Docs", "https://mpp.dev/overview"],
          ["SDKs", "https://mpp.dev/sdk"],
          ["Services", "https://mpp.dev/services"],
          ["Blog", "https://mpp.dev/blog"],
        ].map(([label, href]) => (
          <a className="nav-item" href={href} key={href}>
            {label}
          </a>
        ))}
        <a
          className="nav-item"
          href="https://paymentauth.org/"
          rel="noreferrer"
          target="_blank"
        >
          IETF Specification ↗
        </a>
        <details
          className="nav-dropdown"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.currentTarget.open = false;
              event.currentTarget.querySelector("summary")?.focus();
            }
          }}
        >
          <summary className="nav-item">
            GitHub <span aria-hidden>⌄</span>
          </summary>
          <div className="nav-dropdown-items">
            {[
              ["mppx (TypeScript)", "https://github.com/wevm/mppx"],
              ["MPP-go (Go)", "https://github.com/tempoxyz/mpp-go"],
              ["MPP-rb (Ruby)", "https://github.com/stripe/mpp-rb"],
              ["MPP-rs (Rust)", "https://github.com/tempoxyz/mpp-rs"],
              ["PyMPP (Python)", "https://github.com/tempoxyz/pympp"],
            ].map(([label, href]) => (
              <a href={href} key={href} rel="noreferrer" target="_blank">
                {label}
              </a>
            ))}
          </div>
        </details>
      </nav>
    </header>
  );
}

/** The haiku output and input controls. */
function Panel({ f }: { f: Demo }) {
  return (
    <section className="panel">
      <PanelHead name="haiku" />
      <div className="panel-body">
        {f.tier === "link" ? (
          <div className="coming-soon">Coming soon</div>
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
      {f.low && f.tier !== "link" && (
        <button
          className="button"
          disabled={f.funding}
          onClick={f.fund}
          type="button"
        >
          {f.funding ? "Funding…" : "Get test OUSD"}
        </button>
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
  const [explain, setExplain] = useState(false);
  const annotations = explain ? explanations(now) : [];
  return (
    <section className="panel code">
      <PanelHead name={name}>
        <button
          aria-pressed={explain}
          className="button explain-toggle"
          onClick={() => setExplain(!explain)}
          type="button"
        >
          Explain code
        </button>
      </PanelHead>
      <div className="code-body">
        {old === now ? (
          <File
            file={{ contents: now, name }}
            lineAnnotations={annotations}
            options={codeOptions}
            renderAnnotation={renderExplanation}
          />
        ) : (
          <MultiFileDiff
            lineAnnotations={annotations.map((annotation) => ({
              ...annotation,
              side: "additions" as const,
            }))}
            renderAnnotation={renderExplanation}
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

function renderExplanation({ metadata }: { metadata: string }) {
  return <div className="code-explanation">{metadata}</div>;
}

/** Wallet, tier and request state shared by every layout. */
function useDemo() {
  const connection = useConnection();
  const connectors = useConnectors();
  const connect = useConnect();
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
  const source = {
    now: usage(tier, email, apiKey, topic.trim()),
  };

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
    useTestWallet,
  };
}

const codeOptions = {
  disableFileHeader: true,
  disableLineNumbers: true,
  overflow: "wrap",
  theme: { dark: "github-dark-dimmed", light: "github-light" },
  themeType: "dark",
} as const;

/** A terminal window's title bar, as on mpp.dev's demos. */
function PanelHead({ children, name }: { children?: ReactNode; name: string }) {
  return (
    <div className="panel-head">
      <span>{name}</span>
      {children}
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

/** Anonymous baselines for the tier diffs. */
const base = usage("anonymous");
const serverBase = serverUsage("anonymous");
