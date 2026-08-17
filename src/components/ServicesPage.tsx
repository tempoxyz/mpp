"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  type Category,
  type Endpoint,
  fetchServices,
  type Service,
  serviceIconUrl,
} from "../data/registry";
import { AgentSetupPrompt } from "./AgentSetupPrompt";
import { Button } from "./marketing/Button";
import { CopyBadge } from "./marketing/CopyBadge";
import { cx } from "./marketing/cx";
import { Dropdown } from "./marketing/Dropdown";
import { Header } from "./marketing/Header";
import { Icon } from "./marketing/Icon";
import { LineLogo } from "./marketing/LineLogo";
import { ServiceCard } from "./marketing/ServiceCard";

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
export const PINNED_IDS: string[] = [
  "openai",
  "alchemy",
  "browserbase",
  "parallel",
  "fal",
  "anthropic",
  "google-gemini",
  "openrouter",
  "stabletravel",
  "stripe-climate",
];

export function allCategories(service: Service): Category[] {
  return service.categories ?? [];
}

export function formatPrice(endpoint: Endpoint): string {
  const payment = endpoint.payment;
  if (!payment) return "—";
  if (!payment.amount) return payment.amountHint ?? "Varies";
  const value = Number(payment.amount) / 10 ** (payment.decimals ?? 0);
  if (Number.isNaN(value)) return "—";
  if (value === 0) return "$0";
  if (value >= 1) return `$${value.toFixed(2)}`;
  let output = value.toFixed(6).replace(/0+$/, "");
  if (output.endsWith(".")) output += "00";
  else {
    const decimals = output.length - output.indexOf(".") - 1;
    if (decimals < 2) output += "0".repeat(2 - decimals);
  }
  return `$${output}`;
}

const categoryLabel = (service: Service) =>
  service.categories?.[0] ? CATEGORY_LABELS[service.categories[0]] : "Service";
const serviceUrl = (service: Service) => service.serviceUrl ?? service.url;
export const providerUrl = (service: Pick<Service, "provider" | "url">) =>
  service.provider?.url ?? service.url;
const endpointUrl = (service: Service, endpoint: Endpoint) =>
  new URL(
    endpoint.path,
    `${serviceUrl(service).replace(/\/$/, "")}/`,
  ).toString();

export function buildTryCommands(service: Service, endpoint: Endpoint): string {
  const requestArguments =
    endpoint.method === "GET"
      ? ""
      : ` \\\n    -X ${endpoint.method} --json '{"input":"Hello!"}'`;
  return [
    "curl -fsSL https://tempo.xyz/install | bash",
    "tempo wallet login",
    `tempo request \\\n    ${endpointUrl(service, endpoint)}${requestArguments}`,
  ].join("\n");
}

const searchable = (service: Service) =>
  [
    service.name,
    service.description,
    service.url,
    service.provider?.name,
    ...(service.categories ?? []),
    ...(service.tags ?? []),
    ...service.endpoints.flatMap((endpoint) => [
      endpoint.description,
      endpoint.method,
      endpoint.path,
    ]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

function ServiceTableRow({ service }: { service: Service }) {
  const [open, setOpen] = useState(false);
  const action =
    "flex size-8 shrink-0 items-center justify-center border border-border bg-[#101010] text-secondary transition-colors hover:text-offwhite";

  return (
    <article
      className={cx(
        "border-b border-border transition-colors",
        open && "bg-[#191919]",
      )}
    >
      <div className="px-4 py-5">
        <div className="flex items-start gap-4">
          <div className="flex min-w-0 items-center gap-3 xl:w-[200px] xl:flex-none">
            <img
              alt=""
              className="size-9 shrink-0 object-contain"
              src={serviceIconUrl(service)}
            />
            <div className="flex min-w-0 flex-col gap-1">
              <p className="truncate font-sans text-lg font-normal leading-[1.1] text-offwhite">
                {service.name}
              </p>
              <p className="font-mono text-sm capitalize leading-[1.2] tracking-[0.24px] text-secondary">
                {categoryLabel(service)}
              </p>
            </div>
          </div>

          <CopyBadge
            className="max-md:hidden xl:hidden"
            text={serviceUrl(service)}
          />
          <p className="hidden min-w-0 pt-1 font-sans text-sm leading-[1.3] text-secondary xl:block xl:flex-1">
            {service.description}
          </p>
          <div className="ml-auto flex shrink-0 items-center justify-end gap-2 xl:ml-0 xl:flex-1">
            <CopyBadge className="max-xl:hidden" text={serviceUrl(service)} />
            {service.docs?.apiReference && (
              <a
                aria-label={`${service.name} API docs`}
                className={action}
                href={service.docs.apiReference}
                onClick={(event) => event.stopPropagation()}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Icon name="code" />
              </a>
            )}
            <a
              aria-label={`Open ${service.name}`}
              className={action}
              href={providerUrl(service)}
              onClick={(event) => event.stopPropagation()}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Icon name="arrow-linkout" />
            </a>
            <button
              aria-expanded={open}
              aria-label={`Show ${service.name} endpoints`}
              className={action}
              onClick={() => setOpen((value) => !value)}
              type="button"
            >
              <Icon
                className={cx(
                  "transition-transform duration-200",
                  open && "rotate-180",
                )}
                name="chevron-down"
              />
            </button>
          </div>
        </div>
        <p className="mt-4 font-sans text-sm leading-[1.3] text-secondary xl:hidden">
          {service.description}
        </p>
        <CopyBadge className="mt-4 md:hidden" text={serviceUrl(service)} />
      </div>

      <div
        className={cx(
          "grid transition-[grid-template-rows] duration-300 motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="px-4 pb-2">
            <div className="flex items-center gap-4 border-t border-border py-3 font-mono text-sm uppercase leading-4 tracking-[-0.14px] text-secondary">
              <span className="flex-1">Endpoint</span>
              <span className="hidden flex-1 xl:block">Description</span>
              <span className="w-[94px] shrink-0 text-right">Price</span>
            </div>
            {service.endpoints.map((endpoint) => (
              <div
                className="border-t border-border py-4"
                key={`${endpoint.method}-${endpoint.path}`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span
                      className={cx(
                        "inline-flex shrink-0 items-center justify-center px-3 py-1.5 font-mono text-sm uppercase leading-4 tracking-[-0.14px]",
                        endpoint.method === "GET"
                          ? "bg-[rgba(152,243,170,0.1)] text-term-green"
                          : "bg-[rgba(158,148,255,0.1)] text-term-purple",
                      )}
                    >
                      {endpoint.method}
                    </span>
                    <CopyBadge
                      className="max-md:hidden"
                      text={endpointUrl(service, endpoint)}
                    />
                    <span className="min-w-0 truncate font-mono text-sm uppercase leading-4 text-empty">
                      {endpoint.path}
                    </span>
                  </div>
                  <p className="hidden min-w-0 flex-1 font-sans text-sm leading-[1.3] text-secondary xl:block">
                    {endpoint.description}
                  </p>
                  <span className="w-[94px] shrink-0 text-right font-mono text-sm uppercase leading-4 tracking-[-0.14px] text-secondary">
                    {formatPrice(endpoint)}
                  </span>
                </div>
                <div className="mt-3 flex flex-col items-start gap-3 xl:hidden">
                  <p className="font-sans text-sm leading-[1.3] text-secondary">
                    {endpoint.description}
                  </p>
                  <CopyBadge
                    className="md:hidden"
                    text={endpointUrl(service, endpoint)}
                  />
                </div>
              </div>
            ))}
            {service.endpoints.length === 0 && (
              <p className="border-t border-border py-4 font-sans text-sm text-secondary">
                Endpoint details are available from the provider.
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function ShortcutCard({
  href,
  subtext,
  title,
}: {
  href: string;
  subtext: string;
  title: string;
}) {
  return (
    <a
      className="group flex w-full items-start gap-5 border border-border bg-[#191919] p-4 text-offwhite backdrop-blur-[10px] transition-colors hover:border-[rgba(235,235,235,0.4)]"
      href={href}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2 pr-6">
        <p className="font-mono text-sm uppercase leading-4 tracking-[-0.14px] !text-offwhite">
          {title}
        </p>
        <p className="font-sans text-sm leading-[1.2] text-secondary transition-colors group-hover:text-offwhite">
          {subtext}
        </p>
      </div>
      <Icon
        className="mt-0.5 shrink-0 text-offwhite transition-transform duration-200 group-hover:translate-x-0.5"
        name="arrow-right"
      />
    </a>
  );
}

function ServiceDetailModal({
  close,
  service,
}: {
  close: () => void;
  service: Service | null;
}) {
  const [openEndpoints, setOpenEndpoints] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!service) return;
    setOpenEndpoints(new Set(service.endpoints.map((_, index) => index)));
  }, [service]);

  useEffect(() => {
    if (!service) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.documentElement.classList.add("overflow-hidden");
    document.addEventListener("keydown", key);
    return () => {
      document.documentElement.classList.remove("overflow-hidden");
      document.removeEventListener("keydown", key);
    };
  }, [close, service]);
  if (!service) return null;

  const firstEndpoint = service.endpoints[0];
  const runUrl = firstEndpoint
    ? endpointUrl(service, firstEndpoint)
    : serviceUrl(service);
  const tryCommands = firstEndpoint
    ? buildTryCommands(service, firstEndpoint)
    : "";
  const actionLink =
    "inline-flex items-center gap-2 border border-border bg-[#101010] px-3 py-1.5 font-mono text-sm uppercase leading-4 tracking-[-0.14px] text-offwhite transition-colors hover:border-[rgba(235,235,235,0.4)]";

  return (
    <div
      aria-label="Service details"
      aria-modal="true"
      className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-4 md:p-6"
      role="dialog"
    >
      <button
        aria-label="Close service details"
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={close}
        type="button"
      />
      <div className="relative z-10 my-auto flex w-full max-w-[740px] flex-col gap-6 border border-border bg-[#101010] p-6">
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between">
            <img
              alt=""
              className="size-12 shrink-0 object-contain"
              src={serviceIconUrl(service)}
            />
            <button
              aria-label="Close"
              className="text-secondary transition-colors hover:text-offwhite"
              onClick={close}
              type="button"
            >
              <Icon name="close" size={24} />
            </button>
          </div>
          <div className="flex flex-col gap-5 md:pr-[120px]">
            <div className="flex flex-wrap items-center gap-4">
              <h2 className="font-sans !text-[28px] font-normal !leading-[1.1] !tracking-[-0.56px] text-offwhite">
                {service.name}
              </h2>
              <span className="inline-flex items-center border border-border bg-[#101010] px-3 py-1.5 font-mono text-sm uppercase leading-4 tracking-[-0.14px] text-secondary">
                {categoryLabel(service)}
              </span>
            </div>
            <p className="font-sans text-sm leading-[1.3] text-secondary">
              {service.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {service.docs?.llmsTxt && (
                <a
                  className={actionLink}
                  href={service.docs.llmsTxt}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Icon name="plus" /> Add to agents
                </a>
              )}
              {service.docs?.apiReference && (
                <a
                  className={actionLink}
                  href={service.docs.apiReference}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Icon name="code" /> API
                </a>
              )}
              {service.docs?.homepage && (
                <a
                  className={actionLink}
                  href={service.docs.homepage}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Icon name="arrow-linkout" /> Docs
                </a>
              )}
              <a
                className={actionLink}
                href={service.provider?.url ?? service.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Icon name="globe" /> Website
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-border" />
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-sans !text-xl font-normal !leading-[1.1] text-offwhite">
              Endpoints
            </h3>
            <CopyBadge
              label="Copy as JSON"
              text={JSON.stringify(service.endpoints, null, 2)}
            />
          </div>
          <div className="border border-border">
            {service.endpoints.map((endpoint, index) => {
              const open = openEndpoints.has(index);
              return (
                <div
                  className="border-b border-border bg-[#191919] last:border-b-0"
                  key={`${endpoint.method}-${endpoint.path}`}
                >
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span
                        className={cx(
                          "inline-flex shrink-0 items-center justify-center px-3 py-1.5 font-mono text-sm uppercase leading-4 tracking-[-0.14px]",
                          endpoint.method === "GET"
                            ? "bg-[rgba(152,243,170,0.1)] text-term-green"
                            : "bg-[rgba(158,148,255,0.1)] text-term-purple",
                        )}
                      >
                        {endpoint.method}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-mono text-sm text-secondary">
                        {endpoint.path}
                      </span>
                    </div>
                    <span className="shrink-0 font-mono text-sm uppercase text-secondary">
                      {formatPrice(endpoint)}
                    </span>
                    <button
                      aria-expanded={open}
                      aria-label={`Toggle ${endpoint.method} ${endpoint.path} details`}
                      className="shrink-0 text-secondary transition-colors hover:text-offwhite"
                      onClick={() =>
                        setOpenEndpoints((current) => {
                          const next = new Set(current);
                          if (next.has(index)) next.delete(index);
                          else next.add(index);
                          return next;
                        })
                      }
                      type="button"
                    >
                      <Icon name={open ? "minus" : "plus"} />
                    </button>
                  </div>
                  <div
                    className={cx(
                      "grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none",
                      open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                  >
                    <div className="min-h-0 overflow-hidden">
                      {endpoint.description && (
                        <p className="px-5 pb-4 font-sans text-sm leading-[1.3] text-secondary">
                          {endpoint.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {service.endpoints.length === 0 && (
              <p className="bg-[#191919] px-5 py-4 font-sans text-sm text-secondary">
                Endpoint details are available from the provider.
              </p>
            )}
          </div>
        </div>
        {firstEndpoint && (
          <>
            <div className="border-t border-border" />
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-sans !text-xl font-normal !leading-[1.1] text-offwhite">
                  Try out
                </h3>
                <span className="inline-flex min-w-0 items-center border border-border bg-[#101010] px-3 py-1.5 font-mono text-sm uppercase leading-4 tracking-[-0.14px] text-secondary">
                  <span className="truncate">{firstEndpoint.path}</span>
                </span>
                <CopyBadge
                  className="ml-auto"
                  label="Copy commands"
                  text={tryCommands}
                />
              </div>
              {firstEndpoint.description && (
                <p className="font-sans text-sm leading-[1.3] text-secondary">
                  {firstEndpoint.description}
                </p>
              )}
              <div className="border border-border bg-[#191919] p-4">
                <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm leading-[1.64] text-secondary">
                  <span className="text-white/50">$ </span>
                  <span className="text-term-green">curl</span>
                  {" -L https://tempo.xyz/install | bash"}
                  <span className="text-white/40"> # Get Tempo CLI</span>
                  {"\n"}
                  <span className="text-white/50">$ </span>
                  <span className="text-term-green">tempo</span>
                  {" add wallet"}
                  <span className="text-white/40"> # Add wallet tools</span>
                  {"\n"}
                  <span className="text-white/50">$ </span>
                  <span className="text-term-green">tempo</span>
                  {" wallet login"}
                  <span className="text-white/40"> # Sign in via browser</span>
                  {"\n"}
                  <span className="text-white/50">$ </span>
                  <span className="text-term-green">tempo</span>
                  {" run \\\n    "}
                  <span className="text-term-purple">{runUrl}</span>
                  {firstEndpoint.method !== "GET" && (
                    <>
                      {" \\\n    "}
                      <span className="text-offwhite">
                        {`-X ${firstEndpoint.method} --json`}
                      </span>{" "}
                      <span className="text-term-green">
                        {'\'{"input":"Hello!"}\''}
                      </span>
                    </>
                  )}
                </pre>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const shortcuts = [
  {
    href: "/services/llms.txt",
    subtext: "Service discovery for agents.",
    title: "LLMS.TXT",
  },
  {
    href: "/overview",
    subtext: "Guides, quickstarts, and SDKs.",
    title: "Documentation",
  },
  {
    href: "/advanced/discovery",
    subtext: "Let agents automatically find your API.",
    title: "Discovery",
  },
  {
    href: "/quickstart/server",
    subtext: "Services which directly integrate with MPP.",
    title: "First-party services",
  },
];

const topShortcuts = [
  {
    href: "/quickstart/agent",
    subtext: "CLI wallet for agents.",
    title: "Use with agents",
  },
  ...shortcuts.filter((shortcut) => shortcut.title !== "Discovery"),
];

export function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [page, setPage] = useState(0);
  const [view, setView] = useState<"cards" | "list">("list");
  const [selected, setSelected] = useState<Service | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchServices()
      .then((data) => {
        const pinned = new Map(
          PINNED_IDS.map((id, index) => [id, index] as const),
        );
        setServices(
          data.toSorted(
            (a, b) =>
              (pinned.get(a.id) ?? PINNED_IDS.length) -
              (pinned.get(b.id) ?? PINNED_IDS.length),
          ),
        );
      })
      .catch(() => {});
  }, []);
  const categories = useMemo(
    () =>
      Array.from(new Set(services.flatMap(allCategories))).sort((a, b) =>
        CATEGORY_LABELS[a].localeCompare(CATEGORY_LABELS[b]),
      ),
    [services],
  );
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return services.filter(
      (service) =>
        (!normalized || searchable(service).includes(normalized)) &&
        (!category || service.categories?.includes(category)),
    );
  }, [category, query, services]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages - 1);
  const visible = filtered.slice(
    safePage * PAGE_SIZE,
    (safePage + 1) * PAGE_SIZE,
  );
  const start = filtered.length ? safePage * PAGE_SIZE + 1 : 0;
  const end = Math.min((safePage + 1) * PAGE_SIZE, filtered.length);
  const go = (next: number) => {
    setPage(next);
    requestAnimationFrame(() =>
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  return (
    <div className="marketing-route not-prose bg-[#101010] text-offwhite">
      <Header active="services" />
      <main className="mx-auto w-full max-w-[1728px]">
        <section className="flex h-[300px] flex-col items-start justify-end gap-6 px-4 py-12 md:px-12">
          <LineLogo
            className="h-auto w-[619px] max-w-full"
            label="Services"
            name="services"
          />
          <p className="font-mono text-sm uppercase leading-4 tracking-[-0.14px] text-offwhite">
            Use MPP-enabled services with your agent.
          </p>
        </section>

        <section className="flex flex-col gap-14 px-4 pb-20 md:px-12 xl:flex-row xl:gap-4">
          <div
            className="flex min-w-0 scroll-mt-24 flex-col gap-8 xl:flex-1 xl:gap-14"
            ref={topRef}
          >
            <div className="flex flex-wrap items-center gap-4">
              <label className="order-1 flex h-10 min-w-[220px] flex-1 items-center gap-2.5 border border-border bg-[#191919] px-4 md:min-w-[240px]">
                <Icon className="shrink-0 text-secondary" name="search" />
                <input
                  className="w-full bg-transparent font-mono text-sm uppercase tracking-[-0.14px] text-offwhite placeholder:text-secondary focus:outline-none [&::-webkit-search-cancel-button]:hidden"
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(0);
                  }}
                  placeholder="SEARCH SERVICES"
                  type="search"
                  value={query}
                />
              </label>
              <div className="order-2 flex shrink-0 gap-2 max-[353px]:hidden md:order-3">
                {(["list", "cards"] as const).map((mode) => (
                  <button
                    aria-label={`${mode} view`}
                    aria-pressed={view === mode}
                    className={cx(
                      "flex size-10 items-center justify-center text-secondary",
                      view === mode && "text-offwhite",
                    )}
                    key={mode}
                    onClick={() => setView(mode)}
                    type="button"
                  >
                    <Icon name={mode === "list" ? "list-view" : "grid-view"} />
                  </button>
                ))}
              </div>
              <Dropdown
                className="order-3 hidden md:order-2 md:block"
                items={[
                  {
                    label: "All",
                    onSelect: () => {
                      setCategory("");
                      setPage(0);
                    },
                    selected: !category,
                  },
                  ...categories.map((value) => ({
                    label: CATEGORY_LABELS[value],
                    onSelect: () => {
                      setCategory(value);
                      setPage(0);
                    },
                    selected: category === value,
                  })),
                ]}
                label={category ? CATEGORY_LABELS[category] : "Showing all"}
              />
              <div className="order-4 hidden md:block">
                <Button href="/overview" variant="primary">
                  Learn more
                </Button>
              </div>
            </div>

            {view === "list" ? (
              <div className="flex flex-col">
                <div className="hidden items-end gap-4 border-b border-border px-4 pb-4 font-mono text-sm uppercase leading-4 tracking-[-0.14px] text-secondary xl:flex">
                  <div className="w-[200px] shrink-0">Provider</div>
                  <div className="flex-1">Description</div>
                  <div className="flex-1 text-right">Service URL</div>
                </div>
                {visible.map((service) => (
                  <ServiceTableRow key={service.id} service={service} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((service) => (
                  // biome-ignore lint/a11y/useSemanticElements: the card contains its own copy button, so the wrapper cannot be a button
                  <div
                    className="text-left"
                    key={service.id}
                    onClick={() => setSelected(service)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        setSelected(service);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <ServiceCard service={service} />
                  </div>
                ))}
              </div>
            )}

            {!visible.length && (
              <p className="px-4 py-10 text-center font-mono text-sm uppercase text-secondary">
                No services match your search.
              </p>
            )}
            <div className="flex items-center justify-between">
              <p className="font-mono text-sm uppercase text-secondary">
                {start}–{end} of {filtered.length}
              </p>
              <div className="flex gap-2">
                <Button
                  disabled={safePage === 0}
                  onClick={() => go(Math.max(0, safePage - 1))}
                >
                  Prev
                </Button>
                <Button
                  disabled={safePage >= pages - 1}
                  onClick={() => go(Math.min(pages - 1, safePage + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>

          <aside className="order-first flex w-full flex-col gap-4 self-start xl:order-none xl:w-[356px] xl:shrink-0">
            <div className="marketing-services-shortcuts-grid grid gap-4 xl:hidden">
              {topShortcuts.map((shortcut) => (
                <ShortcutCard key={shortcut.title} {...shortcut} />
              ))}
            </div>

            <details
              className="group hidden flex-col gap-5 border border-border bg-[#191919] p-4 backdrop-blur-[10px] xl:flex"
              open
            >
              <summary className="flex cursor-pointer list-none items-start gap-4 marker:hidden [&::-webkit-details-marker]:hidden">
                <div className="flex flex-1 flex-col gap-2 pr-6">
                  <p className="font-mono text-sm uppercase leading-4 tracking-[-0.14px] text-offwhite">
                    Use with agents
                  </p>
                  <p className="font-sans text-sm leading-[1.2] text-secondary">
                    Install the Tempo CLI and its wallet to fund your
                    agent&apos;s use of MPP services.
                  </p>
                </div>
                <Icon
                  className="mt-0.5 shrink-0 text-offwhite transition-transform duration-200 group-open:rotate-180"
                  name="chevron-down"
                />
              </summary>

              <div className="hidden space-y-5 group-open:block">
                <AgentSetupPrompt
                  manualSetupHref="/quickstart/agent#manual-setup"
                  variant="marketing"
                />

                <p className="font-sans text-sm leading-[1.2] text-secondary">
                  Point your agent to{" "}
                  <a
                    className="underline transition-colors hover:text-offwhite"
                    href="/services/llms.txt"
                  >
                    llms.txt
                  </a>{" "}
                  for full service documentation.
                </p>
              </div>
            </details>

            <div className="hidden flex-col gap-4 xl:flex">
              {shortcuts.map((shortcut) => (
                <ShortcutCard key={shortcut.title} {...shortcut} />
              ))}
            </div>
          </aside>
        </section>
      </main>
      <ServiceDetailModal close={() => setSelected(null)} service={selected} />
    </div>
  );
}

Object.assign(ServicesPage, {
  toMarkdown: () => ({
    children: [
      { type: "text", value: "Browse payment-enabled services in " },
      {
        children: [{ type: "text", value: "the services llms.txt catalog" }],
        type: "link",
        url: "/services/llms.txt",
      },
      { type: "text", value: "." },
    ],
    type: "paragraph",
  }),
});
