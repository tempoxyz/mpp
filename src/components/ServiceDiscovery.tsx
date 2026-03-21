"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Category, Endpoint, Service } from "../data/registry";
import {
  fetchIconManifest,
  fetchServices,
  iconUrl as getIconUrlForService,
  type IconManifest,
  useIsDark,
} from "../data/registry";
import { PINNED_IDS } from "./ServicesPage";

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

// Flip to true when `tempo request q` convention goes live
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
  if (ep.path.includes("/apollo") || ep.path.includes("/people")) {
    return '\'{"name":"Jane Doe","company":"Acme Inc"}\'';
  }
  if (ep.path.includes("/enrich") || ep.path.includes("/lookup")) {
    return '\'{"email":"jane@example.com"}\'';
  }
  if (ep.path.includes("/captcha") || ep.path.includes("/solve")) {
    return '\'{"sitekey":"6Le-...","pageurl":"https://example.com"}\'';
  }
  if (ep.path.includes("/repos") || ep.path.includes("/git")) {
    return '\'{"name":"my-project","private":false}\'';
  }
  if (ep.description?.toLowerCase().includes("flight")) {
    return '\'{"origin":"SFO","destination":"JFK","date":"2026-04-01"}\'';
  }
  return "'{}'";
}

function getIconUrl(service: Service): string {
  return getIconUrlForService(service.id);
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

export function ServiceDiscovery({
  externalQuery,
  externalCategory,
  externalSelectedServiceId,
  onExternalServiceHandled,
}: {
  externalQuery?: string;
  externalCategory?: string | null;
  externalSelectedServiceId?: string;
  onExternalServiceHandled?: () => void;
} = {}) {
  const [services, setServices] = useState<Service[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const isDark = useIsDark();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [transforms, setTransforms] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const sectionRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const brokenIcons = useRef(new Set<string>());
  const [, forceIconUpdate] = useState(0);
  const [iconManifest, setIconManifest] = useState<IconManifest>({
    transparent: new Set(),
    lightBg: new Set(),
  });
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const [dropdownTab, setDropdownTab] = useState<
    "all" | "services" | "endpoints"
  >("all");
  const [mobileSearchActive, setMobileSearchActive] = useState(false);
  const [mobileResultsView, setMobileResultsView] = useState(false);

  useEffect(() => {
    fetchServices()
      .then((data) => {
        const pinnedSet = new Set(PINNED_IDS);
        const pinned = PINNED_IDS.flatMap((id) =>
          data.filter((s) => s.id === id),
        );
        const rest = shuffle(data.filter((s) => !pinnedSet.has(s.id)));
        setServices([...pinned, ...rest]);
      })
      .catch(() => {});
    fetchIconManifest()
      .then(setIconManifest)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setActiveIndex(-1);
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (!isMobile) {
      inputRef.current?.focus({ preventScroll: true });
    }
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

  useEffect(() => {
    const handleReset = () => {
      setQuery("");
      setDebouncedQuery("");
      setShowDropdown(false);
      setActiveIndex(-1);
      setIsFocused(false);
      setDropdownTab("all");
      setMobileSearchActive(false);
      setMobileResultsView(false);
      setSelectedService(null);
    };
    window.addEventListener("mpp:reset-discovery", handleReset);
    return () => window.removeEventListener("mpp:reset-discovery", handleReset);
  }, []);

  useEffect(() => {
    if (externalQuery !== undefined) {
      setDebouncedQuery(externalQuery);
    }
  }, [externalQuery]);

  const stableScored = useMemo(() => {
    let scored = services.map((s) => ({
      service: s,
      score: scoreService(s, debouncedQuery),
    }));
    if (externalCategory) {
      scored = scored.map((item) => {
        const cats = (item.service.categories ?? []) as string[];
        const matches = cats.some((c) => c === externalCategory);
        return { ...item, score: matches ? Math.max(item.score, 1) : 0 };
      });
    }
    return scored;
  }, [services, debouncedQuery, externalCategory]);

  const targetGridIndex = useMemo(() => {
    const map = new Map<string, number>();
    if (!debouncedQuery && !externalCategory) return map;
    const matches = [...stableScored]
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);
    for (let i = 0; i < matches.length; i++) {
      map.set(matches[i].service.id, i);
    }
    return map;
  }, [stableScored, debouncedQuery, externalCategory]);

  const dropdownResults = useMemo(
    () => getDropdownResults(services, query),
    [services, query],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: trigger on external ID change
  useEffect(() => {
    if (!externalSelectedServiceId || services.length === 0) return;
    const svc = services.find((s) => s.id === externalSelectedServiceId);
    if (svc) {
      setSelectedService(svc);
      onExternalServiceHandled?.();
    }
  }, [externalSelectedServiceId, services]);

  const dismissMobileSearch = useCallback(() => {
    setMobileSearchActive(false);
    setMobileResultsView(false);
    setShowDropdown(false);
    setQuery("");
    inputRef.current?.blur();
  }, []);

  const handleDropdownSelect = useCallback((result: DropdownResult) => {
    setShowDropdown(false);
    setMobileSearchActive(false);
    setMobileResultsView(false);
    inputRef.current?.blur();
    if (result.type === "service") {
      setSelectedService(result.service);
    } else if (result.type === "category") {
      setQuery(result.label);
    } else if (result.type === "endpoint") {
      setSelectedService(result.service);
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

  const hasQuery =
    query.length > 0 || debouncedQuery.length > 0 || !!externalCategory;

  return (
    <>
      <div
        ref={sectionRef}
        className={`discovery-section${hasQuery ? " has-query" : ""}${mobileSearchActive ? " mobile-search-active" : ""}${mobileResultsView ? " mobile-results-view" : ""}`}
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
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: scroll to top */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: scroll to top */}
          <div
            className="discovery-ascii-logo"
            onClick={() => {
              setQuery("");
              setShowDropdown(false);
              setMobileSearchActive(false);
              setMobileResultsView(false);
              setSelectedService(null);
              const el = document.querySelector(".landing-page") as HTMLElement;
              if (el) {
                el.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            style={{ cursor: "pointer" }}
          >
            Superpowers for <br className="sm:hidden" />
            your agent
          </div>

          <p className="discovery-overlay-desc">
            Explore services using MPP that enable new use cases for your agent
            or application in just seconds
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
                  if (window.matchMedia("(max-width: 768px)").matches) {
                    setMobileSearchActive(true);
                  }
                }}
                onBlur={() => {
                  setIsFocused(false);
                  if (!mobileSearchActive) {
                    setTimeout(() => {
                      setShowDropdown(false);
                      setQuery("");
                    }, 200);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Find by usage, route, category..."
                className="discovery-search-input"
              />
              {!isFocused && query.length === 0 && !mobileSearchActive && (
                <kbd className="discovery-kbd">
                  <span className="discovery-kbd-symbol">⌘</span>K
                </kbd>
              )}
              {query.length > 0 && !mobileSearchActive && (
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
                  >
                    <title>Clear</title>
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              )}
              {mobileSearchActive &&
                dropdownResults.length > 0 &&
                !mobileResultsView && (
                  <button
                    type="button"
                    className="mobile-search-view"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setMobileResultsView(true);
                      setShowDropdown(false);
                      inputRef.current?.blur();
                    }}
                  >
                    View
                  </button>
                )}
              {mobileResultsView && targetGridIndex.size > 0 && (
                <span className="mobile-results-count">
                  {targetGridIndex.size} matches
                </span>
              )}
              {(mobileSearchActive || mobileResultsView) && (
                <button
                  type="button"
                  className="mobile-search-dismiss"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (mobileResultsView) {
                      dismissMobileSearch();
                    } else if (query.length > 0) {
                      setQuery("");
                      setShowDropdown(false);
                    } else {
                      dismissMobileSearch();
                    }
                  }}
                  aria-label="Clear"
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
                    <title>Clear</title>
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              )}
            </div>
            {query.length === 0 && !mobileSearchActive && (
              <a href="/services" className="discovery-view-all">
                View all
              </a>
            )}
            {(showDropdown || mobileSearchActive) && query.length > 0 && (
              <div className="discovery-dropdown">
                <div className="discovery-dropdown-tabs">
                  {(["all", "services", "endpoints"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className={`discovery-dropdown-tab${dropdownTab === tab ? " discovery-dropdown-tab-active" : ""}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setDropdownTab(tab);
                        setActiveIndex(-1);
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
                <div className="discovery-dropdown-scroll">
                  {dropdownResults.length > 0 ? (
                    dropdownResults
                      .filter(
                        (r) =>
                          dropdownTab === "all" ||
                          (dropdownTab === "services" &&
                            (r.type === "service" || r.type === "category")) ||
                          (dropdownTab === "endpoints" &&
                            r.type === "endpoint"),
                      )
                      .map((r, i) => (
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
                      ))
                  ) : (
                    <div
                      style={{
                        padding: "1.5rem 1rem",
                        textAlign: "center",
                        color: "var(--vocs-text-color-muted)",
                        fontSize: 14,
                      }}
                    >
                      <p style={{ margin: 0 }}>No matches found</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* submit hint removed for now */}
        </div>

        {/* Card grid */}
        <div className="discovery-grid" ref={gridRef}>
          {stableScored.slice(0, 48).map(({ service, score }) => {
            const isMatch = (!debouncedQuery && !externalCategory) || score > 0;
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
                className="discovery-card discovery-card-visible"
                style={{
                  opacity: hasQuery ? (isMatch ? 1 : 0.08) : undefined,
                  filter: hasQuery && !isMatch ? "blur(3px)" : undefined,
                  pointerEvents: hasQuery && !isMatch ? "none" : undefined,
                  transform: cardTransform,
                  zIndex: isAnimating ? 6 : undefined,
                  position: isAnimating ? ("relative" as const) : undefined,
                }}
                onClick={() => setSelectedService(service)}
              >
                {(service.docs?.homepage || service.provider?.url) && (
                  <div className="discovery-card-links">
                    {service.docs?.homepage && (
                      <a
                        href={service.docs.homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Docs"
                        aria-label="Docs"
                      >
                        <span className="sr-only">Docs</span>
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
                        >
                          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                        </svg>
                      </a>
                    )}
                    {service.provider?.url && (
                      <a
                        href={service.provider.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Website"
                        aria-label="Website"
                      >
                        <span className="sr-only">Website</span>
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
                        >
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" x2="21" y1="14" y2="3" />
                        </svg>
                      </a>
                    )}
                  </div>
                )}
                <div
                  className="discovery-card-icon"
                  style={{
                    position: "relative",
                    overflow: "visible",
                    zIndex: 1,
                  }}
                >
                  {iconUrl && !brokenIcons.current.has(service.id) ? (
                    <img
                      src={iconUrl}
                      alt=""
                      className="discovery-card-icon-img"
                      style={
                        isDark === iconManifest.lightBg.has(service.id)
                          ? { filter: "invert(1)" }
                          : undefined
                      }
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
                  {service.integration !== "third-party" && (
                    <span
                      className="discovery-card-fp-dot"
                      style={{
                        position: "absolute",
                        top: -1,
                        right: -1,
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        background: "#22c55e",
                        border:
                          "1.5px solid var(--vocs-background-color-primary, #1a1a1a)",
                        zIndex: 2,
                      }}
                    />
                  )}
                </div>
                <div className="discovery-card-name">{service.name}</div>
                <div className="discovery-card-desc">{service.description}</div>
              </button>
            );
          })}
          {(() => {
            const matchCount = hasQuery
              ? targetGridIndex.size
              : stableScored.length;
            const skeletons: React.ReactNode[] = [];
            const maxCols = 6;
            const remainder = matchCount % maxCols;
            if (remainder > 0) {
              for (let i = 0; i < maxCols - remainder; i++) {
                skeletons.push(
                  <div
                    key={`skel-${i}`}
                    className="discovery-card discovery-card-skeleton discovery-card-visible"
                    style={{
                      opacity: hasQuery ? 0.5 : undefined,
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
            iconManifest={iconManifest}
            isDark={isDark}
            onClose={() => {
              setSelectedService(null);
              dismissMobileSearch();
            }}
          />,
          document.body,
        )}
      {/* {showAddModal &&
        createPortal(
          <AddServiceModal onClose={() => setShowAddModal(false)} />,
          document.body,
        )} */}
    </>
  );
}

// ---------------------------------------------------------------------------
// Service Detail Modal
// ---------------------------------------------------------------------------

function ServiceDetailModal({
  service,
  iconManifest,
  isDark,
  onClose,
}: {
  service: Service;
  iconManifest: IconManifest;
  isDark: boolean;
  onClose: () => void;
}) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(
    service.endpoints[0] ?? null,
  );
  const [copied, setCopied] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [showAgentTip, setShowAgentTip] = useState(false);
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
    if (!p?.amount) return p?.amountHint ?? "—";
    const v = Number(p.amount) / 10 ** (p.decimals ?? 0);
    if (Number.isNaN(v)) return "—";
    if (v >= 0.01) return `$${v.toFixed(2)}`;
    let s = v.toFixed(4);
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
        "curl -fsSL https://tempo.xyz/install | bash",
        "tempo wallet login",
        `tempo request ${walletPrefix}--dry-run ${baseUrl}${cliPath}${isNonGet ? ` -X ${selectedEndpoint.method} --json ${exampleJson}` : ""}`,
      ].join(" && ")
    : null;

  const handleCopySnippet = () => {
    if (copyCommand) {
      navigator.clipboard.writeText(copyCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyEndpoint = (ep: Endpoint) => {
    const url = `${baseUrl}${ep.path}`;
    navigator.clipboard.writeText(url);
    setCopiedEndpoint(`${ep.method}-${ep.path}`);
    setTimeout(() => setCopiedEndpoint(null), 1500);
  };

  const handleCopyJson = () => {
    const schema = {
      name: service.name,
      description: service.description,
      url: baseUrl,
      endpoints: service.endpoints.map((ep) => ({
        method: ep.method,
        path: ep.path,
        description: ep.description,
        payment: ep.payment,
      })),
    };
    navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 1500);
  };

  const green = "light-dark(#15803d, #4ade80)";
  const purple = "light-dark(#7c3aed, #c084fc)";
  const yellow = "light-dark(#b45309, #fbbf24)";
  const flag = "light-dark(#0369a1, #38bdf8)";
  const teal = "light-dark(#0d7377, #5eead4)";
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
        {/* Close button — pinned top-right */}
        <div className="modal-actions">
          <button type="button" onClick={handleClose} className="modal-close">
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

        {/* Header */}
        <div className="modal-header">
          <div style={{ marginBottom: 12 }}>
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
                  ...(isDark === iconManifest.lightBg.has(service.id)
                    ? { filter: "invert(1)" }
                    : {}),
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
                }}
              >
                {service.name[0]}
              </div>
            )}
          </div>
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
                fontSize: 22,
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
          {service.description && (
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.6,
                color: "var(--vocs-text-color-secondary)",
                margin: "0.3rem 0 0",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical" as const,
                overflow: "hidden",
              }}
            >
              {service.description}
            </p>
          )}

          {/* Action links — under description */}
          <div
            className="modal-action-links"
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              marginTop: "0.75rem",
              flexWrap: "wrap",
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
              className="modal-link"
              style={{ position: "relative" }}
              onClick={(e) => {
                e.stopPropagation();
                handleCopyJson();
              }}
              onMouseEnter={() => setShowAgentTip(true)}
              onMouseLeave={() => setShowAgentTip(false)}
              onTouchEnd={(e) => {
                e.preventDefault();
                setShowAgentTip((v) => !v);
              }}
            >
              <svg
                aria-hidden="true"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 8V4H8" />
                <rect width="16" height="12" x="4" y="8" rx="2" />
                <path d="M2 14h2" />
                <path d="M20 14h2" />
                <path d="M15 13v2" />
                <path d="M9 13v2" />
              </svg>
              <span>Add to agent</span>
              {/* Invisible bridge to prevent tooltip dismiss when moving cursor */}
              {showAgentTip && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    width: "100%",
                    height: 12,
                  }}
                  aria-hidden="true"
                />
              )}
              {showAgentTip && (
                /* biome-ignore lint/a11y/useKeyWithClickEvents: tooltip container */
                /* biome-ignore lint/a11y/noStaticElementInteractions: tooltip container */
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="agent-tooltip"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    width: 360,
                    padding: "1rem",
                    borderRadius: 12,
                    border:
                      "1px solid light-dark(var(--vocs-border-color-primary), rgba(255,255,255,0.12))",
                    background: "var(--vocs-background-color-primary)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                    zIndex: 30,
                    textAlign: "left",
                    fontSize: 13,
                    color: "var(--vocs-text-color-secondary)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 0.25rem",
                      fontWeight: 600,
                      fontSize: 14,
                      color: "var(--vocs-text-color-heading)",
                    }}
                  >
                    Add to your agent
                  </p>
                  <p
                    style={{
                      margin: "0 0 0.75rem",
                      fontSize: 12,
                      lineHeight: 1.5,
                      color: "var(--vocs-text-color-muted)",
                    }}
                  >
                    Copies all {service.endpoints.length} endpoints and service
                    metadata as structured JSON your agent can use seamlessly.
                  </p>

                  <p
                    style={{
                      margin: "0 0 0.35rem",
                      fontSize: 11,
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--vocs-text-color-muted)",
                    }}
                  >
                    Get Tempo tools
                  </p>
                  <div
                    style={{
                      position: "relative",
                      padding: "0.5rem 0.65rem",
                      borderRadius: 8,
                      background:
                        "light-dark(rgba(0,0,0,0.04), rgba(255,255,255,0.06))",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      lineHeight: 1.7,
                      marginBottom: "0.6rem",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          color: "var(--vocs-text-color-muted)",
                          userSelect: "none",
                        }}
                      >
                        ${" "}
                      </span>
                      curl -L https://tempo.xyz/install | bash
                    </div>
                    <button
                      type="button"
                      style={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: "var(--vocs-text-color-muted)",
                        padding: 3,
                        display: "flex",
                        borderRadius: 4,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(
                          "curl -L https://tempo.xyz/install | bash",
                        );
                      }}
                    >
                      <svg
                        aria-hidden="true"
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect width="14" height="14" x="8" y="8" rx="2" />
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                      </svg>
                    </button>
                  </div>

                  <p
                    style={{
                      margin: "0 0 0.35rem",
                      fontSize: 11,
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--vocs-text-color-muted)",
                    }}
                  >
                    Full documentation
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: "0.75rem",
                      padding: "0.4rem 0.65rem",
                      borderRadius: 8,
                      border: "1px solid var(--vocs-border-color-primary)",
                      background:
                        "light-dark(rgba(0,0,0,0.02), rgba(255,255,255,0.03))",
                    }}
                  >
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
                        flexShrink: 0,
                        color: "var(--vocs-text-color-muted)",
                      }}
                    >
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                    </svg>
                    <a
                      href="/services/llms.txt"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        color: "var(--vocs-text-color-heading)",
                        textDecoration: "none",
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      llms.txt
                    </a>
                    <button
                      type="button"
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: "var(--vocs-text-color-muted)",
                        padding: 2,
                        display: "flex",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(
                          `${window.location.origin}/services/llms.txt`,
                        );
                      }}
                    >
                      <svg
                        aria-hidden="true"
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect width="14" height="14" x="8" y="8" rx="2" />
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                      </svg>
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyJson();
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: "0.45rem 0.75rem",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 500,
                        color: "var(--vocs-text-color-heading)",
                        border:
                          "1px solid light-dark(rgba(0,0,0,0.12), rgba(255,255,255,0.15))",
                        background:
                          "light-dark(rgba(0,0,0,0.05), rgba(255,255,255,0.08))",

                        fontFamily: "var(--font-sans)",
                        transition: "background 0.15s",
                      }}
                    >
                      <svg
                        aria-hidden="true"
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect width="14" height="14" x="8" y="8" rx="2" />
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                      </svg>
                      Add to agent
                    </button>
                    <a
                      href="/guides/building-with-an-llm"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: "0.45rem 0.75rem",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 500,
                        color: "var(--vocs-text-color-heading)",
                        textDecoration: "none",
                        border:
                          "1px solid light-dark(rgba(0,0,0,0.12), rgba(255,255,255,0.15))",
                        background:
                          "light-dark(rgba(0,0,0,0.05), rgba(255,255,255,0.08))",
                        transition: "background 0.15s",
                      }}
                    >
                      Learn more
                      <svg
                        aria-hidden="true"
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                </div>
              )}
            </button>
          </div>
        </div>

        <div
          style={{
            borderBottom: "1px solid var(--vocs-border-color-primary)",
            margin: "1.25rem -2rem",
            padding: "0.5rem 0",
          }}
        />

        {/* Endpoints table */}
        <div style={{ marginTop: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 15,
              fontWeight: 500,
              color: "var(--vocs-text-color-heading)",
              marginBottom: 12,
              flexWrap: "nowrap",
            }}
          >
            <span>Endpoints</span>
            <span className="endpoint-count-pill">
              {service.endpoints.length}
            </span>
            <button
              type="button"
              className={`modal-copy-btn${copiedJson ? " modal-copy-btn-active" : ""}`}
              style={{ marginLeft: "auto", marginBottom: 4 }}
              onClick={(e) => {
                e.stopPropagation();
                handleCopyJson();
              }}
            >
              {copiedJson ? (
                <>
                  <svg
                    aria-hidden="true"
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginRight: 4 }}
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg
                    aria-hidden="true"
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginRight: 4 }}
                  >
                    <rect width="14" height="14" x="8" y="8" rx="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                  Copy as JSON
                </>
              )}
            </button>
          </div>
          <div className="modal-endpoints-wrap">
            <div className="modal-endpoints-grad-top" id="ep-grad-top" />
            <div
              className="modal-endpoints"
              onScroll={(e) => {
                const el = e.currentTarget;
                const top = el.scrollTop > 4;
                const bottom =
                  el.scrollHeight - el.scrollTop - el.clientHeight > 4;
                const canScroll = el.scrollHeight > el.clientHeight + 4;
                const topEl = el.parentElement?.querySelector(
                  ".modal-endpoints-grad-top",
                );
                const bottomEl = el.parentElement?.querySelector(
                  ".modal-endpoints-grad-bottom",
                );
                if (topEl) topEl.classList.toggle("visible", top && canScroll);
                if (bottomEl)
                  bottomEl.classList.toggle("visible", bottom && canScroll);
              }}
              ref={(el) => {
                if (!el) return;
                const canScroll = el.scrollHeight > el.clientHeight + 4;
                const bottom =
                  el.scrollHeight - el.scrollTop - el.clientHeight > 4;
                const bottomEl = el.parentElement?.querySelector(
                  ".modal-endpoints-grad-bottom",
                );
                if (bottomEl)
                  bottomEl.classList.toggle("visible", bottom && canScroll);
              }}
            >
              {service.endpoints.map((ep) => {
                const isSelected = ep === selectedEndpoint;
                const epCopyId = `${ep.method}-${ep.path}`;
                return (
                  <button
                    key={epCopyId}
                    type="button"
                    className={`modal-endpoint-row ${isSelected ? "modal-endpoint-selected" : ""}`}
                    onClick={() => {
                      setSelectedEndpoint(ep);
                      handleCopyEndpoint(ep);
                    }}
                  >
                    <span
                      className={`method-badge method-${ep.method.toLowerCase()}`}
                    >
                      {ep.method}
                    </span>
                    <span className="endpoint-path">{ep.path}</span>
                    <span className="endpoint-desc">{ep.description}</span>
                    {/* biome-ignore lint/a11y/useKeyWithClickEvents: copy on click */}
                    {/* biome-ignore lint/a11y/noStaticElementInteractions: copy on click */}
                    <span
                      className="endpoint-price-wrap"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyEndpoint(ep);
                      }}
                    >
                      {copiedEndpoint === epCopyId ? (
                        <span
                          className="endpoint-copy-done"
                          style={{ display: "flex", alignItems: "center" }}
                        >
                          <svg
                            aria-hidden="true"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                      ) : (
                        <span className="endpoint-price">
                          {formatPrice(ep)}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="modal-endpoints-grad-bottom" />
          </div>
        </div>

        <div
          style={{
            borderBottom: "1px solid var(--vocs-border-color-primary)",
            margin: "1rem -2rem",
            padding: "0.6rem 0",
          }}
        />

        {/* CLI snippet */}
        {selectedEndpoint && (
          <div className="modal-cli-wrapper" style={{ marginTop: "2rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 15,
                fontWeight: 500,
                color: "var(--vocs-text-color-heading)",
                paddingBottom: 8,
              }}
            >
              <span>
                Try out{" "}
                <code
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    padding: "1px 5px",
                    borderRadius: 4,
                    background:
                      "light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.08))",
                  }}
                >
                  {selectedEndpoint.path}
                </code>
              </span>
              <button
                type="button"
                className={`modal-copy-btn${copied ? " modal-copy-btn-active" : ""}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,

                  textTransform: "none",
                  letterSpacing: "normal",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopySnippet();
                }}
              >
                <svg
                  aria-hidden="true"
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="4 17 10 11 4 5" />
                  <line x1="12" x2="20" y1="19" y2="19" />
                </svg>
                {copied ? "Copied!" : "Copy commands"}
              </button>
            </div>
            <p
              style={{
                fontSize: 14,
                color: "var(--vocs-text-color-secondary)",
                margin: "0 0 1rem",
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
              <div className="cli-lines">
                <div className="cli-line">
                  <span className="cli-line-cmd">
                    <span style={{ color: muted }}>$ </span>
                    <span style={{ color: green }}>curl</span>{" "}
                    <span style={{ color: flag }}>-L</span>{" "}
                    <span style={{ color: teal }}>
                      https://tempo.xyz/install
                    </span>{" "}
                    <span style={{ color: flag }}>|</span>{" "}
                    <span style={{ color: green }}>bash</span>
                  </span>
                  <span className="cli-line-comment"># Get Tempo CLI</span>
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
                <div className="cli-line">
                  <span className="cli-line-cmd">
                    <span style={{ color: muted }}>$ </span>
                    <span style={{ color: green }}>tempo</span> wallet{" "}
                    {walletPrefix}
                    <span style={{ color: flag }}>--dry-run</span>{" "}
                    <span style={{ color: teal }}>
                      {baseUrl}
                      {cliPath}
                    </span>
                    {isNonGet && (
                      <>
                        {" \\\n      "}
                        <span style={{ color: flag }}>-X</span>{" "}
                        <span style={{ color: purple }}>
                          {selectedEndpoint.method}
                        </span>{" "}
                        <span style={{ color: flag }}>--json</span>{" "}
                        <span style={{ color: yellow }}>{exampleJson}</span>
                      </>
                    )}
                  </span>
                  <span className="cli-line-comment">
                    {cliPath.includes("{")
                      ? `# Replace ${cliPath.match(/\{(\w+)\}/g)?.join(", ") ?? "{…}"} with real values`
                      : "# Test without paying"}
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
      /* Search overlay — centered column */
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
        width: min(90vw, 600px);
        gap: 0;
      }
      .discovery-overlay > * { pointer-events: auto; }
      .discovery-ascii-logo {
        margin: 0 0 0.75rem;
        pointer-events: none;
        color: var(--vocs-text-color-heading);
        opacity: 0.85;
        font-family: "VTC Du Bois", var(--font-sans);
        font-size: clamp(2.5rem, 2.5vw, 2.5rem);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: -0.01em;
        transition: opacity 0.3s;
      }
      .discovery-ascii-logo > div { display: none; }
      .discovery-overlay-desc {
        color: var(--vocs-text-color-secondary);
        font-size: clamp(1.2rem, 1.2vw, 1.2rem);
        margin: 0 0 1.25rem;
        line-height: 1.55;
        max-width: 500px;
      }
      .has-query .discovery-ascii-logo {
        display: none !important;
      }
      .has-query .discovery-overlay-desc {
        display: none !important;
      }
      .has-query .discovery-overlay {
        top: 35%;
        transition: top 0.15s ease;
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
          oklch(from var(--vocs-background-color-primary) l c h / 0.96) 0%,
          oklch(from var(--vocs-background-color-primary) l c h / 0.92) 28%,
          oklch(from var(--vocs-background-color-primary) l c h / 0.7) 48%,
          oklch(from var(--vocs-background-color-primary) l c h / 0.4) 65%,
          transparent 80%
        );
        pointer-events: none;
        z-index: 8;
        transition: opacity 0.4s;
      }
      @media (max-width: 768px) {
        .discovery-grid::after {
          background: radial-gradient(
            ellipse 100% 60% at 50% 30%,
            oklch(from var(--vocs-background-color-primary) l c h / 0.98) 0%,
            oklch(from var(--vocs-background-color-primary) l c h / 0.95) 20%,
            oklch(from var(--vocs-background-color-primary) l c h / 0.85) 35%,
            oklch(from var(--vocs-background-color-primary) l c h / 0.7) 55%,
            transparent 75%
          );
        }
        .discovery-overlay {
          top: 28% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
        }
        .discovery-dropdown {
          max-height: 40vh;
          overflow-y: auto;
        }
        .discovery-dropdown-item {
          padding: 0.8rem 1rem !important;
          font-size: 15px !important;
        }
        .dropdown-tag {
          font-size: 11px !important;
        }
        .dropdown-desc, .dropdown-route {
          font-size: 13px !important;
        }
        .discovery-dropdown-tab {
          font-size: 12px !important;
          padding: 4px 12px !important;
        }
      }
      @media (max-width: 768px) {
        .discovery-kbd { display: none; }
      }

      .discovery-search-wrapper {
        position: relative;
        width: 100%;
        max-width: 560px;
        margin-top: 0;
        z-index: 10;
        display: flex;
        gap: 0.5rem;
        align-items: stretch;
      }
      .discovery-search {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0.75rem 1rem;
        border-radius: 10px;
        border: 1px solid var(--vocs-border-color-primary);
        background: light-dark(rgba(255,255,255,0.9), rgba(255,255,255,0.09));
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        transition: border-color 0.15s;
        flex: 1;
        min-width: 0;
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
        
        color: var(--vocs-text-color-muted);
        
        padding: 2px;
        border-radius: 4px;
        transition: color 0.15s;
      }
      .discovery-search-clear:hover {
        color: var(--vocs-text-color-heading);
      }
      .discovery-view-all {
        flex-shrink: 0;
        font-size: 14.5px;
        font-family: var(--font-sans);
        color: var(--vocs-text-color-secondary);
        text-decoration: none !important;
        padding: 0.75rem 1rem;
        border-radius: 10px;
        border: 1px solid var(--vocs-border-color-primary);
        background: light-dark(var(--vocs-background-color-primary), rgba(255,255,255,0.06));
        white-space: nowrap;
        transition: color 0.15s, border-color 0.15s, background 0.15s;
        pointer-events: auto;
        display: flex;
        align-items: center;
      }
      .discovery-view-all:hover {
        color: var(--vocs-text-color-heading);
        border-color: light-dark(rgba(0,0,0,0.2), rgba(255,255,255,0.2));
        text-decoration: none !important;
      }
      @media (max-width: 768px) {
        .discovery-view-all {
          background: var(--vocs-background-color-primary) !important;
          border-color: light-dark(rgba(0,0,0,0.15), rgba(255,255,255,0.15)) !important;
          color: var(--vocs-text-color-heading) !important;
          font-weight: 500;
        }
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
        background: light-dark(rgba(255,255,255,0.95), rgba(30,30,30,0.92));
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        box-shadow: 0 8px 32px rgba(0,0,0,0.18);
        overflow: hidden;
        z-index: 20;
      }
      .discovery-dropdown-scroll {
        max-height: 360px;
        overflow-y: auto;
      }
      .discovery-dropdown-item {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 0.7rem 1rem;
        border: none;
        background: transparent;
        
        font-size: 14px;
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
        color: light-dark(rgba(0,0,0,0.55), rgba(255,255,255,0.6));
        background: light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.1));
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
      .discovery-dropdown-tabs {
        display: flex;
        gap: 2px;
        padding: 0.4rem 0.6rem;
        border-bottom: 1px solid var(--vocs-border-color-primary);
      }
      .discovery-dropdown-tab {
        font-size: 11px;
        font-family: var(--font-sans);
        padding: 3px 10px;
        border-radius: 5px;
        border: none;
        background: transparent;
        color: var(--vocs-text-color-muted);
        
        transition: background 0.1s, color 0.1s;
      }
      .discovery-dropdown-tab:hover { color: var(--vocs-text-color-heading); }
      .discovery-dropdown-tab-active {
        background: light-dark(rgba(0,0,0,0.07), rgba(255,255,255,0.1));
        color: var(--vocs-text-color-heading);
      }

      /* Card grid — fits within viewport, no scroll */
      .discovery-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        grid-auto-rows: minmax(130px, 1fr);
        gap: 10px;
        padding: clamp(0.75rem, 1.5vw, 1.5rem);
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      .discovery-grid::before {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 100px;
        background: linear-gradient(to top, var(--vocs-background-color-primary) 15%, transparent);
        pointer-events: none;
        z-index: 6;
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
          grid-auto-rows: 120px;
          gap: 8px;
          padding: 0.75rem;
        }
      }

      .discovery-card {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 12px;
        border-radius: 14px;
        border: 1px solid var(--vocs-border-color-primary);
        background: light-dark(rgba(0,0,0,0.03), rgba(255,255,255,0.03));
        
        text-align: left;
        font-family: var(--font-sans);
        overflow: visible;
        min-height: 0;
        transition: opacity 0.4s ease, filter 0.4s ease, transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.15s, background 0.15s;
      }
      .discovery-card-visible {
        opacity: 1;
        transform: translateY(0);
      }
      .discovery-card:hover {
        border-color: light-dark(rgba(0,0,0,0.12), rgba(255,255,255,0.12));
        background: light-dark(rgba(0,0,0,0.03), rgba(255,255,255,0.03));
      }
      .discovery-card-skeleton {
        pointer-events: none;
        border-style: dashed;
        border-color: light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.06));
        background: transparent;
      }
      .discovery-card { position: relative; }
      .discovery-card-links {
        position: absolute;
        top: 10px;
        right: 10px;
        display: flex;
        gap: 6px;
        z-index: 2;
        opacity: 0;
        transition: opacity 0.15s;
      }
      .discovery-card:hover .discovery-card-links { opacity: 1; }
      .discovery-card-links a {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        border-radius: 5px;
        color: var(--vocs-text-color-muted);
        background: light-dark(rgba(0,0,0,0.05), rgba(255,255,255,0.08));
        transition: color 0.15s, background 0.15s;
        pointer-events: auto;
      }
      .discovery-card-links a:hover {
        color: var(--vocs-text-color-heading);
        background: light-dark(rgba(0,0,0,0.1), rgba(255,255,255,0.14));
      }
      .discovery-card-icon { flex-shrink: 0; width: 28px; height: 28px; }
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
        font-size: 17px;
        color: var(--vocs-text-color-heading);
        margin-top: auto;
        flex-shrink: 0;
      }
      .discovery-card-desc {
        font-size: 13px;
        color: var(--vocs-text-color-secondary);
        line-height: 1.5;
        margin-top: 2px;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        flex-shrink: 1;
        min-height: 0;
      }

      @media (max-width: 768px) {
        .discovery-card {
          display: grid !important;
          grid-template-columns: auto 1fr;
          grid-template-rows: auto 1fr;
          gap: 2px 12px;
          padding: 10px;
          align-items: start;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
        }
        .discovery-card-icon { grid-area: 1 / 1; align-self: center; }
        .discovery-card-icon-img { width: 30px !important; height: 30px !important; }
        .discovery-card-icon-fallback { width: 30px !important; height: 30px !important; font-size: 13px !important; }
        .discovery-card-name { grid-area: 1 / 2; align-self: center; margin-top: 0; font-size: 15px; }
        .discovery-card-desc { grid-area: 2 / 1 / 3 / -1; -webkit-line-clamp: 3; font-size: 13.5px; margin-top: 2px; }
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
        border: 1px solid light-dark(var(--vocs-border-color-primary), rgba(255,255,255,0.12));
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
      .modal-actions {
        position: absolute;
        top: 1.25rem;
        right: 1.5rem;
        z-index: 2;
      }
      .modal-close {
        border: none;
        background: transparent;
        
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
        cursor: pointer;
      }
      .modal-link:hover {
        background: light-dark(rgba(0,0,0,0.04), rgba(255,255,255,0.06));
      }

      /* CLI example */
      .modal-cli-wrapper {
        overflow: hidden;
        transition: max-height 0.3s ease;
        min-height: 180px;
      }
      .modal-cli {
        padding: 1rem;
        border-radius: 10px;
        background: light-dark(#f5f5f5, #1a1a1a);
        font-family: var(--font-mono);
        overflow-x: auto;
        transition: opacity 0.15s;
      }
      .modal-cli-copied {
        /* No flash on copy — keep steady */
      }
      .modal-copy-btn {
        font-size: 12px;
        padding: 2px 8px;
        border-radius: 4px;
        border: 1px solid var(--vocs-border-color-primary);
        background: transparent;
        color: var(--vocs-text-color-secondary);
        cursor: pointer;
        font-family: var(--font-sans);
        transition: color 0.15s, background 0.15s, border-color 0.15s;
        white-space: nowrap;
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .modal-copy-btn:hover {
        color: var(--vocs-text-color-heading);
        background: light-dark(rgba(0,0,0,0.04), rgba(255,255,255,0.06));
      }
      @media (max-width: 640px) {
        .modal-copy-btn {
          font-size: 13px !important;
          padding: 6px 12px !important;
          min-height: 36px;
        }
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
        line-height: 1.7;
        margin: 0;
      }
      .cli-line {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 1rem;
        align-items: start;
      }
      .cli-line-cmd {
        white-space: pre-wrap;
        word-break: break-word;
        overflow-wrap: anywhere;
        padding-left: 2ch;
        text-indent: -2ch;
      }
      .cli-line-comment {
        white-space: nowrap;
        color: var(--vocs-text-color-muted);
        font-size: 12px;
        text-align: left;
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
      .modal-endpoints-grad-top,
      .modal-endpoints-grad-bottom {
        position: absolute;
        left: 1px;
        right: 1px;
        height: 32px;
        pointer-events: none;
        z-index: 1;
        opacity: 0;
        transition: opacity 0.2s;
      }
      .modal-endpoints-grad-top {
        top: 1px;
        background: linear-gradient(to bottom, var(--vocs-background-color-primary), transparent);
        border-radius: 9px 9px 0 0;
      }
      .modal-endpoints-grad-bottom {
        bottom: 1px;
        background: linear-gradient(to top, var(--vocs-background-color-primary), transparent);
        border-radius: 0 0 9px 9px;
      }
      .modal-endpoints-grad-top.visible,
      .modal-endpoints-grad-bottom.visible {
        opacity: 1;
      }

      .modal-endpoints {
        max-height: 320px;
        overflow-y: auto;
        border: 1px solid light-dark(var(--vocs-border-color-primary), rgba(255,255,255,0.1));
        border-radius: 10px;
        scrollbar-width: thin;
      }
      .modal-endpoint-row {
        display: grid;
        grid-template-columns: 60px minmax(80px, 1fr) minmax(0, 1.1fr) 80px;
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
        text-align: left;
        justify-self: start;
        min-width: 0;
        font-size: 12px;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .endpoint-price-wrap {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        white-space: nowrap;
        cursor: pointer;
      }
      .endpoint-price {
        font-family: var(--font-mono);
        font-size: 12px;
        color: var(--vocs-text-color-secondary);
        white-space: nowrap;
        text-align: right;
      }
      .endpoint-copy-done {
        color: light-dark(#15803d, #4ade80);
      }

      @media (max-width: 640px) {
        .modal-backdrop {
          align-items: flex-end !important;
          padding: 0 !important;
        }
        .modal-content {
          padding: 0.85rem 1.25rem;
          border-radius: 16px 16px 0 0 !important;
          max-height: 90vh !important;
        }
        @keyframes modalSlideIn {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalSlideOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(100%); }
        }
        .modal-content {
          display: flex !important;
          flex-direction: column !important;
          padding-bottom: calc(0.85rem + env(safe-area-inset-bottom, 0px)) !important;
        }
        .modal-content { position: relative !important; }
        .modal-close {
          position: absolute !important;
          top: 0.75rem !important;
          right: 0.75rem !important;
          z-index: 10 !important;
          border: 1px solid var(--vocs-border-color-primary) !important;
          border-radius: 8px !important;
          padding: 6px !important;
          width: 32px !important;
          height: 32px !important;
        }
        .modal-header { padding-left: 0.25rem; }
        .modal-endpoint-row {
          grid-template-columns: 50px 1fr;
          grid-template-rows: auto auto;
          gap: 4px 8px;
          padding: 0.6rem 0.75rem;
          font-size: 14px;
        }
        .endpoint-desc {
          display: -webkit-box !important;
          grid-column: 1 / -1;
          font-size: 13px !important;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-top: 2px;
        }
        .endpoint-path { font-size: 13px !important; }
        .method-badge { font-size: 11px !important; }
        .modal-action-links {
          flex-direction: column !important;
          gap: 6px !important;
          margin-top: 1rem !important;
        }
        .modal-link {
          width: 100% !important;
          justify-content: center !important;
          padding: 0.6rem 1rem !important;
          font-size: 14px !important;
          background: light-dark(rgba(0,0,0,0.03), rgba(255,255,255,0.06)) !important;
        }
        .modal-link svg { width: 16px !important; height: 16px !important; }
        .cli-line-comment { display: none; }
      }

      /* ---- Mobile search buttons ---- */
      .mobile-search-dismiss,
      .mobile-search-view { display: none; }

      @media (max-width: 768px) {
        .discovery-overlay {
          transition: top 0.3s ease, opacity 0.3s ease !important;
        }
        .mobile-search-active .discovery-ascii-logo {
          opacity: 0 !important;
          max-height: 0 !important;
          margin: 0 !important;
          overflow: hidden;
          transition: opacity 0.2s ease, max-height 0.2s ease, margin 0.2s ease;
        }
        .mobile-search-active .discovery-overlay-desc {
          opacity: 0 !important;
          max-height: 0 !important;
          margin: 0 !important;
          overflow: hidden;
          transition: opacity 0.2s ease, max-height 0.2s ease, margin 0.2s ease;
        }
        .mobile-search-active .discovery-overlay {
          top: 15% !important;
        }
        .mobile-search-active .discovery-grid::after {
          opacity: 1 !important;
          background: oklch(from var(--vocs-background-color-primary) l c h / 0.92) !important;
        }
        .mobile-search-active .discovery-dropdown {
          max-height: 60vh !important;
        }
        .mobile-search-active .discovery-view-all {
          display: none !important;
        }
        .mobile-results-view .discovery-overlay {
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          transform: none !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0.75rem 1rem;
          padding-top: calc(0.75rem + env(safe-area-inset-top, 0px));
          flex-direction: row;
          align-items: center;
          gap: 10px;
          position: sticky;
          z-index: 20;
          background: var(--vocs-background-color-primary);
          border-bottom: 1px solid var(--vocs-border-color-primary);
          pointer-events: auto;
        }
        .mobile-results-view .discovery-ascii-logo,
        .mobile-results-view .discovery-overlay-desc,
        .mobile-results-view .discovery-view-all,
        .mobile-results-view .discovery-dropdown,
        .mobile-results-view .discovery-kbd {
          display: none !important;
        }
        .mobile-results-view .discovery-search-wrapper {
          margin-top: 0 !important;
          flex: 1;
        }
        .mobile-results-view .discovery-grid::after {
          opacity: 0 !important;
        }
        .mobile-results-view.discovery-section {
          overflow-y: auto !important;
          -webkit-overflow-scrolling: touch;
        }
        .mobile-results-view .discovery-grid {
          height: auto !important;
          overflow: visible !important;
        }
        .mobile-search-dismiss {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: none;
          background: transparent;
          color: var(--vocs-text-color-muted);
          
          padding: 4px;
          border-radius: 4px;
          transition: color 0.15s;
        }
        .mobile-search-dismiss:hover {
          color: var(--vocs-text-color-heading);
        }
        .mobile-search-view {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          border: none;
          background: light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.1));
          color: var(--vocs-text-color-heading);
          font-size: 12px;
          font-weight: 600;
          font-family: var(--font-sans);
          
          padding: 4px 10px;
          border-radius: 5px;
          white-space: nowrap;
          transition: background 0.15s;
        }
        .mobile-search-view:hover {
          background: light-dark(rgba(0,0,0,0.1), rgba(255,255,255,0.15));
        }
      }

      /* Match count badge in results view */
      .mobile-results-count {
        display: none;
      }
      @media (max-width: 768px) {
        .mobile-results-count {
          display: inline-flex;
          flex-shrink: 0;
          font-size: 11.5px;
          font-family: var(--font-sans);
          color: var(--vocs-text-color-muted);
          opacity: 0.55;
          background: none;
          padding: 0;
          white-space: nowrap;
        }
      }
    `}</style>
  );
}
