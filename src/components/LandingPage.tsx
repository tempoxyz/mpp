"use client";

import blogPosts from "virtual:blog-posts";
import {
  type ComponentType,
  lazy,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  type FeaturedService,
  fetchFeaturedServices,
  serviceIconUrl,
} from "../data/registry";
import { formatBlogPostDate } from "../lib/blog";
import { AnalyticsEvents, captureEvent } from "../lib/posthog";
import { Terminal } from "./Terminal";

type LinkProps = {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  to: string;
};

const Link = lazy(async () => {
  const { Link } = await import("vocs");
  return { default: Link };
}) as ComponentType<LinkProps>;

const FEATURED_SERVICE_IDS = ["anthropic", "openai", "parallel", "fal"];

const INTEGRATIONS = [
  {
    href: "https://www.alchemy.com",
    name: "Alchemy",
    slug: "alchemy",
  },
  {
    href: "https://www.amazon.com",
    name: "Amazon",
    slug: "amazon",
  },
  {
    href: "https://www.browserbase.com",
    name: "Browserbase",
    slug: "browserbase",
  },
  {
    href: "https://www.cloudflare.com",
    name: "Cloudflare",
    slug: "4",
  },
  {
    href: "https://dune.com",
    name: "Dune",
    slug: "5",
  },
  {
    href: "https://parallel.ai",
    name: "Parallel",
    slug: "6",
  },
  {
    href: "https://www.visa.com",
    name: "Visa",
    slug: "visa",
  },
];

const PAYMENT_METHOD_SNIPPETS = [
  {
    code: `const mppx = Mppx.create({ methods: [tempo.charge()] })

app.get(
  '/premium',
  mppx.charge({ amount: '1' }),
  (c) => c.text('Paid'),
)`,
    imports: `import { Mppx, tempo } from 'mppx/hono'`,
    method: "Tempo",
  },
  {
    code: `const payments = await stripe.create({ client: stripeClient })

const mppx = Mppx.create({
  methods: [payments.spt.charge()],
})

app.get(
  '/premium',
  mppx.charge({ amount: '1' }),
  (c) => c.text('Paid'),
)`,
    imports: `import { Mppx, stripe } from 'mppx/hono'`,
    method: "Stripe",
  },
  {
    code: `const mppx = Mppx.create({
  methods: [spark.charge({ mnemonic: process.env.MNEMONIC! })],
})

app.get(
  '/premium',
  mppx.charge({ amount: '1' }),
  (c) => c.text('Paid'),
)`,
    imports: `import { Mppx } from 'mppx/hono'
import { spark } from '@buildonspark/lightning-mpp-sdk/server'`,
    method: "Bitcoin",
  },
];

function createTypescriptHighlighter() {
  return Promise.all([
    import("shiki/core"),
    import("shiki/engine/javascript"),
    import("shiki/dist/langs/typescript.mjs"),
    import("shiki/dist/themes/github-dark-default.mjs"),
  ]).then(async ([core, engine, language, theme]) =>
    core.createHighlighterCore({
      engine: engine.createJavaScriptRegexEngine(),
      langs: [language.default],
      themes: [theme.default],
    }),
  );
}

let typescriptHighlighter:
  | ReturnType<typeof createTypescriptHighlighter>
  | undefined;

function loadTypescriptHighlighter() {
  typescriptHighlighter ??= createTypescriptHighlighter();
  return typescriptHighlighter;
}

const TERMINAL_STEPS = [
  Terminal.commands(["./mpp.sh"]),
  Terminal.wizard([
    Terminal.chat(),
    Terminal.image(),
    Terminal.search(),
    Terminal.article(),
  ]),
];

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}

function MobileTerminalArt() {
  const ref = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const isMobile = useMediaQuery("(max-width: 999px)");

  useEffect(() => {
    if (!isMobile || shouldLoad) return;
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShouldLoad(true);
        observer.disconnect();
      },
      { rootMargin: "200px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [isMobile, shouldLoad]);

  return (
    <div className="marketing-mobile-terminal-art" ref={ref}>
      {shouldLoad && (
        <video autoPlay loop muted playsInline preload="metadata">
          <source src="/marketing/mobile-terminal.mp4" type="video/mp4" />
        </video>
      )}
    </div>
  );
}

export function LandingPage() {
  const [featuredServices, setFeaturedServices] = useState<FeaturedService[]>(
    [],
  );
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFeaturedServices(FEATURED_SERVICE_IDS)
      .then(setFeaturedServices)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const logoLink = document.querySelector(
      "[data-v-logo] a",
    ) as HTMLAnchorElement | null;
    if (!logoLink) return;
    const onClick = (event: MouseEvent) => {
      event.preventDefault();
      window.scrollTo({ behavior: "smooth", top: 0 });
    };
    logoLink.addEventListener("click", onClick);
    return () => logoLink.removeEventListener("click", onClick);
  }, []);

  const scrollServices = (direction: -1 | 1) => {
    const card = carouselRef.current?.querySelector<HTMLElement>(
      ".marketing-service-card",
    );
    carouselRef.current?.scrollBy({
      behavior: "smooth",
      left: direction * ((card?.offsetWidth ?? 360) + 16),
    });
  };

  return (
    <div className="not-prose landing-page">
      <LandingStyles />

      <section className="marketing-hero">
        <video
          autoPlay
          className="marketing-hero-art"
          loop
          muted
          playsInline
          poster="/marketing/mpp-hero-poster.jpg"
          preload="metadata"
        >
          <source src="/marketing/mpp-hero.mp4" type="video/mp4" />
        </video>
        <div className="marketing-hero-content">
          <div className="marketing-hero-copy">
            <h1>The open protocol for machine-to-machine payments.</h1>
            <h2>
              Charge for API requests, tool calls, or content—agents and apps
              pay in the same HTTP request.
            </h2>
          </div>
          <div className="marketing-actions">
            <Link
              className="marketing-button marketing-button-primary"
              to="/quickstart/agent"
              onClick={() =>
                captureEvent(AnalyticsEvents.LANDING_CTA_CLICKED, {
                  cta_label: "Use with your agent",
                  href: "/quickstart/agent",
                })
              }
            >
              <span>Use with your agent</span>
            </Link>
            <Link
              className="marketing-button"
              to="/quickstart/server"
              onClick={() =>
                captureEvent(AnalyticsEvents.LANDING_CTA_CLICKED, {
                  cta_label: "Add payments to your API",
                  href: "/quickstart/server",
                })
              }
            >
              <span>Add payments to your API</span>
            </Link>
          </div>
        </div>
        <DesignedBy />
      </section>

      <section className="marketing-terminal-section">
        <SectionLabel>Terminal</SectionLabel>
        <div className="marketing-terminal-shell">
          <Terminal marketing steps={TERMINAL_STEPS} showLastVisit={false} />
        </div>
        <MobileTerminalArt />
      </section>

      <section className="marketing-integrations">
        <SectionLabel>Integrations</SectionLabel>
        <div className="marketing-integration-grid">
          {INTEGRATIONS.map(({ href, name, slug }) => (
            <a
              className="marketing-integration-logo"
              href={href}
              key={name}
              rel="noreferrer"
              target="_blank"
            >
              <img alt={name} src={`/marketing/logo-${slug}.svg`} />
            </a>
          ))}
        </div>
      </section>

      <IntegrationCodeCarousel />

      <section className="marketing-services">
        <div className="marketing-section-heading">
          <div>
            <SectionLabel>Services</SectionLabel>
            <h2>
              Use MPP-enabled services
              <br />
              with your agent.
            </h2>
            <Link className="marketing-button" to="/services">
              <span>See all services</span>
            </Link>
          </div>
        </div>
        <div className="marketing-carousel-controls-row">
          <div className="marketing-carousel-controls">
            <button
              aria-label="Previous services"
              onClick={() => scrollServices(-1)}
              type="button"
            >
              ←
            </button>
            <button
              aria-label="Next services"
              onClick={() => scrollServices(1)}
              type="button"
            >
              →
            </button>
          </div>
        </div>
        <div className="marketing-service-carousel" ref={carouselRef}>
          {featuredServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>

      <section className="marketing-blog">
        <div className="marketing-blog-intro">
          <SectionLabel>Blog</SectionLabel>
          <h2>
            See updates from the MPP team on protocol development, integrations,
            and more.
          </h2>
        </div>
        <div className="marketing-blog-list">
          {blogPosts.slice(0, 5).map((post) => (
            <Link className="marketing-blog-row" key={post.to} to={post.to}>
              <div className="marketing-blog-row-title">
                <h3>{post.title}</h3>
                <p>{formatBlogPostDate(post.date)}</p>
              </div>
              <p className="marketing-blog-row-description">
                {post.description}
              </p>
              <span aria-hidden="true" className="marketing-blog-row-arrow">
                <svg
                  aria-hidden="true"
                  fill="none"
                  height="16"
                  stroke="currentColor"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  strokeWidth="1.25"
                  viewBox="0 0 16 16"
                  width="16"
                >
                  <line x1="4.5" x2="11.5" y1="11.5" y2="4.5" />
                  <polyline points="5.5 4.5 11.5 4.5 11.5 10.5" />
                </svg>
              </span>
            </Link>
          ))}
          <Link className="marketing-button" to="/blog">
            <span>See all blog posts</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

Object.assign(LandingPage, {
  toMarkdown: () => ({
    children: [
      {
        type: "text",
        value:
          "MPP is the open standard for machine-to-machine payments over HTTP 402. ",
      },
      {
        children: [{ type: "text", value: "Read the quickstart" }],
        type: "link",
        url: "/quickstart",
      },
    ],
    type: "paragraph",
  }),
});

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="marketing-section-label">{children}</p>;
}

function IntegrationCodeCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [highlightedCode, setHighlightedCode] = useState("");
  const [shouldHighlight, setShouldHighlight] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useMediaQuery(
    "(prefers-reduced-motion: reduce)",
  );

  useEffect(() => {
    if (shouldHighlight) return;
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShouldHighlight(true);
        observer.disconnect();
      },
      { rootMargin: "300px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [shouldHighlight]);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const interval = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % PAYMENT_METHOD_SNIPPETS.length);
    }, 4200);
    return () => window.clearInterval(interval);
  }, [prefersReducedMotion]);

  const activeSnippet = PAYMENT_METHOD_SNIPPETS[activeIndex];
  const source = `${activeSnippet.imports}

${activeSnippet.code}`;

  useEffect(() => {
    if (!shouldHighlight) return;

    let cancelled = false;
    setHighlightedCode("");

    loadTypescriptHighlighter()
      .then((highlighter) =>
        highlighter.codeToHtml(source, {
          lang: "ts",
          theme: "github-dark-default",
        }),
      )
      .then((html) => {
        if (!cancelled) setHighlightedCode(html);
      });

    return () => {
      cancelled = true;
    };
  }, [shouldHighlight, source]);

  return (
    <section className="marketing-single-line" ref={sectionRef}>
      <div className="marketing-single-line-intro">
        <SectionLabel>Integrate</SectionLabel>
        <h2>Sell to agents with just a single line of code</h2>
        <p className="marketing-single-line-copy">
          Accept fiat and stablecoin payments in any currency, including
          transactions under $0.01.
        </p>
      </div>
      <div className="marketing-code-carousel">
        <div className="marketing-code-carousel-header">
          <span>{activeSnippet.method}</span>
        </div>
        <div className="marketing-code-carousel-content">
          <div className="marketing-code-snippet" key={activeSnippet.method}>
            {highlightedCode ? (
              <div
                className="marketing-code-shiki"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: renders static MPPX snippets highlighted by Shiki
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
              />
            ) : (
              <pre className="marketing-code-fallback">
                <code>{source}</code>
              </pre>
            )}
          </div>
        </div>
        <fieldset
          aria-label="Choose a payment method example"
          className="marketing-code-carousel-dots"
        >
          {PAYMENT_METHOD_SNIPPETS.map((snippet, index) => (
            <button
              aria-label={`Show ${snippet.method} example`}
              aria-pressed={index === activeIndex}
              className={index === activeIndex ? "is-active" : undefined}
              key={snippet.method}
              onClick={() => setActiveIndex(index)}
              type="button"
            />
          ))}
        </fieldset>
      </div>
    </section>
  );
}

function DesignedBy() {
  return (
    <div className="marketing-designed-by">
      <span>Designed by</span>
      <a href="https://tempo.xyz" rel="noreferrer" target="_blank">
        <img alt="Tempo" src="/marketing/tempo-logo.svg" />
      </a>
      <span>×</span>
      <a href="https://stripe.com" rel="noreferrer" target="_blank">
        <img alt="Stripe" src="/marketing/stripe-logo.svg" />
      </a>
    </div>
  );
}

function ServiceCard({ service }: { service: FeaturedService }) {
  const category = service.categories?.[0] ?? "Service";
  const [copied, setCopied] = useState(false);
  const url = new URL(service.serviceUrl ?? service.url).host.replace(
    /^www\./,
    "",
  );

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(service.serviceUrl ?? service.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <article className="marketing-service-card">
      <div className="marketing-service-card-header">
        <img
          alt=""
          decoding="async"
          loading="lazy"
          src={serviceIconUrl(service)}
        />
        <div>
          <h3>{service.name}</h3>
          <span>{category}</span>
        </div>
      </div>
      <p>{service.description ?? "MPP-enabled service for your agents."}</p>
      <button
        aria-label={copied ? "Copied to clipboard" : `Copy ${url}`}
        className={`marketing-service-card-url${copied ? " marketing-service-card-url-copied" : ""}`}
        onClick={copyUrl}
        type="button"
      >
        <span>{copied ? "Copied" : url}</span>
        <span aria-hidden="true">⧉</span>
      </button>
    </article>
  );
}

function LandingStyles() {
  return (
    <style>{`
      :has(.landing-page) [data-v-main] { margin: 0 !important; padding: 0 !important; }
      :has(.landing-page) article[data-v-content] { margin: 0 !important; max-width: none !important; padding: 0 !important; }
      :has(.landing-page) article[data-v-content] > * { margin-top: 0 !important; }
      :has(.landing-page) [data-v-gutter-top] {
        background: rgb(6 6 6 / 88%) !important;
        border-bottom-color: rgb(235 235 235 / 20%) !important;
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
      }
      :has(.landing-page) [data-v-footer] { background: #060606 !important; }

      .landing-page {
        --marketing-bg: #060606;
        --marketing-elevated: #191919;
        --marketing-copy: #ebebeb;
        --marketing-muted: #a6a6a6;
        --marketing-border: rgb(235 235 235 / 20%);
        --marketing-border-hover: rgb(235 235 235 / 40%);
        background: var(--marketing-bg);
        color: var(--marketing-copy);
        overflow: clip;
      }
      .marketing-hero,
      .marketing-terminal-section,
      .marketing-integrations,
      .marketing-services,
      .marketing-blog {
        margin-inline: auto;
        max-width: 1728px;
        padding-inline: clamp(1rem, 4vw, 3rem);
      }
      .marketing-hero {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: calc(100svh - var(--vocs-spacing-topNav, 56px));
        padding-bottom: clamp(2rem, 5vw, 4rem);
        padding-top: clamp(2rem, 8vw, 7.5rem);
        position: relative;
      }
      .marketing-hero-art {
        height: clamp(300px, 48vw, 780px);
        left: 50%;
        object-fit: cover;
        pointer-events: none;
        position: absolute;
        top: clamp(13rem, 28vw, 21.5rem);
        transform: translateX(-50%);
        width: 100vw;
        z-index: 0;
      }
      .marketing-hero-content,
      .marketing-designed-by { position: relative; z-index: 1; }
      .marketing-hero-content { display: flex; flex-direction: column; gap: 2.25rem; max-width: 62rem; }
      .marketing-hero :is(h1, h2),
      .marketing-single-line h2,
      .marketing-services h2,
      .marketing-blog h2 {
        color: var(--marketing-copy) !important;
        font-family: var(--font-sans, sans-serif) !important;
        margin: 0 !important;
      }
      .marketing-hero-copy { display: flex; flex-direction: column; gap: clamp(2rem, 4vw, 3.75rem); }
      .marketing-hero h1 { font-size: clamp(2rem, 3.25vw, 3rem) !important; font-weight: 400 !important; letter-spacing: -0.045em !important; line-height: 1.05 !important; }
      .marketing-hero h2 { font-size: clamp(1.5rem, 2.5vw, 2.25rem) !important; font-weight: 400 !important; letter-spacing: -0.035em !important; line-height: 1.15 !important; }
      .marketing-services h2,
      .marketing-blog h2 { font-size: 2rem !important; font-weight: 400 !important; letter-spacing: -0.01em !important; line-height: 1.1 !important; }
      .marketing-desktop-break { display: none; }
      .marketing-actions { background: var(--marketing-bg); display: flex; flex-wrap: wrap; gap: 0.5rem; margin: -0.75rem -1rem -1rem; padding: 0.75rem 1rem 1rem; position: relative; }
      .marketing-button {
        align-items: center;
        background: transparent;
        border: 1px solid var(--marketing-border);
        color: var(--marketing-copy) !important;
        display: inline-flex;
        font-family: var(--font-mono, monospace);
        font-size: 0.875rem;
        justify-content: center;
        letter-spacing: -0.14px;
        line-height: 1rem;
        padding: 0.75rem 1rem;
        text-decoration: none !important;
        text-transform: uppercase;
        isolation: isolate;
        overflow: hidden;
        position: relative;
        transition: border-color 150ms cubic-bezier(0.4, 0, 0.2, 1), color 300ms cubic-bezier(0.215, 0.61, 0.355, 1);
      }
      .marketing-button::before,
      .marketing-button::after {
        background: #fff;
        content: "";
        height: 50%;
        inset-inline: 0;
        pointer-events: none;
        position: absolute;
        transform: scaleX(0);
        transform-origin: left center;
        z-index: 0;
      }
      .marketing-button > span { position: relative; z-index: 1; }
      .marketing-button::before { top: 0; transition: transform 400ms cubic-bezier(0.215, 0.61, 0.355, 1); }
      .marketing-button::after { bottom: 0; transition: transform 550ms cubic-bezier(0.215, 0.61, 0.355, 1); }
      .marketing-button:is(:hover, :focus-visible) { border-color: var(--marketing-border-hover); color: #101010 !important; }
      .marketing-button:is(:hover, :focus-visible)::before,
      .marketing-button:is(:hover, :focus-visible)::after { transform: scaleX(1); }
      .marketing-button-primary { background: #262626; }
      .marketing-designed-by {
        align-items: center;
        align-self: flex-start;
        background: var(--marketing-bg);
        border: 1px solid var(--marketing-border);
        display: inline-flex;
        gap: 0.7rem;
        margin-top: auto;
        padding: 0.8rem 1rem;
      }
      .marketing-designed-by span { color: var(--marketing-muted); font-family: var(--font-mono, monospace); font-size: 0.875rem; line-height: 1rem; text-transform: uppercase; }
      .marketing-designed-by img { display: block; height: 1rem; width: auto; }
      .marketing-designed-by a:last-child img { height: 1.35rem; }
      .marketing-terminal-section { padding-bottom: clamp(4rem, 8vw, 8rem); padding-top: clamp(3rem, 6vw, 6rem); }
      .marketing-section-label { color: var(--marketing-muted); font-family: var(--font-mono, monospace); font-size: 0.875rem; line-height: 1rem; margin: 0 0 1rem; text-transform: uppercase; }
      .marketing-section-label::before { background: currentColor; content: ""; display: inline-block; height: 0.65rem; margin-right: 0.45rem; width: 0.65rem; }
      .marketing-terminal-shell { background: var(--marketing-elevated); border: 1px solid var(--marketing-border); min-height: 21rem; }
      .marketing-terminal-shell .terminal-theme { border: 0 !important; border-radius: 0 !important; box-shadow: none !important; height: 100%; }
      .marketing-terminal-shell .terminal-theme > div { border-radius: 0 !important; }
      .marketing-terminal-shell:has(.terminal-theme[data-marketing-minimized]) { height: auto !important; min-height: 0; }
      .marketing-terminal-shell .h-6 { height: 1rem; }
      .marketing-mobile-terminal-art { aspect-ratio: 1694 / 940; background: var(--marketing-elevated); border: 1px solid var(--marketing-border); border-top: 0; }
      .marketing-mobile-terminal-art video { display: block; height: auto; width: 100%; }
      .marketing-integrations { padding: 5rem 0; }
      .marketing-integration-grid { display: grid; gap: 1rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .marketing-integration-logo { align-items: center; border: 1px solid var(--marketing-border); display: flex; height: 4.5rem; justify-content: center; padding: 1rem; text-decoration: none !important; transition: background-color 150ms ease, border-color 150ms ease; }
      .marketing-integration-logo:is(:hover, :focus-visible) { background: var(--marketing-elevated); border-color: var(--marketing-border-hover); outline: none; }
      .marketing-integration-logo img { max-height: 1.75rem; max-width: 100%; opacity: 0.9; width: auto; }
      .marketing-single-line { border-top: 1px solid var(--marketing-border); display: grid; gap: 2.5rem; margin-inline: auto; max-width: 1728px; padding: clamp(4rem, 8vw, 7rem) clamp(1rem, 4vw, 3rem); }
      .marketing-single-line h2 { margin: 0 !important; }
      .marketing-single-line-intro { padding: clamp(1rem, 3vw, 2rem); }
      .marketing-single-line-copy { color: var(--marketing-muted); font-size: 1.125rem; line-height: 1.4; margin: 1.5rem 0 0; max-width: 28rem; }
      .marketing-code-carousel { background: #101010; border: 1px solid var(--marketing-border); display: flex; flex-direction: column; height: 28rem; min-width: 0; }
      .marketing-code-carousel-header { align-items: center; border-bottom: 1px solid var(--marketing-border); color: var(--marketing-copy); display: flex; flex: none; font-family: var(--font-mono, monospace); font-size: 0.75rem; justify-content: flex-start; line-height: 1rem; padding: 0.875rem 1rem; text-transform: uppercase; }
      .marketing-code-carousel-content { background: #101010; display: flex; flex: 1; min-height: 0; overflow: auto; padding: clamp(1rem, 3vw, 2rem); }
      .marketing-code-snippet { animation: marketing-code-fade 520ms ease both; background: #101010; flex: 1; min-height: 0; min-width: 0; }
      .marketing-code-shiki { background: #101010; height: 100%; }
      .marketing-code-fallback,
      .marketing-code-shiki .shiki { background: #101010 !important; color: #dedede !important; font-family: var(--font-mono, monospace) !important; font-size: clamp(0.75rem, 1.4vw, 0.9375rem) !important; height: 100%; line-height: 1.5 !important; margin: 0 !important; overflow-x: auto; padding: 0 0 0.25rem !important; white-space: pre; }
      .marketing-code-fallback code,
      .marketing-code-shiki .shiki code { font-family: inherit !important; }
      .marketing-code-carousel-dots { align-items: center; border: 0; border-top: 1px solid var(--marketing-border); display: flex; gap: 0.375rem; margin: 0; min-width: 0; padding: 0.625rem 1rem; }
      .marketing-code-carousel-dots button { appearance: none; background: transparent; border: 0; cursor: pointer; height: 1.5rem; padding: 0; position: relative; transition: width 300ms ease; width: 1.25rem; }
      .marketing-code-carousel-dots button::after { background: var(--marketing-border); content: ""; height: 2px; inset: calc(50% - 1px) 0 auto; position: absolute; transition: background-color 300ms ease; }
      .marketing-code-carousel-dots button.is-active { width: 3rem; }
      .marketing-code-carousel-dots button.is-active::after { background: var(--marketing-copy); }
      .marketing-code-carousel-dots button:focus-visible { outline: 1px solid var(--marketing-copy); outline-offset: 2px; }
      @keyframes marketing-code-fade { from { opacity: 0; transform: translateY(0.5rem); } to { opacity: 1; transform: translateY(0); } }
      .marketing-services,
      .marketing-blog { border-top: 1px solid var(--marketing-border); padding-bottom: clamp(5rem, 10vw, 9rem); padding-top: clamp(1.5rem, 3vw, 2rem); }
      .marketing-section-heading { align-items: flex-end; display: flex; gap: 2rem; justify-content: space-between; }
      .marketing-services h2 { margin-bottom: 2rem !important; }
      .marketing-carousel-controls { display: flex; gap: 0.5rem; }
      .marketing-carousel-controls button { background: transparent; border: 1px solid var(--marketing-border); color: var(--marketing-copy); cursor: pointer; font: inherit; height: 2.75rem; width: 2.75rem; }
      .marketing-carousel-controls button:hover { background: #262626; border-color: var(--marketing-border-hover); }
      .marketing-service-carousel { display: flex; gap: 1rem; margin-top: clamp(3rem, 6vw, 5rem); overflow-x: auto; padding-bottom: 0.5rem; scrollbar-width: none; }
      .marketing-service-carousel::-webkit-scrollbar { display: none; }
      .marketing-service-card { background: #101010; border: 1px solid var(--marketing-border); display: flex; flex: 0 0 min(24.75rem, 84vw); flex-direction: column; gap: 1.5rem; min-height: 18rem; padding: 1rem 2.5rem 1rem 1rem; }
      .marketing-service-card-header { align-items: flex-start; display: flex; gap: 1rem; }
      .marketing-service-card-header img { background: #2a2a2a; flex: 0 0 auto; height: 2.7rem; object-fit: contain; width: 2.7rem; }
      .marketing-service-card-header h3 { color: var(--marketing-copy); font-size: 1.25rem; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1; margin: 0; }
      .marketing-service-card-header span { color: var(--marketing-muted); display: block; font-family: var(--font-mono, monospace); font-size: 0.875rem; line-height: 1rem; margin-top: 0.25rem; text-transform: uppercase; }
      .marketing-service-card > p { color: var(--marketing-muted); font-size: 1.125rem; line-height: 1.2; margin: 0; }
      .marketing-service-card-url { align-items: center; align-self: flex-start; background: var(--marketing-bg); border: 1px solid var(--marketing-border); color: var(--marketing-muted); cursor: pointer; display: inline-flex; font-family: var(--font-mono, monospace); font-size: 0.875rem; gap: 0.5rem; line-height: 1rem; margin-top: auto; max-width: 100%; overflow: hidden; padding: 0.75rem; text-overflow: ellipsis; text-transform: uppercase; white-space: nowrap; }
      .marketing-service-card-url:hover { border-color: var(--marketing-border-hover); color: var(--marketing-copy); }
      .marketing-service-card-url-copied { border-color: #98f3aa; color: #98f3aa; }
      .marketing-blog { display: grid; gap: 3rem; grid-template-columns: minmax(0, 1fr); }
      .marketing-blog h2 { max-width: 28.75rem; }
      .marketing-blog-list { display: flex; flex-direction: column; }
      .marketing-blog-row { align-items: flex-start; border-bottom: 1px solid var(--marketing-border); color: var(--marketing-copy) !important; display: flex; gap: 1rem; padding: 1.25rem 1rem; text-decoration: none !important; transition: color 150ms ease, background-color 150ms ease, border-color 150ms ease; }
      .marketing-blog-row:hover { background: rgb(255 255 255 / 2%); }
      .marketing-blog-row-title { display: flex; flex: 1; flex-direction: column; gap: 0.25rem; min-width: 0; }
      .marketing-blog-row-title h3 { color: var(--marketing-copy); font-size: 1.25rem; font-weight: 400; letter-spacing: normal; line-height: 1.1; margin: 0; }
      .marketing-blog-row-title p { color: rgb(235 235 235 / 60%); font-family: var(--font-mono, monospace); font-size: 0.875rem; letter-spacing: normal; line-height: 1rem; margin: 1px 0 0; text-transform: uppercase; transition: color 150ms ease; }
      .marketing-blog-row-description { display: none; }
      .marketing-blog-row-arrow { align-items: center; background: #101010; border: 1px solid var(--marketing-border); color: rgb(235 235 235 / 60%); display: inline-flex; flex: 0 0 auto; justify-content: center; padding: 0.375rem; transition: color 150ms ease; }
      .marketing-blog-row-arrow svg { display: block; }
      .marketing-blog-row:hover :is(.marketing-blog-row-title p, .marketing-blog-row-description) { color: var(--marketing-copy); }
      .marketing-blog-row:hover .marketing-blog-row-arrow { color: var(--marketing-copy); }
      .marketing-blog-list > .marketing-button { align-self: flex-start; margin-top: 3.5rem; }
      @media (min-width: 768px) {
        .marketing-integration-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        .marketing-blog-row { padding-block: 1.5rem; }
        .marketing-blog-row-title { flex: 0 0 12.5rem; }
        .marketing-blog-row-description { color: rgb(235 235 235 / 60%); display: block; flex: 1; font-size: 1.125rem; letter-spacing: normal; line-height: 1.2; margin: 0; transition: color 150ms ease; }
      }
      @media (min-width: 960px) {
        .marketing-hero-art { top: clamp(18rem, 24vw, 22rem); }
      }
      @media (min-width: 1000px) {
        .marketing-hero,
        .marketing-terminal-section,
        .marketing-integrations,
        .marketing-single-line,
        .marketing-services,
        .marketing-blog { padding-inline: 3rem; }
        .marketing-hero { min-height: 100svh; padding-bottom: 2.5rem; padding-top: 11.875rem; }
        .marketing-hero-art { height: max(12.5rem, calc(100svh - 32.5rem)); top: 32.5rem; }
        .marketing-hero-content { gap: 2.375rem; max-width: 61.125rem; }
        .marketing-hero h1 { font-size: 3rem !important; font-weight: 400 !important; letter-spacing: -0.09rem !important; line-height: 3rem !important; }
        .marketing-hero h2 { font-size: 2.25rem !important; letter-spacing: -0.065rem !important; line-height: 2.5rem !important; }
        .marketing-desktop-break { display: block; }
        .marketing-services { border-top: 0; padding-bottom: 7rem; padding-top: 5rem; }
        .marketing-services .marketing-section-heading { border-top: 1px solid var(--marketing-border); padding-top: 1.5rem; }
        .marketing-services .marketing-section-label { margin-bottom: 1.5rem; }
        .marketing-services h2 { margin-bottom: 1.5rem !important; }
        .marketing-carousel-controls-row { display: flex; justify-content: flex-end; margin-top: 2.5rem; }
        .marketing-service-carousel { margin-top: 0.75rem; }
        .marketing-blog { border-top: 0; padding-bottom: 5rem; padding-top: 6.5rem; position: relative; }
        .marketing-blog::before { border-top: 1px solid var(--marketing-border); content: ""; inset-inline: 3rem; position: absolute; top: 5rem; }
        .marketing-blog .marketing-section-label { margin-bottom: 1.5rem; }
        .marketing-terminal-section {
          bottom: 2.5rem;
          padding: 0;
          position: fixed;
          right: clamp(1.5rem, 4vw, 3rem);
          width: min(28.2rem, calc(100vw - 6rem));
          z-index: 10;
        }
        .marketing-terminal-section .marketing-section-label,
        .marketing-mobile-terminal-art { display: none; }
        .marketing-terminal-shell { height: 17.25rem; min-height: 0; }
        .marketing-integration-grid { grid-template-columns: repeat(7, minmax(0, 1fr)); }
        .marketing-single-line { align-items: start; gap: clamp(4rem, 10vw, 12rem); grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr); }
        .marketing-code-carousel { max-width: 40rem; }
      }
      @media (min-width: 1280px) {
        .marketing-blog { gap: 0; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
      }
      @media (max-width: 999px) {
        .marketing-hero { gap: 2rem; min-height: auto; padding-bottom: 2rem; padding-top: 1.5rem; }
        .marketing-hero-art { height: 18.75rem; left: auto; order: -1; position: relative; top: auto; transform: none; width: 100%; }
        .marketing-hero-content { gap: 1.5rem; }
        .marketing-designed-by { margin-top: 0; }
        .marketing-terminal-section { padding-block: 4rem; }
        .marketing-terminal-shell { height: 23.75rem; min-height: 23.75rem; }
        .marketing-services { border-top: 0; padding-top: 5rem; }
        .marketing-services .marketing-section-heading { border-top: 1px solid var(--marketing-border); padding-top: 1.5rem; }
        .marketing-blog { border-top: 0; padding-bottom: 5rem; padding-top: 6.5rem; position: relative; }
        .marketing-blog::before { border-top: 1px solid var(--marketing-border); content: ""; position: absolute; top: 5rem; }
        .marketing-carousel-controls-row { display: none; }
      }
      @media (min-width: 768px) and (max-width: 999px) {
        .marketing-hero,
        .marketing-terminal-section,
        .marketing-integrations,
        .marketing-single-line,
        .marketing-services,
        .marketing-blog { padding-inline: 3rem; }
        .marketing-blog::before { inset-inline: 3rem; }
      }
      @media (max-width: 767px) {
        .marketing-hero,
        .marketing-terminal-section,
        .marketing-integrations,
        .marketing-single-line,
        .marketing-services,
        .marketing-blog { padding-inline: 1rem; }
        .marketing-designed-by { display: none; }
        .marketing-service-carousel { flex-direction: column; overflow: visible; }
        .marketing-service-card { flex: 0 0 auto; width: 100%; }
        .marketing-blog::before { inset-inline: 1rem; }
      }
      @media (max-width: 639px) {
        .marketing-hero {
          gap: 2rem;
          margin-top: 3.875rem;
          padding-bottom: 2rem;
          padding-top: 1.5rem;
        }
        .marketing-hero-content { gap: 2rem; max-width: 35rem; }
        .marketing-hero h1 {
          font-size: 1.75rem !important;
          letter-spacing: -0.035rem !important;
          line-height: 1.1 !important;
        }
        .marketing-hero h2 { font-size: 1.375rem !important; letter-spacing: -0.025rem !important; line-height: 1.2 !important; }
        .marketing-actions { flex-direction: column; gap: 0.5rem; }
        .marketing-actions .marketing-button { width: 100%; }
        .marketing-designed-by { display: none; }
      }
      @media (prefers-reduced-motion: reduce) {
        .marketing-code-snippet { animation: none; }
        .marketing-code-carousel-dots button,
        .marketing-code-carousel-dots button::after { transition: none; }
      }
    `}</style>
  );
}
