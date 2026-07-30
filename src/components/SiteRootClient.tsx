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
  useRef,
  useState,
} from "react";
import { useRouter } from "waku";

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

function GlobalClientEffects() {
  const router = useRouter();
  const savedPositions = useRef<Record<string, number>>({});
  const previousHash = useRef<string | null>(null);
  const previousPath = useRef<string | null>(null);
  const isPopstate = useRef(false);

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

  useEffect(() => {
    window.history.scrollRestoration = "manual";
    try {
      const stored = sessionStorage.getItem("vocs:scroll");
      if (stored) savedPositions.current = JSON.parse(stored);
    } catch {}

    const handlePopstate = () => {
      isPopstate.current = true;
    };
    const handleNavigateStart = () => {
      if (previousPath.current === null) return;
      savedPositions.current[previousPath.current] = window.scrollY;
      try {
        sessionStorage.setItem(
          "vocs:scroll",
          JSON.stringify(savedPositions.current),
        );
      } catch {}
    };

    window.addEventListener("popstate", handlePopstate);
    router.unstable_events.on("start", handleNavigateStart);
    return () => {
      window.removeEventListener("popstate", handlePopstate);
      router.unstable_events.off("start", handleNavigateStart);
      window.history.scrollRestoration = "auto";
    };
  }, [router.unstable_events]);

  useEffect(() => {
    const hash = router.hash.slice(1);
    if (!hash) return;
    document.getElementById(hash)?.scrollIntoView({
      behavior: previousHash.current ? "smooth" : "instant",
    });
    previousHash.current = hash;
  }, [router.hash]);

  useEffect(() => {
    const hash = router.hash.slice(1);
    if (isPopstate.current) {
      window.scrollTo(0, savedPositions.current[router.path] ?? 0);
      isPopstate.current = false;
    } else if (hash) {
      document.getElementById(hash)?.scrollIntoView({ behavior: "instant" });
    } else {
      window.scrollTo(0, 0);
    }
    previousPath.current = router.path;
  }, [router.hash, router.path]);

  return null;
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
