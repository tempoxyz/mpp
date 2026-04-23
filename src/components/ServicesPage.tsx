"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "vocs";
import type { Category, Endpoint, Service } from "../data/registry";
import { fetchServices, iconUrl } from "../data/registry";
import { ServiceDiscovery } from "./ServiceDiscovery";

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

export const PINNED_IDS: string[] = [
  "openai",
  "anthropic",
  "google-gemini",
  "parallel",
  "alchemy",
  "openrouter",
  "stabletravel",
  "stripe-climate",
  "browserbase",
];

export function allCategories(s: Service): Category[] {
  return s.categories ?? [];
}
export function formatPrice(ep: Endpoint): string {
  const p = ep.payment;
  if (!p) return "\u2014";
  if (!p.amount) return p.amountHint ?? "Varies";
  const v = Number(p.amount) / 10 ** (p.decimals ?? 0);
  if (Number.isNaN(v)) return "\u2014";
  if (v === 0) return "$0";
  if (v >= 1) return `$${v.toFixed(2)}`;
  let s = v.toFixed(6);
  s = s.replace(/0+$/, "");
  if (s.endsWith(".")) s += "00";
  else {
    const dotIdx = s.indexOf(".");
    if (dotIdx >= 0) {
      const decimals = s.length - dotIdx - 1;
      if (decimals < 2) s += "0".repeat(2 - decimals);
    }
  }
  return `$${s}`;
}
function copyText(t: string) {
  navigator.clipboard.writeText(t);
}

// ---------------------------------------------------------------------------
// Search dropdown types and logic
// ---------------------------------------------------------------------------

type DropdownResult =
  | { type: "service"; service: Service }
  | { type: "category"; category: Category; label: string }
  | { type: "endpoint"; service: Service; endpoint: Endpoint };

function getDropdownResults(
  services: Service[],
  query: string,
): DropdownResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const results: DropdownResult[] = [];
  for (const [cat, label] of Object.entries(CATEGORY_LABELS)) {
    if (label.toLowerCase().includes(q) || cat.includes(q)) {
      results.push({ type: "category", category: cat as Category, label });
    }
  }
  for (const s of services) {
    if (
      s.name.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q) ||
      s.url.toLowerCase().includes(q) ||
      s.tags?.some((t) => t.toLowerCase().includes(q))
    ) {
      results.push({ type: "service", service: s });
    }
  }
  for (const s of services) {
    let count = 0;
    for (const ep of s.endpoints) {
      if (count >= 5) break;
      if (
        ep.path.toLowerCase().includes(q) ||
        ep.description?.toLowerCase().includes(q) ||
        ep.method.toLowerCase().includes(q)
      ) {
        results.push({ type: "endpoint", service: s, endpoint: ep });
        count++;
      }
    }
  }
  return results.slice(0, 12);
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Search with dropdown
// ---------------------------------------------------------------------------

function SearchWithDropdown({
  search,
  setSearch,
  setPage,
  services,
  onSelectService,
  onSelectCategory,
  fullWidth,
  inputRef: externalRef,
  onInputFocus,
  onDismiss,
  resultCount,
}: {
  search: string;
  setSearch: (v: string) => void;
  setPage: (v: number) => void;
  services: Service[];
  onSelectService: (id: string) => void;
  onSelectCategory: (cat: Category) => void;
  fullWidth?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onInputFocus?: () => void;
  onDismiss?: () => void;
  resultCount?: number;
}) {
  const internalRef = useRef<HTMLInputElement>(null);
  const ref = externalRef ?? internalRef;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropdownTab, setDropdownTab] = useState<
    "all" | "services" | "endpoints"
  >("all");

  const dropdownResults = useMemo(
    () => getDropdownResults(services, search),
    [services, search],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset on search change
  useEffect(() => {
    setActiveIndex(-1);
  }, [search]);

  const handleSelect = useCallback(
    (result: DropdownResult) => {
      setShowDropdown(false);
      if (result.type === "service") {
        onSelectService(result.service.id);
        setSearch("");
      } else if (result.type === "category") {
        onSelectCategory(result.category);
        setSearch("");
      } else if (result.type === "endpoint") {
        onSelectService(result.service.id);
        setSearch("");
      }
    },
    [onSelectService, onSelectCategory, setSearch],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowDropdown(false);
        setActiveIndex(-1);
        ref.current?.blur();
        return;
      }
      if (!showDropdown || dropdownResults.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, dropdownResults.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        handleSelect(dropdownResults[activeIndex]);
        setActiveIndex(-1);
      }
    },
    [showDropdown, dropdownResults, activeIndex, handleSelect, ref],
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        ref.current &&
        !ref.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref]);

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
          zIndex: 2,
        }}
      >
        <SearchIcon />
      </span>
      <input
        ref={ref}
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(0);
          setShowDropdown(true);
        }}
        onFocus={() => {
          if (search.trim()) setShowDropdown(true);
          onInputFocus?.();
        }}
        onKeyDown={handleKeyDown}
        placeholder="Search services..."
        style={{
          width: "100%",
          padding: `0.4rem ${onDismiss && resultCount != null ? "5rem" : onDismiss ? "2rem" : "0.6rem"} 0.4rem 2rem`,
          fontSize: 14,
          borderRadius: 8,
          border: "1px solid var(--vocs-border-color-primary)",
          background:
            "light-dark(rgba(255,255,255,0.8), rgba(255,255,255,0.04))",
          color: "var(--vocs-text-color-heading)",
          fontFamily: "var(--font-sans)",
          outline: "none",
        }}
      />
      {onDismiss && resultCount != null && (
        <span
          style={{
            position: "absolute",
            right: 32,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "12.5px",
            color: "var(--vocs-text-color-muted)",
            pointerEvents: "none",
            zIndex: 2,
          }}
        >
          {resultCount}
        </span>
      )}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            border: "none",
            background: "transparent",
            color: "var(--vocs-text-color-muted)",
            cursor: "pointer",
            padding: 4,
            display: "flex",
            alignItems: "center",
            zIndex: 2,
          }}
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
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      )}
      {!search && !onDismiss && (
        <kbd
          className="search-kbd-hint"
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 11,
            padding: "1px 5px",
            borderRadius: 4,
            border: "1px solid var(--vocs-border-color-primary)",
            color: "var(--vocs-text-color-muted)",
            fontFamily: "var(--font-sans)",
            pointerEvents: "none",
          }}
        >
          ⌘K
        </kbd>
      )}
      {showDropdown && dropdownResults.length > 0 && (
        <div
          ref={dropdownRef}
          className="search-dropdown"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 100,
            borderRadius: 12,
            border: "1px solid var(--vocs-border-color-primary)",
            background: "var(--vocs-background-color-primary)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 2,
              padding: "0.4rem 0.6rem",
              borderBottom: "1px solid var(--vocs-border-color-primary)",
            }}
          >
            {(["all", "services", "endpoints"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setDropdownTab(tab);
                  setActiveIndex(-1);
                }}
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-sans)",
                  padding: "3px 10px",
                  borderRadius: 5,
                  border: "none",
                  background:
                    dropdownTab === tab
                      ? "light-dark(rgba(0,0,0,0.07), rgba(255,255,255,0.1))"
                      : "transparent",
                  color:
                    dropdownTab === tab
                      ? "var(--vocs-text-color-heading)"
                      : "var(--vocs-text-color-muted)",
                }}
              >
                {tab === "all"
                  ? "All"
                  : tab === "services"
                    ? "Services"
                    : "Endpoints"}
              </button>
            ))}
          </div>
          <div style={{ maxHeight: 360, overflow: "auto" }}>
            {dropdownResults
              .filter(
                (r) =>
                  dropdownTab === "all" ||
                  (dropdownTab === "services" &&
                    (r.type === "service" || r.type === "category")) ||
                  (dropdownTab === "endpoints" && r.type === "endpoint"),
              )
              .map((result, idx) => (
                // biome-ignore lint/a11y/useKeyWithClickEvents: dropdown item
                // biome-ignore lint/a11y/noStaticElementInteractions: dropdown item
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: filtered list with no stable id
                  key={`${result.type}-${idx}`}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className="search-dropdown-item"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    width: "100%",
                    padding: "0.6rem 1rem",
                    background:
                      idx === activeIndex
                        ? "light-dark(rgba(0,0,0,0.04), rgba(255,255,255,0.06))"
                        : "transparent",
                    border: "none",

                    textAlign: "left",
                    fontFamily: "var(--font-sans)",
                    fontSize: 13,
                    color: "var(--vocs-text-color-heading)",
                    transition: "background 0.1s",
                  }}
                >
                  {result.type === "category" && (
                    <>
                      <span
                        style={{
                          fontSize: 10,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--vocs-text-color-muted)",
                          background:
                            "light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.08))",
                          padding: "2px 6px",
                          borderRadius: 4,
                          flexShrink: 0,
                          width: 62,
                          textAlign: "center",
                          boxSizing: "border-box" as const,
                        }}
                      >
                        Category
                      </span>
                      <span>{result.label}</span>
                    </>
                  )}
                  {result.type === "service" && (
                    <>
                      <span
                        style={{
                          fontSize: 10,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--vocs-text-color-muted)",
                          background:
                            "light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.08))",
                          padding: "2px 6px",
                          borderRadius: 4,
                          flexShrink: 0,
                          width: 62,
                          textAlign: "center",
                          boxSizing: "border-box" as const,
                        }}
                      >
                        Service
                      </span>
                      <span style={{ fontWeight: 500 }}>
                        {result.service.name}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--vocs-text-color-muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {result.service.description?.slice(0, 60)}
                      </span>
                    </>
                  )}
                  {result.type === "endpoint" && (
                    <>
                      <span
                        style={{
                          fontSize: 10,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--vocs-text-color-muted)",
                          background:
                            "light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.08))",
                          padding: "2px 6px",
                          borderRadius: 4,
                          flexShrink: 0,
                          width: 62,
                          textAlign: "center",
                          boxSizing: "border-box" as const,
                        }}
                      >
                        Endpoint
                      </span>
                      <span style={{ fontWeight: 500 }}>
                        {result.service.name}
                      </span>
                      <span
                        style={{
                          marginLeft: "auto",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 12,
                            color: "var(--vocs-text-color-muted)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {result.endpoint.path}
                        </span>
                        <span
                          className={`method-badge method-${result.endpoint.method.toLowerCase()}`}
                        >
                          {result.endpoint.method}
                        </span>
                      </span>
                    </>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// DropdownServiceIcon removed — dropdown now uses tag labels matching discovery homepage

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

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
  const segments = children.match(/"[^"]*"|'[^']*'|\S+|\s+/g) ?? [];
  let key = 0;
  for (const tok of segments) {
    if (/^(claude|codex|amp)$/i.test(tok)) {
      parts.push(
        <span key={key} style={{ color: CMD_PURPLE, fontWeight: 600 }}>
          {tok}
        </span>,
      );
    } else if (/^(curl|bash)$/.test(tok)) {
      parts.push(
        <span key={key} style={{ color: CMD_PURPLE }}>
          {tok}
        </span>,
      );
    } else if (/^(tempo)$/.test(tok)) {
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
    } else if (/^["']/.test(tok) && tok.length > 1) {
      parts.push(
        <span key={key} style={{ color: "var(--vocs-text-color-heading)" }}>
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
// Helpers
// ---------------------------------------------------------------------------

function orderServices(services: Service[]): Service[] {
  const pinned = PINNED_IDS.flatMap((id) =>
    services.filter((s) => s.id === id),
  );
  const pinnedSet = new Set(PINNED_IDS);
  const rest = services.filter((s) => !pinnedSet.has(s.id));
  rest.sort((a, b) => a.name.localeCompare(b.name));
  return [...pinned, ...rest];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [walletOpen, setWalletOpen] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const initialHashHandled = useRef(false);
  const [mobileSearchActive, setMobileSearchActive] = useState(false);
  const [mobileSearchStuck, setMobileSearchStuck] = useState(false);
  const [mobileResultsView, setMobileResultsView] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [gridSelectedServiceId, setGridSelectedServiceId] = useState<
    string | undefined
  >(undefined);
  const tableRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
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

  // Reset expanded row when search or category changes so rows don't stay grayed out
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset on category change
  useEffect(() => {
    setExpandedIds(new Set());
  }, [debouncedSearch, selectedCategory]);

  const stickyObserverReady = !loading && !error;
  useEffect(() => {
    if (!stickyObserverReady) return;
    const el = stickyRef.current;
    if (!el) return;
    const navH =
      document.querySelector("[data-v-gutter-top]")?.getBoundingClientRect()
        .height ?? 56;
    const io = new IntersectionObserver(
      ([e]) => {
        document.documentElement.toggleAttribute(
          "data-search-stuck",
          !e.isIntersecting,
        );
      },
      { threshold: 0, rootMargin: `-${navH}px 0px 0px 0px` },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      document.documentElement.removeAttribute("data-search-stuck");
    };
  }, [stickyObserverReady]);

  useEffect(() => {
    if (!stickyObserverReady) return;
    if (window.matchMedia("(min-width: 901px)").matches) return;
    const el = document.querySelector(".search-mobile-spacer");
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        const stuck = !e.isIntersecting;
        document.documentElement.toggleAttribute(
          "data-mobile-search-stuck",
          stuck,
        );
        setMobileSearchStuck(stuck);
      },
      { threshold: 0 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      document.documentElement.removeAttribute("data-mobile-search-stuck");
      setMobileSearchStuck(false);
    };
  }, [stickyObserverReady]);

  useEffect(() => {
    if (window.matchMedia("(min-width: 901px)").matches) return;
    const nav = document.querySelector("[data-v-gutter-top]") as HTMLElement;
    if (!nav) return;
    const sync = () => {
      const rect = nav.getBoundingClientRect();
      const visible = rect.bottom > 0;
      document.documentElement.style.setProperty(
        "--mobile-search-top",
        visible ? `${rect.bottom}px` : "0px",
      );
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(nav, { attributes: true, attributeFilter: ["style", "class"] });
    window.addEventListener("scroll", sync, { passive: true });
    return () => {
      mo.disconnect();
      window.removeEventListener("scroll", sync);
      document.documentElement.style.removeProperty("--mobile-search-top");
    };
  }, []);

  // Cmd+K to focus search
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  const categories = useMemo(
    () =>
      [
        ...new Set(services.flatMap((s) => allCategories(s))),
      ].sort() as Category[],
    [services],
  );

  const effectiveSearch =
    mobileSearchActive && !mobileResultsView ? "" : debouncedSearch;

  const filtered = useMemo(() => {
    let list = services;
    if (selectedCategory)
      list = list.filter((s) =>
        allCategories(s).some((c) => c === selectedCategory),
      );
    if (effectiveSearch) {
      const q = effectiveSearch.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.url.toLowerCase().includes(q) ||
          s.tags?.some((t) => t.toLowerCase().includes(q)) ||
          s.endpoints.some(
            (ep) =>
              ep.path.toLowerCase().includes(q) ||
              ep.description?.toLowerCase().includes(q) ||
              ep.method.toLowerCase().includes(q),
          ),
      );
    }
    return orderServices(list);
  }, [services, selectedCategory, effectiveSearch]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const mobileSearchCount = useMemo(() => {
    if (!search.trim()) return 0;
    const q = search.toLowerCase();
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.url.toLowerCase().includes(q) ||
        s.tags?.some((t) => t.toLowerCase().includes(q)) ||
        s.endpoints.some(
          (ep) =>
            ep.path.toLowerCase().includes(q) ||
            ep.description?.toLowerCase().includes(q) ||
            ep.method.toLowerCase().includes(q),
        ),
    ).length;
  }, [services, search]);

  const toggleRow = useCallback((id: string) => {
    setExpandedIds((p) => {
      if (p.has(id)) {
        history.replaceState(null, "", window.location.pathname);
        return new Set();
      }
      const hadPrevious = p.size > 0;
      history.replaceState(null, "", `/services#${id}`);
      const delay = hadPrevious ? 220 : 50;
      setTimeout(() => {
        const el = document.getElementById(`service-${id}`);
        if (!el) return;
        const navH =
          document.querySelector("[data-v-gutter-top]")?.getBoundingClientRect()
            .height ?? 56;
        const barH =
          document.querySelector(".search-bar")?.getBoundingClientRect()
            .height ?? 0;
        const target =
          el.getBoundingClientRect().top + window.scrollY - navH - barH - 12;
        const start = window.scrollY;
        const dist = target - start;
        if (Math.abs(dist) < 2) return;
        const dur = Math.min(600, Math.max(300, Math.abs(dist) * 0.6));
        let t0: number | null = null;
        const step = (t: number) => {
          if (!t0) t0 = t;
          const p = Math.min((t - t0) / dur, 1);
          const ease = p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;
          window.scrollTo(0, start + dist * ease);
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }, delay);
      return new Set([id]);
    });
  }, []);

  const selectAndScrollToService = useCallback(
    (serviceId: string) => {
      setSearch("");
      setDebouncedSearch("");
      setSelectedCategory(null);
      setMobileSearchActive(false);
      setMobileResultsView(false);
      if (viewMode === "grid") {
        setGridSelectedServiceId(serviceId);
        return;
      }
      setExpandedIds(new Set([serviceId]));
      history.replaceState(null, "", `/services#${serviceId}`);
      const all = orderServices(services);
      const idx = all.findIndex((s) => s.id === serviceId);
      if (idx >= 0) setPage(Math.floor(idx / PAGE_SIZE));
      setTimeout(() => {
        document
          .getElementById(`service-${serviceId}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    },
    [services, viewMode],
  );

  // Handle anchor hash on mount
  useEffect(() => {
    if (services.length === 0 || initialHashHandled.current) return;
    const hash = window.location.hash;
    if (!hash.startsWith("#")) return;
    initialHashHandled.current = true;
    const serviceId = hash.slice(1);
    if (services.some((s) => s.id === serviceId)) {
      selectAndScrollToService(serviceId);
    }
  }, [services, selectAndScrollToService]);

  const toggleCat = (cat: Category) => {
    setSelectedCategory((prev) => (prev === cat ? null : cat));
    setPage(0);
  };
  const clearCats = () => {
    setSelectedCategory(null);
    setPage(0);
  };

  const handleSelectCategory = useCallback((cat: Category) => {
    setSelectedCategory(cat);
    setSearch("");
    setDebouncedSearch("");
    setPage(0);
    setMobileSearchActive(false);
    setMobileResultsView(false);
  }, []);

  const dismissMobileSearch = useCallback(() => {
    setMobileSearchActive(false);
    setMobileResultsView(false);
    setSearch("");
    setDebouncedSearch("");
  }, []);

  const handleMobileView = useCallback(() => {
    setMobileResultsView(true);
    setDebouncedSearch(search);
    setPage(0);
    setTimeout(() => {
      const el = tableRef.current;
      if (!el) return;
      const navH =
        document.querySelector("[data-v-gutter-top]")?.getBoundingClientRect()
          .height ?? 56;
      const barH =
        document.querySelector(".search-mobile")?.getBoundingClientRect()
          .height ?? 56;
      const y =
        el.getBoundingClientRect().top + window.scrollY - navH - barH - 12;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }, 100);
  }, [search]);

  const handleMobileSearchFocus = useCallback(() => {
    if (window.matchMedia("(max-width: 900px)").matches) {
      setMobileSearchActive(true);
    }
  }, []);

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
          padding: "3rem 1.5rem 5rem 1.5rem",
        }}
      >
        {/* Header */}
        <div
          className="page-header"
          style={{
            marginBottom: "0.5rem",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1rem",
            marginLeft: "0.5rem",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "2.5rem",
                fontWeight: 700,
                fontFamily: '"VTC Du Bois", var(--font-sans)',
                letterSpacing: "-0.02em",
                margin: 0,
                whiteSpace: "nowrap",
                marginBottom: "0rem",
                paddingBottom: "0rem",
                textTransform: "uppercase",
              }}
            >
              Discover services
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
              Seamlessly use MPP-enabled services with your agent.
            </p>
          </div>
          <div className="page-header-ctas" style={{ display: "none" }} />
        </div>

        {/* Header cards — visible when sidebar hidden */}
        <div
          className="header-cards"
          style={{ display: "none", marginBottom: "1.5rem" }}
        >
          <HeaderCards
            walletOpen={walletOpen}
            onWalletToggle={() => setWalletOpen(!walletOpen)}
          />
        </div>

        {/* Layout */}
        <div
          className="services-layout"
          style={{ display: "flex", gap: "3rem", alignItems: "flex-start" }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading && (
              <div>
                <style>
                  {`@keyframes skeletonShimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                  }`}
                </style>
                {["a", "b", "c", "d", "e", "f", "g", "h"].map((k) => (
                  <div
                    key={k}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      height: 58,
                      padding: "0 1rem",
                      borderBottom:
                        "1px solid light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.06))",
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background:
                          "linear-gradient(90deg, light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.06)) 25%, light-dark(rgba(0,0,0,0.1), rgba(255,255,255,0.1)) 50%, light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.06)) 75%)",
                        backgroundSize: "200% 100%",
                        animation: "skeletonShimmer 1.5s infinite ease-in-out",
                        flexShrink: 0,
                      }}
                    />
                    <div
                      style={{
                        width: 100,
                        height: 14,
                        borderRadius: 4,
                        background:
                          "linear-gradient(90deg, light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.06)) 25%, light-dark(rgba(0,0,0,0.1), rgba(255,255,255,0.1)) 50%, light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.06)) 75%)",
                        backgroundSize: "200% 100%",
                        animation: "skeletonShimmer 1.5s infinite ease-in-out",
                        animationDelay: "0.1s",
                        flexShrink: 0,
                      }}
                    />
                    <div
                      style={{
                        flex: 1,
                        height: 12,
                        borderRadius: 4,
                        background:
                          "linear-gradient(90deg, light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.06)) 25%, light-dark(rgba(0,0,0,0.1), rgba(255,255,255,0.1)) 50%, light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.06)) 75%)",
                        backgroundSize: "200% 100%",
                        animation: "skeletonShimmer 1.5s infinite ease-in-out",
                        animationDelay: "0.2s",
                      }}
                    />
                    <div
                      style={{
                        width: 140,
                        height: 12,
                        borderRadius: 4,
                        background:
                          "linear-gradient(90deg, light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.06)) 25%, light-dark(rgba(0,0,0,0.1), rgba(255,255,255,0.1)) 50%, light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.06)) 75%)",
                        backgroundSize: "200% 100%",
                        animation: "skeletonShimmer 1.5s infinite ease-in-out",
                        animationDelay: "0.3s",
                        flexShrink: 0,
                      }}
                    />
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        background:
                          "linear-gradient(90deg, light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.06)) 25%, light-dark(rgba(0,0,0,0.1), rgba(255,255,255,0.1)) 50%, light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.06)) 75%)",
                        backgroundSize: "200% 100%",
                        animation: "skeletonShimmer 1.5s infinite ease-in-out",
                        animationDelay: "0.4s",
                        flexShrink: 0,
                      }}
                    />
                  </div>
                ))}
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
                {mobileSearchActive &&
                  !mobileResultsView &&
                  mobileSearchStuck && (
                    // biome-ignore lint/a11y/useKeyWithClickEvents: backdrop
                    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop
                    <div
                      className="mobile-search-backdrop"
                      onClick={dismissMobileSearch}
                      style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 99,
                        background:
                          "light-dark(rgba(255,255,255,0.85), rgba(0,0,0,0.75))",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                      }}
                    />
                  )}
                {mobileResultsView && (
                  <div
                    className="mobile-results-header"
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 30,
                      display: "none",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.75rem 1.25rem",
                      background: "var(--vocs-background-color-primary)",
                      borderBottom:
                        "1px solid var(--vocs-border-color-primary)",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <SearchWithDropdown
                        search={search}
                        setSearch={setSearch}
                        setPage={setPage}
                        services={services}
                        onSelectService={selectAndScrollToService}
                        onSelectCategory={handleSelectCategory}
                        fullWidth
                        inputRef={mobileSearchInputRef}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={dismissMobileSearch}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "var(--vocs-text-color-muted)",

                        padding: 4,
                        borderRadius: 4,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
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
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                <div
                  className="search-mobile-spacer"
                  style={{ display: "none" }}
                />
                <div
                  className={`search-mobile${mobileSearchActive && !mobileResultsView ? " search-mobile-active" : ""}`}
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
                      alignItems: "stretch",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <SearchWithDropdown
                        search={search}
                        setSearch={(v) => {
                          setSearch(v);
                          if (v && !mobileSearchActive) {
                            if (
                              window.matchMedia("(max-width: 900px)").matches
                            ) {
                              setMobileSearchActive(true);
                            }
                          }
                        }}
                        setPage={setPage}
                        services={services}
                        onSelectService={selectAndScrollToService}
                        onSelectCategory={handleSelectCategory}
                        fullWidth
                        inputRef={searchInputRef}
                        onInputFocus={handleMobileSearchFocus}
                        onDismiss={
                          mobileSearchActive ? dismissMobileSearch : undefined
                        }
                        resultCount={
                          mobileSearchActive && search.trim()
                            ? mobileSearchCount
                            : undefined
                        }
                      />
                    </div>
                    {!mobileSearchActive && (
                      <div
                        className="mobile-view-toggle"
                        style={{
                          display: "flex",
                          gap: 2,
                          flexShrink: 0,
                          alignItems: "center",
                        }}
                      >
                        <button
                          type="button"
                          aria-label="List view"
                          onClick={() => setViewMode("list")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 34,
                            height: 34,
                            border: "none",
                            borderRadius: 6,

                            background: "transparent",
                            color:
                              viewMode === "list"
                                ? "var(--vocs-text-color-heading)"
                                : "var(--vocs-text-color-muted)",
                            opacity: viewMode === "list" ? 1 : 0.5,
                          }}
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
                          >
                            <title>List</title>
                            <path d="M3 6h18" />
                            <path d="M3 12h18" />
                            <path d="M3 18h18" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          aria-label="Grid view"
                          onClick={() => setViewMode("grid")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 34,
                            height: 34,
                            border: "none",
                            borderRadius: 6,

                            background: "transparent",
                            color:
                              viewMode === "grid"
                                ? "var(--vocs-text-color-heading)"
                                : "var(--vocs-text-color-muted)",
                            opacity: viewMode === "grid" ? 1 : 0.5,
                          }}
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
                          >
                            <title>Grid</title>
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                          </svg>
                        </button>
                      </div>
                    )}
                    {mobileSearchActive &&
                      !mobileResultsView &&
                      search.trim() && (
                        <button
                          type="button"
                          className="mobile-search-view-btn"
                          onClick={handleMobileView}
                          style={{
                            flexShrink: 0,
                            border:
                              "1px solid var(--vocs-border-color-primary)",
                            background:
                              "light-dark(rgba(0,0,0,0.03), rgba(255,255,255,0.06))",
                            color: "var(--vocs-text-color-heading)",
                            fontSize: 13,
                            fontWeight: 500,
                            fontFamily: "var(--font-sans)",
                            cursor: "pointer",
                            padding: "0.45rem 0.85rem",
                            borderRadius: 7,
                            whiteSpace: "nowrap",
                            transition:
                              "color 0.15s, border-color 0.15s, background 0.15s",
                          }}
                        >
                          View
                        </button>
                      )}
                  </div>
                </div>
                <div
                  ref={stickyRef}
                  style={{ height: 1, marginBottom: -1, pointerEvents: "none" }}
                  aria-hidden
                />
                <div
                  className="search-bar"
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                    marginBottom: "0.75rem",
                    marginRight: "0.5rem",
                    position: "sticky",
                    top: "calc(var(--vocs-spacing-topNav, 56px) -  46px)",
                    zIndex: 51,
                    background:
                      "linear-gradient(to bottom, var(--vocs-background-color-primary) 80%, transparent)",
                    paddingBottom: "0.75rem",
                  }}
                >
                  <SearchWithDropdown
                    search={search}
                    setSearch={setSearch}
                    setPage={setPage}
                    services={services}
                    onSelectService={selectAndScrollToService}
                    onSelectCategory={handleSelectCategory}
                    fullWidth
                    inputRef={searchInputRef}
                  />
                  <FilterDropdown
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onSelect={toggleCat}
                    onClear={clearCats}
                  />
                  <div
                    style={{
                      display: "flex",
                      gap: 2,
                      flexShrink: 0,
                    }}
                  >
                    <button
                      type="button"
                      aria-label="List view"
                      onClick={() => setViewMode("list")}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 34,
                        height: 34,
                        border: "none",
                        borderRadius: 6,

                        background: "transparent",
                        color:
                          viewMode === "list"
                            ? "var(--vocs-text-color-heading)"
                            : "var(--vocs-text-color-muted)",
                        opacity: viewMode === "list" ? 1 : 0.5,
                        transition: "color 0.15s, opacity 0.15s",
                      }}
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
                      >
                        <title>List</title>
                        <path d="M3 6h18" />
                        <path d="M3 12h18" />
                        <path d="M3 18h18" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      aria-label="Grid view"
                      onClick={() => setViewMode("grid")}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 34,
                        height: 34,
                        border: "none",
                        borderRadius: 6,

                        background: "transparent",
                        color:
                          viewMode === "grid"
                            ? "var(--vocs-text-color-heading)"
                            : "var(--vocs-text-color-muted)",
                        opacity: viewMode === "grid" ? 1 : 0.5,
                        transition: "color 0.15s, opacity 0.15s",
                      }}
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
                      >
                        <title>Grid</title>
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                      </svg>
                    </button>
                  </div>
                  <Link
                    to="/overview"
                    className="no-underline! search-bar-learn-more"
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      padding: "0.45rem 0.85rem",
                      borderRadius: 7,
                      color: "var(--vocs-text-color-heading)",
                      border: "1px solid var(--vocs-border-color-primary)",
                      background:
                        "light-dark(rgba(0,0,0,0.03), rgba(255,255,255,0.06))",
                      textDecoration: "none",
                      transition:
                        "color 0.15s, border-color 0.15s, background 0.15s",
                      flexShrink: 0,
                    }}
                  >
                    Learn more
                  </Link>
                </div>
                {viewMode === "grid" ? (
                  <div className="services-grid-inline">
                    <style>{`
                      .services-grid-inline .discovery-section {
                        height: auto !important;
                        overflow: visible !important;
                      }
                      .services-grid-inline .discovery-overlay {
                        display: none !important;
                      }
                      .services-grid-inline .discovery-grid {
                        height: auto !important;
                        overflow: visible !important;
                        grid-template-columns: repeat(4, 1fr) !important;
                        grid-auto-rows: minmax(150px, 1fr) !important;
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                      }
                      .services-grid-inline .discovery-grid::before,
                      .services-grid-inline .discovery-grid::after {
                        display: none !important;
                      }
                      @media (max-width: 1100px) {
                        .services-grid-inline .discovery-grid {
                          grid-template-columns: repeat(3, 1fr) !important;
                        }
                      }
                      @media (max-width: 900px) {
                        .services-grid-inline .discovery-grid {
                          grid-template-columns: repeat(2, 1fr) !important;
                          grid-auto-rows: 120px !important;
                          padding-left: 1.25rem !important;
                          padding-right: 1.25rem !important;
                        }
                        .services-grid-inline .discovery-card-desc {
                          font-size: 14px !important;
                        }
                      }
                    `}</style>
                    <ServiceDiscovery
                      externalQuery={debouncedSearch}
                      externalCategory={selectedCategory}
                      externalSelectedServiceId={gridSelectedServiceId}
                      onExternalServiceHandled={() =>
                        setGridSelectedServiceId(undefined)
                      }
                    />
                  </div>
                ) : (
                  <div ref={tableRef} className="services-content-row">
                    <div
                      className="services-table-col"
                      style={{ flex: 1, minWidth: 0 }}
                    >
                      <div
                        data-services-table
                        {...(expandedIds.size > 0
                          ? { "data-has-expanded": "" }
                          : {})}
                      >
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
                            <col
                              className="hide-mobile"
                              style={{ width: "36%" }}
                            />
                            <col
                              className="hide-mobile"
                              style={{ width: "36%" }}
                            />
                            <col style={{ width: "10%" }} />
                          </colgroup>
                          <thead>
                            <tr
                              style={{
                                borderBottom:
                                  "1px solid var(--vocs-border-color-primary)",
                              }}
                            >
                              <Th
                                className="hide-mobile"
                                style={{ textAlign: "left" }}
                              >
                                Provider
                              </Th>
                              <Th
                                className="hide-mobile"
                                style={{ textAlign: "left" }}
                              >
                                Description
                              </Th>
                              <Th
                                className="hide-mobile"
                                style={{ textAlign: "left" }}
                              >
                                Service URL
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
                            {Math.min((page + 1) * PAGE_SIZE, filtered.length)}{" "}
                            of {filtered.length}
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
            <WalletCardFull />
            <SidebarInfoCards />
          </div>
        </div>
      </div>
      {showAddServiceModal && (
        <AddServiceModal onClose={() => setShowAddServiceModal(false)} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add Service Modal
// ---------------------------------------------------------------------------

export function AddServiceModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: "",
    homepage: "",
    docs: "",
    icon: "",
    github: "",
    email: "",
    telegram: "",
    terms: false,
    firstParty: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const set = (key: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (
      !form.name ||
      !form.homepage ||
      !form.docs ||
      !form.icon ||
      !form.github ||
      !form.email
    ) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!form.terms) {
      setError("You must agree to the terms.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/submit-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
  };
  const panelStyle: React.CSSProperties = {
    background: "var(--vocs-background-color-primary)",
    border: "1px solid var(--vocs-border-color-primary)",
    borderRadius: 12,
    maxWidth: 520,
    width: "100%",
    maxHeight: "80vh",
    overflow: "auto",
    padding: "1.5rem",
  };
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.5rem 0.75rem",
    borderRadius: 6,
    border: "1px solid var(--vocs-border-color-primary)",
    background: "transparent",
    color: "var(--vocs-text-color-heading)",
    fontSize: 14,
    fontFamily: "var(--font-sans)",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 500,
    color: "var(--vocs-text-color-secondary)",
    marginBottom: 4,
    display: "block",
  };

  if (submitted) {
    return (
      // biome-ignore lint/a11y/useKeyWithClickEvents: overlay
      // biome-ignore lint/a11y/noStaticElementInteractions: overlay
      <div style={overlayStyle} onClick={onClose}>
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: modal panel */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: modal panel */}
        <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: 18, fontWeight: 600 }}>
            Submitted
          </h3>
          <p
            style={{ color: "var(--vocs-text-color-secondary)", fontSize: 14 }}
          >
            Your service has been submitted for review. We will reach out via
            the email you provided.
          </p>
          <button
            type="button"
            onClick={onClose}
            style={{
              marginTop: "1rem",
              padding: "0.4rem 1rem",
              borderRadius: 6,
              border: "none",
              background: "var(--vocs-text-color-heading)",
              color: "var(--vocs-background-color-primary)",

              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: overlay
    // biome-ignore lint/a11y/noStaticElementInteractions: overlay
    <div style={overlayStyle} onClick={onClose}>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: modal panel */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: modal panel */}
      <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 1rem", fontSize: 18, fontWeight: 600 }}>
          Add a service
        </h3>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          <div>
            <label htmlFor="svc-name" style={labelStyle}>
              Service name *
            </label>
            <input
              id="svc-name"
              style={inputStyle}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="My Service"
            />
          </div>
          <div>
            <label htmlFor="svc-homepage" style={labelStyle}>
              Homepage URL *
            </label>
            <input
              id="svc-homepage"
              style={inputStyle}
              value={form.homepage}
              onChange={(e) => set("homepage", e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <div>
            <label htmlFor="svc-docs" style={labelStyle}>
              Documentation URL *
            </label>
            <input
              id="svc-docs"
              style={inputStyle}
              value={form.docs}
              onChange={(e) => set("docs", e.target.value)}
              placeholder="https://docs.example.com"
            />
          </div>
          <div>
            <label htmlFor="svc-icon" style={labelStyle}>
              Icon URL (square, SVG, monochrome) *
            </label>
            <input
              id="svc-icon"
              style={inputStyle}
              value={form.icon}
              onChange={(e) => set("icon", e.target.value)}
              placeholder="https://example.com/icon.svg"
            />
          </div>
          <div>
            <label htmlFor="svc-github" style={labelStyle}>
              GitHub URL *
            </label>
            <input
              id="svc-github"
              style={inputStyle}
              value={form.github}
              onChange={(e) => set("github", e.target.value)}
              placeholder="https://github.com/org/repo"
            />
          </div>
          <div>
            <label htmlFor="svc-email" style={labelStyle}>
              Contact email *
            </label>
            <input
              id="svc-email"
              style={inputStyle}
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="svc-telegram" style={labelStyle}>
              Contact Telegram (optional)
            </label>
            <input
              id="svc-telegram"
              style={inputStyle}
              value={form.telegram}
              onChange={(e) => set("telegram", e.target.value)}
              placeholder="@handle"
            />
          </div>
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              fontSize: 13,
              color: "var(--vocs-text-color-secondary)",
            }}
          >
            <input
              type="checkbox"
              checked={form.terms}
              onChange={(e) => set("terms", e.target.checked)}
              style={{ marginTop: 3 }}
            />
            <span>
              I agree to the review terms. Submitted services are subject to
              review and may be accepted, rejected, or removed at any time.
              Tempo reserves the right to audit service integrations.
            </span>
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              fontSize: 13,
              color: "var(--vocs-text-color-secondary)",
            }}
          >
            <input
              type="checkbox"
              checked={form.firstParty}
              onChange={(e) => set("firstParty", e.target.checked)}
              style={{ marginTop: 3 }}
            />
            <span>
              I am interested in first-party integration (direct MPP support
              without a proxy).
            </span>
          </label>
          {error && (
            <p style={{ color: "red", fontSize: 13, margin: 0 }}>{error}</p>
          )}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              justifyContent: "flex-end",
              marginTop: "0.5rem",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.4rem 1rem",
                borderRadius: 6,
                border: "1px solid var(--vocs-border-color-primary)",
                background: "transparent",
                color: "var(--vocs-text-color-heading)",

                fontSize: 14,
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: "0.4rem 1rem",
                borderRadius: 6,
                border: "none",
                background: "var(--vocs-text-color-heading)",
                color: "var(--vocs-background-color-primary)",

                fontSize: 14,
                fontWeight: 500,
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wallet cards
// ---------------------------------------------------------------------------

function WalletCardFull() {
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
          fontSize: "1.15rem",
          fontWeight: 500,
          letterSpacing: "-0.02em",
          marginBottom: "0.35rem",
        }}
      >
        Use with agents
      </h2>
      <p
        style={{
          color: "var(--vocs-text-color-secondary)",
          fontSize: 14,
          lineHeight: 1.5,
          marginBottom: "1.25rem",
        }}
      >
        Install Tempo CLI and its wallet to fund your agents use of MPP
        services.
      </p>
      <WalletSteps />
    </div>
  );
}

function HeaderCards({
  walletOpen,
  onWalletToggle,
}: {
  walletOpen: boolean;
  onWalletToggle: () => void;
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
  const titleS: React.CSSProperties = { fontSize: 13, fontWeight: 500 };
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
          onClick={onWalletToggle}
          className="info-card-link"
          style={{
            ...cs,

            fontFamily: "var(--font-sans)",
            textAlign: "left",
          }}
        >
          <span style={iconS}>
            <TerminalIcon />
          </span>
          <div>
            <div style={titleS}>Use with Tempo</div>
            <div style={descS}>CLI & wallet for agents</div>
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
            <div style={titleS}>Quickstart</div>
            <div style={descS}>Guides, quickstarts, and SDKs</div>
          </div>
        </a>
        <a
          href="/quickstart/server"
          className="info-card-link"
          style={{
            ...cs,
            padding: "0.65rem 0.5rem",
            background: "transparent",
            textDecoration: "none",
            color: "var(--vocs-text-color-heading)",
            transition: "background 0.15s, border-color 0.15s",
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
            <div style={descS}>Services which directly integrate with MPP</div>
            <div
              style={{
                fontSize: 11,
                color: "var(--vocs-text-color-link)",
                marginTop: "0.2rem",
              }}
            >
              Learn how to integrate →
            </div>
          </div>
        </a>
      </div>
      {walletOpen && (
        <div
          style={{
            marginTop: "0.5rem",
            borderRadius: 10,
            border: "1px solid var(--vocs-border-color-primary)",
            background: "light-dark(rgba(0,0,0,0.02), rgba(255,255,255,0.03))",
            padding: "1rem",
          }}
        >
          <WalletSteps />
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
    fontSize: 13,
    fontWeight: 500,
    marginBottom: "0.1rem",
  };
  const descStyle: React.CSSProperties = {
    fontSize: 13,
    color: "var(--vocs-text-color-muted)",
    lineHeight: 1.6,
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
      <a
        href="/advanced/discovery"
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
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
            <path d="M2 12h20" />
          </svg>
        </span>
        <div style={{ flex: 1 }}>
          <div style={titleStyle}>Discovery</div>
          <div style={descStyle}>Let agents automatically find your API.</div>
        </div>
        <ArrowRightIcon />
      </a>
      <a
        href="/quickstart/server"
        className="info-card-link"
        style={{
          ...cardStyle,
          background: "transparent",
          border: "1px solid var(--vocs-border-color-primary)",
          textDecoration: "none",
          color: "var(--vocs-text-color-heading)",
          transition: "background 0.15s, border-color 0.15s",
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
        <div style={{ flex: 1 }}>
          <div style={titleStyle}>First-party services</div>
          <div style={descStyle}>
            Services which directly integrate with MPP
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--vocs-text-color-link)",
              marginTop: "0.35rem",
            }}
          >
            Learn how to integrate →
          </div>
        </div>
      </a>
    </div>
  );
}

function WalletSteps() {
  return (
    <div
      style={{
        padding: "0 0rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
      }}
    >
      <CliSnippet
        label="Install Tempo tools"
        desc="Install the CLI. You will be asked to sign in or create a passkey-based wallet in your browser."
      >
        curl -L https://tempo.xyz/install | bash && tempo add request && tempo
        wallet login
      </CliSnippet>
      <CliSnippet
        label="Prompt your agent"
        desc="Tell Claude (or Codex, Amp, etc) to use a Tempo service."
      >
        {`claude "Summarize https://stripe.com/docs using parallel.ai search via Tempo"`}
      </CliSnippet>
      <div
        style={{
          fontSize: 13,
          color: "var(--vocs-text-color-muted)",
          lineHeight: 1.5,
        }}
      >
        Point your agent to{" "}
        <a
          href="/services/llms.txt"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "var(--vocs-text-color-secondary)",
            textDecoration: "underline",
            textUnderlineOffset: 2,
          }}
        >
          llms.txt
        </a>{" "}
        for full service documentation.
      </div>
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
            color: "var(--vocs-text-color-secondary)",
            fontSize: 13,
            lineHeight: 1.6,
            marginBottom: "0.75rem",
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
          padding: "0.6rem 0.6rem",
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

function FilterDropdown({
  categories,
  selectedCategory,
  onSelect,
  onClear,
}: {
  categories: Category[];
  selectedCategory: Category | null;
  onSelect: (cat: Category) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const label = selectedCategory
    ? (CATEGORY_LABELS[selectedCategory] ?? selectedCategory)
    : "Showing all";

  return (
    <div className="filter-dropdown-wrap" style={{ position: "relative" }}>
      <button
        type="button"
        className="filter-dropdown-btn"
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
          padding: "0.4rem 0.75rem",
          fontSize: 14,
          fontWeight: 500,
          borderRadius: 6,
          border: "1px solid var(--vocs-border-color-primary)",
          background: "transparent",
          color: "var(--vocs-text-color-muted)",

          fontFamily: "var(--font-sans)",
          whiteSpace: "nowrap",
        }}
      >
        {label}
        <svg
          aria-hidden="true"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.15s",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <>
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 19,
            }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              zIndex: 20,
              minWidth: 160,
              padding: "0.35rem",
              borderRadius: 8,
              border: "1px solid var(--vocs-border-color-primary)",
              background: "var(--vocs-background-color-primary)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            }}
          >
            <button
              type="button"
              onClick={() => {
                onClear();
                setOpen(false);
              }}
              style={{
                display: "block",
                width: "100%",
                padding: "0.45rem 0.65rem",
                fontSize: 14,
                textAlign: "left",
                border: "none",
                borderRadius: 5,
                background:
                  selectedCategory === null
                    ? "light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.1))"
                    : "transparent",
                color:
                  selectedCategory === null
                    ? "var(--vocs-text-color-heading)"
                    : "var(--vocs-text-color-secondary)",

                fontFamily: "var(--font-sans)",
              }}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => {
                  onSelect(cat);
                  setOpen(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "0.45rem 0.65rem",
                  fontSize: 14,
                  textAlign: "left",
                  border: "none",
                  borderRadius: 5,
                  background:
                    selectedCategory === cat
                      ? "light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.1))"
                      : "transparent",
                  color:
                    selectedCategory === cat
                      ? "var(--vocs-text-color-heading)"
                      : "var(--vocs-text-color-secondary)",

                  fontFamily: "var(--font-sans)",
                }}
              >
                {CATEGORY_LABELS[cat] ?? cat}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
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
// Service icon with optional first-party overlay
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
          src={iconUrl(s.id)}
          alt=""
          width={28}
          height={28}
          className="svc-icon-img"
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
        id={`service-${s.id}`}
        onClick={onToggle}
        {...(expanded ? { "data-expanded": "" } : {})}
        style={{
          borderBottom: expanded
            ? "1px solid transparent"
            : "1px solid var(--vocs-border-color-primary)",

          transition: "background 0.1s, opacity 0.2s",
          background: expanded ? expandedBg : undefined,
          minHeight: 58,
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
              alignItems: "flex-start",
              gap: "0.5rem",
              paddingTop: "0.15rem",
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
                className="show-tablet svc-desc-container"
                style={{ display: "none", marginTop: 8 }}
              >
                <span
                  className="svc-desc-mobile"
                  style={{
                    color: "var(--vocs-text-color-secondary)",
                    fontSize: 14,
                    lineHeight: 1.4,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {s.description}
                </span>
              </div>
              <div
                className="show-tablet url-mobile"
                style={{
                  display: "none",
                  marginTop: 10,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    color: URL_COLOR,
                    padding: "0.15rem 0.4rem",
                    borderRadius: 4,
                    background: CODE_BG,
                  }}
                >
                  <span style={{ opacity: 0.5 }}>https://</span>
                  {displayUrl.replace(/^https?:\/\//, "")}
                </span>
              </div>
            </div>
          </div>
        </td>
        <td
          className="hide-mobile"
          style={{
            padding: "0.7rem 0.75rem",
            color: "var(--vocs-text-color-secondary)",
            fontSize: 14,
            lineHeight: 1.6,
            verticalAlign: "middle",
          }}
        >
          {s.description}
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

              display: "inline-block",
              padding: "0.15rem 0.4rem",
              borderRadius: 4,
              background: CODE_BG,
              transition: "color 0.15s",
              wordBreak: "break-all",
              cursor: "pointer",
            }}
            title={
              copiedId === `url-${s.id}`
                ? "Copied!"
                : `Click to copy: ${displayUrl}`
            }
          >
            <span style={{ opacity: 0.5 }}>https://</span>
            {displayUrl.replace(/^https?:\/\//, "")}
            <span
              className="url-copy-icon"
              data-copied={copiedId === `url-${s.id}` ? "true" : undefined}
              style={{
                marginLeft: 4,
                display: "inline-flex",
                verticalAlign: "middle",
              }}
            >
              {copiedId === `url-${s.id}` ? (
                <CheckIcon size={10} />
              ) : (
                <CopyIcon size={10} />
              )}
            </span>
          </span>
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
              gap: "0.5rem",
              paddingRight: "0.75rem",
              color: "var(--vocs-text-color-muted)",
            }}
          >
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: copy */}
            {/* biome-ignore lint/a11y/noStaticElementInteractions: copy */}
            <span
              className="mobile-row-copy"
              onClick={(e) => {
                e.stopPropagation();
                copy(displayUrl, `url-${s.id}`);
              }}
              style={{
                display: "none",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: 8,
                color:
                  copiedId === `url-${s.id}`
                    ? "light-dark(#15803d, #4ade80)"
                    : "var(--vocs-text-color-muted)",
                transition: "color 0.15s",
                cursor: "pointer",
                flexShrink: 0,
              }}
              title={
                copiedId === `url-${s.id}` ? "Copied!" : `Copy: ${displayUrl}`
              }
            >
              {copiedId === `url-${s.id}` ? (
                <CheckIcon size={16} />
              ) : (
                <CopyIcon size={16} />
              )}
            </span>
            {(s.docs?.apiReference || s.docs?.llmsTxt || s.docs?.homepage) && (
              <a
                href={
                  (s.docs?.apiReference ?? s.docs?.llmsTxt ?? s.docs?.homepage)!
                }
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 32,
                  height: 32,
                  borderRadius: 7,
                  border: "1px solid var(--vocs-border-color-primary)",
                  color: "var(--vocs-text-color-muted)",
                  transition:
                    "background 0.15s, color 0.15s, border-color 0.15s",
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
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 32,
                  height: 32,
                  borderRadius: 7,
                  border: "1px solid var(--vocs-border-color-primary)",
                  color: "var(--vocs-text-color-muted)",
                  transition:
                    "background 0.15s, color 0.15s, border-color 0.15s",
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
      <AccordionRow expanded={expanded} bg={expandedBg}>
        <ExpandedDetail service={s} />
      </AccordionRow>
    </>
  );
}

const ACCORDION_MS = 200;

function AccordionRow({
  expanded,
  bg,
  children,
}: {
  expanded: boolean;
  bg: string;
  children: React.ReactNode;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [render, setRender] = useState(expanded);

  if (expanded && !render) setRender(true);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.style.gridTemplateRows = expanded ? "1fr" : "0fr";
    });
    if (!expanded) {
      const id = setTimeout(() => setRender(false), ACCORDION_MS);
      return () => clearTimeout(id);
    }
  }, [expanded]);

  if (!render) return null;

  return (
    <tr data-expanded={expanded ? "" : undefined} style={{ background: bg }}>
      <td
        className="expanded-detail"
        colSpan={4}
        style={{
          padding: 0,
          borderBottom: expanded
            ? "1px solid var(--vocs-border-color-primary)"
            : "1px solid transparent",
        }}
      >
        <div
          ref={gridRef}
          style={{
            display: "grid",
            gridTemplateRows: "0fr",
            transition: `grid-template-rows ${ACCORDION_MS}ms ease-out`,
          }}
        >
          <div style={{ overflow: "hidden", minHeight: 0 }}>{children}</div>
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Expanded detail
// ---------------------------------------------------------------------------

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
        fontSize: 13,
        fontWeight: 400,
        color: "var(--vocs-text-color-muted)",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function ExpandedDetail({ service: s }: { service: Service }) {
  const { copiedId, copy } = useCopyFeedback();
  const baseUrl = s.serviceUrl ?? s.url;
  return (
    <div style={{ fontSize: 14 }}>
      {baseUrl && (
        <div
          className="expanded-url-bar"
          style={{
            alignItems: "center",
            gap: "0.35rem",
            padding: "0.25rem 0.75rem 0.5rem 3.5rem",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              padding: "0.15rem 0.4rem",
              borderRadius: 4,
              background: CODE_BG,
              color: URL_COLOR,
              height: 24,
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            {baseUrl}
          </span>
        </div>
      )}
      {s.endpoints.length > 0 && (
        <div>
          <div
            className="sub-header"
            style={{
              padding: "0.45rem 0",
              background:
                "light-dark(rgba(0,0,0,0.025), rgba(255,255,255,0.025))",
            }}
          >
            <SubTh style={{ paddingLeft: "0.75rem" }}>Endpoint</SubTh>
            <SubTh>Description</SubTh>
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
                    minHeight: 56,
                    borderBottom: isLast
                      ? "none"
                      : "1px solid light-dark(rgba(0,0,0,0.05), rgba(255,255,255,0.05))",
                  }}
                >
                  <div
                    style={{
                      padding: "0.85rem 0.75rem 0.85rem 0.75rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        minWidth: 0,
                      }}
                    >
                      <span
                        className={`method-badge method-${ep.method.toLowerCase()}`}
                      >
                        {ep.method}
                      </span>
                      {/* biome-ignore lint/a11y/useKeyWithClickEvents: copy */}
                      {/* biome-ignore lint/a11y/noStaticElementInteractions: copy */}
                      <span
                        className="ep-path-clickable"
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

                          transition: "color 0.15s",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "inline-block",
                          minWidth: 0,
                          cursor: "pointer",
                        }}
                        title={isCopied ? "Copied!" : `Copy: ${fullUrl}`}
                      >
                        {ep.path}
                        <span
                          className="url-copy-icon ep-copy-inline"
                          data-copied={isCopied ? "true" : undefined}
                          style={{
                            marginLeft: 4,
                            display: "inline-flex",
                            verticalAlign: "middle",
                          }}
                        >
                          {isCopied ? (
                            <CheckIcon size={10} />
                          ) : (
                            <CopyIcon size={10} />
                          )}
                        </span>
                      </span>
                      {/* biome-ignore lint/a11y/useKeyWithClickEvents: copy */}
                      {/* biome-ignore lint/a11y/noStaticElementInteractions: copy */}
                      <span
                        className="ep-copy-outside"
                        onClick={(e) => {
                          e.stopPropagation();
                          copy(fullUrl, copyId);
                        }}
                        style={{
                          display: "none",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          cursor: "pointer",
                          color: isCopied
                            ? "light-dark(#15803d, #4ade80)"
                            : "var(--vocs-text-color-muted)",
                          transition: "color 0.15s",
                        }}
                        title={isCopied ? "Copied!" : `Copy: ${fullUrl}`}
                      >
                        {isCopied ? (
                          <CheckIcon size={14} />
                        ) : (
                          <CopyIcon size={14} />
                        )}
                      </span>
                      <span className="intent-badge-desktop">
                        {ep.payment?.intent && (
                          <span
                            className="intent-badge"
                            data-tip={
                              ep.payment.intent === "session"
                                ? "Session: Pay-as-you-go via payment channel"
                                : "Charge: One-time payment per request"
                            }
                          >
                            <Badge>{ep.payment.intent}</Badge>
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div
                    className="ep-desc-cell"
                    style={{
                      color: "var(--vocs-text-color-secondary)",
                      fontSize: 13.5,
                    }}
                  >
                    {ep.payment?.intent && (
                      <span className="intent-badge-mobile">
                        <Badge>{ep.payment.intent}</Badge>
                      </span>
                    )}
                    {ep.description}
                  </div>
                  <div
                    className="ep-price-cell"
                    style={{
                      padding: "0 1rem 0 0",
                      fontFamily: "var(--font-mono)",
                      fontSize: 14,
                      fontVariantNumeric: "tabular-nums",
                      color: "var(--vocs-text-color-secondary)",
                      whiteSpace: "nowrap",
                      alignSelf: "stretch",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                    }}
                  >
                    {ep.payment?.intent && (
                      <span
                        className="intent-badge-price"
                        style={{ marginRight: "0.35rem" }}
                      >
                        <Badge>{ep.payment.intent}</Badge>
                      </span>
                    )}
                    <span className="ep-price-text">{formatPrice(ep)}</span>

                    {/* biome-ignore lint/a11y/useKeyWithClickEvents: copy */}
                    {/* biome-ignore lint/a11y/noStaticElementInteractions: copy */}
                    <span
                      className="ep-copy-mobile"
                      onClick={(e) => {
                        e.stopPropagation();
                        copy(fullUrl, copyId);
                      }}
                      style={{
                        display: "none",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        color: isCopied
                          ? "light-dark(#15803d, #4ade80)"
                          : "var(--vocs-text-color-muted)",
                        cursor: "pointer",
                        transition: "color 0.15s",
                        flexShrink: 0,
                      }}
                      title={isCopied ? "Copied!" : `Copy: ${fullUrl}`}
                    >
                      {isCopied ? (
                        <CheckIcon size={14} />
                      ) : (
                        <CopyIcon size={14} />
                      )}
                    </span>
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
      
      [data-layout="minimal"] main { padding-left: 0 !important; padding-right: 0 !important; }
      [data-layout="minimal"] main > article { max-width: none !important; padding-left: 0 !important; padding-right: 0 !important; }

      /* Hide logo when search bar is stuck and overlaps it at mid-wide viewports */
      @media (min-width: 1500px) and (max-width: 1730px) {
        [data-search-stuck] [data-v-logo] { opacity: 0 !important; pointer-events: none; }
      }

      /* Tighten search bar padding when stuck so it aligns with nav links */
      [data-search-stuck] .search-bar { padding-top: 0rem !important; }

      @media (max-width: 900px) {
        [data-layout="minimal"] main { padding-left: 0 !important; padding-right: 0 !important; max-width: none !important; overflow-x: clip !important; }
        [data-layout="minimal"] main > article { padding-left: 0 !important; padding-right: 0 !important; max-width: none !important; width: 100% !important; }
      }
      /* Filter: always show dropdown, search bar taller */
      .filter-dropdown-wrap { display: block; }
      .filter-tags-pills { display: none !important; }
      .search-bar input { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
      .filter-dropdown-btn { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
      .search-bar-learn-more { display: inline-flex !important; align-items: center; }
      @media (max-width: 900px) {
        .search-bar-learn-more { display: none !important; }
      }

      /* Soften table borders */
      [data-services-table] table tr { border-color: light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.06)) !important; scroll-margin-top: calc(var(--vocs-spacing-topNav, 56px) + 80px); }

      .search-mobile { display: none; }
      .header-cards { display: none !important; }
      .sub-header { display: grid; grid-template-columns: minmax(0, 40%) minmax(0, 1fr) 8%; }
      .sub-row { display: grid; grid-template-columns: minmax(0, 40%) minmax(0, 1fr) 8%; align-items: center; }
      .ep-desc-cell { padding: 0.25rem 0.75rem 0.85rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; white-space: normal; word-break: break-word; }
      .show-tablet { display: none !important; }
      .expanded-url-bar { display: none !important; }
      .url-copy-icon { opacity: 0.8; transition: opacity 0.15s, color 0.15s; color: var(--vocs-text-color-muted); }
      .url-copy-icon[data-copied="true"] { color: light-dark(#15803d, #4ade80); opacity: 1; }
      span:hover > .url-copy-icon { opacity: 1; }
      .sub-row:hover .url-copy-icon { opacity: 0.7; }
      tr:hover .url-copy-icon { opacity: 0.7; }
      [data-services-table] table { table-layout: fixed !important; }
      [data-services-table] table td, [data-services-table] table th { white-space: normal !important; min-width: 0 !important; overflow: hidden; text-overflow: ellipsis; }
      .svc-name-row { display: flex; flex-direction: column; gap: 0; }
      .svc-badge-inline { display: block; line-height: 1; margin-top: -0.1rem; }
      .svc-badge-bordered { display: none; }
      .svc-badge-borderless { display: inline; }
      .svc-name-text { margin-right: 0.35rem; }
      .info-card-link:hover { background: light-dark(rgba(0,0,0,0.05), rgba(255,255,255,0.06)) !important; border-color: light-dark(rgba(0,0,0,0.15), rgba(255,255,255,0.15)) !important; }
      .chevron-cell a { aspect-ratio: 1; box-sizing: border-box; }
      .expanded-detail { }

      /* Dim non-expanded rows when one is expanded */
      [data-services-table] tbody tr { transition: opacity 0.2s; }
      [data-has-expanded] tbody tr:not([data-expanded]) { opacity: 0.35; }
      [data-has-expanded] tbody tr:not([data-expanded]):hover { opacity: 0.7; }

      .method-badge {
        font-size: 11px;
        font-weight: 600;
        font-family: var(--font-mono);
        padding: 2px 6px;
        border-radius: 3px;
        text-align: center;
        display: inline-block;
      }
      .method-get { color: light-dark(#15803d, #4ade80); background: light-dark(rgba(21,128,61,0.1), rgba(74,222,128,0.1)); }
      .method-post { color: light-dark(#7c3aed, #c084fc); background: light-dark(rgba(124,58,237,0.1), rgba(192,132,252,0.1)); }
      .method-put { color: light-dark(#b45309, #fbbf24); background: light-dark(rgba(180,83,9,0.1), rgba(251,191,36,0.1)); }
      .method-delete { color: light-dark(#dc2626, #f87171); background: light-dark(rgba(220,38,38,0.1), rgba(248,113,113,0.1)); }
      .method-patch { color: light-dark(#0369a1, #38bdf8); background: light-dark(rgba(3,105,161,0.1), rgba(56,189,248,0.1)); }

      .search-dropdown { scrollbar-width: thin; }
      .search-dropdown-item:hover { background: light-dark(rgba(0,0,0,0.05), rgba(255,255,255,0.07)); }
      .intent-badge { position: relative; cursor: help; }
      .intent-badge::after { content: attr(data-tip); position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%); background: var(--vocs-background-color-primary); color: var(--vocs-text-color-secondary); padding: 5px 10px; border-radius: 6px; font-size: 11px; white-space: nowrap; z-index: 20; pointer-events: none; opacity: 0; transition: opacity 0.15s; box-shadow: 0 2px 12px rgba(0,0,0,0.12); border: 1px solid var(--vocs-border-color-primary); }
      .intent-badge:hover::after { opacity: 1; }
      .intent-badge-mobile { display: none; }
      .intent-badge-price { display: none; }
      .ep-copy-mobile { display: none !important; }
      .mobile-row-copy { display: none !important; }

      /* ---- Wide desktop: filters stay as horizontal row inline with search ---- */
      @media (min-width: 1401px) {
        .services-content-row {
          display: block;
        }
      }



      /* ---- Sidebar hidden, header cards as 4-col strip ---- */
      @media (max-width: 1200px) {
        .services-sidebar { display: none !important; }
        .services-layout { gap: 0 !important; }
        .page-header { margin-left: 0 !important; }
        .header-cards { display: block !important; margin-left: 0 !important; margin-right: 0 !important; margin-bottom: 0.75rem !important; }
        .page-header-ctas { display: none !important; }
        
        .search-bar {
          margin-left: 0 !important;
          margin-top: 0 !important;
          padding-top: 20px !important;
          margin-right: 0 !important;
          top: calc(var(--vocs-spacing-topNav, 56px) - 4px) !important;
          padding-bottom: 0.75rem !important;
          background: linear-gradient(to bottom, var(--vocs-background-color-primary) 80%, transparent) !important;
        }
      }

      /* ---- Table columns stack ---- */
      @media (max-width: 1400px) {
        .services-content-row { display: block !important; }
        .services-table-col { min-width: 0 !important; }
        [data-services-table] thead { display: none !important; }
        .show-tablet { display: block !important; }
        [data-services-table] table { table-layout: fixed !important; overflow: visible !important; width: 100% !important; }
        /* 3-col: name+desc | URL | chevron+actions */
        [data-services-table] table col:nth-child(1) { width: 48% !important; }
        [data-services-table] table col:nth-child(2) { width: 44% !important; }
        [data-services-table] table col:nth-child(3) { width: 14% !important; }
        [data-services-table] table col:nth-child(4) { width: 0% !important; }
        /* Hide description column (col 2) — desc moves into cell 1 via .show-tablet */
        td.hide-mobile:nth-child(2) { display: none !important; }
        /* Keep URL column (col 3) visible */
        td.hide-mobile:nth-child(3) { display: table-cell !important; white-space: nowrap !important; }
        td.hide-mobile:nth-child(3) span { white-space: nowrap !important; word-break: normal !important; }
        [data-services-table] table td:first-child { padding: 0.75rem 0.5rem 0.75rem 1rem !important; vertical-align: top !important; }
        [data-services-table] table td:last-child { padding: 0 !important; vertical-align: middle !important; text-align: right !important; overflow: visible !important; }
        .svc-icon { align-self: flex-start !important; margin-top: 0 !important; }
      .svc-icon-img {
        width: 28px; height: 28px; border-radius: 6px;
        display: block; object-fit: contain;
      }
        .svc-name-row { flex-direction: row !important; align-items: center !important; gap: 0.35rem !important; flex-wrap: nowrap !important; }
        .svc-name-text { white-space: nowrap !important; }
        .svc-badge-inline { display: inline !important; flex-shrink: 0 !important; }
        .svc-badge-bordered { display: inline !important; }
        .svc-badge-borderless { display: none !important; }
        .svc-name-row > span:first-child { font-size: 16px !important; }
        .svc-desc-mobile { font-size: 14.5px !important; word-wrap: break-word !important; overflow-wrap: break-word !important; }
        .url-mobile { display: none !important; }
        .expanded-detail { padding-top: 0 !important; padding-bottom: 0.5rem !important; }
        .expanded-url-bar { display: none !important; }
        tr:has(+ tr .expanded-detail) { border-bottom: none !important; }
        .sub-header { display: grid !important; grid-template-columns: 1fr auto !important; padding-left: 1rem !important; padding-right: 0.75rem !important; }
        .sub-header > *:nth-child(1) { text-align: left !important; padding-left: 0 !important; }
        .sub-header > *:nth-child(2) { display: none !important; }
        .sub-row:first-child { border-top: none !important; }
        .sub-row {
          display: grid !important;
          grid-template-columns: 1fr auto !important;
          grid-template-rows: auto auto !important;
          padding: 0.8rem 0.75rem 0.8rem 1rem !important;
          gap: 0 0.5rem !important;
          align-items: start !important;

        }
        .sub-row > * { padding: 0 !important; }
        .sub-row > *:nth-child(1) { grid-row: 1; grid-column: 1; font-size: 13px !important; overflow: hidden; min-width: 0; }
        .sub-row > *:nth-child(3) { grid-row: 1; grid-column: 2; display: flex !important; align-items: center !important; gap: 0.35rem !important; font-family: var(--font-mono); font-size: 13.5px !important; color: var(--vocs-text-color-secondary) !important; text-align: right !important; justify-self: end !important; align-self: center !important; white-space: nowrap; }
        .sub-row > *:nth-child(2) { grid-row: 2; grid-column: 1 / -1; font-size: 14.5px !important; color: var(--vocs-text-color-secondary) !important; text-align: left !important; margin-top: 0.2rem !important; display: block !important; -webkit-line-clamp: unset !important; -webkit-box-orient: unset !important; overflow: visible !important; }
        .intent-badge-desktop { display: none !important; }
        .intent-badge-mobile { display: inline !important; margin-right: 0.35rem; }
        .ep-copy-inline { display: none !important; }
        .ep-copy-mobile { display: inline-flex !important; }
        .ep-path-clickable { cursor: default !important; pointer-events: none; }
        .mobile-row-copy { display: none !important; }
        .url-copy-icon { opacity: 0.8 !important; }
      }

      /* ---- Header cards 2x2, search moves, tags center ---- */
      @media (max-width: 900px) {
        .services-container { padding-left: 0 !important; padding-right: 0 !important; }
        [data-services-table] table { width: 100% !important; table-layout: auto !important; }
        [data-services-table] thead { display: none !important; }
        [data-services-table] colgroup { display: none !important; }
        td.hide-mobile:nth-child(2) { display: none !important; }
        td.hide-mobile:nth-child(3) { display: none !important; }
        [data-services-table] table { table-layout: auto !important; }
        [data-services-table] table td:first-child:not(.expanded-detail) { padding: 1.15rem 0.35rem 1.15rem 1.25rem !important; vertical-align: top !important; overflow: hidden !important; max-width: 0 !important; width: 100% !important; }
        [data-services-table] table td:last-of-type:not(.expanded-detail) { padding: 0 !important; vertical-align: middle !important; text-align: right !important; white-space: nowrap !important; overflow: visible !important; width: 120px !important; min-width: 140px !important; max-width: 140px !important; box-sizing: border-box !important; }
        .expanded-detail { padding: 0 !important; }
        .chevron-cell { padding-right: 24px !important; gap: 0.25rem !important; }
        .chevron-cell a { width: 32px !important; height: 32px !important; border: 1px solid var(--vocs-border-color-primary) !important; border-radius: 7px !important; display: flex !important; align-items: center !important; justify-content: center !important; margin-right: 4px; }
        .svc-name-row { flex-direction: row !important; align-items: center !important; gap: 0.35rem !important; }
        .svc-badge-inline { display: inline !important; margin-left: 0.25rem !important; }
        .svc-badge-bordered { display: inline !important; }
        .svc-badge-borderless { display: none !important; }
        .show-tablet { display: block !important; }
        
        .svc-desc-container { display: block !important; }
        .sub-row {
          display: grid !important;
          grid-template-columns: 1fr auto !important;
          grid-template-rows: auto auto !important;
          padding: 0.8rem 1.25rem 0.8rem 1.25rem !important;
          gap: 0 0.75rem !important;
          align-items: start !important;
          text-align: left;
          margin-top: 4px;
          padding-bottom: 0rem !important;
          
        }
        .sub-row > * { padding: 0 !important; }
        .sub-row > *:nth-child(1) { grid-row: 1 !important; grid-column: 1 !important; }
        .sub-row > *:nth-child(3) { grid-row: 1 !important; grid-column: 2 !important; display: flex !important; align-items: center !important; gap: 0.35rem !important; justify-self: end !important; align-self: center !important; white-space: nowrap !important; }
        .sub-row > *:nth-child(2) { grid-row: 2 !important; grid-column: 1 / -1 !important; margin-top: 0.2rem !important; display: block !important; -webkit-line-clamp: unset !important; -webkit-box-orient: unset !important; overflow: visible !important; }
        .ep-desc-cell { display: block !important; -webkit-line-clamp: unset !important; -webkit-box-orient: unset !important; overflow: visible !important; padding: 0 !important; padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
        .intent-badge-mobile { display: none !important; }
        .intent-badge-price { display: inline !important; }
        .ep-copy-inline { display: none !important; }
        .ep-copy-outside { display: inline-flex !important; }
        .ep-copy-mobile { display: none !important; }
        .ep-path-clickable { pointer-events: none !important; cursor: default !important; }
        .sub-header { padding-left: 1.25rem !important; padding-right: 1.25rem !important; grid-template-columns: 1fr auto !important; }
        .sub-header > *:nth-child(1) { text-align: left !important; padding-left: 0 !important; }
        .sub-header > *:nth-child(2) { display: none !important; }
        .sub-header > *:nth-child(3) { text-align: right !important; padding-right: 0 !important; }
        .expanded-detail { overflow: hidden !important; padding-left: 0 !important; padding-right: 0 !important; }
        .svc-desc-mobile { font-size: 14.5px !important; -webkit-line-clamp: 3 !important; max-width: none !important; }
        .url-mobile { display: block !important; }
        .expanded-url-bar { display: none !important; }
        .header-cards { padding: 0 1.25rem !important; margin-left: 0 !important; margin-right: 0 !important; }
        .header-cards-grid { grid-template-columns: repeat(2, 1fr) !important; }
        .header-cards-grid > * > div > div:first-child { font-size: 14.5px !important; }
        .header-cards-grid > * > div > div:last-child { font-size: 13.5px !important; line-height: 1.4 !important; }
        .search-bar { display: none !important; }
        .search-mobile {
          display: block !important;
          padding: 0.75rem 1.25rem !important;
          margin: 0 !important;
          position: relative !important;
          margin-top: -56px !important;
        }
        .search-mobile-spacer { display: block !important; height: 56px; }
        [data-mobile-search-stuck] .search-mobile {
          position: fixed !important;
          top: var(--mobile-search-top, 56px) !important;
          left: 0 !important;
          right: 0 !important;
          z-index: 40 !important;
          margin-top: 0 !important;
          background: var(--vocs-background-color-primary) !important;
          transition: top 0.2s ease !important;
        }
        .search-mobile input { padding-top: 0.6rem !important; padding-bottom: 0.6rem !important; font-size: 16px !important; }
        .search-mobile-active,
        [data-mobile-search-stuck] .search-mobile-active {
          z-index: 101 !important;
          background: var(--vocs-background-color-primary) !important;
        }
        .search-kbd-hint { display: none !important; }
        .mobile-results-header { display: none !important; }
        .search-mobile .search-dropdown { max-height: 50vh; overflow-y: auto; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.18); }
        .search-mobile-active .search-dropdown { position: fixed !important; top: calc(var(--mobile-search-top, 56px) + 52px) !important; left: 0 !important; right: 0 !important; width: 100vw !important; max-width: 100vw !important; border-radius: 0 0 12px 12px !important; border-left: none !important; border-right: none !important; max-height: 60vh !important; z-index: 102 !important; }
        .search-mobile .search-dropdown > div:first-child { padding: 0.75rem 1.25rem !important; gap: 6px !important; }
        .search-mobile .search-dropdown > div:first-child button { font-size: 13px !important; padding: 8px 16px !important; border-radius: 6px !important; }
        .search-mobile .search-dropdown-item { padding: 0.85rem 1.25rem !important; font-size: 15px !important; }
        .search-mobile .search-dropdown-item span:first-child { font-size: 11px !important; width: 70px !important; min-width: 70px !important; }
        .search-mobile-hidden { display: none !important; }
        .filter-tags { justify-content: flex-start !important; gap: 0.5rem !important; width: 100% !important; padding: 0.75rem 1.25rem !important; }
        .filter-tags button { font-size: 14.5px !important; padding: 0.5rem 1rem !important; flex: unset !important; max-width: unset !important; }
        .page-header { text-align: center !important; margin-bottom: 1.25rem !important; padding: 0 1.25rem !important; flex-direction: column !important; align-items: center !important; margin-left: 0 !important; }
        .page-header p { max-width: 100% !important; margin-left: auto !important; margin-right: auto !important; font-size: 16.5px !important; padding-left: 4rem; padding-right: 4rem;}
        .page-header-ctas { display: none !important; }
        .pagination { padding: 0 1.25rem !important; }
        .ep-desc-cell {
          margin-top: 6px !important;
          margin-bottom: 2px !important;
          font-size: 14.5px !important;
        }
      }

      /* ---- Mobile: one-column primary rows ---- */
      @media (max-width: 700px) {
        [data-services-table] table,
        [data-services-table] table tbody {
          display: block !important;
          width: 100% !important;
        }
        [data-services-table] table tr {
          display: block !important;
          width: 100% !important;
        }
        [data-services-table] table tr > td.expanded-detail {
          display: block !important;
          width: 100% !important;
          max-width: none !important;
        }
        [data-services-table] table tr[id^="service-"] {
          display: flex !important;
          flex-wrap: wrap !important;
          position: relative !important;
        }
        [data-services-table] table tr[id^="service-"] > td:first-child {
          display: block !important;
          max-width: none !important;
          width: 100% !important;
        }
        [data-services-table] table tr[id^="service-"] > td:last-of-type {
          position: absolute !important;
          right: 0 !important;
          top: 0 !important;
          width: auto !important;
          min-width: auto !important;
          max-width: none !important;
          height: auto !important;
          padding-top: 0.75rem !important;
        }
        .svc-badge-inline { position: relative !important; top: -4px !important; }
        .svc-name-row { margin-bottom: 3px !important; }
        .ep-desc-cell {
          white-space: normal !important;
          word-break: break-word !important;
        }
      }

      /* ---- Mobile: full-width, bigger icons ---- */
      @media (max-width: 640px) {
        .expanded-detail { padding-left: 0 !important; padding-right: 0 !important;  }
        .svc-icon { width: 38px !important; height: 38px !important; margin-right: 10px !important; }
        .svc-icon img { width: 38px !important; height: 38px !important; }
        .sub-row { padding-left: 1.25rem !important; }
        .header-cards-grid > * > div > div:first-child { font-size: 14.5px !important; }
        .header-cards-grid > * > div > div:last-child { font-size: 13.5px !important; }
        .filter-tags button { min-width: auto !important; }
        [data-services-table] table td:last-child  {
          padding-right: 0px !important;
        }
      }
    `}</style>
  );
}
