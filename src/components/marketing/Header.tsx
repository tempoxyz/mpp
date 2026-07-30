import { useEffect, useRef, useState } from "react";
import { Link } from "waku";
import { cx } from "./cx";
import { Dropdown } from "./Dropdown";
import { Icon, type IconName } from "./Icon";
import { LogoLottie } from "./LogoLottie";
import { useWipeHover } from "./useWipeHover";
import { WipeBands } from "./WipeBands";

export type ActiveKey = "blog" | "docs" | "services";

const links = [
  { href: "/overview", key: "docs" as const, label: "Docs" },
  { href: "/services", key: "services" as const, label: "Services" },
  { href: "/blog", key: "blog" as const, label: "Blog" },
];
const sdks = [
  { href: "https://github.com/wevm/mppx", label: "mppx (TypeScript)" },
  { href: "https://github.com/tempoxyz/mpp-go", label: "MPP-go (Go)" },
  { href: "https://github.com/stripe/mpp-rb", label: "MPP-rb (Ruby)" },
  { href: "https://github.com/tempoxyz/mpp-rs", label: "MPP-rs (Rust)" },
  { href: "https://github.com/tempoxyz/pympp", label: "PyMPP (Python)" },
];
const tagClass =
  "flex items-center justify-center border border-border bg-[#101010] px-3 py-1.5 font-mono text-sm uppercase leading-4 tracking-[-0.14px] text-secondary transition-colors hover:text-offwhite";
const navLinkBase =
  "relative inline-flex items-center justify-center overflow-hidden border px-3 py-1.5 font-mono text-sm uppercase tracking-[-0.14px] leading-4 whitespace-nowrap";

type NavItem =
  | {
      external: false;
      href: string;
      key: ActiveKey;
      label: string;
    }
  | {
      external: true;
      href: string;
      icon: IconName;
      label: string;
    };

function NavLink({ active, item }: { active?: ActiveKey; item: NavItem }) {
  const selected = !item.external && item.key === active;
  const ref = useRef<HTMLElement>(null);
  useWipeHover(ref, !selected);
  const className = cx(
    navLinkBase,
    selected
      ? "border-[rgba(235,235,235,0.4)] bg-[#262626] text-offwhite"
      : "border-border bg-[#101010] text-secondary",
  );
  const content = (
    <>
      {!selected && <WipeBands />}
      <span className="wipe-label relative z-10 inline-flex items-center gap-2">
        {item.label}
        {item.external && <Icon name={item.icon} />}
      </span>
    </>
  );
  if (!item.external) {
    return (
      <Link
        className={className}
        data-wipe=""
        ref={ref as React.Ref<HTMLAnchorElement>}
        to={item.href}
      >
        {content}
      </Link>
    );
  }
  return (
    <a
      className={className}
      data-wipe=""
      href={item.href}
      ref={ref as React.Ref<HTMLAnchorElement>}
      rel="noopener noreferrer"
      target="_blank"
    >
      {content}
    </a>
  );
}

export function Header({
  active,
  overlay = false,
}: {
  active?: ActiveKey;
  overlay?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems: NavItem[] = [
    ...links.map((link) => ({ ...link, external: false as const })),
    {
      external: true,
      href: "https://paymentauth.org/",
      icon: "arrow-linkout",
      label: "IETF Specs",
    },
  ];

  useEffect(() => {
    document.documentElement.classList.toggle("overflow-hidden", menuOpen);
    if (!menuOpen) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", key);
    return () => {
      document.documentElement.classList.remove("overflow-hidden");
      document.removeEventListener("keydown", key);
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={cx(
          "fixed inset-x-0 top-0 z-50 w-full",
          overlay
            ? "bg-gradient-to-b from-[#101010] to-transparent"
            : "bg-[#101010]",
        )}
      >
        <div className="mx-auto flex w-full max-w-[1728px] items-center justify-between gap-4 px-4 py-4 md:px-12 md:py-5">
          <Link
            aria-label="Machine Payment Protocol — home"
            className="flex min-w-0 items-center"
            to="/"
          >
            <LogoLottie className="block aspect-[763/74] w-[206px] max-w-full overflow-hidden" />
          </Link>

          <nav className="hidden flex-wrap items-center justify-end gap-2 min-[880px]:flex">
            {navItems.map((item) => (
              <NavLink active={active} item={item} key={item.label} />
            ))}
            <Dropdown align="right" items={sdks} label="GitHub" size="sm" />
          </nav>

          <button
            aria-expanded={menuOpen}
            aria-label="Open menu"
            className={cx(tagClass, "ml-auto min-[880px]:hidden")}
            onClick={() => setMenuOpen(true)}
            type="button"
          >
            Menu
          </button>
        </div>
      </header>
      {!overlay && <div className="h-[62px] md:h-[70px]" />}

      {menuOpen && (
        <div
          aria-label="Site menu"
          aria-modal="true"
          className="fixed inset-0 z-[90] flex flex-col bg-[#101010] min-[880px]:hidden"
          role="dialog"
        >
          <div className="flex items-center justify-between px-4 py-4">
            <Link
              aria-label="Machine Payment Protocol — home"
              className="flex shrink-0 items-center"
              to="/"
            >
              <img
                alt="MPP"
                className="h-[20px] w-auto"
                src="/marketing/mpp-logo.svg"
              />
            </Link>
            <button
              aria-label="Close menu"
              className={tagClass}
              onClick={() => setMenuOpen(false)}
              type="button"
            >
              Close
            </button>
          </div>
          <nav className="flex flex-1 flex-col justify-start gap-4 overflow-y-auto px-4 pb-12 pt-8">
            {links.map((link) => (
              <Link
                className="font-sans text-5xl leading-none tracking-[-0.48px] text-white"
                key={link.label}
                onClick={() => setMenuOpen(false)}
                to={link.href}
              >
                {link.label}
              </Link>
            ))}
            <a
              className="flex items-center gap-2 font-sans text-5xl leading-none tracking-[-0.48px] text-white"
              href="https://paymentauth.org/"
              rel="noopener noreferrer"
              target="_blank"
            >
              IETF Specs
              <Icon name="arrow-linkout" size={24} />
            </a>
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center gap-2 font-sans text-5xl leading-none tracking-[-0.48px] text-white marker:hidden [&::-webkit-details-marker]:hidden">
                Github
                <Icon
                  className="transition-transform duration-200 group-open:rotate-180"
                  name="chevron-down"
                  size={24}
                />
              </summary>
              <div className="mt-4 space-y-4 pl-1">
                {sdks.map((sdk) => (
                  <a
                    className="flex items-center gap-2 font-mono text-sm uppercase tracking-[-0.14px] text-secondary"
                    href={sdk.href}
                    key={sdk.label}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {sdk.label}
                    <Icon name="arrow-linkout" />
                  </a>
                ))}
              </div>
            </details>
          </nav>
        </div>
      )}
    </>
  );
}
