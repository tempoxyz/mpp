import code from "virtual:charge-code";
import { useState } from "react";

import { CodeLines } from "../../shared/CodeLines.js";
import { Bridge, Connect, PayerRow } from "../../shared/Payer.js";
import {
  explorer,
  message,
  Nav,
  ousdText,
  PanelHead,
  Stat,
  short,
} from "../../shared/ui.js";
import { loadPay, useWallet } from "../../shared/useWallet.js";
import { price } from "../prices.js";
import { client, notes, server } from "./samples.js";

const loadCore = () => import("mppx");

/** Where mpp.dev serves the playground, with a trailing slash. */
const basePath = `${import.meta.env.BASE_URL}charge/`;

/** Payment methods whose SDKs implement the charge intent; this page runs Tempo's. */
const methods = [
  ["Tempo", "https://mpp.dev/payment-methods/tempo/charge"],
  ["Stripe", "https://mpp.dev/payment-methods/stripe"],
  ["Card", "https://mpp.dev/payment-methods/card"],
  ["EVM", "https://mpp.dev/payment-methods/evm"],
  ["Lightning", "https://mpp.dev/payment-methods/lightning"],
  ["Solana", "https://mpp.dev/payment-methods/solana"],
  ["Stellar", "https://mpp.dev/payment-methods/stellar"],
] as const;

export function App() {
  const f = useDemo();
  return (
    <>
      <Bridge p={f.p} />
      <Nav />
      <div className="page">
        <main className="main">
          <div className="intro">
            <span className="label">Playground</span>
            <h1 className="title">Charge</h1>
            <p className="lede">
              Pay once per request. Each purchase is its own payment, settled on
              its own.
            </p>
          </div>
          <Panel f={f} />
          <Methods />
          <a className="link" href="https://mpp.dev/intents/charge">
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

function Panel({ f }: { f: Demo }) {
  return (
    <section className="panel">
      <PanelHead name="charge" />
      <div className="meter">
        <dl className="stats">
          <Stat label="Price" value={`${price} OUSD`} />
          <Stat label="Bought" value={String(f.bought)} />
          <Stat label="Spent" value={ousdText(f.spent)} />
          <Stat label="Transactions" value={String(f.bought)} />
        </dl>
      </div>
      <div className="panel-body story-body">
        {f.fortune ? (
          <div className="fortune">
            <p className="story">“{f.fortune.fortune}”</p>
            <div className="dim">
              Lucky numbers {f.fortune.lucky.join(" · ")}
            </div>
            {f.fortune.transaction && (
              <div className="dim">
                Paid {price} OUSD in one transaction ·{" "}
                <a
                  className="link"
                  href={`${explorer}/tx/${f.fortune.transaction}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  receipt {short(f.fortune.transaction)}
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="placeholder">
            {!f.p.address
              ? "Link a wallet to start."
              : `Buy a fortune for ${price} OUSD.`}
          </div>
        )}
        {f.error && <div className="error">{f.error}</div>}
      </div>
      {!f.p.address ? (
        <Connect p={f.p} />
      ) : (
        <div className="panel-row">
          <span className="prompt">❯</span>
          <span className="dim">GET /api/fortune</span>
          <span className="spacer" />
          <button
            className="button"
            disabled={f.buying || f.p.funding}
            onClick={f.buy}
            type="button"
          >
            {f.buying
              ? "Paying…"
              : f.bought > 0
                ? `Buy another · ${price}`
                : `Buy a fortune · ${price}`}
          </button>
        </div>
      )}
      {f.p.address && <PayerRow busy={f.buying} p={f.p} />}
    </section>
  );
}

function Methods() {
  return (
    <section className="methods">
      <div className="label">Supported methods</div>
      {methods.map(([name, href]) => (
        <a className="method" href={href} key={name}>
          <span className="method-name">{name}</span>
          <span className="dim">Docs →</span>
        </a>
      ))}
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
          Explain code
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

function useDemo() {
  const [error, setError] = useState<string>();
  const p = useWallet(setError);
  const [buying, setBuying] = useState(false);
  const [bought, setBought] = useState(0);
  const [spent, setSpent] = useState(0n);
  const [fortune, setFortune] = useState<{
    fortune: string;
    lucky: number[];
    transaction: string | undefined;
  }>();

  async function buy() {
    setError(undefined);
    setBuying(true);
    try {
      const [Pay, { Receipt }] = await Promise.all([loadPay(), loadCore()]);
      const mppx = Pay.create({
        fetch: globalThis.fetch.bind(globalThis),
        maxAmount: BigInt(Math.round(Number(price) * 1e6)),
        wallet: await p.payer(),
      });
      // One call: the 402 comes back, mppx pays it and retries.
      const response = await mppx.fetch(
        `${location.origin + basePath}api/fortune`,
      );
      if (!response.ok)
        throw new Error(`The server answered ${response.status}.`);
      const transaction = response.headers.has("payment-receipt")
        ? Receipt.fromResponse(response).reference
        : undefined;
      setFortune({ ...(await response.json()), transaction });
      setBought((n) => n + 1);
      setSpent((n) => n + BigInt(Math.round(Number(price) * 1e6)));
    } catch (e) {
      setError(message(e));
    } finally {
      setBuying(false);
      p.refreshBalance();
    }
  }

  return { bought, buy, buying, error, fortune, p, spent };
}
