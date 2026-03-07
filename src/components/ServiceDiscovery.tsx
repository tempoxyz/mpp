"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Category, Endpoint, Service } from "../data/registry";
import { fetchServices } from "../data/registry";

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

// Flip to true when `tempo wallet q` convention goes live
const WALLET_Q_PREFIX = false;

function formatPathForCli(path: string): string {
  return path.replace(/:(\w+)/g, "{$1}");
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getExamplePayload(ep: Endpoint): string {
  if (ep.path.includes("/chat/completions") || ep.path.includes("/messages")) {
    return '\'{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Hello!"}]}\'';
  }
  if (ep.path.includes("/embeddings")) {
    return '\'{"input":"Hello world","model":"text-embedding-3-small"}\'';
  }
  if (
    ep.path.includes("/images") ||
    ep.description?.toLowerCase().includes("image")
  ) {
    return '\'{"prompt":"A sunset over the ocean"}\'';
  }
  if (ep.path.includes("/search") || ep.path.includes("/crawl")) {
    return '\'{"query":"example search"}\'';
  }
  if (ep.path.includes("/send")) {
    return '\'{"to":"user@example.com","subject":"Hello","body":"Hi there"}\'';
  }
  if (
    ep.path.includes("/audio") ||
    ep.description?.toLowerCase().includes("speech")
  ) {
    return '\'{"input":"Hello world","voice":"alloy"}\'';
  }
  return "'{}'";
}

function getIconUrl(service: Service): string {
  if (service.icon) return service.icon;
  return `/api/icon?id=${encodeURIComponent(service.id)}`;
}

// ---------------------------------------------------------------------------
// Filter engine — scores services against a query
// ---------------------------------------------------------------------------

function scoreService(service: Service, query: string): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const words = q.split(/\s+/).filter(Boolean);
  let score = 0;

  const name = service.name.toLowerCase();
  const desc = (service.description ?? "").toLowerCase();
  const cats = (service.categories ?? []).join(" ").toLowerCase();
  const tags = (service.tags ?? []).join(" ").toLowerCase();
  const endpoints = service.endpoints
    .map((e) => `${e.method} ${e.path} ${e.description ?? ""}`)
    .join(" ")
    .toLowerCase();

  const all = `${name} ${desc} ${cats} ${tags} ${endpoints}`;

  for (const word of words) {
    if (name.includes(word)) score += 10;
    if (cats.includes(word)) score += 5;
    if (tags.includes(word)) score += 4;
    if (desc.includes(word)) score += 3;
    if (endpoints.includes(word)) score += 1;
  }

  if (all.includes(q)) score += 8;

  return score;
}

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

  for (const cat of Object.keys(CATEGORY_LABELS) as Category[]) {
    if (cat.includes(q) || CATEGORY_LABELS[cat].toLowerCase().includes(q)) {
      results.push({
        type: "category",
        category: cat,
        label: CATEGORY_LABELS[cat],
      });
    }
  }

  for (const s of services) {
    if (
      s.name.toLowerCase().includes(q) ||
      (s.description ?? "").toLowerCase().includes(q)
    ) {
      results.push({ type: "service", service: s });
    }
  }

  for (const s of services) {
    for (const ep of s.endpoints.slice(0, 5)) {
      if (
        ep.path.toLowerCase().includes(q) ||
        (ep.description ?? "").toLowerCase().includes(q)
      ) {
        results.push({ type: "endpoint", service: s, endpoint: ep });
        break;
      }
    }
  }

  return results.slice(0, 12);
}

// ---------------------------------------------------------------------------
// Exported component
// ---------------------------------------------------------------------------

export function ServiceDiscovery() {
  const [services, setServices] = useState<Service[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [visible, setVisible] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [transforms, setTransforms] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const sectionRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const brokenIcons = useRef(new Set<string>());
  const [, forceIconUpdate] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    fetchServices()
      .then((s) => setServices(shuffle(s)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setActiveIndex(-1);
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          setTimeout(() => setRevealed(true), 800);
          const isMobile = window.matchMedia("(max-width: 768px)").matches;
          if (!isMobile) {
            setTimeout(() => inputRef.current?.focus(), 400);
          }
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        sectionRef.current?.scrollIntoView({ behavior: "smooth" });
        setTimeout(() => inputRef.current?.focus(), 300);
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  const stableScored = useMemo(() => {
    return services.map((s) => ({
      service: s,
      score: scoreService(s, debouncedQuery),
    }));
  }, [services, debouncedQuery]);

  const targetGridIndex = useMemo(() => {
    const map = new Map<string, number>();
    if (!debouncedQuery) return map;
    const matches = [...stableScored]
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);
    for (let i = 0; i < matches.length; i++) {
      map.set(matches[i].service.id, i);
    }
    return map;
  }, [stableScored, debouncedQuery]);

  const dropdownResults = useMemo(
    () => getDropdownResults(services, query),
    [services, query],
  );

  const handleDropdownSelect = useCallback((result: DropdownResult) => {
    setShowDropdown(false);
    if (result.type === "service") {
      setSelectedService(result.service);
      setQuery("");
    } else if (result.type === "category") {
      setQuery(result.label);
    } else if (result.type === "endpoint") {
      setSelectedService(result.service);
      setQuery("");
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowDropdown(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
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
        handleDropdownSelect(dropdownResults[activeIndex]);
        setActiveIndex(-1);
      }
    },
    [showDropdown, dropdownResults, activeIndex, handleDropdownSelect],
  );

  useEffect(() => {
    if (!debouncedQuery) {
      setTransforms({});
      return;
    }
    const grid = gridRef.current;
    if (!grid) return;

    const gridStyle = getComputedStyle(grid);
    const numCols = gridStyle.gridTemplateColumns.split(" ").length;
    const gap = Number.parseFloat(gridStyle.gap) || 10;

    const firstCard = grid.children[0] as HTMLElement | undefined;
    if (!firstCard) return;
    const cellW = firstCard.offsetWidth + gap;
    const cellH = firstCard.offsetHeight + gap;

    const next: Record<string, { x: number; y: number }> = {};
    stableScored.forEach((m, stableIdx) => {
      const targetIdx = targetGridIndex.get(m.service.id);
      if (targetIdx === undefined) return;

      const curCol = stableIdx % numCols;
      const curRow = Math.floor(stableIdx / numCols);
      const tgtCol = targetIdx % numCols;
      const tgtRow = Math.floor(targetIdx / numCols);

      next[m.service.id] = {
        x: (tgtCol - curCol) * cellW,
        y: (tgtRow - curRow) * cellH,
      };
    });

    setTransforms(next);
  }, [debouncedQuery, stableScored, targetGridIndex]);

  const hasQuery = debouncedQuery.length > 0;

  return (
    <>
      <div
        ref={sectionRef}
        className={`discovery-section${hasQuery ? " has-query" : ""}`}
        style={{
          height: "100%",
          width: "100%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <DiscoveryStyles />

        {/* Search overlay — absolutely centered */}
        <div className="discovery-overlay" ref={overlayRef}>
          <h2 className="discovery-overlay-title">Start using MPP</h2>
          <p className="discovery-overlay-desc">
            Level up your agent or app with powerful abilities
          </p>
          <div className="discovery-search-wrapper">
            <div className="discovery-search">
              <SearchIcon />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowDropdown(e.target.value.length > 0);
                }}
                onFocus={() => {
                  setIsFocused(true);
                  if (query.length > 0) setShowDropdown(true);
                }}
                onBlur={() => {
                  setIsFocused(false);
                  setTimeout(() => setShowDropdown(false), 200);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search services, endpoints, categories..."
                className="discovery-search-input"
              />
              {!isFocused && query.length === 0 && (
                <kbd className="discovery-kbd">
                  <span className="discovery-kbd-symbol">⌘</span>K
                </kbd>
              )}
              {query.length > 0 && (
                <button
                  type="button"
                  className="discovery-search-clear"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setQuery("");
                    setShowDropdown(false);
                    inputRef.current?.blur();
                  }}
                  aria-label="Clear search"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-label="Clear"
                  >
                    <title>Clear</title>
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              )}
            </div>
            {showDropdown && dropdownResults.length > 0 && (
              <div className="discovery-dropdown">
                {dropdownResults.map((r, i) => (
                  <button
                    key={`${r.type}-${i}`}
                    type="button"
                    className={`discovery-dropdown-item${i === activeIndex ? " discovery-dropdown-active" : ""}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleDropdownSelect(r);
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                  >
                    {r.type === "category" && (
                      <>
                        <span className="dropdown-tag">Category</span>
                        <span>{r.label}</span>
                      </>
                    )}
                    {r.type === "service" && (
                      <>
                        <span className="dropdown-tag">Service</span>
                        <span>{r.service.name}</span>
                        <span className="dropdown-desc">
                          {r.service.description?.slice(0, 60)}
                        </span>
                      </>
                    )}
                    {r.type === "endpoint" && (
                      <>
                        <span className="dropdown-tag">Endpoint</span>
                        <span>{r.service.name}</span>
                        <span className="dropdown-right">
                          <span className="dropdown-route">
                            {r.endpoint.path}
                          </span>
                          <span
                            className={`method-badge method-${r.endpoint.method.toLowerCase()}`}
                          >
                            {r.endpoint.method}
                          </span>
                        </span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          {query.trim().length > 0 &&
            dropdownResults.length === 0 &&
            !showDropdown && (
              <p className="discovery-no-results">
                No services match your search
              </p>
            )}
        </div>

        {/* Card grid */}
        <div className="discovery-grid" ref={gridRef}>
          {stableScored.map(({ service, score }, idx) => {
            const isMatch = !debouncedQuery || score > 0;
            const iconUrl = getIconUrl(service);
            const t = transforms[service.id];
            const isAnimating = hasQuery && isMatch && t;

            let cardTransform: string;
            if (isAnimating) {
              cardTransform = `translate(${t.x}px, ${t.y}px) scale(1)`;
            } else if (!isMatch) {
              cardTransform = "translateY(4px) scale(0.96)";
            } else {
              cardTransform = "translateY(0) scale(1)";
            }

            return (
              <button
                key={service.id}
                type="button"
                className={`discovery-card ${visible ? "discovery-card-visible" : ""}`}
                style={{
                  transitionDelay:
                    visible && !revealed && !hasQuery
                      ? `${Math.min(idx * 40, 600)}ms`
                      : "0ms",
                  opacity: hasQuery ? (isMatch ? 1 : 0.08) : undefined,
                  filter: hasQuery && !isMatch ? "blur(3px)" : undefined,
                  pointerEvents: hasQuery && !isMatch ? "none" : undefined,
                  transform: cardTransform,
                  zIndex: isAnimating ? 6 : undefined,
                  position: isAnimating ? ("relative" as const) : undefined,
                }}
                onClick={() => setSelectedService(service)}
              >
                <div className="discovery-card-icon">
                  {iconUrl && !brokenIcons.current.has(service.id) ? (
                    <img
                      src={iconUrl}
                      alt=""
                      className="discovery-card-icon-img"
                      onError={() => {
                        brokenIcons.current.add(service.id);
                        forceIconUpdate((n) => n + 1);
                      }}
                    />
                  ) : (
                    <div className="discovery-card-icon-fallback">
                      {service.name[0]}
                    </div>
                  )}
                </div>
                <div className="discovery-card-name">{service.name}</div>
                <div className="discovery-card-desc">{service.description}</div>
              </button>
            );
          })}
          {(() => {
            const count = stableScored.length;
            const skeletons: React.ReactNode[] = [];
            const maxCols = 6;
            const remainder = count % maxCols;
            if (remainder > 0) {
              for (let i = 0; i < maxCols - remainder; i++) {
                skeletons.push(
                  <div
                    key={`skel-${i}`}
                    className={`discovery-card discovery-card-skeleton ${visible ? "discovery-card-visible" : ""}`}
                    style={{
                      transitionDelay: visible
                        ? `${Math.min((count + i) * 40, 600)}ms`
                        : "0ms",
                    }}
                  />,
                );
              }
            }
            return skeletons;
          })()}
        </div>
      </div>

      {/* Detail modal — portaled to body to escape stacking context */}
      {selectedService &&
        createPortal(
          <ServiceDetailModal
            service={selectedService}
            onClose={() => setSelectedService(null)}
          />,
          document.body,
        )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Service Detail Modal
// ---------------------------------------------------------------------------

function ServiceDetailModal({
  service,
  onClose,
}: {
  service: Service;
  onClose: () => void;
}) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(
    service.endpoints[0] ?? null,
  );
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  }, [onClose]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleClose]);

  const iconUrl = getIconUrl(service);

  function formatPrice(ep: Endpoint): string {
    const p = ep.payment;
    if (!p?.amount) return "—";
    const v = Number(p.amount) / 10 ** (p.decimals ?? 0);
    if (Number.isNaN(v)) return "—";
    if (v >= 0.01) return `$${v.toFixed(2)}`;
    let s = v.toFixed(4);
    s = s.replace(/0+$/, "").replace(/\.$/, "");
    return `$${s}`;
  }

  const baseUrl = service.serviceUrl ?? service.url;
  const epPath = selectedEndpoint?.path ?? "";
  const cliPath = formatPathForCli(epPath);
  const isNonGet = selectedEndpoint && selectedEndpoint.method !== "GET";
  const exampleJson = selectedEndpoint
    ? getExamplePayload(selectedEndpoint)
    : "'{}'";
  const walletPrefix = WALLET_Q_PREFIX ? "q " : "";

  const copyCommand = selectedEndpoint
    ? [
        "curl -L https://tempo.xyz/install | bash",
        "tempo add wallet",
        "tempo wallet login",
        `tempo wallet ${walletPrefix}--dry-run ${baseUrl}${cliPath}${isNonGet ? ` -X ${selectedEndpoint.method} --json ${exampleJson}` : ""}`,
      ].join(" && ")
    : null;

  const handleCopySnippet = () => {
    if (copyCommand) {
      navigator.clipboard.writeText(copyCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const green = "light-dark(#15803d, #4ade80)";
  const purple = "light-dark(#7c3aed, #c084fc)";
  const yellow = "light-dark(#b45309, #fbbf24)";
  const muted = "var(--vocs-text-color-muted)";

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: backdrop dismiss
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss
    <div
      className={`modal-backdrop${isClosing ? " modal-closing" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <DiscoveryStyles />
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: stop propagation only */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: stop propagation only */}
      <div
        className={`modal-content${isClosing ? " modal-closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header row: icon + title + tags + action buttons + close */}
        <div className="modal-header">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {iconUrl && !imgError ? (
                <img
                  src={iconUrl}
                  alt=""
                  onError={() => setImgError(true)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    objectFit: "contain",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: "var(--vocs-border-color-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    fontWeight: 600,
                    color: "var(--vocs-text-color-secondary)",
                    flexShrink: 0,
                  }}
                >
                  {service.name[0]}
                </div>
              )}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <h3
                    style={{
                      fontSize: 20,
                      fontWeight: 600,
                      margin: 0,
                      color: "var(--vocs-text-color-heading)",
                    }}
                  >
                    {service.name}
                  </h3>
                  {(service.categories ?? []).map((cat) => (
                    <span key={cat} className="modal-tag">
                      {CATEGORY_LABELS[cat] ?? cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                flexShrink: 0,
                alignItems: "center",
              }}
            >
              {service.docs?.homepage && (
                <a
                  href={service.docs.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-link"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-label="Docs"
                  >
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                  </svg>
                  <span>Docs</span>
                </a>
              )}
              {service.provider?.url && (
                <a
                  href={service.provider.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-link"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-label="Website"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  <span>Website</span>
                </a>
              )}
              {service.serviceUrl && (
                <a
                  href={service.serviceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-link"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-label="API"
                  >
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                  <span>API</span>
                </a>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="modal-close"
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
                  aria-label="Close"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          </div>
          {service.description && (
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: "var(--vocs-text-color-secondary)",
                margin: "0.75rem 0 0",
              }}
            >
              {service.description}
            </p>
          )}
        </div>

        {/* Endpoints table */}
        <div style={{ marginTop: "1rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              fontWeight: 500,
              color: "var(--vocs-text-color-heading)",
              marginBottom: 8,
            }}
          >
            <span>Endpoints</span>
            <span className="endpoint-count-pill">
              {service.endpoints.length}
            </span>
          </div>
          <div className="modal-endpoints-wrap">
            <div className="modal-endpoints">
              {service.endpoints.map((ep) => {
                const isSelected = ep === selectedEndpoint;
                return (
                  <button
                    key={`${ep.method}-${ep.path}`}
                    type="button"
                    className={`modal-endpoint-row ${isSelected ? "modal-endpoint-selected" : ""}`}
                    onClick={() => setSelectedEndpoint(ep)}
                  >
                    <span
                      className={`method-badge method-${ep.method.toLowerCase()}`}
                    >
                      {ep.method}
                    </span>
                    <span className="endpoint-path">{ep.path}</span>
                    <span className="endpoint-desc">{ep.description}</span>
                    <span className="endpoint-price">{formatPrice(ep)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* CLI snippet */}
        {selectedEndpoint && (
          <div style={{ marginTop: "1.25rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                fontWeight: 500,
                color: "var(--vocs-text-color-heading)",
                marginBottom: 4,
              }}
            >
              <span>Try it out</span>
            </div>
            <p
              style={{
                fontSize: 13,
                color: "var(--vocs-text-color-secondary)",
                margin: "0 0 0.75rem",
                lineHeight: 1.5,
              }}
            >
              {selectedEndpoint.description ??
                `Use this ${service.name} endpoint.`}
            </p>
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: copy on click */}
            {/* biome-ignore lint/a11y/noStaticElementInteractions: copy on click */}
            <div
              className={`modal-cli${copied ? " modal-cli-copied" : ""}`}
              style={{ cursor: "pointer" }}
              onClick={handleCopySnippet}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: 8,
                }}
              >
                <span
                  className={`modal-copy-btn${copied ? " modal-copy-btn-active" : ""}`}
                >
                  {copied ? "Copied!" : "Copy"}
                </span>
              </div>
              <div className="cli-lines">
                <div className="cli-line">
                  <span className="cli-line-cmd">
                    <span style={{ color: muted }}>$ </span>
                    <span style={{ color: green }}>curl</span> -L
                    https://tempo.xyz/install | bash
                  </span>
                  <span className="cli-line-comment"># Install Tempo CLI</span>
                </div>
                <div className="cli-line">
                  <span className="cli-line-cmd">
                    <span style={{ color: muted }}>$ </span>
                    <span style={{ color: green }}>tempo</span> add wallet
                  </span>
                  <span className="cli-line-comment"># Add wallet tools</span>
                </div>
                <div className="cli-line">
                  <span className="cli-line-cmd">
                    <span style={{ color: muted }}>$ </span>
                    <span style={{ color: green }}>tempo</span> wallet login
                  </span>
                  <span className="cli-line-comment">
                    # Sign in via browser
                  </span>
                </div>
                <div className="cli-line-empty" />
                <div className="cli-line">
                  <span className="cli-line-cmd">
                    <span style={{ color: muted }}>$ </span>
                    <span style={{ color: green }}>tempo</span> wallet{" "}
                    {walletPrefix}--dry-run {baseUrl}
                    {cliPath}
                    {isNonGet && (
                      <>
                        {" \\\n    "}
                        <span style={{ color: purple }}>
                          -X {selectedEndpoint.method}
                        </span>
                        {" --json "}
                        <span style={{ color: yellow }}>{exampleJson}</span>
                      </>
                    )}
                  </span>
                  <span className="cli-line-comment">
                    # Test without paying
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, opacity: 0.5 }}
      aria-label="Search"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function DiscoveryStyles() {
  return (
    <style>{`
      /* Search overlay — always centered */
      .discovery-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        pointer-events: none;
        width: min(90vw, 480px);
      }
      .discovery-overlay > * { pointer-events: auto; }
      .discovery-overlay-title {
        font-size: clamp(2rem, 2.5vw, 2.5rem);
        font-weight: 600;
        color: var(--vocs-text-color-heading);
        margin: 0;
        transition: opacity 0.3s;
      }
      .discovery-overlay-desc {
        color: var(--vocs-text-color-secondary);
        font-size: clamp(1.15rem, 1.3vw, 1rem);
        margin-top: 0.5rem;
        transition: opacity 0.3s;
      }
      @media (max-width: 768px) {
        .has-query .discovery-overlay-title,
        .has-query .discovery-overlay-desc {
          opacity: 0;
          max-height: 0;
          margin: 0;
          overflow: hidden;
        }
      }

      /* No results message */
      .discovery-no-results {
        margin-top: 0.75rem;
        font-size: 0.8125rem;
        color: var(--vocs-text-color-muted);
      }

      /* Cmd+K shortcut hint */
      .discovery-kbd {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        font-size: 12px;
        font-family: var(--font-sans);
        color: var(--vocs-text-color-muted);
        background: light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.08));
        border: 1px solid var(--vocs-border-color-primary);
        padding: 2px 6px;
        border-radius: 4px;
        flex-shrink: 0;
        line-height: 1;
        pointer-events: none;
      }
      .discovery-kbd-symbol {
        font-size: 14px;
        line-height: 1;
      }

      /* Radial fade so center area is readable */
      .discovery-grid { position: relative; }
      .discovery-grid::after {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(
          ellipse 55% 42% at center,
          var(--vocs-background-color-primary) 0%,
          oklch(from var(--vocs-background-color-primary) l c h / 0.97) 28%,
          oklch(from var(--vocs-background-color-primary) l c h / 0.8) 48%,
          oklch(from var(--vocs-background-color-primary) l c h / 0.4) 65%,
          transparent 80%
        );
        pointer-events: none;
        z-index: 5;
        transition: opacity 0.4s;
      }
      @media (max-width: 768px) {
        .discovery-grid::after {
          background: radial-gradient(
            ellipse 85% 38% at center,
            var(--vocs-background-color-primary) 0%,
            var(--vocs-background-color-primary) 15%,
            oklch(from var(--vocs-background-color-primary) l c h / 0.95) 30%,
            oklch(from var(--vocs-background-color-primary) l c h / 0.7) 50%,
            transparent 72%
          );
        }
        .discovery-overlay {
          top: 30% !important;
        }
        .discovery-dropdown {
          max-height: 40vh;
          overflow-y: auto;
        }
      }
      .has-query .discovery-grid::after { opacity: 0; }

      .discovery-search-wrapper {
        position: relative;
        width: 100%;
        max-width: 480px;
        margin-top: 1rem;
        z-index: 10;
      }
      .discovery-search {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0.75rem 1rem;
        border-radius: 12px;
        border: 1px solid var(--vocs-border-color-primary);
        background: var(--vocs-background-color-primary);
        transition: border-color 0.15s;
      }
      .discovery-search:has(.discovery-search-input:focus-visible) {
        border-color: light-dark(rgba(0,0,0,0.25), rgba(255,255,255,0.25));
      }
      .discovery-search-input {
        flex: 1;
        border: none;
        background: transparent;
        outline: none;
        font-size: 15px;
        color: var(--vocs-text-color-heading);
        font-family: var(--font-sans);
      }
      .discovery-search-input::placeholder {
        color: var(--vocs-text-color-muted);
      }
      .discovery-search-clear {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        border: none;
        background: transparent;
        cursor: pointer;
        color: var(--vocs-text-color-muted);
        padding: 2px;
        border-radius: 4px;
        transition: color 0.15s;
      }
      .discovery-search-clear:hover {
        color: var(--vocs-text-color-heading);
      }

      /* Dropdown */
      .discovery-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: 6px;
        border-radius: 12px;
        border: 1px solid var(--vocs-border-color-primary);
        background: var(--vocs-background-color-primary);
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        overflow: hidden;
        z-index: 20;
      }
      .discovery-dropdown-item {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 0.6rem 1rem;
        border: none;
        background: transparent;
        cursor: pointer;
        font-size: 13px;
        color: var(--vocs-text-color-heading);
        text-align: left;
        font-family: var(--font-sans);
        transition: background 0.1s;
        white-space: nowrap;
        overflow: hidden;
      }
      .discovery-dropdown-item:hover,
      .discovery-dropdown-active {
        background: light-dark(rgba(0,0,0,0.04), rgba(255,255,255,0.06));
      }
      .dropdown-tag {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--vocs-text-color-muted);
        background: light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.08));
        padding: 2px 6px;
        border-radius: 4px;
        flex-shrink: 0;
        width: 62px;
        text-align: center;
        box-sizing: border-box;
      }
      .dropdown-right {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
      }
      .dropdown-desc {
        color: var(--vocs-text-color-muted);
        font-size: 12px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .dropdown-route {
        margin-left: auto;
        font-family: var(--font-mono);
        font-size: 12px;
        color: var(--vocs-text-color-muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* Card grid — fits within viewport, no scroll */
      .discovery-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        grid-auto-rows: minmax(0, 1fr);
        gap: 10px;
        padding: clamp(0.75rem, 1.5vw, 1.5rem);
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      @media (max-width: 1100px) {
        .discovery-grid {
          grid-template-columns: repeat(4, 1fr);
          grid-auto-rows: minmax(160px, 1fr);
        }
      }
      @media (max-width: 768px) {
        .discovery-grid {
          grid-template-columns: repeat(2, 1fr);
          grid-auto-rows: 110px;
          gap: 10px;
          padding: 1rem;
        }
      }

      .discovery-card {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 4px;
        padding: 12px;
        border-radius: 14px;
        border: 1px solid var(--vocs-border-color-primary);
        background: var(--vocs-background-color-primary);
        cursor: pointer;
        text-align: left;
        font-family: var(--font-sans);
        overflow: hidden;
        min-height: 0;
        transition: opacity 0.4s ease, filter 0.4s ease, transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.15s, background 0.15s;
        opacity: 0.3;
        transform: translateY(6px);
      }
      .discovery-card-visible {
        opacity: 1;
        transform: translateY(0);
      }
      .discovery-card:hover {
        border-color: light-dark(rgba(0,0,0,0.12), rgba(255,255,255,0.12));
        background: light-dark(rgba(0,0,0,0.02), rgba(255,255,255,0.03));
      }
      .discovery-card-skeleton {
        pointer-events: none;
        border-style: dashed;
        border-color: light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.06));
        background: transparent;
      }
      .discovery-card-icon { flex-shrink: 0; }
      .discovery-card-icon-img {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        object-fit: contain;
      }
      .discovery-card-icon-fallback {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        background: var(--vocs-border-color-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 600;
        color: var(--vocs-text-color-secondary);
      }
      .discovery-card-name {
        font-weight: 600;
        font-size: 15px;
        color: var(--vocs-text-color-heading);
        margin-top: auto;
      }
      .discovery-card-desc {
        font-size: 13px;
        color: var(--vocs-text-color-secondary);
        line-height: 1.5;
        margin-top: 2px;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      @media (max-width: 768px) {
        .discovery-card {
          display: grid !important;
          grid-template-columns: auto 1fr;
          grid-template-rows: auto 1fr;
          gap: 2px 12px;
          padding: 10px;
          align-items: start;
        }
        .discovery-card-icon { grid-area: 1 / 1; align-self: center; }
        .discovery-card-icon-img { width: 20px !important; height: 20px !important; }
        .discovery-card-icon-fallback { width: 20px !important; height: 20px !important; font-size: 11px !important; }
        .discovery-card-name { grid-area: 1 / 2; align-self: center; margin-top: 0; font-size: 14px; }
        .discovery-card-desc { grid-area: 2 / 1 / 3 / -1; -webkit-line-clamp: 3; font-size: 12.5px; margin-top: 2px; }
        .discovery-grid::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 140px;
          background: linear-gradient(to top, var(--vocs-background-color-primary) 20%, transparent);
          pointer-events: none;
          z-index: 6;
        }
      }

      /* Modal */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 1rem;
        animation: modalFadeIn 0.2s ease forwards;
      }
      .modal-backdrop.modal-closing {
        animation: modalFadeOut 0.2s ease forwards;
      }
      @keyframes modalFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes modalFadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      .modal-content {
        position: relative;
        width: 100%;
        max-width: 720px;
        max-height: 85vh;
        overflow-y: auto;
        background: var(--vocs-background-color-primary);
        border-radius: 16px;
        border: 1px solid var(--vocs-border-color-primary);
        padding: 2rem;
        animation: modalSlideIn 0.25s ease forwards;
      }
      .modal-content.modal-closing {
        animation: modalSlideOut 0.2s ease forwards;
      }
      @keyframes modalSlideIn {
        from { opacity: 0; transform: translateY(16px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes modalSlideOut {
        from { opacity: 1; transform: translateY(0) scale(1); }
        to { opacity: 0; transform: translateY(16px) scale(0.98); }
      }
      .modal-close {
        border: none;
        background: transparent;
        cursor: pointer;
        color: var(--vocs-text-color-muted);
        padding: 4px;
        border-radius: 6px;
        transition: color 0.15s, background 0.15s;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .modal-close:hover {
        color: var(--vocs-text-color-heading);
        background: light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.08));
      }
      .modal-header { margin-bottom: 0.5rem; }
      .modal-tag {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 4px;
        border: 1px solid var(--vocs-border-color-primary);
        color: var(--vocs-text-color-muted);
        text-transform: capitalize;
      }
      .modal-link {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 13px;
        padding: 0.35rem 0.8rem;
        border-radius: 6px;
        border: 1px solid var(--vocs-border-color-primary);
        color: var(--vocs-text-color-heading);
        text-decoration: none;
        transition: background 0.15s;
      }
      .modal-link:hover {
        background: light-dark(rgba(0,0,0,0.04), rgba(255,255,255,0.06));
      }

      /* CLI example */
      .modal-cli {
        padding: 1rem;
        border-radius: 10px;
        background: light-dark(#f5f5f5, #1a1a1a);
        font-family: var(--font-mono);
        overflow-x: auto;
        transition: opacity 0.15s;
      }
      .modal-cli-copied {
        animation: copyPulse 0.4s ease;
      }
      @keyframes copyPulse {
        0% { opacity: 1; }
        30% { opacity: 0.5; }
        100% { opacity: 1; }
      }
      .modal-copy-btn {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 4px;
        border: 1px solid var(--vocs-border-color-primary);
        background: transparent;
        color: var(--vocs-text-color-muted);
        cursor: pointer;
        font-family: var(--font-sans);
        transition: color 0.15s, background 0.15s, border-color 0.15s;
      }
      .modal-copy-btn:hover {
        color: var(--vocs-text-color-heading);
        background: light-dark(rgba(0,0,0,0.04), rgba(255,255,255,0.06));
      }
      .modal-copy-btn-active {
        color: light-dark(#15803d, #4ade80) !important;
        border-color: light-dark(#15803d, #4ade80) !important;
        background: light-dark(rgba(21,128,61,0.08), rgba(74,222,128,0.1)) !important;
        font-weight: 600;
      }

      /* CLI line layout */
      .cli-lines {
        display: flex;
        flex-direction: column;
        font-size: 13px;
        line-height: 1.8;
        margin: 0;
      }
      .cli-line {
        display: flex;
        justify-content: space-between;
        gap: 2rem;
      }
      .cli-line-cmd {
        white-space: pre-wrap;
        word-break: break-all;
      }
      .cli-line-comment {
        white-space: nowrap;
        color: var(--vocs-text-color-muted);
        flex-shrink: 0;
        text-align: right;
      }
      .cli-line-empty {
        height: 0.4em;
      }

      /* Endpoint count pill */
      .endpoint-count-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 22px;
        height: 22px;
        padding: 0 6px;
        border-radius: 11px;
        font-size: 11px;
        font-weight: 600;
        font-family: var(--font-mono);
        background: light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.08));
        color: var(--vocs-text-color-muted);
      }

      /* Endpoints */
      .modal-endpoints-wrap {
        position: relative;
      }
      .modal-endpoints-wrap::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 48px;
        background: linear-gradient(to top, var(--vocs-background-color-primary) 0%, transparent 100%);
        pointer-events: none;
        border-radius: 0 0 10px 10px;
        z-index: 1;
      }
      .modal-endpoints {
        max-height: 320px;
        overflow-y: auto;
        border: 1px solid var(--vocs-border-color-primary);
        border-radius: 10px;
      }
      .modal-endpoint-row {
        display: grid;
        grid-template-columns: 60px minmax(80px, 1fr) minmax(120px, 1.5fr) minmax(60px, auto);
        gap: 8px;
        align-items: center;
        width: 100%;
        padding: 0.5rem 0.75rem;
        border: none;
        border-bottom: 1px solid var(--vocs-border-color-primary);
        background: transparent;
        cursor: pointer;
        font-size: 13px;
        text-align: left;
        font-family: var(--font-sans);
        color: var(--vocs-text-color-secondary);
        transition: background 0.1s;
      }
      .modal-endpoint-row:last-child { border-bottom: none; }
      .modal-endpoint-row:hover {
        background: light-dark(rgba(0,0,0,0.03), rgba(255,255,255,0.04));
      }
      .modal-endpoint-selected {
        background: light-dark(rgba(0,0,0,0.05), rgba(255,255,255,0.07)) !important;
      }
      .method-badge {
        font-size: 10px;
        font-weight: 600;
        font-family: var(--font-mono);
        padding: 2px 6px;
        border-radius: 3px;
        text-align: center;
      }
      .method-get { color: light-dark(#15803d, #4ade80); background: light-dark(rgba(21,128,61,0.1), rgba(74,222,128,0.1)); }
      .method-post { color: light-dark(#7c3aed, #c084fc); background: light-dark(rgba(124,58,237,0.1), rgba(192,132,252,0.1)); }
      .method-put { color: light-dark(#b45309, #fbbf24); background: light-dark(rgba(180,83,9,0.1), rgba(251,191,36,0.1)); }
      .method-delete { color: light-dark(#dc2626, #f87171); background: light-dark(rgba(220,38,38,0.1), rgba(248,113,113,0.1)); }
      .method-patch { color: light-dark(#0369a1, #38bdf8); background: light-dark(rgba(3,105,161,0.1), rgba(56,189,248,0.1)); }
      .endpoint-path {
        font-family: var(--font-mono);
        font-size: 12px;
        color: var(--vocs-text-color-heading);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .endpoint-desc {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-align: left;
        justify-self: start;
      }
      .endpoint-price {
        font-family: var(--font-mono);
        font-size: 12px;
        color: var(--vocs-text-color-muted);
        white-space: nowrap;
        text-align: right;
        justify-self: end;
      }

      @media (max-width: 640px) {
        .modal-content { padding: 1.25rem; }
        .modal-endpoint-row {
          grid-template-columns: 50px 1fr auto;
        }
        .endpoint-desc { display: none; }
        .cli-line-comment { display: none; }
      }
    `}</style>
  );
}
