import {
  Component,
  type KeyboardEvent,
  lazy,
  type ReactNode,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Address, Hex as HexValue } from "viem";

import type * as Client from "../client.js";
import { prices } from "../prices.js";
import { CodeLines } from "./CodeLines.js";
import { serverUsage, usage } from "./samples.js";
import * as TempoIdSignIn from "./tempo-id.js";
import { ousd, unloaded, type Wallet } from "./wallet-state.js";

// The payment client (mppx) is most of the page's JavaScript: load it after first paint, so the
// page shows while it downloads.
const loadClient = () => import("../client.js");
const loadChain = () => import("./chain.js");
const loadReceipt = () => import("mppx").then((m) => m.Receipt);
const WalletBridge = lazy(() => import("./WalletBridge.js"));

/** Shows the fallback if a lazy chunk fails to load (a network error, a blocker, a stale tab after a deploy), instead of unmounting the page. */
class LoadBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

type Tier =
  | "anonymous"
  | "email"
  | "apiKey"
  | "tempoId"
  | "poppy"
  | "erc8004"
  | "webBotAuth"
  | "link";
/** The Worker's active tiers; Link is not implemented yet. */
type Config = {
  issuer: string;
  limit: number;
  origin: string;
  prices: Partial<Record<Exclude<Tier, "link">, string>>;
  /** Tempo ID sign-in settings; absent from a Worker that predates the tier. */
  tempoId?: TempoIdSignIn.Config;
  /** The agent tiers' settings; absent from a Worker that predates them. */
  agents?: {
    botDirectory: string;
    chainId: number;
    /** The shared MPP Demo Agent's ERC-8004 ID. */
    demoAgentId?: string;
    poppyClientId: string;
    registry: `0x${string}`;
  };
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
  profile?: {
    agent?: string;
    accounts?: number;
    compliance?: string;
    kind?: string;
  };
};
type PendingCode = {
  email: string;
  message?: { code: string; subject: string } | undefined;
  resolve: (code: string | undefined) => void;
};

const explorer = "https://explore.testnet.tempo.xyz";
/** The MPP Demo Agent's registration in the ERC-8004 Identity Registry on Moderato. */
const demoAgentRegistration =
  "0x143a8de4da30097bc48a3e94bf84f57e9a507204d0bc533df2b197437a01155b";
/** Where mpp.dev serves the playground, with a trailing slash. */
const basePath = `${import.meta.env.BASE_URL}identity/`;
/** The samples, grouped as the dropdown lists them. */
const groups: {
  label: string;
  tiers: { id: Tier; label: string }[];
}[] = [
  {
    label: "People",
    tiers: [
      {
        id: "anonymous",
        label: "Anonymous",
      },
      {
        id: "email",
        label: "Email",
      },
      {
        id: "tempoId",
        label: "Tempo ID",
      },
      {
        id: "apiKey",
        label: "API key",
      },
    ],
  },
  {
    label: "Agents",
    tiers: [
      {
        id: "poppy",
        label: "Personal Agent",
      },
      {
        id: "erc8004",
        label: "MPP Demo Agent (ERC-8004)",
      },
      {
        id: "webBotAuth",
        label: "Web Bot Auth",
      },
    ],
  },
  {
    label: "Coming soon",
    tiers: [
      {
        id: "link",
        label: "Link",
      },
    ],
  },
];
const agentTiers: readonly Tier[] = ["poppy", "erc8004", "webBotAuth"];

export function App() {
  const f = useDemo();
  return (
    <>
      <LoadBoundary fallback={null}>
        <Suspense fallback={null}>
          <WalletBridge onChange={f.setWallet} />
        </Suspense>
      </LoadBoundary>
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
          <SamplePicker f={f} />
          <Panel f={f} />
          <Requests f={f} />
          <a className="link" href="https://mpp.dev/extensions/identity">
            Read the docs →
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

/** The sample dropdown: who is buying, grouped into people, agents and what's coming. */
function SamplePicker({ f }: { f: Demo }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  // A Worker that predates the agent tiers can't serve them yet.
  const offline = f.config !== undefined && !f.config.agents;
  const current = groups.flatMap((g) => g.tiers).find((t) => t.id === f.tier);
  const price = (id: Tier) =>
    id === "link" ? "soon" : `${f.config?.prices[id] ?? prices[id]} OUSD`;

  // Close on a click outside the picker; focus the selected option on open.
  useEffect(() => {
    if (!open) return;
    root.current
      ?.querySelector<HTMLButtonElement>('[aria-current="true"]')
      ?.focus();
    function close(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  function choose(id: Tier) {
    f.selectTier(id);
    setOpen(false);
    trigger.current?.focus();
  }

  /** Arrow keys move between options; Escape closes. */
  function onOptionKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      trigger.current?.focus();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const buttons = [
      ...(root.current?.querySelectorAll<HTMLButtonElement>(
        ".sample-option:not(:disabled)",
      ) ?? []),
    ];
    const i = buttons.indexOf(event.currentTarget);
    const step = event.key === "ArrowDown" ? 1 : -1;
    buttons[(i + step + buttons.length) % buttons.length]?.focus();
  }

  return (
    <div className="sample">
      <span className="sample-label" id="sample-label">
        Buy as
      </span>
      <div className="sample-picker" ref={root}>
        <button
          aria-expanded={open}
          aria-labelledby="sample-label"
          className="sample-trigger"
          data-open={open}
          disabled={f.busy}
          onClick={() => setOpen((value) => !value)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && !open) {
              event.preventDefault();
              setOpen(true);
            }
            if (event.key === "Escape") setOpen(false);
          }}
          ref={trigger}
          type="button"
        >
          <span>{current?.label}</span>
          <span className="sample-price">{price(f.tier)}</span>
          <span aria-hidden className="sample-caret">
            {open ? "▴" : "▾"}
          </span>
        </button>
        {open && (
          <div className="sample-list">
            {groups.map((group) => (
              <div className="sample-group" key={group.label}>
                <div className="sample-group-label">{group.label}</div>
                {group.tiers.map((t) => (
                  <button
                    aria-current={t.id === f.tier}
                    className="sample-option"
                    data-tier={t.id}
                    disabled={
                      (offline && agentTiers.includes(t.id)) ||
                      (t.id === "tempoId" &&
                        f.config !== undefined &&
                        !f.config.tempoId)
                    }
                    id={`sample-${t.id}`}
                    key={t.id}
                    onClick={() => choose(t.id)}
                    onKeyDown={onOptionKey}
                    type="button"
                  >
                    <span aria-hidden className="sample-check">
                      {t.id === f.tier ? "❯" : ""}
                    </span>
                    <span>{t.label}</span>
                    <span className="sample-price">{price(t.id)}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
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
            // Until the wallet stack loads, link can't open the wallet: replaying the click
            // later would lose its user gesture, so the button waits instead.
            disabled={!f.wallet.ready || f.wallet.linking}
            onClick={f.link}
            type="button"
          >
            {f.wallet.linking ? "Linking…" : "Link Tempo Wallet"}
          </button>
          <span className="dim">or</span>
          <button className="action" onClick={f.useTestWallet} type="button">
            use a test wallet
          </button>
        </div>
      ) : (
        <Composer f={f} />
      )}
      {f.address && !f.wallet.connected && (
        // With no unlink action, linking is how a test-wallet visitor switches to a real
        // wallet: a linked wallet's address takes precedence over the test one.
        <div className="panel-row">
          <span className="dim">Using a test wallet ·</span>
          <button
            className="action"
            disabled={!f.wallet.ready || f.wallet.linking}
            onClick={f.link}
            type="button"
          >
            {f.wallet.linking ? "Linking…" : "Link Tempo Wallet"}
          </button>
        </div>
      )}
      {f.address && f.wallet.connected && (
        // A linked wallet stays visible, so visitors can see which account pays and switch.
        <div className="panel-row">
          <span className="dim">Linked</span>
          <a
            className="link"
            href={`${explorer}/address/${f.address}`}
            rel="noreferrer"
            target="_blank"
          >
            {shortAddress(f.address)}
          </a>
          {f.balance !== undefined && (
            <span className="dim">· {f.balance} OUSD ·</span>
          )}
          <button
            className="action"
            disabled={f.busy}
            onClick={f.wallet.unlink}
            type="button"
          >
            Unlink
          </button>
        </div>
      )}
      {!f.wallet.connected && f.wallet.error && (
        <div className="panel-row error">{f.wallet.error.message}</div>
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
      {f.tier === "poppy" && (
        <span className="input dim">agent signs for {f.poppyUser}</span>
      )}
      {f.tier === "erc8004" && (
        <span className="input dim">
          signs as the MPP Demo Agent, #
          {f.config?.agents?.demoAgentId ?? "1086"} on Moderato
        </span>
      )}
      {f.tier === "tempoId" &&
        (f.tempoId ? (
          <span className="input dim">
            signed in{f.tempoId.email ? ` as ${f.tempoId.email}` : ""} ·{" "}
            <button
              className="action"
              disabled={f.busy}
              onClick={f.signOutTempoId}
              type="button"
            >
              sign out
            </button>
          </span>
        ) : (
          <button
            className="action"
            // Stays enabled while waiting: a closed popup never answers, so a click starts over.
            disabled={!f.config?.tempoId}
            onClick={f.signInTempoId}
            type="button"
          >
            {f.signingIn
              ? "Signing in… (click to restart)"
              : "Sign in with Tempo ID"}
          </button>
        ))}
      {f.tier === "webBotAuth" && (
        <span className="input dim">signs as Cloudflare's demo bot</span>
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
            : `Buy haiku · ${f.price ?? prices[f.tier]} OUSD`}
      </button>
      <div className="topic">
        <span className="dim">topic</span>
        <input
          aria-label="Topic"
          className="input"
          disabled={!f.topicAllowed}
          maxLength={40}
          placeholder={
            f.topicAllowed
              ? "anything, such as the sea…"
              : "verified buyers only…"
          }
          value={f.topicAllowed ? f.topic : ""}
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
      {result.profile?.agent && (
        <div className="dim">
          Signed as {result.profile.agent}
          {f.tier === "erc8004" && (
            <>
              {" · "}
              <a
                className="link"
                href={`${explorer}/tx/${demoAgentRegistration}`}
                rel="noreferrer"
                target="_blank"
              >
                registration
              </a>
            </>
          )}
        </div>
      )}
      {result.profile?.kind === "tempoId" && (
        <div className="dim">
          Verified Tempo ID user · {result.profile.accounts ?? 0}{" "}
          {result.profile.accounts === 1 ? "account" : "accounts"} · compliance{" "}
          {result.profile.compliance ?? "not shared with this app"}
        </div>
      )}
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
            {hop.path.replace(`${basePath}api/`, "/").replace(basePath, "/")}
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
  const values = { apiKey: f.apiKey, email: f.email, topic: f.sentTopic };
  return (
    <div className="code-stack">
      <CodePanel
        name="client.ts"
        now={f.source.now}
        tier={f.tier}
        values={values}
      />
      <CodePanel
        name="server.ts"
        now={serverUsage(f.tier)}
        tier={f.tier}
        values={values}
      />
    </div>
  );
}

function CodePanel({
  name,
  now,
  tier,
  values,
}: {
  name: string;
  now: string;
  tier: Tier;
  values: { apiKey: string; email: string; topic: string };
}) {
  const [explain, setExplain] = useState(false);
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
        <CodeLines
          explain={explain}
          name={name}
          now={now}
          tier={tier}
          values={values}
        />
      </div>
    </section>
  );
}

/** Wallet, tier and request state shared by every layout. */
function useDemo() {
  const [wallet, setWallet] = useState<Wallet>(unloaded);
  const [testKey, setTestKey] = useState(
    () => localStorage.getItem("fortune.key") as HexValue | null,
  );
  // The test wallet's address is stored beside its key, so it shows before viem loads.
  const [testAddress, setTestAddress] = useState(
    () =>
      (localStorage.getItem("fortune.address") as Address | null) ?? undefined,
  );
  // Once viem loads, derive the address from the key, correcting a stored address that
  // doesn't match it (another version of the page may have replaced the key).
  useEffect(() => {
    if (!testKey) return;
    loadChain()
      .then(({ privateKeyToAccount }) => {
        const { address } = privateKeyToAccount(testKey);
        localStorage.setItem("fortune.address", address);
        setTestAddress(address);
      })
      .catch((e) => setError(`Couldn't load the test wallet: ${String(e)}`));
  }, [testKey]);
  const address = wallet.connected
    ? wallet.address
    : testKey
      ? testAddress
      : undefined;
  // The address balance replies must still match: a reply for an earlier wallet is dropped.
  const addressRef = useRef(address);
  addressRef.current = address;

  // Fetch what the next click needs while the visitor reads: viem for the test wallet and
  // balances, and once there is a wallet, the payment client Buy runs.
  useEffect(() => {
    const warm = () => {
      loadChain().catch(() => undefined);
      if (address) loadClient().catch(() => undefined);
    };
    if (!("requestIdleCallback" in window)) {
      const id = setTimeout(warm, 1000);
      return () => clearTimeout(id);
    }
    const id = requestIdleCallback(warm, { timeout: 3000 });
    return () => cancelIdleCallback(id);
  }, [address]);

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
  // The Tempo ID sign-in, kept for the tab's session.
  const [tempoId, setTempoId] = useState(() => TempoIdSignIn.load());
  const [signingIn, setSigningIn] = useState(false);
  // The latest sign-in attempt: an earlier one a click replaced must not touch the state.
  const signInAttempt = useRef(0);
  // The pseudonymous user the demo Personal Agent acts for.
  const [poppyUser] = useState(() => {
    const stored = localStorage.getItem("playground.poppy.user");
    if (stored) return stored;
    const id = `user-${crypto.randomUUID().slice(0, 8)}`;
    localStorage.setItem("playground.poppy.user", id);
    return id;
  });
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

  // Custom topics are for verified tiers: the server refuses one from an anonymous buyer (403).
  const topicAllowed =
    tier === "email" ||
    tier === "apiKey" ||
    tier === "tempoId" ||
    agentTiers.includes(tier);
  const sentTopic = topicAllowed ? topic.trim() : "";

  // The client code for the current inputs; the panel shows it as additions to the anonymous base.
  const source = {
    now: usage(tier, email, apiKey, sentTopic),
  };

  async function refreshBalance(account = address) {
    if (!account) return;
    const { Actions, rpc } = await loadChain();
    const value = await Actions.token.getBalance(rpc, { account, token: ousd });
    if (account !== addressRef.current) return;
    setBalance((Number(value.amount) / 1e6).toFixed(2));
  }

  async function fund() {
    if (!address) return;
    setFunding(true);
    try {
      const { Actions, rpc } = await loadChain();
      await Actions.faucet.fundSync(rpc, { account: address, timeout: 30_000 });
      await refreshBalance();
    } catch (e) {
      setError(`Faucet failed: ${String(e)}`);
    } finally {
      setFunding(false);
    }
  }

  /** Signs in with Tempo ID in a popup: call from a click. */
  async function signInTempoId() {
    if (!config?.tempoId) return;
    const attempt = ++signInAttempt.current;
    setSigningIn(true);
    setError(undefined);
    try {
      setTempoId(await TempoIdSignIn.signIn(config.tempoId));
      buyRef.current = undefined;
    } catch (e) {
      if (e instanceof TempoIdSignIn.Superseded) return;
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (attempt === signInAttempt.current) setSigningIn(false);
    }
  }

  function signOutTempoId() {
    TempoIdSignIn.signOut();
    setTempoId(undefined);
    buyRef.current = undefined;
  }

  function link() {
    setError(undefined);
    wallet.link();
  }

  function useTestWallet() {
    loadChain()
      .then(({ generatePrivateKey, privateKeyToAccount }) => {
        const key = generatePrivateKey();
        const { address } = privateKeyToAccount(key);
        localStorage.setItem("fortune.key", key);
        localStorage.setItem("fortune.address", address);
        setTestKey(key);
        setTestAddress(address);
      })
      .catch((e) => setError(`Couldn't create a test wallet: ${String(e)}`));
  }

  async function payer(): Promise<Client.Options["wallet"]> {
    const linked = (await wallet.mppx()) as
      | Client.Options["wallet"]
      | undefined;
    if (linked) return linked;
    if (wallet.connected || !testKey)
      throw new Error("Wallet disconnected. Link Tempo Wallet and try again.");
    const { privateKeyToAccount } = await loadChain();
    return { account: privateKeyToAccount(testKey) };
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

  function selectTier(next: Tier) {
    if (next === tier || busy) return;
    setTier(next);
    setResult(undefined);
    setError(undefined);
    setTopic("");
    setCode("");
    hopsRef.current = [];
    setHops([]);
    buyRef.current = undefined;
  }

  async function buy() {
    if (!config || !address) return;
    // An open page outlives the access token: sign in again rather than send an expired one.
    if (tier === "tempoId" && tempoId && !TempoIdSignIn.load()) {
      signOutTempoId();
      setError("Your Tempo ID sign-in expired. Sign in again.");
      return;
    }
    setBusy(true);
    setError(undefined);
    setResult(undefined);
    hopsRef.current = [];
    setHops([]);
    try {
      // Reuse the client while its inputs hold: the email prover keeps its attestation,
      // so repeat purchases don't send a new code each time.
      const key = [tier, email, apiKey, address, tempoId?.accessToken].join(
        "|",
      );
      if (buyRef.current?.key !== key) {
        const Client = await loadClient();
        const proof = await agentProof(Client);
        buyRef.current = {
          buy: Client.create({
            agent: proof,
            apiKey: tier === "apiKey" ? apiKey : undefined,
            tempoId:
              tier === "tempoId" && tempoId
                ? {
                    accessToken: () => tempoId.accessToken,
                    idToken: () => tempoId.idToken,
                  }
                : undefined,
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
            wallet: await payer(),
          }),
          key,
        };
      }
      const response = await buyRef.current.buy(sentTopic || undefined);
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
      const Receipt = await loadReceipt();
      setResult({ ...body, receipt: Receipt.fromResponse(response).reference });
      await refreshBalance();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      setPending(undefined);
    }
  }

  /** The selected agent tier's proof. */
  async function agentProof(
    Client: typeof import("../client.js"),
  ): Promise<Client.Agent | undefined> {
    const agents = config?.agents;
    if (!agents || !agentTiers.includes(tier)) return undefined;
    if (tier === "poppy")
      return Client.poppyAgent({
        delegationUrl: `${basePath}api/poppy/delegation`,
        fetch: tracedFetch,
        userId: poppyUser,
      });
    if (tier === "webBotAuth") return Client.demoBot(agents.botDirectory);
    // Every visitor signs as the shared MPP Demo Agent: no registration, no wait.
    const { demoAgentKey, privateKeyToAccount } = await loadChain();
    return {
      account: privateKeyToAccount(demoAgentKey),
      agentId: BigInt(agents.demoAgentId ?? "1086"),
      chainId: agents.chainId,
      kind: "erc8004",
      registry: agents.registry,
    };
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
    (tier !== "apiKey" || Boolean(apiKey)) &&
    (tier !== "tempoId" || Boolean(tempoId)) &&
    (!agentTiers.includes(tier) || Boolean(config?.agents));

  return {
    address,
    apiKey,
    balance,
    busy,
    code,
    config,
    buy,
    email,
    error,
    fund,
    funding,
    hops,
    link,
    low,
    pending,
    poppyUser,
    price,
    ready,
    result,
    setApiKey,
    setCode,
    setEmail,
    selectTier,
    sentTopic,
    setWallet,
    setTopic,
    signInTempoId,
    signingIn,
    signOutTempoId,
    source,
    tempoId,
    tier,
    topic,
    topicAllowed,
    useTestWallet,
    wallet,
  };
}

/** 0x1234…abcd: enough of an address to recognize it. */
function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

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
