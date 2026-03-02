"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Category, Endpoint, Service } from "../data/registry";
import { fetchServices } from "../data/registry";

export const CATEGORY_LABELS: Record<Category, string> = {
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
export const PAGE_SIZE = 60;
const CODE_BG = "light-dark(rgba(0,0,0,0.05), rgba(255,255,255,0.07))";
const URL_COLOR = "light-dark(rgba(0,0,0,0.7), rgba(255,255,255,0.7))";
const CMD_PURPLE = "light-dark(#7c3aed, #c084fc)";
const CMD_GREEN = "light-dark(#15803d, #4ade80)";

export function allCategories(s: Service): Category[] {
  return s.categories ?? [];
}
export function formatPrice(ep: Endpoint): string {
  const p = ep.payment;
  if (!p) return "—";
  if (!p.amount) return "n/a";
  const v = Number(p.amount) / 10 ** (p.decimals ?? 0);
  if (Number.isNaN(v)) return "—";
  if (v >= 1) return `$${v.toFixed(2)}`;
  let s = v.toFixed(4);
  s = s.replace(/0+$/, "");
  if (s.endsWith(".")) s = s.slice(0, -1);
  return `$${s}`;
}
function copyText(t: string) {
  navigator.clipboard.writeText(t);
}

// Icons
function ChevronDownIcon({
  expanded,
  size = 14,
}: {
  expanded: boolean;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        transition: "transform 0.2s ease",
        transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
        flexShrink: 0,
      }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
function CopyIcon({ size = 13 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}
function CheckIcon({ size = 13 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function TerminalIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" x2="20" y1="19" y2="19" />
    </svg>
  );
}
function ArrowRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        color: "var(--vocs-text-color-muted)",
        flexShrink: 0,
        marginTop: 2,
      }}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function SearchInput({
  search,
  setSearch,
  setPage,
  fullWidth,
}: {
  search: string;
  setSearch: (v: string) => void;
  setPage: (v: number) => void;
  fullWidth?: boolean;
}) {
  return (
    <div style={{ position: "relative", width: fullWidth ? "100%" : 260 }}>
      <span
        style={{
          position: "absolute",
          left: 10,
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--vocs-text-color-muted)",
          pointerEvents: "none",
        }}
      >
        <SearchIcon />
      </span>
      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(0);
        }}
        placeholder="Search services..."
        style={{
          width: "100%",
          padding: "0.4rem 0.6rem 0.4rem 2rem",
          fontSize: 14,
          borderRadius: 7,
          border: "1px solid var(--vocs-border-color-primary)",
          background: "transparent",
          color: "var(--vocs-text-color-heading)",
          fontFamily: "var(--font-sans)",
          outline: "none",
        }}
      />
    </div>
  );
}

function useCopyFeedback() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  const copy = useCallback((text: string, id: string) => {
    copyText(text);
    setCopiedId(id);
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => setCopiedId(null), 1500);
  }, []);
  return { copiedId, copy };
}

// Syntax-highlighted CLI text
function HighlightedCmd({ children }: { children: string }) {
  const parts: React.ReactNode[] = [];
  const tokens = children.split(/(\s+)/);
  let key = 0;
  for (const tok of tokens) {
    if (/^(curl|bash)$/.test(tok)) {
      parts.push(
        <span key={key} style={{ color: CMD_PURPLE }}>
          {tok}
        </span>,
      );
    } else if (/^presto$/.test(tok)) {
      parts.push(
        <span key={key} style={{ color: CMD_GREEN }}>
          {tok}
        </span>,
      );
    } else if (/^-/.test(tok)) {
      parts.push(
        <span key={key} style={{ color: "var(--vocs-text-color-secondary)" }}>
          {tok}
        </span>,
      );
    } else if (/^https?:\/\//.test(tok)) {
      parts.push(
        <span key={key} style={{ color: "var(--vocs-text-color-heading)" }}>
          {tok}
        </span>,
      );
    } else if (/^'/.test(tok) || /^"/.test(tok)) {
      parts.push(
        <span key={key} style={{ color: CMD_GREEN }}>
          {tok}
        </span>,
      );
    } else {
      parts.push(<span key={key}>{tok}</span>);
    }
    key++;
  }
  return <>{parts}</>;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<Category>>(
    new Set(),
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [prestoOpen, setPrestoOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [integrationFilter, setIntegrationFilter] = useState<
    "all" | "first-party"
  >("all");

  useEffect(() => {
    fetchServices()
      .then((data) => {
        setServices(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 150);
    return () => clearTimeout(id);
  }, [search]);

  const categories = useMemo(
    () =>
      [
        ...new Set(services.flatMap((s) => allCategories(s))),
      ].sort() as Category[],
    [services],
  );
  const filtered = useMemo(() => {
    let list = services;
    if (integrationFilter !== "all")
      list = list.filter(
        (s) => (s.integration ?? "first-party") === integrationFilter,
      );
    if (selectedCategories.size > 0)
      list = list.filter((s) =>
        allCategories(s).some((c) => selectedCategories.has(c)),
      );
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.url.toLowerCase().includes(q) ||
          s.tags?.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [services, selectedCategories, debouncedSearch, integrationFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleRow = (id: string) =>
    setExpandedIds((p) => {
      if (p.has(id)) return new Set();
      return new Set([id]);
    });
  const toggleCat = (cat: Category) => {
    setSelectedCategories((p) => {
      const n = new Set(p);
      if (n.has(cat)) n.delete(cat);
      else n.add(cat);
      return n;
    });
    setPage(0);
  };
  const clearCats = () => {
    setSelectedCategories(new Set());
    setPage(0);
  };

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
        className="services-container"
        style={{
          maxWidth: 1600,
          margin: "0 auto",
          padding: "3rem 2.5rem 5rem",
        }}
      >
        {/* Header */}
        <div
          className="page-header"
          style={{ marginBottom: "0.5rem", paddingLeft: "0.5rem" }}
        >
          <h1
            style={{
              fontSize: "2.1rem",
              fontWeight: 500,
              letterSpacing: "-0.02em",
              margin: 0,
              whiteSpace: "nowrap",
              marginBottom: "0rem",
              paddingBottom: "0rem",
            }}
          >
            Services
          </h1>
          <p
            style={{
              color: "var(--vocs-text-color-secondary)",
              fontSize: 17,
              lineHeight: 1.4,
              marginBottom: "2.75rem",
              marginTop: "-0.5rem",
            }}
          >
            MPP-enabled APIs your agent or application can seamlessly use.
          </p>
        </div>

        {/* Header cards — visible when sidebar hidden */}
        <div
          className="header-cards"
          style={{ display: "none", marginBottom: "1.5rem" }}
        >
          <HeaderCards
            prestoOpen={prestoOpen}
            onPrestoToggle={() => setPrestoOpen(!prestoOpen)}
          />
        </div>

        {/* Layout */}
        <div
          className="services-layout"
          style={{ display: "flex", gap: "3rem", alignItems: "flex-start" }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading && (
              <div
                style={{
                  padding: "5rem 0",
                  textAlign: "center",
                  color: "var(--vocs-text-color-secondary)",
                  fontSize: 16,
                }}
              >
                Loading services...
              </div>
            )}
            {error && (
              <div
                style={{
                  padding: "2rem",
                  borderRadius: 10,
                  border: "1px solid var(--vocs-border-color-primary)",
                  background: "var(--vocs-background-color-surfaceMuted)",
                  color: "var(--vocs-text-color-secondary)",
                  fontSize: 15,
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ color: "var(--vocs-text-color-heading)" }}>
                  Failed to load services
                </strong>
                <p style={{ margin: "0.5rem 0 0" }}>{error}</p>
              </div>
            )}
            {!loading && !error && (
              <>
                <div
                  className="search-mobile"
                  style={{
                    display: "none",
                    marginBottom: "1rem",
                    marginTop: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      alignItems: "center",
                    }}
                  >
                    <IntegrationFilter
                      value={integrationFilter}
                      onChange={(v) => {
                        setIntegrationFilter(v);
                        setPage(0);
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <SearchInput
                        search={search}
                        setSearch={setSearch}
                        setPage={setPage}
                        fullWidth
                      />
                    </div>
                  </div>
                </div>
                <div
                  className="search-bar"
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                    marginBottom: "0.75rem",
                    marginLeft: "0.5rem",
                    marginRight: "0.5rem",
                  }}
                >
                  <IntegrationFilter
                    value={integrationFilter}
                    onChange={(v) => {
                      setIntegrationFilter(v);
                      setPage(0);
                    }}
                  />
                  <SearchInput
                    search={search}
                    setSearch={setSearch}
                    setPage={setPage}
                    fullWidth
                  />
                </div>
                <div
                  className="filter-tags"
                  style={{
                    display: "flex",
                    gap: "0.375rem",
                    flexWrap: "wrap",
                    marginBottom: "1.5rem",
                    alignItems: "center",
                    marginLeft: "0.5rem",
                    marginRight: "0.5rem",
                    justifyContent: "flex-start",
                  }}
                >
                  <Pill
                    active={selectedCategories.size === 0}
                    onClick={clearCats}
                  >
                    All
                  </Pill>
                  {categories.map((cat) => (
                    <Pill
                      key={cat}
                      active={selectedCategories.has(cat)}
                      onClick={() => toggleCat(cat)}
                    >
                      {CATEGORY_LABELS[cat] ?? cat}
                    </Pill>
                  ))}
                </div>
                <div data-services-table>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: 16,
                      tableLayout: "fixed",
                    }}
                  >
                    <colgroup>
                      <col style={{ width: "18%" }} />
                      <col className="hide-mobile" style={{ width: "36%" }} />
                      <col className="hide-mobile" style={{ width: "36%" }} />
                      <col style={{ width: "10%" }} />
                    </colgroup>
                    <thead>
                      <tr
                        style={{
                          borderBottom:
                            "1px solid var(--vocs-border-color-primary)",
                        }}
                      >
                        <Th style={{ textAlign: "left" }}>Service</Th>
                        <Th
                          className="hide-mobile"
                          style={{ textAlign: "left" }}
                        >
                          URL
                        </Th>
                        <Th
                          className="hide-mobile"
                          style={{ textAlign: "left" }}
                        >
                          Description
                        </Th>
                        <Th style={{ width: 36 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((s) => (
                        <ServiceRow
                          key={s.id}
                          service={s}
                          expanded={expandedIds.has(s.id)}
                          onToggle={() => toggleRow(s.id)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
                {filtered.length === 0 && (
                  <p
                    style={{
                      textAlign: "center",
                      padding: "4rem 0",
                      color: "var(--vocs-text-color-secondary)",
                      fontSize: 15,
                    }}
                  >
                    No services found.
                  </p>
                )}
                {totalPages > 1 && (
                  <div
                    className="pagination"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: "1rem",
                    }}
                  >
                    <p
                      style={{
                        color: "var(--vocs-text-color-muted)",
                        fontSize: 13,
                      }}
                    >
                      {page * PAGE_SIZE + 1}–
                      {Math.min((page + 1) * PAGE_SIZE, filtered.length)} of{" "}
                      {filtered.length}
                    </p>
                    <div style={{ display: "flex", gap: "0.375rem" }}>
                      <PaginationBtn
                        disabled={page === 0}
                        onClick={() => setPage(page - 1)}
                      >
                        ← Prev
                      </PaginationBtn>
                      <PaginationBtn
                        disabled={page >= totalPages - 1}
                        onClick={() => setPage(page + 1)}
                      >
                        Next →
                      </PaginationBtn>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <div
            className="services-sidebar"
            style={{
              width: 360,
              flexShrink: 0,
              position: "sticky",
              top: "calc(var(--vocs-spacing-topNav, 64px) + 1.5rem)",
              alignSelf: "flex-start",
            }}
          >
            <PrestoCardFull />
            <SidebarInfoCards />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Resource link row (docs, llms.txt)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Presto cards
// ---------------------------------------------------------------------------

function PrestoCardFull() {
  return (
    <div
      style={{
        borderRadius: 10,
        border: "1px solid var(--vocs-border-color-primary)",
        background: "light-dark(rgba(0,0,0,0.02), rgba(255,255,255,0.03))",
        padding: "1.25rem",
      }}
    >
      <h2
        style={{
          fontSize: "1.25rem",
          fontWeight: 500,
          letterSpacing: "-0.02em",
          marginBottom: "0.35rem",
        }}
      >
        Get started with Presto
      </h2>
      <p
        style={{
          color: "var(--vocs-text-color-secondary)",
          fontSize: 14,
          lineHeight: 1.5,
          marginBottom: "1.25rem",
        }}
      >
        Command-line client with built-in MPP support.
      </p>
      <PrestoSteps />
    </div>
  );
}

function HeaderCards({
  prestoOpen,
  onPrestoToggle,
}: {
  prestoOpen: boolean;
  onPrestoToggle: () => void;
}) {
  const cs: React.CSSProperties = {
    padding: "0.65rem 0.85rem",
    borderRadius: 8,
    border: "1px solid var(--vocs-border-color-primary)",
    background: "light-dark(rgba(0,0,0,0.02), rgba(255,255,255,0.03))",
    textDecoration: "none",
    color: "var(--vocs-text-color-heading)",
    display: "flex",
    alignItems: "flex-start",
    gap: "0.5rem",
    transition: "background 0.15s, border-color 0.15s",
    minWidth: 0,
  };
  const titleS: React.CSSProperties = { fontSize: 14, fontWeight: 500 };
  const descS: React.CSSProperties = {
    fontSize: 12,
    color: "var(--vocs-text-color-muted)",
    lineHeight: 1.35,
    marginTop: 1,
  };
  const iconS: React.CSSProperties = {
    color: "var(--vocs-text-color-muted)",
    marginTop: 2,
    flexShrink: 0,
  };
  return (
    <>
      <div
        className="header-cards-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "0.5rem",
        }}
      >
        <button
          type="button"
          onClick={onPrestoToggle}
          className="info-card-link"
          style={{
            ...cs,
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
            textAlign: "left",
          }}
        >
          <span style={iconS}>
            <TerminalIcon />
          </span>
          <div>
            <div style={titleS}>Presto</div>
            <div style={descS}>CLI with built-in payments</div>
          </div>
        </button>
        <a
          href="/services/llms.txt"
          target="_blank"
          rel="noopener noreferrer"
          className="info-card-link"
          style={cs}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={iconS}
          >
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
          </svg>
          <div>
            <div style={titleS}>llms.txt</div>
            <div style={descS}>Service discovery for agents</div>
          </div>
        </a>
        <a href="/overview" className="info-card-link" style={cs}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={iconS}
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          <div>
            <div style={titleS}>Documentation</div>
            <div style={descS}>Guides, quickstarts, and SDKs</div>
          </div>
        </a>
        <div
          style={{
            ...cs,
            padding: "0.65rem 0.5rem",
            background: "transparent",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 16,
              height: 16,
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#22c55e",
              }}
            />
          </span>
          <div>
            <div style={titleS}>First-party</div>
            <div style={descS}>Hosted natively on Tempo</div>
          </div>
        </div>
      </div>
      {prestoOpen && (
        <div
          style={{
            marginTop: "0.5rem",
            borderRadius: 10,
            border: "1px solid var(--vocs-border-color-primary)",
            background: "light-dark(rgba(0,0,0,0.02), rgba(255,255,255,0.03))",
            padding: "1rem",
          }}
        >
          <PrestoSteps />
        </div>
      )}
    </>
  );
}

function SidebarInfoCards() {
  const cardStyle: React.CSSProperties = {
    padding: "0.65rem 0.85rem",
    borderRadius: 8,
    border: "1px solid var(--vocs-border-color-primary)",
    background: "light-dark(rgba(0,0,0,0.02), rgba(255,255,255,0.03))",
    display: "flex",
    gap: "0.55rem",
    alignItems: "flex-start",
  };
  const titleStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 500,
    marginBottom: "0.1rem",
  };
  const descStyle: React.CSSProperties = {
    fontSize: 13,
    color: "var(--vocs-text-color-muted)",
    lineHeight: 1.45,
  };
  const iconStyle: React.CSSProperties = {
    color: "var(--vocs-text-color-muted)",
    marginTop: 1,
    flexShrink: 0,
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        marginTop: "0.75rem",
      }}
    >
      <a
        href="/services/llms.txt"
        target="_blank"
        rel="noopener noreferrer"
        className="info-card-link"
        style={{
          ...cardStyle,
          textDecoration: "none",
          color: "var(--vocs-text-color-heading)",
          transition: "background 0.15s, border-color 0.15s",
        }}
      >
        <span style={iconStyle}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
          </svg>
        </span>
        <div style={{ flex: 1 }}>
          <div style={titleStyle}>llms.txt</div>
          <div style={descStyle}>Service discovery for agents.</div>
        </div>
        <ArrowRightIcon />
      </a>
      <a
        href="/overview"
        className="info-card-link"
        style={{
          ...cardStyle,
          textDecoration: "none",
          color: "var(--vocs-text-color-heading)",
          transition: "background 0.15s, border-color 0.15s",
        }}
      >
        <span style={iconStyle}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        </span>
        <div style={{ flex: 1 }}>
          <div style={titleStyle}>Documentation</div>
          <div style={descStyle}>Guides, quickstarts, and SDKs.</div>
        </div>
        <ArrowRightIcon />
      </a>
      <div
        style={{
          ...cardStyle,
          background: "transparent",
          border: "1px solid transparent",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#22c55e",
            flexShrink: 0,
            marginTop: 5,
          }}
        />
        <div>
          <div style={titleStyle}>First-party services</div>
          <div style={descStyle}>Directly integrated with MPP.</div>
        </div>
      </div>
    </div>
  );
}

function PrestoSteps() {
  return (
    <div
      style={{
        padding: "0 0rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <CliSnippet label="Install" desc="One-line install via shell.">
        curl -fsSL https://presto-binaries.tempo.xyz/install.sh | bash
      </CliSnippet>
      <CliSnippet
        label="Log in"
        desc="Opens browser to connect your Tempo wallet."
      >
        presto login
      </CliSnippet>
      <CliSnippet
        label="Make a request"
        desc="Payment handled automatically."
      >{`presto https://openai.mpp.tempo.xyz/v1/chat/completions \\\n  -X POST --json '{"model":"gpt-4o","messages":[{"role":"user","content":"Hello!"}]}'`}</CliSnippet>
      <CliSnippet label="Dry run" desc="Preview cost without paying.">
        presto --dry-run https://openai.mpp.tempo.xyz/v1/chat/completions
      </CliSnippet>
    </div>
  );
}

function CliSnippet({
  label,
  desc,
  children,
}: {
  label: string;
  desc?: string;
  children: string;
}) {
  const [copied, setCopied] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  const handleCopy = () => {
    copyText(children);
    setCopied(true);
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: "0.2rem" }}>
        {label}
      </div>
      {desc && (
        <div
          style={{
            color: "var(--vocs-text-color-muted)",
            fontSize: 13,
            lineHeight: 1.45,
            marginBottom: "0.5rem",
          }}
        >
          {desc}
        </div>
      )}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: copy */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: copy */}
      <div
        onClick={handleCopy}
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 8,
          padding: "0.45rem 0.6rem",
          borderRadius: 6,
          border: "1px solid var(--vocs-border-color-primary)",
          background: CODE_BG,
          cursor: "pointer",
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          lineHeight: 1.6,
          color: "var(--vocs-text-color-heading)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}
      >
        <span
          style={{
            flex: 1,
            display: "block",
            paddingLeft: "1.2em",
            textIndent: "-1.2em",
          }}
        >
          <span
            style={{
              color: "var(--vocs-text-color-muted)",
              userSelect: "none",
            }}
          >
            ${" "}
          </span>
          <HighlightedCmd>{children}</HighlightedCmd>
        </span>
        <span
          style={{
            flexShrink: 0,
            marginTop: 2,
            color: copied
              ? "var(--vocs-text-color-heading)"
              : "var(--vocs-text-color-muted)",
            transition: "color 0.15s",
          }}
        >
          {copied ? <CheckIcon size={11} /> : <CopyIcon size={11} />}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small components
// ---------------------------------------------------------------------------

function IntegrationFilter({
  value,
  onChange,
}: {
  value: "all" | "first-party";
  onChange: (v: "all" | "first-party") => void;
}) {
  const dotColor =
    value === "first-party" ? "#22c55e" : "var(--vocs-text-color-muted)";
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <span
        style={{
          position: "absolute",
          left: 9,
          top: "50%",
          transform: "translateY(-50%)",
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: dotColor,
          pointerEvents: "none",
        }}
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as "all" | "first-party")}
        style={{
          appearance: "none",
          WebkitAppearance: "none",
          padding: "0.4rem 1.8rem 0.4rem 1.5rem",
          fontSize: 13,
          borderRadius: 7,
          border: "1px solid var(--vocs-border-color-primary)",
          background: "transparent",
          color: "var(--vocs-text-color-heading)",
          fontFamily: "var(--font-sans)",
          outline: "none",
          cursor: "pointer",
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 0.5rem center",
        }}
      >
        <option value="all">All</option>
        <option value="first-party">First-party</option>
      </select>
    </div>
  );
}

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
        padding: "0.3rem 0.65rem",
        fontSize: 13,
        borderRadius: 6,
        border: "1px solid var(--vocs-border-color-primary)",
        whiteSpace: "nowrap",
        flexShrink: 1,
        minWidth: 0,
        background: active
          ? "light-dark(rgba(0,0,0,0.08), rgba(255,255,255,0.12))"
          : "transparent",
        color: active
          ? "var(--vocs-text-color-heading)"
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
function PaginationBtn({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: "0.25rem 0.6rem",
        fontSize: 13,
        borderRadius: 6,
        border: "1px solid var(--vocs-border-color-primary)",
        background: "transparent",
        color: disabled
          ? "var(--vocs-text-color-muted)"
          : "var(--vocs-text-color-secondary)",
        cursor: disabled ? "default" : "pointer",
        fontFamily: "var(--font-sans)",
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
        fontWeight: 400,
        color: "var(--vocs-text-color-muted)",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </th>
  );
}
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 12,
        padding: "0.1rem 0.35rem",
        borderRadius: 3,
        border: "1px solid var(--vocs-border-color-primary)",
        color: "var(--vocs-text-color-muted)",
        whiteSpace: "nowrap",
        textTransform: "capitalize",
      }}
    >
      {children}
    </span>
  );
}
function BorderlessBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 12,
        borderRadius: 3,
        color: "var(--vocs-text-color-muted)",
        whiteSpace: "nowrap",
        textTransform: "capitalize",
      }}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Service icon with optional third-party overlay
// ---------------------------------------------------------------------------

function FallbackIcon({ name }: { name: string }) {
  const initials = name
    .split(/[\s-]+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: 6,
        background: "light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.10))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: initials.length > 1 ? 10 : 13,
        fontWeight: 600,
        letterSpacing: "-0.02em",
        color: "var(--vocs-text-color-secondary)",
        border:
          "1px solid light-dark(rgba(0,0,0,0.08), rgba(255,255,255,0.08))",
      }}
    >
      {initials || "?"}
    </div>
  );
}

function ServiceIcon({ service: s }: { service: Service }) {
  const isFirstParty = s.integration !== "third-party";
  const [imgError, setImgError] = useState(false);
  return (
    <div
      className="svc-icon"
      style={{
        position: "relative",
        width: 28,
        height: 28,
        flexShrink: 0,
        marginRight: 6,
      }}
    >
      {s.id && !imgError ? (
        <img
          src={`/icons/${s.id}.svg`}
          alt=""
          width={28}
          height={28}
          style={{ borderRadius: 6, display: "block", objectFit: "cover" }}
          onError={() => setImgError(true)}
        />
      ) : (
        <FallbackIcon name={s.name} />
      )}
      {isFirstParty && (
        <span
          style={{
            position: "absolute",
            top: -3,
            right: -3,
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#22c55e",
            border: "2px solid var(--vocs-background-color-primary, #1a1a1a)",
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Service row
// ---------------------------------------------------------------------------

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
  const { copiedId, copy } = useCopyFeedback();
  const displayUrl = s.serviceUrl ?? s.url;
  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    copy(displayUrl, `url-${s.id}`);
  };
  const expandedBg = "light-dark(rgba(0,0,0,0.025), rgba(255,255,255,0.025))";
  return (
    <>
      <tr
        onClick={onToggle}
        style={{
          borderBottom: expanded
            ? "1px solid transparent"
            : "1px solid var(--vocs-border-color-primary)",
          cursor: "pointer",
          transition: "background 0.1s",
          background: expanded ? expandedBg : undefined,
          height: 58,
        }}
        onMouseEnter={(e) => {
          if (!expanded)
            e.currentTarget.style.background =
              "var(--vocs-background-color-surfaceMuted)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = expanded ? expandedBg : "";
        }}
      >
        <td style={{ padding: "0.7rem 0.75rem", verticalAlign: "middle" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <ServiceIcon service={s} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="svc-name-row">
                <span
                  className="svc-name-text"
                  style={{
                    fontWeight: 500,
                    fontSize: 16,
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.name}
                </span>
                {cats[0] && (
                  <span className="svc-badge-inline">
                    <span className="svc-badge-bordered">
                      <Badge>{CATEGORY_LABELS[cats[0]] ?? cats[0]}</Badge>
                    </span>
                    <span className="svc-badge-borderless">
                      <BorderlessBadge>
                        {CATEGORY_LABELS[cats[0]] ?? cats[0]}
                      </BorderlessBadge>
                    </span>
                  </span>
                )}
              </div>
              <div
                className="show-tablet"
                style={{ display: "none", marginTop: 5 }}
              >
                <span
                  className="svc-desc-mobile"
                  style={{
                    color: "var(--vocs-text-color-secondary)",
                    fontSize: 14,
                    lineHeight: 1.4,
                  }}
                >
                  {s.description}
                </span>
              </div>
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: copy */}
              {/* biome-ignore lint/a11y/noStaticElementInteractions: copy */}
              <div
                className="show-tablet url-mobile"
                onClick={handleCopyUrl}
                style={{
                  display: "none",
                  marginTop: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    color:
                      copiedId === `url-${s.id}`
                        ? "var(--vocs-text-color-heading)"
                        : URL_COLOR,
                    padding: "0.15rem 0.4rem",
                    borderRadius: 4,
                    background: CODE_BG,
                    cursor: "pointer",
                    transition: "color 0.15s",
                    wordBreak: "break-all",
                  }}
                  title={
                    copiedId === `url-${s.id}`
                      ? "Copied!"
                      : `Copy: ${displayUrl}`
                  }
                >
                  {copiedId === `url-${s.id}` ? "Copied!" : displayUrl}
                </span>
              </div>
            </div>
          </div>
        </td>
        <td
          className="hide-mobile"
          style={{ padding: "0.7rem 0.75rem", verticalAlign: "middle" }}
        >
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: copy */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: copy */}
          <span
            onClick={handleCopyUrl}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              color:
                copiedId === `url-${s.id}`
                  ? "var(--vocs-text-color-heading)"
                  : URL_COLOR,
              cursor: "pointer",
              display: "inline-block",
              padding: "0.15rem 0.4rem",
              borderRadius: 4,
              background: CODE_BG,
              transition: "color 0.15s",
              wordBreak: "break-all",
            }}
            title={
              copiedId === `url-${s.id}`
                ? "Copied!"
                : `Click to copy: ${displayUrl}`
            }
          >
            {copiedId === `url-${s.id}` ? "Copied!" : displayUrl}
          </span>
        </td>
        <td
          className="hide-mobile"
          style={{
            padding: "0.7rem 0.75rem",
            color: "var(--vocs-text-color-secondary)",
            fontSize: 14,
            lineHeight: 1.45,
            verticalAlign: "middle",
          }}
        >
          {s.description}
        </td>
        <td
          style={{
            padding: 0,
            verticalAlign: "middle",
          }}
        >
          <div
            className="chevron-cell"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "0.3rem",
              paddingRight: "0.5rem",
              color: "var(--vocs-text-color-muted)",
            }}
          >
            {(s.docs?.apiReference || s.docs?.llmsTxt || s.docs?.homepage) && (
              <a
                href={(s.docs?.apiReference ?? s.docs?.llmsTxt ?? s.docs?.homepage)!}
                target="_blank"
                rel="noopener noreferrer"
                className="hide-mobile"
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  color: "var(--vocs-text-color-muted)",
                  transition: "background 0.15s, color 0.15s",
                }}
                title="Docs"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.08))";
                  e.currentTarget.style.color =
                    "var(--vocs-text-color-heading)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "";
                  e.currentTarget.style.color = "var(--vocs-text-color-muted)";
                }}
              >
                <BookIcon size={14} />
              </a>
            )}
            {s.provider?.url && (
              <a
                href={s.provider.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hide-mobile"
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  color: "var(--vocs-text-color-muted)",
                  transition: "background 0.15s, color 0.15s",
                }}
                title="Website"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.08))";
                  e.currentTarget.style.color =
                    "var(--vocs-text-color-heading)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "";
                  e.currentTarget.style.color = "var(--vocs-text-color-muted)";
                }}
              >
                <ExternalLinkIcon size={14} />
              </a>
            )}
            <ChevronDownIcon expanded={expanded} />
          </div>
        </td>
      </tr>
      {expanded && (
        <tr style={{ background: expandedBg }}>
          <td
            colSpan={4}
            className="expanded-detail"
            style={{
              padding: "0.25rem 0 0.75rem",
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

// ---------------------------------------------------------------------------
// Expanded detail
// ---------------------------------------------------------------------------

const SUB_GRID = "18% 36% 1fr auto 6rem";

function SubTh({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <span
      style={{
        padding: "0 0.75rem",
        fontSize: 12,
        fontWeight: 400,
        color: "var(--vocs-text-color-muted)",
        whiteSpace: "nowrap",
        ...style,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function ExternalLinkIcon({ size = 13 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" x2="21" y1="14" y2="3" />
    </svg>
  );
}

function BookIcon({ size = 13 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
}

function ExpandedDetail({ service: s }: { service: Service }) {
  const { copiedId, copy } = useCopyFeedback();
  const baseUrl = s.serviceUrl ?? s.url;
  const docsUrl = s.docs?.apiReference ?? s.docs?.llmsTxt ?? s.docs?.homepage;
  const websiteUrl = s.provider?.url;
  const mobileLinkStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.4rem",
    padding: "0.45rem 0.75rem",
    fontSize: 14,
    borderRadius: 6,
    border: "1px solid var(--vocs-border-color-primary)",
    background: "light-dark(#fff, rgba(255,255,255,0.06))",
    color: "var(--vocs-text-color-secondary)",
    textDecoration: "none",
    flex: 1,
  };
  return (
    <div style={{ fontSize: 14 }}>
      {(docsUrl || websiteUrl) && (
        <div
          className="show-tablet expanded-links"
          style={{
            display: "none",
            gap: "0.5rem",
            padding: "0.15rem 1rem 0.65rem 1rem",
          }}
        >
          {docsUrl && (
            <a
              href={docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={mobileLinkStyle}
              onClick={(e) => e.stopPropagation()}
            >
              <BookIcon /> Docs
            </a>
          )}
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={mobileLinkStyle}
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLinkIcon /> Website
            </a>
          )}
        </div>
      )}
      {s.endpoints.length > 0 && (
        <div>
          <div
            className="hide-mobile"
            style={{
              display: "grid",
              gridTemplateColumns: SUB_GRID,
              padding: "0.45rem 0",
              background:
                "light-dark(rgba(0,0,0,0.025), rgba(255,255,255,0.025))",
            }}
          >
            <SubTh style={{ paddingLeft: "3.5rem" }}>Method</SubTh>
            <SubTh>Route</SubTh>
            <SubTh>Description</SubTh>
            <SubTh style={{ textAlign: "right" }}>Intent</SubTh>
            <SubTh style={{ textAlign: "right", paddingRight: "1rem" }}>
              Price
            </SubTh>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {s.endpoints.map((ep, idx) => {
              const fullUrl = `${baseUrl}${ep.path}`;
              const copyId = `ep-${s.id}-${ep.method}-${ep.path}`;
              const isCopied = copiedId === copyId;
              const isLast = idx === s.endpoints.length - 1;
              return (
                <div
                  key={`${ep.method}-${ep.path}`}
                  className="sub-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: SUB_GRID,
                    alignItems: "center",
                    borderBottom: isLast
                      ? "none"
                      : "1px solid light-dark(rgba(0,0,0,0.05), rgba(255,255,255,0.05))",
                  }}
                >
                  <div style={{ padding: "0.75rem 0.75rem 0.75rem 3.5rem" }}>
                    <span
                      style={{
                        fontWeight: 600,
                        fontFamily: "var(--font-mono)",
                        fontSize: 14,
                      }}
                    >
                      {ep.method}
                    </span>
                  </div>
                  <div style={{ padding: "0.75rem 0.75rem" }}>
                    {/* biome-ignore lint/a11y/useKeyWithClickEvents: copy */}
                    {/* biome-ignore lint/a11y/noStaticElementInteractions: copy */}
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        copy(fullUrl, copyId);
                      }}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 13,
                        padding: "0.15rem 0.4rem",
                        borderRadius: 4,
                        background: CODE_BG,
                        color: isCopied
                          ? "var(--vocs-text-color-heading)"
                          : URL_COLOR,
                        cursor: "pointer",
                        transition: "color 0.15s",
                        wordBreak: "break-all",
                        display: "inline",
                      }}
                      title={isCopied ? "Copied!" : `Copy: ${fullUrl}`}
                    >
                      {isCopied ? "Copied!" : ep.path}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "0.75rem 0.75rem",
                      color: "var(--vocs-text-color-secondary)",
                      fontSize: 14,
                      lineHeight: 1.45,
                    }}
                  >
                    <span>{ep.description}</span>
                  </div>
                  <div
                    style={{
                      padding: "0.75rem 0.5rem 0.75rem 0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                    }}
                  >
                    {ep.payment?.intent && <Badge>{ep.payment.intent}</Badge>}
                    <span
                      className="mobile-price"
                      style={{
                        display: "none",
                        fontFamily: "var(--font-mono)",
                        fontSize: 14,
                        color: "var(--vocs-text-color-muted)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatPrice(ep)}
                    </span>
                  </div>
                  <div
                    className="desktop-price"
                    style={{
                      padding: "0.75rem 1rem 0.75rem 0",
                      fontFamily: "var(--font-mono)",
                      fontSize: 14,
                      fontVariantNumeric: "tabular-nums",
                      textAlign: "right",
                      color: "var(--vocs-text-color-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatPrice(ep)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function PageStyles() {
  return (
    <style>{`
      [data-v-logo] { visibility: hidden !important; width: 0 !important; overflow: hidden !important; }
      [data-layout="minimal"] main > article { max-width: none !important; }
      @media (max-width: 900px) {
        [data-layout="minimal"] main { padding-left: 0 !important; padding-right: 0 !important; max-width: none !important; overflow-x: hidden !important; }
        [data-layout="minimal"] main > article { padding-left: 0 !important; padding-right: 0 !important; max-width: none !important; width: 100% !important; }
      }
      .search-mobile { display: none; }
      .header-cards { display: none !important; }
      .show-tablet { display: none !important; }
      [data-services-table] table { table-layout: fixed !important; }
      [data-services-table] table td, [data-services-table] table th { white-space: normal !important; min-width: 0 !important; overflow: hidden; text-overflow: ellipsis; }
      .svc-name-row { display: flex; flex-direction: column; gap: 0.1rem; }
      .svc-badge-inline { display: block; }
      .svc-badge-bordered { display: none; }
      .svc-badge-borderless { display: inline; }
      .svc-name-text { margin-right: 0.35rem; }
      .info-card-link:hover { background: light-dark(rgba(0,0,0,0.05), rgba(255,255,255,0.06)) !important; border-color: light-dark(rgba(0,0,0,0.15), rgba(255,255,255,0.15)) !important; }
      .expanded-detail { animation: expandIn 0.15s ease-out; }
      @keyframes expandIn { from { opacity: 0; } to { opacity: 1; } }

      /* ---- Sidebar hidden, header cards as 4-col strip ---- */
      @media (max-width: 1200px) {
        .services-sidebar { display: none !important; }
        .services-layout { gap: 0 !important; }
        .header-cards { display: block !important; }
      }

      /* ---- Table columns stack ---- */
      @media (max-width: 1400px) {
        .filter-tags button { flex: 1 0 auto !important; justify-content: center !important; }
        .hide-mobile { display: none !important; }
        .show-tablet { display: block !important; }
        [data-services-table] table { table-layout: auto !important; overflow: visible !important; }
        [data-services-table] table col:nth-child(1) { width: auto !important; }
        [data-services-table] table col:nth-child(2),
        [data-services-table] table col:nth-child(3) { width: 0 !important; }
        [data-services-table] table col:nth-child(4) { width: 48px !important; }
        [data-services-table] table td:first-child { padding: 1rem 0.5rem 1rem 1rem !important; vertical-align: middle !important; }
        [data-services-table] table td:last-child { padding: 1rem 0.5rem 1rem 0 !important; vertical-align: middle !important; text-align: right !important; overflow: visible !important; }
        .svc-icon { align-self: center !important; margin-top: 0 !important; }
        .svc-name-row { flex-direction: row !important; align-items: center !important; gap: 0.1rem !important; flex-wrap: wrap !important; }
        .svc-badge-inline { display: inline !important; }
        .svc-badge-bordered { display: inline !important; }
        .svc-badge-borderless { display: none !important; }
        .svc-name-row > span:first-child { font-size: 17px !important; }
        .svc-desc-mobile { font-size: 16px !important; word-wrap: break-word !important; overflow-wrap: break-word !important; }
        .expanded-links { display: flex !important; padding-left: 3.25rem !important; }
        .expanded-detail { padding-top: 0 !important; padding-bottom: 0.5rem !important; }
        .sub-row:first-child { border-top: none !important; }

        .sub-row {
          display: grid !important;
          grid-template-columns: auto 1fr auto !important;
          grid-template-rows: auto auto !important;
          padding: 0.65rem 1rem 0.65rem 3.25rem !important;
          gap: 0.15rem 0.6rem !important;
          align-items: center !important;
        }
        .sub-row > * { padding: 0 !important; }
        .sub-row > *:nth-child(1) { grid-row: 1; grid-column: 1; font-size: 13px !important; font-weight: 600 !important; }
        .sub-row > *:nth-child(3) { grid-row: 1; grid-column: 2; font-size: 13px !important; color: var(--vocs-text-color-secondary) !important; text-align: left !important; justify-self: start !important; }
        .sub-row > *:nth-child(4) { grid-row: 1; grid-column: 3; display: flex !important; align-items: center !important; gap: 0.4rem !important; justify-content: flex-end !important; }
        .sub-row > *:nth-child(2) { grid-row: 2; grid-column: 1 / -1; font-size: 12px !important; margin-top: 0.4rem; text-align: left !important; justify-self: start !important; }
        .sub-row .desktop-price { display: none !important; }
        .sub-row .mobile-price { display: inline !important; }
      }

      /* ---- Header cards 2x2, search moves, tags center ---- */
      @media (max-width: 900px) {
        .services-container { padding-left: 0 !important; padding-right: 0 !important; }
        [data-services-table] table { width: 100% !important; }
        [data-services-table] thead { display: none !important; }
        [data-services-table] table td:first-child { padding: 0.85rem 0.5rem 0.85rem 1.25rem !important; vertical-align: middle !important; }
        [data-services-table] table td:last-child { padding: 0.85rem 1.25rem 0.85rem 0 !important; vertical-align: middle !important; text-align: right !important; width: 48px !important; min-width: 48px !important; max-width: 48px !important; box-sizing: border-box !important; overflow: visible !important; }
        .chevron-cell { padding-right: 0 !important; }
        .svc-badge-inline { margin-left: 0.25rem !important; }
        .expanded-links { padding-left: 3.5rem !important; padding-right: 1.25rem !important; }
        .sub-row { padding-left: 3.5rem !important; padding-right: 1.25rem !important; }
        .header-cards { padding: 0 1.25rem !important; }
        .header-cards-grid { grid-template-columns: repeat(2, 1fr) !important; }
        .header-cards-grid > * > div > div:first-child { font-size: 16px !important; }
        .header-cards-grid > * > div > div:last-child { font-size: 14px !important; line-height: 1.4 !important; }
        .search-bar { display: none !important; }
        .search-mobile { display: block !important; padding: 0 1.25rem !important; margin-bottom: 1rem !important; }
        .search-mobile input { padding-top: 0.6rem !important; padding-bottom: 0.6rem !important; font-size: 15px !important; }
        .search-mobile select { font-size: 15px !important; padding-top: 0.55rem !important; padding-bottom: 0.55rem !important; }
        .filter-tags { justify-content: center !important; margin-bottom: 3.75rem !important; margin-left: 0 !important; margin-right: 0 !important; padding: 0 1.25rem !important; }
        .filter-tags button { font-size: 14px !important; padding: 0.4rem 0.85rem !important; flex: 1 1 auto !important; justify-content: center !important; }
        .page-header { text-align: center !important; margin-bottom: 1.25rem !important; padding: 0 1.25rem !important; }
        .page-header p { max-width: 80% !important; margin-left: auto !important; margin-right: auto !important; }
        .pagination { padding: 0 1.25rem !important; }
      }

      /* ---- Mobile: full-width, bigger icons ---- */
      @media (max-width: 640px) {
        .expanded-detail { padding-left: 0 !important; padding-right: 0 !important; }
        .svc-icon { width: 34px !important; height: 34px !important; margin-right: 10px !important; }
        .svc-icon img { width: 34px !important; height: 34px !important; }
        .sub-row { padding-left: 4rem !important; }
        .expanded-links { padding-left: 4rem !important; }
        .header-cards-grid > * > div > div:first-child { font-size: 17px !important; }
        .header-cards-grid > * > div > div:last-child { font-size: 15px !important; }
        .filter-tags button { min-width: auto !important; }
      }
    `}</style>
  );
}
