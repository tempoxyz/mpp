"use client";

import { Link } from "waku";
import { Button } from "./Button";
import { cx } from "./cx";
import { LineLogo } from "./LineLogo";

const socials = [
  { href: "https://x.com/mpp", label: "X" },
  { href: "https://github.com/tempoxyz/mpp", label: "GitHub" },
];
const linkBase =
  "font-mono text-sm uppercase tracking-[-0.14px] leading-4 transition-colors";

export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-[1728px] overflow-clip bg-[var(--marketing-footer-bg,#101010)] px-4 pb-8 pt-20 text-offwhite md:px-12 md:pb-12">
      <div className="flex flex-col items-start gap-10 border-t border-border pt-10">
        <p className="font-sans text-[28px] leading-[1.1] tracking-[-0.32px] text-offwhite md:text-[32px]">
          Start building
        </p>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            className="w-full sm:w-auto"
            href="/quickstart/agent"
            variant="primary"
          >
            Use with your agent
          </Button>
          <Button
            className="w-full sm:w-auto"
            href="/quickstart/server"
            variant="secondary"
          >
            Add payments to your API
          </Button>
        </div>
      </div>

      <div className="mt-[136px] flex flex-col gap-2 md:mt-[200px] md:gap-4 lg:mt-[160px]">
        <div className="flex flex-col gap-4 md:grid md:grid-cols-[584.62fr_544.08fr_503.3fr] md:gap-0">
          <Link
            className={cx(linkBase, "w-fit text-white hover:text-secondary")}
            to="/"
          >
            Machine Payment Protocol
          </Link>
          {socials.map((social) => (
            <a
              className={cx(
                linkBase,
                "hidden w-fit text-secondary hover:text-offwhite md:block",
              )}
              href={social.href}
              key={social.label}
              rel="noopener noreferrer"
              target="_blank"
            >
              {social.label}
            </a>
          ))}
        </div>
        <LineLogo
          className="my-2 w-full max-w-[1632px]"
          label="Machine Payment Protocol"
          mode="scrub"
          name="footer"
        />
        <div className="flex flex-col gap-4 md:hidden">
          {socials.map((social) => (
            <a
              className={cx(
                linkBase,
                "w-fit text-secondary hover:text-offwhite",
              )}
              href={social.href}
              key={social.label}
              rel="noopener noreferrer"
              target="_blank"
            >
              {social.label}
            </a>
          ))}
        </div>
        <p className={cx(linkBase, "mt-2 text-white/50 md:mt-0")}>
          © 2026 All rights reserved, MPP.
          <br />
          San Francisco, California, USA
        </p>
      </div>
    </footer>
  );
}
