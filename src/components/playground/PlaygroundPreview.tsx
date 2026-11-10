import { cx } from "../marketing/cx";
import type { Playground } from "./playgrounds";

/** The card-grid visual: a screenshot, or a short terminal transcript. */
export function PlaygroundPreview({
  className,
  playground,
}: {
  className?: string;
  playground: Playground;
}) {
  const { preview } = playground;
  return (
    <div
      className={cx(
        "relative overflow-hidden border-b border-border bg-[#060606]",
        className,
      )}
    >
      {preview.kind === "image" ? (
        <img
          alt={preview.alt}
          className="absolute left-0 top-0 h-auto w-[175%] max-w-none origin-top-left transition-transform duration-500 ease-out group-hover:scale-[1.02] md:inset-0 md:size-full md:object-cover md:object-left-top"
          decoding="async"
          loading="lazy"
          src={preview.src}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="font-mono text-xs uppercase leading-4 tracking-normal text-[#757575]">
              {playground.href
                ? `mpp.dev${playground.href.split("#")[0]}`.replace(/\/$/, "")
                : "Terminal"}
            </span>
            <span className="flex gap-1" aria-hidden="true">
              <span className="size-[7px] bg-white/15" />
              <span className="size-[7px] bg-white/15" />
              <span className="size-[7px] bg-white/15" />
            </span>
          </div>
          <div className="flex flex-1 flex-col justify-center gap-1.5 px-5 py-5 font-mono text-[13px] leading-5 tracking-normal">
            {preview.lines.map((line, index) => (
              <span
                className={cx(
                  "truncate whitespace-pre",
                  index === 0 ? "text-offwhite" : "text-secondary",
                )}
                key={line}
              >
                {line}
              </span>
            ))}
            <span
              aria-hidden="true"
              className={cx(
                "mt-0.5 h-4 w-2",
                playground.status === "live"
                  ? "bg-offwhite/70 group-hover:animate-pulse"
                  : "bg-white/20",
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}
