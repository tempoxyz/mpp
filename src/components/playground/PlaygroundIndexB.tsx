"use client";

import { cx } from "../marketing/cx";
import { Header } from "../marketing/Header";
import { PlaygroundLink } from "./PlaygroundLink";
import { playgrounds, statusLabel } from "./playgrounds";

/** Option B: a dense typographic index, in the style of nanocode's experiments. */
export function PlaygroundIndexB() {
  const live = playgrounds.filter((item) => item.status === "live").length;

  return (
    <div className="marketing-route not-prose bg-[#101010] text-offwhite">
      <Header />
      <main className="mx-auto w-full max-w-[1728px] px-4 pb-20 pt-16 md:px-12 md:pt-28">
        <div className="flex max-w-[820px] flex-col gap-5">
          <p className="font-mono text-sm uppercase leading-4 tracking-normal !text-[#757575]">
            {String(live).padStart(2, "0")} live ·{" "}
            {String(playgrounds.length - live).padStart(2, "0")} coming soon
          </p>
          <h1 className="font-mono !text-[28px] font-normal !leading-[1.15] !tracking-[-0.28px] text-offwhite md:!text-[32px]">
            Playground
          </h1>
          <p className="max-w-[640px] font-mono text-sm leading-[1.7] tracking-normal !text-secondary">
            Interactive demos of the Machine Payments Protocol. Each one makes
            real payments on Tempo testnet: charges, sessions, payment links,
            and identity.
          </p>
        </div>

        <div className="mt-14 max-w-[820px] md:mt-20">
          <div
            aria-hidden="true"
            className="hidden grid-cols-[5.5rem_1fr_auto] gap-x-6 pb-3 font-mono text-xs uppercase leading-4 tracking-normal text-[#5c5c5c] md:grid"
          >
            <span>No.</span>
            <span>Playground</span>
            <span>Where · status</span>
          </div>
          <ol className="border-t border-border">
            {playgrounds.map((playground, index) => {
              const isLive = playground.status === "live";
              const number = String(index + 1).padStart(3, "0");
              return (
                <li className="border-b border-border" key={playground.slug}>
                  <PlaygroundLink
                    className={cx(
                      "group relative grid grid-cols-[4rem_1fr] gap-x-3 py-5 no-underline transition-colors md:grid-cols-[5.5rem_1fr_auto] md:gap-x-6",
                      isLive
                        ? "before:absolute before:inset-y-0 before:-left-3 before:w-px before:bg-offwhite before:opacity-0 before:transition-opacity hover:bg-white/[0.025] hover:before:opacity-100 md:before:-left-4"
                        : "cursor-default",
                    )}
                    playground={playground}
                  >
                    <span className="font-mono text-sm leading-5 tracking-normal text-[#757575] transition-colors group-hover:text-offwhite">
                      PG-{number}
                    </span>
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <h2
                        className={cx(
                          "font-mono text-sm font-medium leading-5 tracking-normal",
                          isLive ? "!text-offwhite" : "!text-[#757575]",
                        )}
                      >
                        <span
                          className={cx(
                            "underline decoration-1 underline-offset-[5px] transition-colors",
                            isLive
                              ? "decoration-white/30 group-hover:decoration-offwhite"
                              : "decoration-transparent",
                          )}
                        >
                          {playground.title}
                        </span>
                        {isLive && (
                          <span
                            aria-hidden="true"
                            className="ml-2 inline-block -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                          >
                            {playground.navigation === "document" ? "↗" : "→"}
                          </span>
                        )}
                      </h2>
                      <p className="font-mono text-sm leading-[1.6] tracking-normal !text-secondary transition-colors group-hover:!text-offwhite">
                        {playground.description}
                      </p>
                      <p className="font-mono text-xs uppercase leading-5 tracking-normal !text-[#757575] md:hidden">
                        {playground.location} ·{" "}
                        <span className={isLive ? "text-secondary" : undefined}>
                          {statusLabel[playground.status]}
                        </span>
                      </p>
                    </div>
                    <span className="hidden whitespace-nowrap font-mono text-xs uppercase leading-5 tracking-normal text-[#757575] md:block">
                      {playground.location} ·{" "}
                      <span className={isLive ? "text-secondary" : undefined}>
                        {statusLabel[playground.status]}
                      </span>
                    </span>
                  </PlaygroundLink>
                </li>
              );
            })}
          </ol>
        </div>
      </main>
    </div>
  );
}
