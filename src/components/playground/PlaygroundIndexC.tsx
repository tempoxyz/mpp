"use client";

import { cx } from "../marketing/cx";
import { Header } from "../marketing/Header";
import { Icon } from "../marketing/Icon";
import { LineLogo } from "../marketing/LineLogo";
import { PlaygroundLink } from "./PlaygroundLink";
import { PlaygroundPreview } from "./PlaygroundPreview";
import { type Playground, playgrounds, statusLabel } from "./playgrounds";

/** Option C: a card grid with a visual preview per playground. */
export function PlaygroundIndexC() {
  const [featured, ...rest] = playgrounds;

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
          <div className="flex flex-col gap-4 border-t border-border pt-6 md:flex-row md:items-end md:justify-between md:gap-12">
            <h1 className="font-sans !text-[32px] font-normal !leading-[1.1] !tracking-[-0.32px] text-offwhite">
              Try MPP in your browser
            </h1>
            <p className="max-w-[420px] font-sans text-lg leading-[1.2] tracking-normal !text-white/60 md:text-right">
              Interactive demos that make real payments on Tempo testnet.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:mt-10 md:grid-cols-2 xl:grid-cols-3">
            <Card featured playground={featured} />
            {rest.map((playground) => (
              <Card key={playground.slug} playground={playground} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function Card({
  featured = false,
  playground,
}: {
  featured?: boolean;
  playground: Playground;
}) {
  const live = playground.status === "live";
  return (
    <PlaygroundLink
      className={cx(
        "group flex flex-col border border-border bg-[#101010] text-offwhite no-underline transition-colors duration-200",
        live
          ? "hover:border-[rgba(235,235,235,0.4)] hover:bg-[#141414]"
          : "cursor-default",
        featured && "md:col-span-2 xl:col-span-3 xl:flex-row",
      )}
      playground={playground}
    >
      <PlaygroundPreview
        className={cx(
          featured
            ? "aspect-[4/3] md:aspect-[16/9] xl:aspect-auto xl:min-h-[460px] xl:w-2/3 xl:border-b-0 xl:border-r"
            : "aspect-[16/10]",
          !live && "opacity-60",
        )}
        playground={playground}
      />
      <div
        className={cx(
          "flex flex-1 flex-col gap-3 p-5",
          featured && "md:p-6 xl:justify-between xl:p-8",
        )}
      >
        <div className="flex flex-col gap-3">
          <p className="flex items-center gap-2 font-mono text-sm uppercase leading-4 tracking-normal !text-white/60">
            <span
              aria-hidden="true"
              className={cx(
                "size-[7px] shrink-0",
                live ? "bg-offwhite" : "border border-white/60",
              )}
            />
            {statusLabel[playground.status]}
            <span className="text-white/30">·</span>
            {playground.location}
          </p>
          <h2
            className={cx(
              "font-sans font-normal leading-[1.1] tracking-normal",
              featured
                ? "text-[28px] tracking-[-0.28px] md:text-[40px] md:tracking-[-0.4px]"
                : "text-xl",
              live ? "!text-offwhite" : "!text-white/60",
            )}
          >
            {playground.title}
          </h2>
          <p
            className={cx(
              "font-sans leading-[1.25] tracking-normal !text-white/60 transition-colors group-hover:!text-offwhite",
              featured ? "max-w-[420px] text-lg" : "text-base",
            )}
          >
            {playground.description}
          </p>
        </div>
        <div className="mt-auto flex items-end justify-between gap-4 pt-3">
          <ul className="flex flex-wrap gap-1.5">
            {playground.tags.map((tag) => (
              <li
                className="border border-border px-2 py-1 font-mono text-xs uppercase leading-4 tracking-normal text-secondary"
                key={tag}
              >
                {tag}
              </li>
            ))}
          </ul>
          {live &&
            (featured ? (
              <span className="flex h-10 shrink-0 items-center gap-2 border border-border bg-[#262626] px-4 font-mono text-sm uppercase leading-4 tracking-[-0.14px] text-offwhite transition-colors group-hover:border-[rgba(235,235,235,0.4)]">
                Open
                <Icon name="arrow-linkout" />
              </span>
            ) : (
              <span className="flex shrink-0 items-center justify-center border border-border bg-[#101010] p-1.5 text-secondary transition-colors group-hover:text-offwhite">
                <Icon
                  name={
                    playground.navigation === "document"
                      ? "arrow-linkout"
                      : "arrow-right"
                  }
                />
              </span>
            ))}
        </div>
      </div>
    </PlaygroundLink>
  );
}
