"use client";

import { cx } from "../marketing/cx";
import { Header } from "../marketing/Header";
import { Icon } from "../marketing/Icon";
import { LineLogo } from "../marketing/LineLogo";
import { PlaygroundLink } from "./PlaygroundLink";
import { type Playground, playgrounds, statusLabel } from "./playgrounds";

/** Option A: the blog index layout, one row per playground. */
export function PlaygroundIndexA() {
  const live = playgrounds.filter((item) => item.status === "live").length;

  return (
    <div className="marketing-route not-prose bg-[#101010] text-offwhite">
      <Header />
      <main className="mx-auto w-full max-w-[1728px]">
        <section className="flex h-[231px] flex-col items-start justify-end px-4 pb-6 pt-12 md:h-[236px] md:px-12">
          <LineLogo
            className="h-[22px] w-auto max-w-full md:h-auto md:w-[776px]"
            label="Playground"
            name="playground"
          />
        </section>
        <section className="px-4 pb-20 md:px-12">
          <div className="flex flex-col gap-[60px] border-t border-border pt-6 xl:flex-row xl:gap-0">
            <div className="flex flex-col gap-4 xl:w-1/2 xl:pr-12">
              <h1 className="font-sans !text-[32px] font-normal !leading-[1.1] !tracking-[-0.32px] text-offwhite">
                Try MPP in your browser
              </h1>
              <p className="max-w-[440px] font-sans text-lg leading-[1.2] tracking-normal !text-white/60">
                Interactive demos that make real payments on Tempo testnet. No
                setup—each one creates and funds a wallet for you.
              </p>
            </div>
            <div className="flex flex-col gap-14 xl:w-1/2">
              <div className="flex flex-col">
                {playgrounds.map((playground) => (
                  <Row key={playground.slug} playground={playground} />
                ))}
              </div>
              <p className="font-mono text-sm uppercase tracking-normal !text-white/60">
                {live} live · {playgrounds.length - live} coming soon
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Row({ playground }: { playground: Playground }) {
  const live = playground.status === "live";
  return (
    <PlaygroundLink
      className={cx(
        "group flex items-start gap-4 border-b border-border px-4 py-5 text-offwhite no-underline transition-colors md:py-6",
        live ? "hover:bg-white/[0.02]" : "cursor-default",
      )}
      playground={playground}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1 md:w-[200px] md:flex-none">
        <h2
          className={cx(
            "font-sans text-xl font-normal leading-[1.1] tracking-normal",
            live ? "!text-offwhite" : "!text-white/60",
          )}
        >
          {playground.title}
        </h2>
        <p className="mt-px flex items-center gap-2 font-mono text-sm uppercase leading-4 tracking-normal !text-white/60 transition-colors group-hover:!text-offwhite">
          <span
            aria-hidden="true"
            className={cx(
              "size-[7px] shrink-0",
              live ? "bg-offwhite" : "border border-white/60",
            )}
          />
          {statusLabel[playground.status]}
        </p>
        <p className="mt-2 font-sans text-base leading-[1.25] tracking-normal !text-white/60 md:hidden">
          {playground.description}
        </p>
      </div>
      <div className="hidden flex-1 flex-col gap-2 md:flex">
        <p className="font-sans text-lg leading-[1.2] tracking-normal !text-white/60 transition-colors group-hover:!text-offwhite">
          {playground.description}
        </p>
        <p className="font-mono text-xs uppercase leading-4 tracking-normal !text-white/40">
          {playground.location}
        </p>
      </div>
      {live && (
        <span className="flex shrink-0 items-center justify-center border border-border bg-[#101010] p-1.5 text-secondary transition-colors group-hover:text-offwhite">
          <Icon
            name={
              playground.navigation === "document"
                ? "arrow-linkout"
                : "arrow-right"
            }
          />
        </span>
      )}
    </PlaygroundLink>
  );
}
