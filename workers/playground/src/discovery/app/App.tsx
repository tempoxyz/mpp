import code from "virtual:discovery-code";
import { useEffect, useMemo, useRef, useState } from "react";

import { CodeLines, Lines } from "../../shared/CodeLines.js";
import { Bridge, Connect, PayerRow } from "../../shared/Payer.js";
import {
  explorer,
  message,
  Nav,
  ousdText,
  PanelHead,
  short,
} from "../../shared/ui.js";
import { loadPay, useWallet } from "../../shared/useWallet.js";
import type { ObjectSchema, Schema } from "../services.js";
import { defaults } from "../services.js";
import { client, documentNotes, notes } from "./samples.js";

const loadCore = () => import("mppx");

/** Where mpp.dev serves the playground, with a trailing slash. */
const basePath = `${import.meta.env.BASE_URL}discovery/`;

type Offer = {
  amount: string;
  currency: string;
  description?: string;
  intent: string;
  method: string;
};

/** What the page learned about one service, only from its discovery document. */
type Listing = {
  categories: string[];
  description: string;
  doc: Record<string, unknown>;
  method: string;
  offer: Offer | undefined;
  path: string;
  responseType: string;
  schema: ObjectSchema;
  slug: string;
  title: string;
  url: string;
};

type Hop = { line: string; status: number };
type Output =
  | { kind: "json"; text: string }
  | { kind: "svg"; url: string }
  | { kind: "error"; text: string };

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
            <h1 className="title">Discovery</h1>
            <p className="lede">
              Find paid APIs and what they cost before you pay. Every service
              publishes its prices and request schema in an OpenAPI document.
            </p>
          </div>
          <Registry f={f} />
          {f.selected && <ServicePanel f={f} listing={f.selected} />}
          <a className="link" href="https://mpp.dev/extensions/discovery">
            Read the docs →
          </a>
        </main>
        <aside>
          <div className="code-stack">
            <CodePanel name="client.ts" source={client} />
            <DocumentPanel listing={f.selected} />
          </div>
        </aside>
      </div>
    </>
  );
}

type Demo = ReturnType<typeof useDemo>;

/** Every service the registry lists, with the price each one's document advertises. */
function Registry({ f }: { f: Demo }) {
  return (
    <section className="panel">
      <PanelHead name="registry">
        <span className="status" data-phase="idle">
          {f.registryError
            ? "Unavailable"
            : f.urls === undefined
              ? "Loading"
              : `${f.urls.length} services`}
        </span>
      </PanelHead>
      <div className="directory">
        {f.urls === undefined && !f.registryError && (
          <div className="placeholder directory-empty">GET /api/registry…</div>
        )}
        {f.registryError && (
          <div className="error directory-empty">{f.registryError}</div>
        )}
        {f.urls?.map(({ slug, url }) => {
          const listing = f.listings[slug];
          return (
            <button
              aria-pressed={f.selectedSlug === slug}
              className="service"
              disabled={!listing}
              key={slug}
              onClick={() => f.select(slug)}
              type="button"
            >
              <span className="service-main">
                <span className="service-title">{listing?.title ?? url}</span>
                <span className="dim service-summary">
                  {listing ? listing.description : `GET ${url}/openapi.json…`}
                </span>
              </span>
              {listing?.offer && (
                <span className="service-price">
                  {ousdText(listing.offer.amount)} OUSD
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** The selected service: a form built from its schema, and the paid call. */
function ServicePanel({ f, listing }: { f: Demo; listing: Listing }) {
  const values = f.values[listing.slug] ?? defaults(listing.schema);
  const set = (name: string, value: unknown) =>
    f.setValues({ ...f.values, [listing.slug]: { ...values, [name]: value } });
  return (
    <section className="panel">
      <PanelHead name={listing.title}>
        <span className="status" data-phase={f.calling ? "busy" : "idle"}>
          {f.calling ? "Paying" : listing.categories.join(" · ")}
        </span>
      </PanelHead>
      <div className="panel-body form-body">
        {Object.entries(listing.schema.properties).map(([name, field]) => (
          <Field
            field={field}
            key={name}
            name={name}
            onChange={(value) => set(name, value)}
            required={listing.schema.required.includes(name)}
            value={values[name]}
          />
        ))}
      </div>
      {!f.p.address ? (
        <Connect p={f.p} />
      ) : (
        <div className="panel-row">
          <span className="prompt">❯</span>
          <span className="dim">
            {listing.method.toUpperCase()} {listing.path}
          </span>
          <span className="spacer" />
          <button
            className="button"
            disabled={f.calling || !listing.offer}
            onClick={() => f.call(listing, values)}
            type="button"
          >
            {f.calling
              ? "Paying…"
              : `Pay ${listing.offer ? ousdText(listing.offer.amount) : ""} & call`}
          </button>
        </div>
      )}
      {f.output && (
        <div className="panel-body result-body">
          {f.output?.kind === "svg" && (
            <img
              alt="The avatar the service drew"
              className="output-image"
              src={f.output.url}
            />
          )}
          {f.output?.kind === "json" && (
            <pre className="output-json">{f.output.text}</pre>
          )}
          {f.output?.kind === "error" && (
            <div className="error">{f.output.text}</div>
          )}
          {f.receipt && (
            <div className="dim">
              Paid ·{" "}
              <a
                className="link"
                href={`${explorer}/tx/${f.receipt}`}
                rel="noreferrer"
                target="_blank"
              >
                {short(f.receipt)}
              </a>
            </div>
          )}
        </div>
      )}
      {f.p.address && <PayerRow busy={f.calling} p={f.p} />}
    </section>
  );
}

/** One form control, chosen by the field's JSON Schema type. */
function Field({
  field,
  name,
  onChange,
  required,
  value,
}: {
  field: Schema;
  name: string;
  onChange: (value: unknown) => void;
  required: boolean;
  value: unknown;
}) {
  return (
    <div className="field">
      <div className="field-label">
        <span>
          {name}
          {required && <span className="prompt">*</span>}
        </span>
      </div>
      <Control field={field} onChange={onChange} value={value} />
    </div>
  );
}

function Control({
  field,
  onChange,
  value,
}: {
  field: Schema;
  onChange: (value: unknown) => void;
  value: unknown;
}) {
  if (field.type === "string" && field.enum)
    return (
      <div className="segments">
        {field.enum.map((option) => (
          <button
            aria-pressed={value === option}
            className="segment"
            key={option}
            onClick={() => onChange(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
    );
  if (field.type === "string")
    return (
      <input
        className="input field-input"
        maxLength={field.maxLength}
        onChange={(e) => onChange(e.target.value)}
        value={String(value ?? "")}
      />
    );
  if (field.type === "integer" || field.type === "number")
    return (
      <input
        className="input field-input"
        max={field.maximum}
        min={field.minimum}
        onChange={(e) =>
          onChange(e.target.value === "" ? undefined : Number(e.target.value))
        }
        step={field.type === "integer" ? 1 : "any"}
        type="number"
        value={value === undefined ? "" : String(value)}
      />
    );
  if (field.type === "boolean")
    return (
      <div className="segments">
        {[true, false].map((option) => (
          <button
            aria-pressed={value === option}
            className="segment"
            key={String(option)}
            onClick={() => onChange(option)}
            type="button"
          >
            {String(option)}
          </button>
        ))}
      </div>
    );
  if (field.type !== "array") return null;
  // An array of choices: add one per click, remove by clicking it.
  const list = Array.isArray(value) ? (value as string[]) : [];
  return (
    <div className="array">
      <div className="segments">
        {list.map((item, i) => (
          <button
            className="segment chip"
            // biome-ignore lint/suspicious/noArrayIndexKey: items repeat
            key={i}
            onClick={() => onChange(list.filter((_, j) => j !== i))}
            type="button"
          >
            {item} ×
          </button>
        ))}
        {list.length === 0 && <span className="dim">empty</span>}
      </div>
      <div className="segments">
        {field.items.enum.map((option) => (
          <button
            className="segment"
            disabled={
              field.maxItems !== undefined && list.length >= field.maxItems
            }
            key={option}
            onClick={() => onChange([...list, option])}
            type="button"
          >
            + {option}
          </button>
        ))}
      </div>
    </div>
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

/** The selected service's live discovery document, or the seller's code. */
function DocumentPanel({ listing }: { listing: Listing | undefined }) {
  const [explain, setExplain] = useState(false);
  const json = useMemo(
    () => (listing ? JSON.stringify(listing.doc, null, 2) : ""),
    [listing],
  );
  return (
    <section className="panel code">
      <PanelHead
        name={listing ? `${listing.slug}/openapi.json` : "openapi.json"}
      >
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
        {listing ? (
          <Lines
            explain={explain}
            notes={documentNotes}
            rows={highlightJson(json)}
            source={json}
          />
        ) : (
          <pre className="code-lines code-plain dim">
            Pick a service to see its discovery document.
          </pre>
        )}
      </div>
    </section>
  );
}

/** JSON as rows of tokens: keys, strings, numbers and literals get their own color class. */
function highlightJson(json: string) {
  return json.split("\n").map((line) => {
    const tokens: { color: string | undefined; text: string }[] = [];
    const pattern =
      /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b/g;
    let last = 0;
    for (const match of line.matchAll(pattern)) {
      if (match.index > last)
        tokens.push({ color: undefined, text: line.slice(last, match.index) });
      if (match[1] !== undefined) {
        const key = match[2] !== undefined;
        const special = key && /^"x-/.test(match[1]);
        tokens.push({
          color: special ? "jx" : key ? "jk" : "js",
          text: match[1],
        });
        if (match[2]) tokens.push({ color: undefined, text: match[2] });
      } else if (match[3] !== undefined)
        tokens.push({ color: "jn", text: match[3] });
      else tokens.push({ color: "jb", text: match[4]! });
      last = match.index + match[0].length;
    }
    if (last < line.length)
      tokens.push({ color: undefined, text: line.slice(last) });
    return tokens;
  });
}

/** Reads a discovery document into what the page shows: its one paid operation. */
function parse(slug: string, url: string, doc: any): Listing {
  const [path, operations] = Object.entries<any>(doc.paths ?? {})[0] ?? [];
  const [method, operation] = Object.entries<any>(operations ?? {})[0] ?? [];
  const offer = operation?.["x-payment-info"]?.offers?.[0] as Offer | undefined;
  const ok = operation?.responses?.["200"]?.content ?? {};
  return {
    categories: doc["x-service-info"]?.categories ?? [],
    description: operation?.description ?? operation?.summary ?? "",
    doc,
    method: method ?? "post",
    offer,
    path: path ?? "/",
    responseType: Object.keys(ok)[0] ?? "application/json",
    schema: operation?.requestBody?.content?.["application/json"]?.schema ?? {
      additionalProperties: false,
      properties: {},
      required: [],
      type: "object",
    },
    slug,
    title: doc.info?.title ?? slug,
    url,
  };
}

function useDemo() {
  const [error, setError] = useState<string>();
  const p = useWallet(setError);
  const [urls, setUrls] = useState<{ slug: string; url: string }[]>();
  const [registryError, setRegistryError] = useState<string>();
  const [listings, setListings] = useState<Record<string, Listing>>({});
  const [selectedSlug, setSelectedSlug] = useState<string>();
  const [values, setValues] = useState<Record<string, Record<string, unknown>>>(
    {},
  );
  const [calling, setCalling] = useState(false);
  const [hops, setHops] = useState<Hop[]>([]);
  const hopsRef = useRef<Hop[]>([]);
  const [output, setOutput] = useState<Output>();
  const [receipt, setReceipt] = useState<string>();

  // Discover: the registry, then every service's document, in parallel.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`${basePath}api/registry`);
        if (!response.ok)
          throw new Error(`registry answered ${response.status}`);
        const { services } = (await response.json()) as {
          services: { slug: string; url: string }[];
        };
        if (cancelled) return;
        setUrls(services);
        setSelectedSlug((current) => current ?? services[0]?.slug);
        await Promise.all(
          services.map(async ({ slug, url }) => {
            const doc = await fetch(`${url}/openapi.json`).then((r) =>
              r.json(),
            );
            if (!cancelled)
              setListings((all) => ({ ...all, [slug]: parse(slug, url, doc) }));
          }),
        );
      } catch (e) {
        if (!cancelled)
          setRegistryError(`Couldn't load the registry: ${message(e)}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function select(slug: string) {
    setSelectedSlug(slug);
    hopsRef.current = [];
    setHops([]);
    setOutput(undefined);
    setReceipt(undefined);
  }

  const tracedFetch: typeof globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    const response = await fetch(request);
    const paid = request.headers.get("authorization")?.startsWith("Payment ");
    hopsRef.current = [
      ...hopsRef.current,
      {
        line: `${request.method} ${new URL(request.url).pathname.replace(basePath, "/")}${paid ? "  + Credential" : ""}`,
        status: response.status,
      },
    ];
    setHops(hopsRef.current);
    return response;
  };

  async function call(listing: Listing, body: Record<string, unknown>) {
    setError(undefined);
    setCalling(true);
    hopsRef.current = [];
    setHops([]);
    setOutput(undefined);
    setReceipt(undefined);
    try {
      const [Pay, { Receipt }] = await Promise.all([loadPay(), loadCore()]);
      const mppx = Pay.create({
        fetch: tracedFetch,
        // Discovery is advisory: refuse a 402 above the advertised price.
        maxAmount: listing.offer ? BigInt(listing.offer.amount) : undefined,
        wallet: await p.payer(),
      });
      const response = await mppx.fetch(
        `${location.origin}${listing.url}${listing.path}`,
        {
          body: JSON.stringify(body),
          headers: { "content-type": "application/json" },
          method: listing.method.toUpperCase(),
        },
      );
      if (!response.ok) {
        const text = await response.text();
        let detail = text;
        try {
          detail = (JSON.parse(text) as { error?: string }).error ?? text;
        } catch {}
        setOutput({ kind: "error", text: `${response.status}: ${detail}` });
        return;
      }
      if (response.headers.has("payment-receipt"))
        setReceipt(Receipt.fromResponse(response).reference);
      if (response.headers.get("content-type")?.includes("svg"))
        setOutput({
          kind: "svg",
          url: URL.createObjectURL(await response.blob()),
        });
      else
        setOutput({
          kind: "json",
          text: JSON.stringify(await response.json(), null, 2),
        });
    } catch (e) {
      setOutput({ kind: "error", text: message(e) });
    } finally {
      setCalling(false);
      p.refreshBalance();
    }
  }

  const selected = selectedSlug ? listings[selectedSlug] : undefined;
  return {
    call,
    calling,
    error,
    hops,
    listings,
    output,
    p,
    receipt,
    registryError,
    select,
    selected,
    selectedSlug,
    setValues,
    urls,
    values,
  };
}
