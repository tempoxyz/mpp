import {
  Component,
  lazy,
  type ReactNode,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Address, Hex as HexValue } from "viem";

import type * as Client from "../client.js";
import { price, suggestedDeposit } from "../prices.js";
import { topic as cleanTopic } from "../topic.js";
import { CodeLines } from "./CodeLines.js";
import {
  clientBlocks,
  type Step,
  serverBlocks,
  source,
  stepLines,
} from "./samples.js";
import {
  hasStoredChannel,
  ousd,
  unloaded,
  type Wallet,
} from "./wallet-state.js";

// The payment client (mppx) is most of the page's JavaScript: load it after first paint, so the
// page shows while it downloads.
const loadClient = () => import("../client.js");
const loadChain = () => import("./chain.js");
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

type Hop = { method: string; path: string; status: number };
/** Something that happened to the channel, newest last. */
type Event = {
  detail: string;
  /** A transaction to link, when the event has one. */
  hash?: string | undefined;
  kind: "open" | "voucher" | "topUp" | "close";
  /** Whether it was an on-chain transaction. */
  onChain: boolean;
};
type Phase = "idle" | "opening" | "streaming" | "toppingUp" | "closing";

const explorer = "https://explore.testnet.tempo.xyz";
/** Where mpp.dev serves the playground, with a trailing slash. */
const basePath = import.meta.env.BASE_URL;
/** The most a visitor lets the channel hold, in OUSD. */
const budgets = ["0.10", "0.25", "0.50"] as const;
const serverSource = source(serverBlocks());
const serverLines = stepLines(serverBlocks());

/** Payment methods whose SDKs implement the session intent. */
const methods = [
  {
    href: "https://mpp.dev/payment-methods/tempo/session",
    name: "Tempo",
    note: "TIP-20 stablecoins over payment channels",
  },
  {
    href: "https://mpp.dev/payment-methods/stripe",
    name: "Stripe",
    note: "Tempo sessions, recorded in Stripe",
  },
  {
    href: "https://mpp.dev/payment-methods/lightning#session",
    name: "Lightning",
    note: "Prepaid Bitcoin sessions",
  },
  {
    href: "https://mpp.dev/payment-methods/solana#session",
    name: "Solana",
    note: "SOL and SPL tokens over payment channels",
  },
  {
    href: "https://mpp.dev/payment-methods/xrpl#session",
    name: "XRPL",
    note: "XRP payment channels",
  },
  {
    href: "https://mpp.dev/payment-methods/stellar#session",
    name: "Stellar",
    note: "SEP-41 token channels (experimental)",
  },
] as const;

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
            <h1 className="title">Sessions</h1>
            <p className="lede">
              Pay for a story word by word. Reserve a deposit once, pay every
              word with an off-chain voucher, then close and get the rest back.
            </p>
          </div>
          <Panel f={f} />
          <Events f={f} />
          <Methods />
          <a className="link" href="https://mpp.dev/intents/session">
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
      </nav>
    </header>
  );
}

/** The channel meter, the story, and the controls. */
function Panel({ f }: { f: Demo }) {
  return (
    <section className="panel">
      <PanelHead name="session">
        <span className="status" data-phase={f.phase} data-open={f.open}>
          {status(f)}
        </span>
      </PanelHead>
      <Meter f={f} />
      <div className="panel-body story-body">
        {f.words.length > 0 ? (
          <p className="story">
            {f.words.join(" ")}
            {f.phase === "streaming" && <span className="cursor">▍</span>}
          </p>
        ) : (
          <div className="placeholder">
            {!f.address
              ? "Link a wallet to start."
              : f.phase === "opening"
                ? "Opening a channel…"
                : `Stream a story at ${price} OUSD a word.`}
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
        <Controls f={f} />
      )}
      {f.address && <WalletRow f={f} />}
    </section>
  );
}

function status(f: Demo) {
  if (f.phase === "opening") return "Opening";
  if (f.phase === "streaming") return "Streaming";
  if (f.phase === "toppingUp") return "Topping up";
  if (f.phase === "closing") return "Closing";
  if (f.open) return "Open";
  if (f.resumable) return "Resumes on next story";
  return f.closed ? "Closed" : "No channel";
}

/** The deposit, what's been spent of it, and how few transactions it took. */
function Meter({ f }: { f: Demo }) {
  const deposit = f.deposit ?? 0n;
  const share = deposit > 0n ? Number((f.spent * 10_000n) / deposit) / 100 : 0;
  return (
    <div className="meter">
      <div className="meter-bar" aria-hidden>
        <div
          className="meter-spent"
          style={{ width: `${Math.min(share, 100)}%` }}
        />
      </div>
      <dl className="stats">
        <Stat
          label="Deposit"
          value={f.deposit === undefined ? "—" : ousdText(deposit)}
        />
        <Stat label="Spent" value={ousdText(f.spent)} />
        <Stat label="Vouchers" value={String(f.vouchers)} />
        <Stat label="On-chain" value={String(f.transactions)} />
      </dl>
      {f.vouchers > 0 && (
        <div className="meter-note dim">
          {f.vouchers} payments, {f.transactions}{" "}
          {f.transactions === 1 ? "transaction" : "transactions"}. One charge
          per word would have taken {f.vouchers}.
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Controls({ f }: { f: Demo }) {
  return (
    <>
      <form
        className="panel-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (f.canStream) f.stream();
        }}
      >
        <span className="prompt">❯</span>
        <input
          aria-label="Topic"
          className="input"
          disabled={f.busy}
          maxLength={40}
          placeholder="a story about anything, such as the sea…"
          value={f.topic}
          onChange={(e) => f.setTopic(e.target.value)}
        />
        {f.low && (
          <button
            className="button"
            disabled={f.funding}
            onClick={f.fund}
            type="button"
          >
            {f.funding ? "Funding…" : "Get test OUSD"}
          </button>
        )}
        <button className="button" disabled={!f.canStream} type="submit">
          {f.phase === "streaming" || f.phase === "opening"
            ? "Streaming…"
            : f.open
              ? "Stream another"
              : "Open & stream"}
        </button>
      </form>
      <div className="panel-row controls">
        <span className="dim">max deposit</span>
        <div className="segments">
          {budgets.map((budget) => (
            <button
              aria-pressed={f.budget === budget}
              className="segment"
              disabled={f.open || f.busy}
              key={budget}
              onClick={() => f.setBudget(budget)}
              type="button"
            >
              {budget}
            </button>
          ))}
        </div>
        <span className="spacer" />
        <button
          className="action"
          disabled={!f.open || f.busy}
          onClick={f.topUp}
          type="button"
        >
          Top up 0.05
        </button>
        <button
          className="action"
          disabled={!f.open || f.busy}
          onClick={f.close}
          type="button"
        >
          Close & settle
        </button>
      </div>
    </>
  );
}

function WalletRow({ f }: { f: Demo }) {
  return (
    <div className="panel-row">
      <span className="dim">
        {f.wallet.connected ? "Linked" : "Test wallet"}
      </span>
      {f.address && (
        <a
          className="link"
          href={`${explorer}/address/${f.address}`}
          rel="noreferrer"
          target="_blank"
        >
          {shortAddress(f.address)}
        </a>
      )}
      {f.balance !== undefined && (
        <span className="dim">· {f.balance} OUSD</span>
      )}
      <span className="spacer" />
      {f.wallet.connected ? (
        <button
          className="action"
          disabled={f.busy || f.open}
          onClick={f.wallet.unlink}
          type="button"
        >
          Unlink
        </button>
      ) : (
        <button
          className="action"
          disabled={!f.wallet.ready || f.wallet.linking || f.busy || f.open}
          onClick={f.link}
          type="button"
        >
          {f.wallet.linking ? "Linking…" : "Link Tempo Wallet"}
        </button>
      )}
    </div>
  );
}

/** What happened to the channel: the few transactions, and the vouchers between them. */
function Events({ f }: { f: Demo }) {
  if (f.events.length === 0 && f.hops.length === 0) return null;
  return (
    <div className="hops">
      <div className="label">Channel</div>
      {f.events.map((event, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: events never reorder
        <div key={i} className="hop">
          <span data-kind={event.onChain ? "chain" : "voucher"}>
            {event.onChain ? "tx" : "off"}
          </span>
          <span className="hop-path">{event.detail}</span>
          {event.hash ? (
            <a
              className="link"
              href={`${explorer}/tx/${event.hash}`}
              rel="noreferrer"
              target="_blank"
            >
              {shortAddress(event.hash)}
            </a>
          ) : (
            <span className="dim">{event.onChain ? "on-chain" : "0 gas"}</span>
          )}
        </div>
      ))}
    </div>
  );
}

/** Every payment method with a session intent; this page runs Tempo's. */
function Methods() {
  return (
    <section className="methods">
      <div className="label">Sessions work on</div>
      {methods.map((method) => (
        <a className="method" href={method.href} key={method.name}>
          <span className="method-name">{method.name}</span>
          <span className="method-note">{method.note}</span>
          {method.name === "Tempo" ? (
            <span className="method-live">Live here</span>
          ) : (
            <span className="dim">Docs →</span>
          )}
        </a>
      ))}
    </section>
  );
}

/** Client code on top, server code below, with the lines the current step runs lit. */
function Code({ f }: { f: Demo }) {
  const blocks = clientBlocks(f.budget);
  const lit = f.step;
  return (
    <div className="code-stack">
      <CodePanel
        lit={lit ? stepLines(blocks)[lit] : undefined}
        name="client.ts"
        now={source(blocks)}
        step={lit}
        values={{ deposit: f.budget }}
      />
      <CodePanel
        lit={lit ? serverLines[lit] : undefined}
        name="server.ts"
        now={serverSource}
        step={lit}
        values={{ deposit: f.budget }}
      />
    </div>
  );
}

const stepLabels: Record<Step, string> = {
  close: "close",
  open: "open",
  stream: "voucher",
  topUp: "top-up",
};

function CodePanel({
  lit,
  name,
  now,
  step,
  values,
}: {
  lit: ReadonlySet<number> | undefined;
  name: string;
  now: string;
  step: Step | undefined;
  values: { deposit: string };
}) {
  const [explain, setExplain] = useState(false);
  return (
    <section className="panel code">
      <PanelHead name={name}>
        {step && <span className="step-tag">{stepLabels[step]}</span>}
        <button
          aria-pressed={explain}
          className="button explain-toggle"
          onClick={() => setExplain(!explain)}
          title="What a session changes from paying per request"
          type="button"
        >
          Explain code
        </button>
      </PanelHead>
      <div className="code-body">
        <CodeLines
          explain={explain}
          lit={lit}
          name={name}
          now={now}
          values={values}
        />
      </div>
    </section>
  );
}

/** Wallet, channel and request state shared by every layout. */
function useDemo() {
  const [wallet, setWallet] = useState<Wallet>(unloaded);
  const [testKey, setTestKey] = useState(
    () => localStorage.getItem("session.key") as HexValue | null,
  );
  // The test wallet's address is stored beside its key, so it shows before viem loads.
  const [testAddress, setTestAddress] = useState(
    () =>
      (localStorage.getItem("session.address") as Address | null) ?? undefined,
  );
  useEffect(() => {
    if (!testKey) return;
    loadChain()
      .then(({ privateKeyToAccount }) => {
        const { address } = privateKeyToAccount(testKey);
        localStorage.setItem("session.address", address);
        setTestAddress(address);
      })
      .catch((e) => setError(`Couldn't load the test wallet: ${String(e)}`));
  }, [testKey]);
  const address = wallet.connected
    ? wallet.address
    : testKey
      ? testAddress
      : undefined;
  const addressRef = useRef(address);
  addressRef.current = address;

  // Fetch what the next click needs while the visitor reads.
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

  const [balance, setBalance] = useState<string>();
  const [funding, setFunding] = useState(false);
  const [budget, setBudget] = useState<string>("0.25");
  const [topic, setTopic] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState<Step>();
  const [open, setOpen] = useState(false);
  const [closed, setClosed] = useState(false);
  // A channel left open on an earlier visit: the next story resumes it.
  const [resumable, setResumable] = useState(false);
  useEffect(() => {
    setResumable(address ? hasStoredChannel(address) : false);
  }, [address]);
  const [deposit, setDeposit] = useState<bigint>();
  const [spent, setSpent] = useState(0n);
  const [vouchers, setVouchers] = useState(0);
  const [transactions, setTransactions] = useState(0);
  const [words, setWords] = useState<string[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [hops, setHops] = useState<Hop[]>([]);
  const [error, setError] = useState<string>();
  const sessionRef = useRef<{ key: string; session: Client.Session }>(
    undefined,
  );
  // What the page last saw of the channel, to tell a top-up from a voucher.
  const seen = useRef({ deposit: 0n, spent: 0n, vouchers: 0 });
  const phaseRef = useRef<Phase>("idle");
  phaseRef.current = phase;

  // biome-ignore lint/correctness/useExhaustiveDependencies: refetch only when the wallet changes
  useEffect(() => {
    setBalance(undefined);
    if (address) refreshBalance(address);
  }, [address]);

  async function refreshBalance(account = address) {
    if (!account) return;
    const { Actions, rpc } = await loadChain();
    const value = await Actions.token.getBalance(rpc, { account, token: ousd });
    if (account !== addressRef.current) return;
    setBalance((Number(value.amount) / 1e6).toFixed(2));
  }

  async function fund(account = address) {
    if (!account) return;
    setFunding(true);
    try {
      const { Actions, rpc } = await loadChain();
      await Actions.faucet.fundSync(rpc, { account, timeout: 30_000 });
      await refreshBalance(account);
    } catch (e) {
      setError(`Faucet failed: ${String(e)}`);
    } finally {
      setFunding(false);
    }
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
        localStorage.setItem("session.key", key);
        localStorage.setItem("session.address", address);
        setTestKey(key);
        setTestAddress(address);
        // A new test wallet holds nothing: fund it straight away.
        fund(address);
      })
      .catch((e) => setError(`Couldn't create a test wallet: ${String(e)}`));
  }

  async function payer(): Promise<Client.Wallet> {
    const linked = (await wallet.mppx()) as Client.Wallet | undefined;
    if (linked) return linked;
    if (wallet.connected || !testKey)
      throw new Error("Wallet disconnected. Link Tempo Wallet and try again.");
    const { privateKeyToAccount } = await loadChain();
    return { account: privateKeyToAccount(testKey) };
  }

  // Records each HTTP hop; a paid POST mid-stream is a voucher.
  const tracedFetch: typeof globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    const response = await fetch(request);
    const url = new URL(request.url);
    setHops((hops) => [
      ...hops,
      {
        method: request.method,
        path: url.pathname + url.search,
        status: response.status,
      },
    ]);
    if (
      request.method === "POST" &&
      response.ok &&
      phaseRef.current === "streaming" &&
      action(request) === "voucher"
    ) {
      seen.current.vouchers++;
      setVouchers(seen.current.vouchers);
    }
    return response;
  };

  function log(event: Event) {
    setEvents((events) => {
      // Vouchers collapse into one running line between transactions.
      const last = events.at(-1);
      if (event.kind === "voucher" && last?.kind === "voucher")
        return [...events.slice(0, -1), event];
      return [...events, event];
    });
  }

  /** Reads the manager's channel state into the page, noting top-ups it made on its own. */
  async function sync(session: Client.Session) {
    const Client = await loadClient();
    const now = Client.deposit(session);
    if (now !== undefined) {
      if (seen.current.deposit > 0n && now > seen.current.deposit) {
        setTransactions((n) => n + 1);
        log({
          detail: `topped up ${ousdText(now - seen.current.deposit)} mid-stream`,
          kind: "topUp",
          onChain: true,
        });
      }
      seen.current.deposit = now;
      setDeposit(now);
    }
    if (session.cumulative !== seen.current.spent) {
      seen.current.spent = session.cumulative;
      setSpent(session.cumulative);
    }
  }

  async function session() {
    const key = [address, budget].join("|");
    if (sessionRef.current?.key === key) return sessionRef.current.session;
    const Client = await loadClient();
    const created = Client.create({
      fetch: tracedFetch,
      maxDeposit: budget,
      payer: address ?? "",
      wallet: await payer(),
    });
    sessionRef.current = { key, session: created };
    return created;
  }

  async function stream() {
    setError(undefined);
    setWords([]);
    const opening = !open;
    setPhase(opening ? "opening" : "streaming");
    setStep(opening ? "open" : "stream");
    if (opening) {
      setClosed(false);
      setEvents([]);
      setHops([]);
      setTransactions(0);
      setVouchers(0);
      setSpent(0n);
      setDeposit(undefined);
      seen.current = { deposit: 0n, spent: 0n, vouchers: 0 };
    }
    try {
      const s = await session();
      // The topic is part of the path: vouchers post to this URL, and a query would make
      // the Worker treat them as story requests.
      const cleaned = cleanTopic(topic);
      const about = cleaned ? `/${encodeURIComponent(cleaned)}` : "";
      const words = await s.sse(
        `${location.origin + basePath}api/story${about}`,
      );
      if (opening && s.opened) {
        setOpen(true);
        await sync(s);
        if (resumable) {
          setResumable(false);
          log({
            detail: `resumed your channel from last visit (${ousdText(seen.current.deposit)})`,
            kind: "open",
            onChain: false,
          });
        } else {
          setTransactions(1);
          log({
            detail: `opened a channel with ${ousdText(seen.current.deposit)}`,
            kind: "open",
            onChain: true,
          });
        }
      }
      setPhase("streaming");
      setStep("stream");
      const start = seen.current.vouchers;
      const story: string[] = [];
      for await (const word of words) {
        story.push(word);
        setWords([...story]);
        await sync(s);
        log({
          detail: `${seen.current.vouchers - start} vouchers, ${ousdText(seen.current.spent)} spent`,
          kind: "voucher",
          onChain: false,
        });
      }
      await sync(s);
    } catch (e) {
      setError(message(e));
    } finally {
      setPhase("idle");
      setStep(undefined);
      refreshBalance().catch(() => undefined);
    }
  }

  async function topUp() {
    const s = sessionRef.current?.session;
    if (!s) return;
    setError(undefined);
    setPhase("toppingUp");
    setStep("topUp");
    try {
      const receipt = await s.topUp("0.05");
      setTransactions((n) => n + 1);
      const Client = await loadClient();
      const now = Client.deposit(s);
      if (now !== undefined) {
        seen.current.deposit = now;
        setDeposit(now);
      }
      log({
        detail: "topped up 0.05",
        hash: receipt?.txHash,
        kind: "topUp",
        onChain: true,
      });
    } catch (e) {
      setError(message(e));
    } finally {
      setPhase("idle");
      setStep(undefined);
      refreshBalance().catch(() => undefined);
    }
  }

  async function close() {
    const s = sessionRef.current?.session;
    if (!s) return;
    setError(undefined);
    setPhase("closing");
    setStep("close");
    try {
      const receipt = await s.close();
      const spentNow = receipt ? BigInt(receipt.spent) : seen.current.spent;
      setSpent(spentNow);
      setTransactions((n) => n + 1);
      log({
        detail: `closed: paid ${ousdText(spentNow)}, ${ousdText(seen.current.deposit - spentNow)} back`,
        hash: receipt?.txHash,
        kind: "close",
        onChain: true,
      });
      sessionRef.current = undefined;
      setOpen(false);
      setClosed(true);
    } catch (e) {
      setError(message(e));
    } finally {
      setPhase("idle");
      setStep(undefined);
      refreshBalance().catch(() => undefined);
    }
  }

  const busy = phase !== "idle";
  // OUSD pays the deposit; network fees are paid separately in pathUSD.
  // The channel opens with the suggested deposit (at most the budget) and tops up from there.
  const opening = Math.min(Number(suggestedDeposit), Number(budget));
  const low = balance !== undefined && Number(balance) < opening;
  const canStream =
    Boolean(address) && !busy && (open || balance === undefined || !low);

  return {
    address,
    balance,
    budget,
    busy,
    canStream,
    close,
    closed,
    deposit,
    resumable,
    error,
    events,
    fund: () => fund(),
    funding,
    hops,
    link,
    low,
    open,
    phase,
    setBudget,
    setTopic,
    setWallet,
    spent,
    step,
    stream,
    suggestedDeposit,
    topUp,
    topic,
    transactions,
    useTestWallet,
    vouchers,
    wallet,
    words,
  };
}

/** An error's message, without viem's multi-line details. */
function message(error: unknown) {
  const text = error instanceof Error ? error.message : String(error);
  // The manager refuses to sign past maxDeposit: the story stops where the ceiling ran out.
  if (/exceeds local maxDeposit/.test(text))
    return "The channel reached its max deposit, so the story stopped there. Close & settle, then pick a higher max to keep reading.";
  return text.split("\n")[0]!.slice(0, 300);
}

/** Base units of OUSD (6 decimals) as a short decimal. */
function ousdText(amount: bigint) {
  const text = (Number(amount) / 1e6).toFixed(3);
  return text.endsWith("0") ? text.slice(0, -1) : text;
}

/** 0x1234…abcd: enough of an address or hash to recognize it. */
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

/** The session action a request's Payment credential carries, such as voucher or topUp. */
function action(request: Request): string | undefined {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Payment ")) return undefined;
  try {
    const json = atob(
      header.slice("Payment ".length).replace(/-/g, "+").replace(/_/g, "/"),
    );
    return (JSON.parse(json) as { payload?: { action?: string } }).payload
      ?.action;
  } catch {
    return undefined;
  }
}
