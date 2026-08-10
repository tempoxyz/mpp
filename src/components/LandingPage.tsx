"use client";

import blogPosts from "virtual:blog-posts";
import { useEffect, useState } from "react";
import { type FeaturedService, fetchFeaturedServices } from "../data/registry";
import { BlogRow } from "./marketing/BlogRow";
import { Button } from "./marketing/Button";
import { Header } from "./marketing/Header";
import { SectionLabel } from "./marketing/SectionLabel";
import { ServiceCard } from "./marketing/ServiceCard";
import { Terminal } from "./Terminal";

const FEATURED_SERVICE_IDS = ["anthropic", "openai", "parallel", "fal"];
const integrations = [
  { href: "https://www.amazon.com", name: "Amazon", slug: "amazon" },
  { href: "https://www.alchemy.com", name: "Alchemy", slug: "alchemy" },
  {
    href: "https://www.browserbase.com",
    name: "Browserbase",
    slug: "browserbase",
  },
  { href: "https://www.cloudflare.com", name: "Cloudflare", slug: "4" },
  { href: "https://dune.com", name: "Dune", slug: "5" },
  { href: "https://parallel.ai", name: "Parallel", slug: "6" },
  { href: "https://www.visa.com", name: "Visa", slug: "visa" },
];
const terminalSteps = [
  Terminal.commands(["./mpp.sh"]),
  Terminal.wizard([
    Terminal.chat(),
    Terminal.image(),
    Terminal.search(),
    Terminal.article(),
  ]),
];

function DesignedBy() {
  return (
    <>
      <span className="font-mono text-sm uppercase leading-4 tracking-[-0.14px] text-secondary">
        Designed by
      </span>
      <span className="flex items-center gap-2">
        <a
          aria-label="Tempo"
          href="https://tempo.xyz"
          rel="noreferrer"
          target="_blank"
        >
          <img
            alt="Tempo"
            className="h-3.5 w-auto"
            src="/marketing/tempo-logo.svg"
          />
        </a>
        <span className="font-mono text-sm text-secondary">×</span>
        <a
          aria-label="Stripe"
          href="https://stripe.com"
          rel="noreferrer"
          target="_blank"
        >
          <img
            alt="Stripe"
            className="h-[23px] w-auto"
            src="/marketing/stripe-logo.svg"
          />
        </a>
      </span>
    </>
  );
}

export function LandingPage() {
  const [services, setServices] = useState<FeaturedService[]>([]);

  useEffect(() => {
    document.body.classList.add("marketing-home");
    fetchFeaturedServices(FEATURED_SERVICE_IDS)
      .then(setServices)
      .catch(() => {});
    return () => document.body.classList.remove("marketing-home");
  }, []);

  return (
    <div className="marketing-route not-prose bg-[#060606] text-offwhite [--marketing-page-bg:#060606]">
      <Header />
      <main className="mx-auto w-full max-w-[1728px]">
        <section className="relative flex flex-col gap-8 px-4 pb-8 pt-6 md:px-12 min-[1000px]:min-h-[calc(100svh-70px)] min-[1000px]:justify-between min-[1000px]:gap-0 min-[1000px]:pb-10 min-[1000px]:pt-[120px]">
          <video
            autoPlay
            className="pointer-events-none z-0 h-[300px] w-full object-cover min-[1000px]:absolute min-[1000px]:left-1/2 min-[1000px]:top-[344px] min-[1000px]:h-[calc(100%-344px)] min-[1000px]:w-screen min-[1000px]:max-w-none min-[1000px]:-translate-x-1/2"
            loop
            muted
            playsInline
            poster="/marketing/mpp-hero-poster.jpg"
            preload="metadata"
          >
            <source src="/marketing/mpp-hero.mp4" type="video/mp4" />
          </video>

          <div className="relative z-10 flex max-w-[560px] flex-col gap-8 md:max-w-[978px] md:gap-[38px]">
            <h1 className="font-sans !text-[28px] !font-normal !leading-[1.1] !tracking-[-0.56px] text-offwhite min-[640px]:!text-[32px] min-[640px]:!tracking-[-0.64px] min-[1000px]:!text-[48px] min-[1000px]:!leading-none min-[1000px]:!tracking-[-1.44px]">
              MPP lets agents pay for services on the
              <br className="hidden min-[1000px]:block" /> web, extensible to
              any payment method.
            </h1>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button
                className="w-full sm:w-auto"
                href="/quickstart/agent"
                variant="primary"
              >
                Use with your agent
              </Button>
              <Button className="w-full sm:w-auto" href="/quickstart/server">
                Add payments to your API
              </Button>
            </div>
          </div>

          <div className="relative z-10 hidden md:flex">
            <div className="inline-flex h-12 items-center gap-3 border border-border bg-[#060606] px-4">
              <DesignedBy />
            </div>
          </div>
        </section>

        <div className="relative z-40 w-full px-4 py-16 md:px-12 min-[1000px]:pointer-events-none min-[1000px]:fixed min-[1000px]:bottom-10 min-[1000px]:right-12 min-[1000px]:w-[451px] min-[1000px]:p-0">
          <SectionLabel className="mb-4 min-[1000px]:hidden" label="Terminal" />
          <div className="term-outline pointer-events-none h-[380px] w-full min-[1000px]:h-[276px]">
            <Terminal
              className="rounded-none"
              headerClassName="hidden min-[1000px]:flex"
              marketing
              showLastVisit={false}
              steps={terminalSteps}
            />
          </div>
          <div className="relative -mt-px w-full border border-border bg-[#191919] min-[1000px]:hidden">
            <video
              autoPlay
              className="pointer-events-none block h-auto w-full"
              loop
              muted
              playsInline
              preload="metadata"
            >
              <source src="/marketing/mobile-terminal.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        <section className="flex flex-col gap-4 px-4 py-20 md:px-12">
          <SectionLabel label="Integrations" />
          <div className="marketing-integrations-grid grid gap-4">
            {integrations.map((integration) => (
              <a
                className="flex h-[72px] items-center justify-center border border-border px-4 py-2 transition-colors hover:bg-[#191919]"
                href={integration.href}
                key={integration.name}
                rel="noreferrer"
                target="_blank"
              >
                <img
                  alt={integration.name}
                  className="max-h-7 w-auto max-w-full opacity-90"
                  src={`/marketing/logo-${integration.slug}.svg`}
                />
              </a>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-20 px-4 pb-28 pt-20 md:px-12">
          <div className="flex flex-col gap-6 border-t border-border pt-6">
            <SectionLabel label="Services" />
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
              <div className="flex flex-col items-start gap-6">
                <h2 className="font-sans !text-[32px] font-normal !leading-[1.1] !tracking-[-0.32px] text-offwhite">
                  Use MPP-enabled services
                  <br className="hidden md:inline" /> with your agent.
                </h2>
                <Button href="/services">See all services</Button>
              </div>
            </div>
          </div>
          <div className="no-scrollbar flex flex-col gap-4 md:flex-row md:snap-x md:overflow-x-auto md:pb-2">
            {services.map((service) => (
              <div
                className="w-full shrink-0 md:w-[396px] md:snap-start"
                key={service.id}
              >
                <ServiceCard service={service} />
              </div>
            ))}
          </div>
        </section>

        <section className="px-4 py-20 md:px-12">
          <div className="flex flex-col gap-12 border-t border-border pt-6 xl:flex-row xl:gap-0">
            <div className="flex flex-col gap-6 xl:w-1/2">
              <SectionLabel label="Blog" />
              <h2 className="max-w-[460px] font-sans !text-[32px] font-normal !leading-[1.1] !tracking-[-0.32px] text-offwhite">
                See updates from the MPP team on protocol development,
                integrations, and more.
              </h2>
            </div>
            <div className="flex flex-col gap-14 xl:w-1/2">
              <div className="flex flex-col">
                {blogPosts.slice(0, 5).map((post) => (
                  <BlogRow key={post.to} post={post} />
                ))}
              </div>
              <Button className="self-start" href="/blog">
                See all blog posts
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

Object.assign(LandingPage, {
  toMarkdown: () => ({
    children: [
      {
        type: "text",
        value:
          "MPP lets agents pay for services on the web, extensible to any payment method. ",
      },
      {
        children: [{ type: "text", value: "Read the quickstart" }],
        type: "link",
        url: "/quickstart/agent",
      },
    ],
    type: "paragraph",
  }),
});
