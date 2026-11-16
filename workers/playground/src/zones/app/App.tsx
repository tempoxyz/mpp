import code from "virtual:zones-code";
import { useEffect, useRef, useState } from "react";
import type { Hex } from "viem";

import { CodeLines } from "../../shared/CodeLines.js";
import {
  explorer,
  message,
  Nav,
  ousdText,
  PanelHead,
  Stat,
  short,
} from "../../shared/ui.js";
import { price } from "../prices.js";
import type * as ZoneModule from "../zone.js";
import { client, notes, server } from "./samples.js";

type Config = ZoneModule.Config;

/** Where mpp.dev serves the playground, with a trailing slash. */
const basePath = `${import.meta.env.BASE_URL}zones/`;
const loadZone = () => import("../zone.js");
const loadDeps = () =>
  Promise.all([
    import("../zone.js"),
    import("mppx"),
    import("mppx/client"),
    import("viem/accounts"),
  ]);

/** Where this page keeps its test wallet: its own, apart from the charge playgrounds'. */
const storageKey = "zones.key";
/** What a new test wallet moves into the Zone. */
const depositAmount = 1_000_000n;
const priceUnits = BigInt(Math.round(Number(price) * 1e6));

/** Which windows the page shows: ?view=windows, ?view=spot or both (the default). */
type View = "both" | "spot" | "windows";

export function App() {
  const d = useDemo();
  const showWindows = d.view !== "spot";
  const showSpot = d.view !== "windows";
  return (
    <>
      <Nav />
      <div className="page">
        <main className="main">
          <div className="intro">
            <span className="label">Playground</span>
            <h1 className="title">Zones</h1>
            <p className="lede">
              Pay from a private Zone balance. The merchant gets paid on Tempo,
              and nobody can tell it was you.
            </p>
          </div>
          <Panel d={d} />
          {showWindows && <Windows d={d} />}
          {showSpot && <Spot d={d} />}
          <a className="link" href="https://mpp.dev/guides/private-payments">
            Read the docs →
          </a>
        </main>
        <aside>
          <div className="code-stack">
            <CodePanel name="client.ts" source={client} />
            <CodePanel name="server.ts" source={server} />
          </div>
        </aside>
      </div>
    </>
  );
}

type Demo = ReturnType<typeof useDemo>;

function Panel({ d }: { d: Demo }) {
  const last = d.purchases.at(-1);
  return (
    <section className="panel">
      <PanelHead
        name={d.config?.zone ? `zone · ${d.config.zone.name}` : "zone"}
      />
      <div className="meter">
        <dl className="stats">
          <Stat label="Price" value={`${price} ${d.symbol}`} />
          <Stat
            label="In the Zone"
            value={
              d.zoneBalance === undefined ? "–" : balanceText(d.zoneBalance)
            }
          />
          <Stat
            label="On Tempo"
            value={
              d.publicBalance === undefined ? "–" : balanceText(d.publicBalance)
            }
          />
          <Stat label="Bought" value={String(d.purchases.length)} />
        </dl>
      </div>
      <div className="panel-body story-body">
        {last ? (
          <div className="fortune">
            <p className="story">“{last.fortune}”</p>
            <div className="dim">
              Paid {price} {d.symbol} from the Zone in{" "}
              {(last.ms / 1000).toFixed(1)} s · the merchant never saw your
              address
            </div>
          </div>
        ) : (
          <div className="placeholder">{d.placeholder}</div>
        )}
        {d.error && <div className="error">{d.error}</div>}
      </div>
      <div className="panel-row">
        <span className="prompt">❯</span>
        {!d.address ? (
          <button
            className="action"
            disabled={!d.config?.zone || d.busy !== undefined}
            onClick={d.start}
            type="button"
          >
            Make a test wallet
          </button>
        ) : (
          <>
            <span className="dim">GET /api/fortune</span>
            <span className="spacer" />
            <button
              className="button"
              disabled={d.busy !== undefined || !d.ready}
              onClick={d.buy}
              type="button"
            >
              {d.busy === "buying"
                ? "Paying from the Zone…"
                : d.busy
                  ? d.busyText
                  : `Buy privately · ${price}`}
            </button>
          </>
        )}
      </div>
      {d.address && (
        <div className="panel-row">
          <span className="dim">Test wallet</span>
          <span className="ink mono">{short(d.address)}</span>
          <span className="spacer" />
          <button
            className="action"
            disabled={d.busy !== undefined}
            onClick={d.topUp}
            type="button"
          >
            Move 1 {d.symbol} into the Zone
          </button>
        </div>
      )}
    </section>
  );
}

/** What each party learned from the last purchase. */
function Windows({ d }: { d: Demo }) {
  const last = d.purchases.at(-1);
  return (
    <section className="windows">
      <Window
        label="You"
        note="Only you and the Zone's operator can read this."
        tone="you"
      >
        <Row k="Account" v={d.address ? short(d.address) : "–"} />
        <Row
          k="Zone balance"
          v={
            d.zoneBalance === undefined
              ? "–"
              : `${ousdText(d.zoneBalance)} ${d.symbol}`
          }
        />
        <Row k="Withdrawal" v={last ? short(last.paid.zoneTransaction) : "–"} />
      </Window>
      <Window
        label="Merchant"
        note="The Credential proves payment, not who paid."
        tone="merchant"
      >
        <Row
          k="Payer"
          v={last ? (last.seen.source ?? "unknown") : "–"}
          strong={Boolean(last)}
        />
        <Row k="Paid by" v={last ? `Zone ${last.seen.zoneId}` : "–"} />
        <Row k="Sender tag" v={last ? short(last.seen.senderTag) : "–"} />
      </Window>
      <Window label="Tempo" note="Anyone can read this, forever." tone="public">
        <Row
          k="From"
          v={last ? `Zone portal ${short(d.config!.portal)}` : "–"}
        />
        <Row k="Amount" v={last ? `${price} ${d.symbol} → merchant` : "–"} />
        <Row
          k="Your address"
          v={last ? (last.exposed ? "found" : "not in this transaction") : "–"}
          strong={Boolean(last) && !last?.exposed}
        />
        {last && <TxLink chainId={d.config!.chainId} hash={last.paid.hash} />}
      </Window>
    </section>
  );
}

function Window({
  children,
  label,
  note,
  tone,
}: {
  children: React.ReactNode;
  label: string;
  note: string;
  tone: string;
}) {
  return (
    <div className="window" data-tone={tone}>
      <div className="label">{label}</div>
      <dl className="window-rows">{children}</dl>
      <div className="window-note dim">{note}</div>
    </div>
  );
}

function Row({ k, strong, v }: { k: string; strong?: boolean; v: string }) {
  return (
    <div className="window-row">
      <dt>{k}</dt>
      <dd className={strong ? "good" : undefined}>{v}</dd>
    </div>
  );
}

function TxLink({ chainId, hash }: { chainId: number; hash: string }) {
  if (chainId !== 42431)
    return <div className="dim mono">tx {short(hash)}</div>;
  return (
    <a
      className="link"
      href={`${explorer}/tx/${hash}`}
      rel="noreferrer"
      target="_blank"
    >
      View on the explorer ↗
    </a>
  );
}

/** The merchant's ledger on Tempo: every Zone payment looks the same. Which one is yours? */
function Spot({ d }: { d: Demo }) {
  const mine = new Set(d.purchases.map((p) => p.paid.senderTag.toLowerCase()));
  const fresh = new Set(d.fresh);
  const asking = d.round !== undefined && !d.revealed;
  return (
    <section className="panel spot">
      <PanelHead name="spot the buyer · the merchant's payments on Tempo" />
      <div className="panel-body">
        <div className="spot-prompt">
          {d.round === undefined
            ? "Buy privately: a few other buyers pay from the same Zone at the same moment."
            : d.revealed
              ? d.guess === undefined
                ? "That one was yours. Only your wallet could tell: it holds the sender tag."
                : mine.has(d.guess)
                  ? "Right, but only because your wallet holds the sender tag. Nobody else can match it."
                  : "Not that one. To everyone else, every payment from the Zone looks the same."
              : `${d.fresh.length} payments just arrived from the Zone. Which one is yours?`}
        </div>
        <div className="ledger">
          {d.ledger.length === 0 ? (
            <div className="placeholder">No Zone payments yet.</div>
          ) : (
            d.ledger.map((row) => {
              const tag = row.senderTag.toLowerCase();
              const isFresh = fresh.has(tag);
              return (
                <button
                  className="ledger-row"
                  data-fresh={isFresh}
                  data-mine={d.revealed && mine.has(tag)}
                  data-picked={d.guess === tag}
                  disabled={!asking || !isFresh}
                  key={tag}
                  onClick={() => d.pick(tag)}
                  type="button"
                >
                  <span className="mono dim">#{row.block}</span>
                  <span className="mono">from {short(row.from)}</span>
                  <span className="mono">
                    {ousdText(row.amount)} {d.symbol}
                  </span>
                  <span className="mono dim">tag {short(row.senderTag)}</span>
                  <span className="ledger-mark">
                    {d.revealed && mine.has(tag)
                      ? "yours"
                      : isFresh
                        ? "new"
                        : ""}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
      {asking && (
        <div className="panel-row">
          <span className="dim">Pick a row, or</span>
          <span className="spacer" />
          <button className="action" onClick={d.reveal} type="button">
            Reveal mine
          </button>
        </div>
      )}
    </section>
  );
}

function CodePanel({ name, source }: { name: string; source: string }) {
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
          Explain
        </button>
      </PanelHead>
      <div className="code-body">
        <CodeLines
          code={code}
          explain={explain}
          name={name}
          notes={notes}
          now={source}
        />
      </div>
    </section>
  );
}

type LedgerRow = {
  amount: string;
  block: string;
  from: string;
  senderTag: string;
  transaction: string;
};

type Purchase = {
  exposed: boolean;
  fortune: string;
  ms: number;
  paid: ZoneModule.Paid;
  seen: { senderTag: string; source: string | null; zoneId: number };
};

function useDemo() {
  const [view, setView] = useState<View>("both");
  const [config, setConfig] = useState<Config>();
  const [key, setKey] = useState<Hex | null>(null);
  const [address, setAddress] = useState<string>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState<"buying" | "depositing" | "funding">();
  const [zoneBalance, setZoneBalance] = useState<bigint>();
  const [publicBalance, setPublicBalance] = useState<bigint>();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [fresh, setFresh] = useState<string[]>([]);
  const [round, setRound] = useState<number>();
  const [guess, setGuess] = useState<string>();
  const [revealed, setRevealed] = useState(false);
  const clients = useRef<Awaited<ReturnType<typeof makeClients>>>(undefined);

  useEffect(() => {
    const param = new URLSearchParams(location.search).get("view");
    if (param === "spot" || param === "windows") setView(param);
    setKey(localStorage.getItem(storageKey) as Hex | null);
    fetch(`${basePath}api/config`)
      .then((r) => r.json() as Promise<Config>)
      .then(setConfig)
      .catch((e) => setError(`Couldn't load the playground: ${message(e)}`));
  }, []);

  // The ledger, as anyone reads it on Tempo.
  const refreshLedger = async () => {
    const response = await fetch(`${basePath}api/ledger`, {
      cache: "no-store",
    });
    const { payments } = (await response.json()) as { payments: LedgerRow[] };
    setLedger(payments);
    return payments;
  };
  // biome-ignore lint/correctness/useExhaustiveDependencies: poll restarts only when the Zone or view changes
  useEffect(() => {
    if (!config?.zone || view === "windows") return;
    refreshLedger().catch(() => undefined);
    const id = setInterval(() => refreshLedger().catch(() => undefined), 3_000);
    return () => clearInterval(id);
  }, [config, view]);

  // Once there's a key and a config: the clients, the token and the balances.
  // biome-ignore lint/correctness/useExhaustiveDependencies: rebuild only when the wallet or config changes
  useEffect(() => {
    if (!key || !config?.zone) return;
    let live = true;
    makeClients(config, key)
      .then(async (made) => {
        if (!live) return;
        clients.current = made;
        setAddress(made.account.address);
        await made.authorize();
        await refreshBalances();
      })
      .catch((e) => setError(message(e)));
    return () => {
      live = false;
    };
  }, [key, config]);

  async function refreshBalances() {
    const c = clients.current;
    if (!c || !config) return;
    const [{ Actions }, zone] = await Promise.all([
      import("viem/tempo"),
      c.zoneModule.zoneBalance(c.zone, config.currency).catch(() => undefined),
    ]);
    const { amount } = await Actions.token.getBalance(c.tempo, {
      account: c.account.address,
      token: config.currency,
    });
    setPublicBalance(amount);
    setZoneBalance(zone);
    return zone;
  }

  async function waitForZoneCredit(atLeast: bigint) {
    for (let i = 0; i < 240; i++) {
      const balance = await refreshBalances();
      if (balance !== undefined && balance >= atLeast) return;
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
    throw new Error(
      "The deposit hasn't reached the Zone yet. Try again in a minute.",
    );
  }

  async function fundAndDeposit() {
    const c = clients.current!;
    const before = zoneBalance ?? 0n;
    setBusy("funding");
    if ((publicBalance ?? 0n) < depositAmount * 2n) {
      await c.tempo.request({
        method: "tempo_fundAddress",
        params: [c.account.address],
      } as never);
      for (let i = 0; i < 20; i++) {
        await refreshBalances();
        const { Actions } = await import("viem/tempo");
        const { amount } = await Actions.token.getBalance(c.tempo, {
          account: c.account.address,
          token: config!.currency,
        });
        if (amount >= depositAmount) break;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
    setBusy("depositing");
    await c.zoneModule.deposit(c.tempo, config!, depositAmount);
    await refreshBalances();
    await waitForZoneCredit(before + depositAmount - 10_000n);
  }

  async function start() {
    setError(undefined);
    try {
      const { generatePrivateKey } = await import("viem/accounts");
      const next = generatePrivateKey();
      localStorage.setItem(storageKey, next);
      clients.current = await makeClients(config!, next);
      setAddress(clients.current.account.address);
      await clients.current.authorize();
      setKey(next);
      await fundAndDeposit();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(undefined);
    }
  }

  async function topUp() {
    setError(undefined);
    try {
      await fundAndDeposit();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(undefined);
    }
  }

  async function buy() {
    setError(undefined);
    setBusy("buying");
    const started = performance.now();
    const c = clients.current!;
    try {
      const [Zone, { Receipt }, { Mppx, tempo }] = await loadDeps();
      const before = new Set(ledger.map((row) => row.senderTag.toLowerCase()));
      // Decoys pay from the same Zone at the same moment (the spot-the-buyer view).
      if (view !== "windows")
        fetch(`${basePath}api/crowd`, { method: "POST" }).catch(
          () => undefined,
        );
      let paid: ZoneModule.Paid | undefined;
      const mppx = Mppx.create({
        methods: [
          tempo({ account: c.account, getClient: () => c.tempo as never }),
        ],
        polyfill: false,
        onChallenge: async (challenge) => {
          if (
            BigInt(String((challenge.request as { amount?: unknown }).amount)) >
            priceUnits
          )
            throw new Error(
              "The 402 asked for more than the advertised price, so the page didn't pay.",
            );
          paid = await Zone.payFromZone({
            challenge,
            config: config!,
            tempo: c.tempo,
            zone: c.zone,
          });
          return paid.credential;
        },
      });
      const response = await mppx.fetch(
        `${location.origin + basePath}api/fortune`,
      );
      if (!response.ok || !paid)
        throw new Error(`The server answered ${response.status}.`);
      Receipt.fromResponse(response);
      const body = (await response.json()) as {
        fortune: string;
        seen: Purchase["seen"];
      };
      const exposed = await appearsIn(c.tempo, paid.hash, c.account.address);
      const purchase: Purchase = {
        exposed,
        fortune: body.fortune,
        ms: performance.now() - started,
        paid,
        seen: body.seen,
      };
      setPurchases((list) => [...list, purchase]);
      await refreshBalances();
      if (view !== "windows") {
        // Let the decoys land, then ask which of the new payments is the visitor's.
        await new Promise((resolve) => setTimeout(resolve, 2_500));
        const rows = await refreshLedger();
        setFresh(
          rows
            .map((r) => r.senderTag.toLowerCase())
            .filter((t) => !before.has(t)),
        );
        setGuess(undefined);
        setRevealed(false);
        setRound((n) => (n ?? 0) + 1);
      }
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(undefined);
    }
  }

  const symbol =
    config?.currency.toLowerCase() ===
    "0x20c0000000000000000000000000000000000000"
      ? "pathUSD"
      : "USD";
  const placeholder = !config
    ? "Loading…"
    : !config.zone
      ? "This playground has no Zone configured."
      : !address
        ? `Make a test wallet: it gets testnet ${symbol} and moves 1 into the Zone.`
        : busy === "funding"
          ? "Getting testnet funds…"
          : busy === "depositing"
            ? "Moving 1 into the Zone. The deposit is public; your Zone balance isn't."
            : `Buy a fortune for ${price} ${symbol}, paid from the Zone.`;

  return {
    address,
    busy,
    busyText:
      busy === "funding"
        ? "Getting funds…"
        : busy === "depositing"
          ? "Depositing…"
          : "",
    buy,
    config,
    error,
    fresh,
    guess,
    ledger,
    pick: (tag: string) => {
      setGuess(tag);
      setRevealed(true);
    },
    placeholder,
    publicBalance,
    purchases,
    ready: (zoneBalance ?? 0n) >= priceUnits,
    reveal: () => setRevealed(true),
    revealed,
    round,
    start,
    symbol,
    topUp,
    view,
    zoneBalance,
  };
}

async function makeClients(config: Config, key: Hex) {
  const [zoneModule, { privateKeyToAccount }] = await Promise.all([
    loadZone(),
    import("viem/accounts"),
  ]);
  const account = privateKeyToAccount(key);
  const origin = location.origin + basePath;
  const tempo = zoneModule.tempoClient(
    config,
    `${origin}api/rpc/tempo`,
    account,
  );
  const { authorize, client: zone } = zoneModule.zoneClient(
    config,
    `${origin}api/rpc/zone`,
    account,
  );
  return { account, authorize, tempo, zone, zoneModule };
}

/** A balance in base units, short enough for a stat: whole units once it's large. */
function balanceText(amount: bigint) {
  return amount >= 1_000_000_000n
    ? Number(amount / 1_000_000n).toLocaleString("en-US")
    : ousdText(amount);
}

/** Whether address appears anywhere in a Tempo transaction: its sender, or any log. */
async function appearsIn(
  tempo: { request: (args: never) => Promise<unknown> },
  hash: string,
  address: string,
) {
  const needle = address.slice(2).toLowerCase();
  const [tx, receipt] = await Promise.all([
    tempo.request({
      method: "eth_getTransactionByHash",
      params: [hash],
    } as never),
    tempo.request({
      method: "eth_getTransactionReceipt",
      params: [hash],
    } as never),
  ]);
  return JSON.stringify([tx, receipt]).toLowerCase().includes(needle);
}
