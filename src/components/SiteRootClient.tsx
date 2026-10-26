"use client";

import {
  type unstable_AdapterInterface,
  unstable_createAdapterProvider,
} from "nuqs/adapters/custom";
import {
  Component,
  type ErrorInfo,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import { ScrollRestoration } from "vocs";

function useNuqsWakuAdapter(): unstable_AdapterInterface {
  const [searchParams, setSearchParams] = useState(() =>
    typeof window === "undefined"
      ? new URLSearchParams()
      : new URLSearchParams(window.location.search),
  );

  useEffect(() => {
    const update = () =>
      setSearchParams(new URLSearchParams(window.location.search));
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);

  const updateUrl = useCallback<unstable_AdapterInterface["updateUrl"]>(
    (search, options) => {
      const url = new URL(window.location.href);
      url.search = search.toString();
      window.history[options.history === "push" ? "pushState" : "replaceState"](
        null,
        "",
        url,
      );
      setSearchParams(new URLSearchParams(search));
      if (options.scroll) window.scrollTo(0, 0);
    },
    [],
  );

  return { searchParams, updateUrl };
}

const NuqsAdapter = unstable_createAdapterProvider(useNuqsWakuAdapter);

class RootErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Root error boundary caught an error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-[60vh] items-center justify-center px-6 py-16 text-center">
          <div>
            <h1 className="text-3xl text-primary">Something went wrong</h1>
            <p className="mt-3 text-secondary">Reload the page to try again.</p>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

// The custom document root replaces Vocs Root, so mount the Vocs client pieces
// it would otherwise provide: heading-link copy and scroll restoration.
function GlobalClientEffects() {
  useEffect(() => {
    const copyHeadingUrl = async (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const anchor =
        event.target.closest<HTMLAnchorElement>("a.heading-anchor");
      if (!anchor?.href) return;

      await navigator.clipboard.writeText(anchor.href);
      anchor.dataset.copied = "true";
      window.setTimeout(() => {
        delete anchor.dataset.copied;
      }, 1_000);
    };
    document.addEventListener("click", copyHeadingUrl);
    return () => document.removeEventListener("click", copyHeadingUrl);
  }, []);

  return <ScrollRestoration />;
}

export function SiteRootClient({ children }: { children: ReactNode }) {
  return (
    <NuqsAdapter>
      <RootErrorBoundary>
        <GlobalClientEffects />
        {children}
      </RootErrorBoundary>
    </NuqsAdapter>
  );
}
