import code from "virtual:discovery-code";
import { useEffect, useMemo, useState } from "react";

import { CodeLines, Lines } from "../../shared/CodeLines.js";
import { message, Nav, ousdText, PanelHead, Stat } from "../../shared/ui.js";
import type { ObjectSchema, Schema } from "../services.js";
import { client, documentNotes, notes } from "./samples.js";

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
  schema: ObjectSchema;
  slug: string;
  title: string;
  url: string;
};

export function App() {
  const f = useDemo();
  return (
    <>
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
          {f.selected && <ServicePanel listing={f.selected} />}
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
              onClick={() => f.setSelectedSlug(slug)}
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

/** What a client reads from the selected service's document: its operation, price and fields. */
function ServicePanel({ listing }: { listing: Listing }) {
  return (
    <section className="panel">
      <PanelHead name={listing.title}>
        <span className="status" data-phase="idle">
          {listing.categories.join(" · ")}
        </span>
      </PanelHead>
      <div className="meter">
        <dl className="stats">
          <Stat
            label="Price (OUSD)"
            value={listing.offer ? ousdText(listing.offer.amount) : "Free"}
          />
          <Stat label="Method" value={listing.offer?.method ?? "none"} />
          <Stat label="Intent" value={listing.offer?.intent ?? "none"} />
          <Stat
            label="Fields"
            value={String(Object.keys(listing.schema.properties).length)}
          />
        </dl>
      </div>
      <div className="panel-row">
        <span className="prompt">❯</span>
        <span className="dim">
          {listing.method.toUpperCase()} {listing.url}
          {listing.path}
        </span>
      </div>
      <dl className="schema-fields">
        {Object.entries(listing.schema.properties).map(([name, field]) => (
          <div className="schema-field" key={name}>
            <dt>
              {name}
              {listing.schema.required.includes(name) && (
                <span className="prompt">*</span>
              )}
            </dt>
            <dd className="dim">{describe(field)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** A field's type and limits in a few words, such as integer 1–7. */
function describe(field: Schema) {
  if (field.type === "string" && field.enum) return field.enum.join(" | ");
  if (field.type === "string")
    return field.maxLength === undefined
      ? "string"
      : `string ≤ ${field.maxLength}`;
  if (field.type === "integer" || field.type === "number") {
    if (field.minimum === undefined || field.maximum === undefined)
      return field.type;
    return `${field.type} ${field.minimum}–${field.maximum}`;
  }
  if (field.type === "boolean") return "boolean";
  if (field.type !== "array") return field.type;
  return `[${field.items.enum.join(" | ")}]${field.maxItems === undefined ? "" : ` ≤ ${field.maxItems}`}`;
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
  return {
    categories: doc["x-service-info"]?.categories ?? [],
    description: operation?.description ?? operation?.summary ?? "",
    doc,
    method: method ?? "post",
    offer,
    path: path ?? "/",
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
  const [urls, setUrls] = useState<{ slug: string; url: string }[]>();
  const [registryError, setRegistryError] = useState<string>();
  const [listings, setListings] = useState<Record<string, Listing>>({});
  const [selectedSlug, setSelectedSlug] = useState<string>();

  // Discover: the registry, then every service's document, in parallel. No wallet, no payment.
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

  const selected = selectedSlug ? listings[selectedSlug] : undefined;
  return {
    listings,
    registryError,
    selected,
    selectedSlug,
    setSelectedSlug,
    urls,
  };
}
