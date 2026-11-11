import code from "virtual:charge-code";
import { useRef, useState } from "react";

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

/** One line of what a message carried. */
type Field = { href?: string | undefined; label: string; value: string };
/** One HTTP message of the round trip. */
type Step = {
  fields: Field[];
  /** What happened, in a few words. */
  headline: string;
  kind: "request" | "challenge" | "credential" | "receipt" | "error";
  /** The request or status line, as the wire shows it. */
  line: string;
};

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
          <RoundTrip f={f} />
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
      <PanelHead name="charge">
        <span className="status" data-phase={f.buying ? "busy" : "idle"}>
          {f.buying ? "Paying" : f.bought > 0 ? "Paid" : "Ready"}
        </span>
      </PanelHead>
      <div className="meter">
        <dl className="stats">
          <Stat label="Price" value={`${price} OUSD`} />
          <Stat label="Bought" value={String(f.bought)} />
          <Stat label="Spent" value={ousdText(f.spent)} />
          <Stat label="Transactions" value={String(f.transactions)} />
        </dl>
      </div>
      <div className="panel-body story-body">
        {f.fortune ? (
          <div className="fortune">
            <p className="story">“{f.fortune.fortune}”</p>
            <div className="dim">
              Lucky numbers {f.fortune.lucky.join(" · ")}
            </div>
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

/** The last purchase, message by message: price, payment, proof. */
function RoundTrip({ f }: { f: Demo }) {
  if (f.steps.length === 0) return null;
  return (
    <section className="trip">
      <div className="label">Round trip</div>
      {f.steps.map((step, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: steps never reorder
        <div className="trip-step" data-kind={step.kind} key={i}>
          <div className="trip-head">
            <span className="trip-index">{i + 1}</span>
            <span className="trip-headline">{step.headline}</span>
          </div>
          <div className="trip-line">{step.line}</div>
          {step.fields.length > 0 && (
            <dl className="trip-fields">
              {step.fields.map((field) => (
                <div key={field.label}>
                  <dt>{field.label}</dt>
                  <dd>
                    {field.href ? (
                      <a
                        className="link"
                        href={field.href}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {field.value}
                      </a>
                    ) : (
                      field.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      ))}
      {f.bought > 0 && (
        <p className="trip-note dim">
          {f.bought} {f.bought === 1 ? "purchase" : "purchases"},{" "}
          {f.transactions}{" "}
          {f.transactions === 1 ? "transaction" : "transactions"}. Paying per
          word or per token instead?{" "}
          <a className="link" href={`${import.meta.env.BASE_URL}session/`}>
            Try sessions →
          </a>
        </p>
      )}
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
  const [transactions, setTransactions] = useState(0);
  const [fortune, setFortune] = useState<{
    fortune: string;
    lucky: number[];
  }>();
  const [steps, setSteps] = useState<Step[]>([]);
  const stepsRef = useRef<Step[]>([]);

  function record(step: Step) {
    stepsRef.current = [...stepsRef.current, step];
    setSteps(stepsRef.current);
  }

  // Shows each HTTP hop as the protocol message it carries.
  const tracedFetch: typeof globalThis.fetch = async (input, init) => {
    const { Challenge, Credential, Receipt } = await loadCore();
    const request = new Request(input, init);
    const path = new URL(request.url).pathname.replace(basePath, "/");
    const authorization = request.headers.get("authorization");
    if (authorization?.startsWith("Payment ")) {
      const credential = Credential.deserialize<{ type?: string }>(
        authorization,
      );
      record({
        fields: [
          {
            label: "Pays",
            value: `Challenge ${short(credential.challenge.id)}`,
          },
          {
            label: "Payload",
            value:
              credential.payload.type === "hash"
                ? "a transaction the client already sent"
                : "a signed transfer for the server to send",
          },
          ...(credential.source
            ? [
                {
                  label: "From",
                  value: short(credential.source.split(":").at(-1)!),
                },
              ]
            : []),
        ],
        headline: "The client pays exactly that",
        kind: "credential",
        line: `${request.method} ${path}  Authorization: Payment …`,
      });
    } else {
      record({
        fields: [],
        headline: "The client asks for a fortune",
        kind: "request",
        line: `${request.method} ${path}`,
      });
    }
    const response = await fetch(request);
    if (response.status === 402) {
      const challenge = Challenge.fromResponse(response);
      const req = challenge.request as {
        amount?: string;
        recipient?: string;
      };
      const expires = challenge.expires
        ? Math.round((Date.parse(challenge.expires) - Date.now()) / 60_000)
        : undefined;
      record({
        fields: [
          { label: "Amount", value: `${ousdText(req.amount ?? "0")} OUSD` },
          ...(req.recipient
            ? [
                {
                  href: `${explorer}/address/${req.recipient}`,
                  label: "Pay to",
                  value: short(req.recipient),
                },
              ]
            : []),
          {
            label: "Method",
            value: `${challenge.method} · ${challenge.intent}`,
          },
          ...(expires !== undefined
            ? [{ label: "Expires", value: `in ${expires} min` }]
            : []),
        ],
        headline: "The server names its price",
        kind: "challenge",
        line: "402 Payment Required  WWW-Authenticate: Payment …",
      });
    } else if (response.ok && response.headers.has("payment-receipt")) {
      const receipt = Receipt.fromResponse(response);
      record({
        fields: [
          { label: "Status", value: receipt.status },
          {
            href: `${explorer}/tx/${receipt.reference}`,
            label: "Transaction",
            value: short(receipt.reference),
          },
          {
            label: "Settled",
            value: new Date(receipt.timestamp).toLocaleTimeString(),
          },
        ],
        headline: "The server delivers, with proof",
        kind: "receipt",
        line: "200 OK  Payment-Receipt: …",
      });
    } else if (!response.ok) {
      record({
        fields: [],
        headline: "The server refused",
        kind: "error",
        line: `${response.status} ${response.statusText}`,
      });
    }
    return response;
  };

  async function buy() {
    setError(undefined);
    setBuying(true);
    stepsRef.current = [];
    setSteps([]);
    try {
      const Pay = await loadPay();
      const mppx = Pay.create({
        fetch: tracedFetch,
        maxAmount: BigInt(Math.round(Number(price) * 1e6)),
        wallet: await p.payer(),
      });
      const response = await mppx.fetch(
        `${location.origin + basePath}api/fortune`,
      );
      if (!response.ok)
        throw new Error(`The server answered ${response.status}.`);
      setFortune(await response.json());
      setBought((n) => n + 1);
      setTransactions((n) => n + 1);
      setSpent((n) => n + BigInt(Math.round(Number(price) * 1e6)));
    } catch (e) {
      setError(message(e));
    } finally {
      setBuying(false);
      p.refreshBalance();
    }
  }

  return {
    bought,
    buy,
    buying,
    error,
    fortune,
    p,
    spent,
    steps,
    transactions,
  };
}
