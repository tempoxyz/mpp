"use client";

import { Header } from "../marketing/Header";
import { Icon } from "../marketing/Icon";
import { LineLogo } from "../marketing/LineLogo";
import { type Playground, playgrounds } from "./playgrounds";

/** The /playground index, laid out like the blog index: one row per playground. */
export function PlaygroundIndex() {
  return (
    <div className="marketing-route not-prose bg-[#101010] text-offwhite">
      <Header active="playground" />
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
            <h1 className="font-sans !text-[32px] font-normal !leading-[1.1] !tracking-[-0.32px] text-offwhite xl:w-1/2 xl:pr-12">
              Try MPP in your browser
            </h1>
            <div className="flex flex-col xl:w-1/2">
              {playgrounds.map((playground) => (
                <Row key={playground.slug} playground={playground} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Row({ playground }: { playground: Playground }) {
  return (
    // A plain anchor: each playground is a Worker page, not a client route.
    <a
      className="group flex items-center gap-4 border-b border-border px-4 py-5 text-offwhite no-underline transition-colors hover:bg-white/[0.02] md:py-6"
      href={playground.href}
    >
      <h2 className="font-sans text-xl font-normal leading-[1.1] tracking-normal !text-offwhite md:w-[200px] md:flex-none">
        {playground.title}
      </h2>
      <p className="hidden flex-1 font-sans text-lg leading-[1.2] tracking-normal !text-white/60 transition-colors group-hover:!text-offwhite md:block">
        {playground.description}
      </p>
      <span className="ml-auto flex shrink-0 items-center justify-center border border-border bg-[#101010] p-1.5 text-secondary transition-colors group-hover:text-offwhite">
        <Icon name="arrow-right" />
      </span>
    </a>
  );
}
