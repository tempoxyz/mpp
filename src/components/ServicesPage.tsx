"use client";

import { useState } from "react";
import type { Category, Endpoint, Service } from "../data/registry";
import { services } from "../data/registry";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<Category, string> = {
  ai: "AI",
  blockchain: "Blockchain",
  compute: "Compute",
  data: "Data",
  media: "Media",
  search: "Search",
  social: "Social",
  storage: "Storage",
  web: "Web",
};

const STATUS_COLORS: Record<string, string> = {
  active: "#16a34a",
  beta: "#2563eb",
  deprecated: "#dc2626",
  maintenance: "#d97706",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function allCategories(s: Service): Category[] {
  const cats: Category[] = [];
  if (s.category) cats.push(s.category);
  if (s.categories) {
    for (const c of s.categories) {
      if (!cats.includes(c)) cats.push(c);
    }
  }
  return cats;
}

function formatPrice(ep: Endpoint): string {
  const p = ep.payment;
  if (!p) return "Free";
  if (!p.amount) return p.description ?? "Paid";
  const value = Number(p.amount) / 10 ** (p.decimals ?? 0);
  if (value < 0.01) return `$${value.toFixed(4)}`;
  if (value < 1) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PAGE_SIZE = 25;

export function ServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);

  const categories = [
    ...new Set(services.flatMap((s) => allCategories(s))),
  ].sort() as Category[];

  const filtered = services.filter((s) => {
    if (selectedCategory) {
      if (!allCategories(s).includes(selectedCategory)) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggle = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div
      className="not-prose"
      style={{
        color: "var(--vocs-text-color-heading)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <PageStyles />

      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "2.5rem 1.5rem 4rem",
        }}
      >
        {/* Header */}
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 500,
            letterSpacing: "-0.02em",
            marginBottom: "0.375rem",
          }}
        >
          Services
        </h1>
        <p
          style={{
            color: "var(--vocs-text-color-secondary)",
            fontSize: 15,
            lineHeight: 1.5,
            marginBottom: "2rem",
          }}
        >
          MPP-enabled APIs your agent or application can pay for with
          stablecoins.
        </p>

        {/* Category pills */}
        <div
          style={{
            display: "flex",
            gap: "0.375rem",
            flexWrap: "wrap",
            marginBottom: "1.5rem",
          }}
        >
          <Pill
            active={!selectedCategory}
            onClick={() => { setSelectedCategory(null); setPage(0); }}
          >
            All
          </Pill>
          {categories.map((cat) => (
            <Pill
              key={cat}
              active={selectedCategory === cat}
              onClick={() => {
                setSelectedCategory(selectedCategory === cat ? null : cat);
                setPage(0);
              }}
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </Pill>
          ))}
        </div>

        {/* Table */}
        <div data-services-table style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--vocs-border-color-primary)",
                }}
              >
                <Th style={{ textAlign: "left" }}>Service</Th>
                <Th className="hide-mobile" style={{ textAlign: "left" }}>
                  URL
                </Th>
                <Th style={{ textAlign: "left", width: 100 }}>Category</Th>
                <Th style={{ width: 36 }} />
              </tr>
            </thead>
            <tbody>
              {paged.map((s) => (
                <ServiceRow
                  key={s.id}
                  service={s}
                  expanded={expandedIds.has(s.id)}
                  onToggle={() => toggle(s.id)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <p
            style={{
              textAlign: "center",
              padding: "3rem 0",
              color: "var(--vocs-text-color-secondary)",
              fontSize: 14,
            }}
          >
            No services match your search.
          </p>
        )}

        {/* Pagination + count */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "1rem",
          }}
        >
          <p
            style={{
              color: "var(--vocs-text-color-secondary)",
              fontSize: 13,
            }}
          >
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length} services
          </p>

          {totalPages > 1 && (
            <div style={{ display: "flex", gap: "0.375rem" }}>
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                style={{
                  padding: "0.25rem 0.625rem",
                  fontSize: 13,
                  borderRadius: 6,
                  border: "1px solid var(--vocs-border-color-primary)",
                  background: "transparent",
                  color: page === 0 ? "var(--vocs-text-color-muted)" : "var(--vocs-text-color-secondary)",
                  cursor: page === 0 ? "default" : "pointer",
                  fontFamily: "var(--font-sans)",
                }}
              >
                ← Prev
              </button>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
                style={{
                  padding: "0.25rem 0.625rem",
                  fontSize: 13,
                  borderRadius: 6,
                  border: "1px solid var(--vocs-border-color-primary)",
                  background: "transparent",
                  color: page >= totalPages - 1 ? "var(--vocs-text-color-muted)" : "var(--vocs-text-color-secondary)",
                  cursor: page >= totalPages - 1 ? "default" : "pointer",
                  fontFamily: "var(--font-sans)",
                }}
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Presto section */}
        <div
          style={{
            marginTop: "4rem",
            borderTop: "1px solid var(--vocs-border-color-primary)",
            paddingTop: "2.5rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 500,
              letterSpacing: "-0.02em",
              marginBottom: "0.375rem",
            }}
          >
            Presto
          </h2>
          <p
            style={{
              color: "var(--vocs-text-color-secondary)",
              fontSize: 15,
              lineHeight: 1.5,
              marginBottom: "1.5rem",
              maxWidth: 640,
            }}
          >
            <code style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>presto</code> is
            a command-line tool for making HTTP requests with automatic payment
            support. When you request a resource that requires payment,{" "}
            <code style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>presto</code> detects
            the <code style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>402</code> response,
            fulfills the payment, and retries—all in a single command.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Install */}
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, marginBottom: "0.375rem" }}>
                Install
              </p>
              <pre
                style={{
                  margin: 0,
                  padding: 0,
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  overflowX: "auto",
                  lineHeight: 1.5,
                }}
              >
                <code>
                  <span style={{ color: "var(--vocs-text-color-secondary)" }}>$ </span>
                  curl -fsSL https://presto-binaries.tempo.xyz/install.sh | bash
                </code>
              </pre>
            </div>

            {/* Log in */}
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, marginBottom: "0.375rem" }}>
                Log in
              </p>
              <p
                style={{
                  color: "var(--vocs-text-color-secondary)",
                  fontSize: 13,
                  lineHeight: 1.5,
                  marginBottom: "0.375rem",
                }}
              >
                Connect your Tempo wallet. This opens your browser to authenticate
                and stores credentials locally.
              </p>
              <pre
                style={{
                  margin: 0,
                  padding: 0,
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  overflowX: "auto",
                  lineHeight: 1.5,
                }}
              >
                <code>
                  <span style={{ color: "var(--vocs-text-color-secondary)" }}>$ </span>
                  presto login
                </code>
              </pre>
            </div>

            {/* Make a request */}
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, marginBottom: "0.375rem" }}>
                Make a paid request
              </p>
              <p
                style={{
                  color: "var(--vocs-text-color-secondary)",
                  fontSize: 13,
                  lineHeight: 1.5,
                  marginBottom: "0.375rem",
                }}
              >
                Query any service above. Payment is handled automatically.
              </p>
              <pre
                style={{
                  margin: 0,
                  padding: 0,
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  overflowX: "auto",
                  lineHeight: 1.5,
                }}
              >
                <code>
                  <span style={{ color: "var(--vocs-text-color-secondary)" }}>$ </span>
                  {`presto https://mpp.tempo.xyz/openai/v1/chat/completions \\
    -X POST --json '{"model":"gpt-4o","messages":[{"role":"user","content":"Hello!"}]}'`}
                </code>
              </pre>
            </div>

            {/* Preview */}
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, marginBottom: "0.375rem" }}>
                Preview before paying
              </p>
              <p
                style={{
                  color: "var(--vocs-text-color-secondary)",
                  fontSize: 13,
                  lineHeight: 1.5,
                  marginBottom: "0.375rem",
                }}
              >
                Use dry-run mode to see what a request costs without executing
                payment.
              </p>
              <pre
                style={{
                  margin: 0,
                  padding: 0,
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  overflowX: "auto",
                  lineHeight: 1.5,
                }}
              >
                <code>
                  <span style={{ color: "var(--vocs-text-color-secondary)" }}>$ </span>
                  presto --dry-run https://mpp.tempo.xyz/openai/v1/chat/completions
                </code>
              </pre>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "0.25rem 0.625rem",
        fontSize: 13,
        borderRadius: 6,
        border: "1px solid var(--vocs-border-color-primary)",
        background: active ? "var(--vocs-text-color-heading)" : "transparent",
        color: active
          ? "var(--vocs-background-color-primary)"
          : "var(--vocs-text-color-secondary)",
        cursor: "pointer",
        fontFamily: "var(--font-sans)",
        lineHeight: 1.4,
        transition: "background 0.15s, color 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function Th({
  children,
  style,
  className,
}: {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <th
      className={className}
      style={{
        padding: "0.5rem 0.75rem",
        fontSize: 12,
        fontWeight: 500,
        color: "var(--vocs-text-color-secondary)",
        textTransform: "uppercase" as const,
        letterSpacing: "0.05em",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </th>
  );
}

function ServiceRow({
  service: s,
  expanded,
  onToggle,
}: {
  service: Service;
  expanded: boolean;
  onToggle: () => void;
}) {
  const cats = allCategories(s);

  return (
    <>
      <tr
        onClick={onToggle}
        style={{
          borderBottom: expanded
            ? "none"
            : "1px solid var(--vocs-border-color-primary)",
          cursor: "pointer",
          transition: "background 0.1s",
          background: expanded
            ? "var(--vocs-background-color-surfaceMuted)"
            : undefined,
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background =
            "var(--vocs-background-color-surfaceMuted)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = expanded
            ? "var(--vocs-background-color-surfaceMuted)"
            : "transparent")
        }
      >
        {/* Name + description */}
        <td style={{ padding: "0.625rem 0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontWeight: 500 }}>{s.name}</span>
            {s.status && s.status !== "active" && (
              <StatusDot status={s.status} />
            )}
          </div>
          <div
            className="hide-mobile"
            style={{
              color: "var(--vocs-text-color-secondary)",
              fontSize: 13,
              marginTop: 2,
              lineHeight: 1.4,
            }}
          >
            {s.description}
          </div>
        </td>

        {/* URL */}
        <td
          className="hide-mobile"
          style={{
            padding: "0.625rem 0.75rem",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: "var(--vocs-text-color-secondary)",
          }}
        >
          {s.url}
        </td>

        {/* Category */}
        <td style={{ padding: "0.625rem 0.75rem" }}>
          {cats[0] && (
            <span
              style={{
                fontSize: 12,
                padding: "0.125rem 0.5rem",
                borderRadius: 4,
                border: "1px solid var(--vocs-border-color-primary)",
                color: "var(--vocs-text-color-secondary)",
                whiteSpace: "nowrap",
              }}
            >
              {CATEGORY_LABELS[cats[0]] ?? cats[0]}
            </span>
          )}
        </td>

        {/* Chevron */}
        <td
          style={{
            padding: "0.625rem 0.75rem",
            textAlign: "center",
            color: "var(--vocs-text-color-secondary)",
          }}
        >
          <span
            style={{
              display: "inline-block",
              transition: "transform 0.15s",
              transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
              fontSize: 12,
            }}
          >
            ▸
          </span>
        </td>
      </tr>

      {/* Expanded detail */}
      {expanded && (
        <tr
          style={{
            background: "var(--vocs-background-color-surfaceMuted)",
          }}
        >
          <td
            colSpan={4}
            style={{
              padding: "0 0.75rem 0.75rem",
              borderBottom: "1px solid var(--vocs-border-color-primary)",
            }}
          >
            <ExpandedDetail service={s} />
          </td>
        </tr>
      )}
    </>
  );
}

function ExpandedDetail({ service: s }: { service: Service }) {
  const methods = Object.keys(s.methods);
  const intents = [
    ...new Set(Object.values(s.methods).flatMap((m) => m.intents)),
  ];

  return (
    <div
      style={{ fontSize: 13 }}
    >
      {/* Meta row */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1.5rem",
          marginBottom: s.endpoints.length > 0 ? "1rem" : 0,
          color: "var(--vocs-text-color-secondary)",
          lineHeight: 1.5,
        }}
      >
        <MetaItem label="URL">
          <code
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
            }}
          >
            {s.url}
          </code>
        </MetaItem>
        {s.serviceUrl && (
          <MetaItem label="Upstream">
            <a
              href={s.serviceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "var(--vocs-text-color-heading)",
                textDecoration: "underline",
                textUnderlineOffset: 2,
              }}
            >
              {new URL(s.serviceUrl).host}
            </a>
          </MetaItem>
        )}
        <MetaItem label="Payment">
          {methods.join(", ")} ({intents.join(", ")})
        </MetaItem>
        {s.integration && (
          <MetaItem label="Type">
            {s.integration === "first-party" ? "First-party" : "Third-party"}
          </MetaItem>
        )}
      </div>

      {/* Endpoints */}
      {s.endpoints.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--vocs-text-color-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "0.5rem",
            }}
          >
            Endpoints
          </div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <tbody>
              {s.endpoints.map((ep) => (
                <tr
                  key={`${ep.method}-${ep.path}`}
                  style={{
                    borderBottom:
                      "1px solid light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.06))",
                  }}
                >
                  <td
                    style={{
                      padding: "0.375rem 0.5rem 0.375rem 0",
                      whiteSpace: "nowrap",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: 48,
                        fontWeight: 500,
                        color: "var(--vocs-text-color-heading)",
                      }}
                    >
                      {ep.method}
                    </span>
                    <span style={{ color: "var(--vocs-text-color-secondary)" }}>
                      {ep.path}
                    </span>
                  </td>
                  <td
                    className="hide-mobile"
                    style={{
                      padding: "0.375rem 0.5rem",
                      color: "var(--vocs-text-color-secondary)",
                    }}
                  >
                    {ep.description}
                  </td>
                  <td
                    style={{
                      padding: "0.375rem 0 0.375rem 0.5rem",
                      textAlign: "right",
                      whiteSpace: "nowrap",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "var(--vocs-text-color-secondary)",
                    }}
                  >
                    {formatPrice(ep)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Docs links */}
      {s.docs && (
        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginTop: "0.75rem",
            fontSize: 13,
          }}
        >
          {s.docs.homepage && (
            <DocLink href={s.docs.homepage} label="Docs" />
          )}
          {s.docs.apiReference && (
            <DocLink href={s.docs.apiReference} label="API Reference" />
          )}
          {s.docs.llmsTxt && (
            <DocLink href={s.docs.llmsTxt} label="llms.txt" />
          )}
        </div>
      )}
    </div>
  );
}

function MetaItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--vocs-text-color-secondary)",
          marginRight: "0.375rem",
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function DocLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: "var(--vocs-text-color-heading)",
        textDecoration: "underline",
        textUnderlineOffset: 2,
        textDecorationThickness: 1,
      }}
    >
      {label} ↗
    </a>
  );
}

function StatusDot({ status }: { status: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        color: STATUS_COLORS[status] ?? "var(--vocs-text-color-secondary)",
        textTransform: "capitalize",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background:
            STATUS_COLORS[status] ?? "var(--vocs-text-color-secondary)",
        }}
      />
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page-level styles — hide sidebar/outline, responsive columns
// ---------------------------------------------------------------------------

function PageStyles() {
  return (
    <style>{`
      [data-v-logo] { visibility: hidden !important; width: 0 !important; overflow: hidden !important; }
      /* Reset global table overrides from _root.css for the services table */
      [data-services-table] table {
        table-layout: auto !important;
      }
      [data-services-table] table td,
      [data-services-table] table th {
        white-space: normal !important;
        width: auto !important;
        min-width: 0 !important;
      }
      [data-services-table] table td:first-child,
      [data-services-table] table th:first-child {
        width: auto !important;
        min-width: 0 !important;
      }
      [data-services-table] table th:nth-child(3),
      [data-services-table] table td:nth-child(3) {
        min-width: 0 !important;
      }
      [data-services-table] table td:nth-child(2) {
        padding-top: inherit !important;
        padding-bottom: inherit !important;
      }
      [data-services-table] table td:nth-child(2) code {
        display: inline !important;
        margin-top: 0 !important;
      }
      @media (max-width: 640px) {
        .hide-mobile { display: none !important; }
      }
    `}</style>
  );
}
