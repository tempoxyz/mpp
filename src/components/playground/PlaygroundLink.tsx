import type { ReactNode } from "react";
import { Link } from "waku";
import type { Playground } from "./playgrounds";

/**
 * Links a playground the way it is served: a document load for Worker-backed
 * playgrounds (they don't exist as client routes), a client route for docs
 * pages, and no link at all for playgrounds that aren't live.
 */
export function PlaygroundLink({
  children,
  className,
  playground,
}: {
  children: ReactNode;
  className?: string;
  playground: Playground;
}) {
  const { href, navigation, status } = playground;
  if (!href || status !== "live")
    return (
      <div aria-disabled="true" className={className}>
        {children}
      </div>
    );
  if (navigation === "document")
    return (
      <a className={className} href={href}>
        {children}
      </a>
    );
  return (
    <Link className={className} to={href}>
      {children}
    </Link>
  );
}
