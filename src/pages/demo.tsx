"use client";

import { useState } from "react";
import { AsciiLogo } from "../components/AsciiLogo";
import * as Cli from "../components/Cli";
import { pathUsd } from "../wagmi.config";

// ---------------------------------------------------------------------------
// Demo variant types
// ---------------------------------------------------------------------------

type DemoVariant = "A" | "B" | "C" | "D";

const VARIANT_LABELS: Record<DemoVariant, string> = {
  A: "Full demo",
  B: "Simple demo",
  C: "Playground",
  D: "Compact",
};

// ---------------------------------------------------------------------------
// Demo page component
// ---------------------------------------------------------------------------

export function DemoPage() {
  const [variant, setVariantState] = useState<DemoVariant>(() => {
    if (typeof window === "undefined") return "A";
    const params = new URLSearchParams(window.location.search);
    const v = params.get("v");
    if (v && ["A", "B", "C", "D"].includes(v)) return v as DemoVariant;
    return "A";
  });

  const setVariant = (v: DemoVariant) => {
    setVariantState(v);
    const url = new URL(window.location.href);
    url.searchParams.set("v", v);
    window.history.replaceState({}, "", url.toString());
  };

  return (
    <div
      className="not-prose"
      style={{
        color: "var(--vocs-text-color-heading)",
        fontFamily: "var(--font-mono)",
      }}
    >
      <style>{`
				[data-v-sidebar] { display: none !important; }
				[data-v-gutter-left] { display: none !important; }
				[data-v-gutter-right] { display: none !important; }
				[data-v-outline-nav] { display: none !important; }
				main > article { max-width: 100% !important; }
			`}</style>

      {/* Variant toggle — fixed left side */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-1">
        {(["A", "B", "C", "D"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVariant(v)}
            className="w-6 h-6 text-[10px] font-medium rounded transition-all"
            title={VARIANT_LABELS[v]}
            style={
              variant === v
                ? {
                    background: "var(--vocs-color-accent)",
                    color: "#ffffff",
                  }
                : {
                    background: "var(--vocs-background-color-surfaceMuted)",
                    color: "var(--vocs-text-color-secondary)",
                    opacity: 0.7,
                  }
            }
          >
            {v}
          </button>
        ))}
      </div>

      {/* Main content — centered */}
      <div
        className="flex flex-col items-center justify-center px-6"
        style={{
          minHeight: "calc(100vh - 64px)",
        }}
      >
        {variant === "A" && <DemoVariantA />}
        {variant === "B" && <DemoVariantB />}
        {variant === "C" && <DemoVariantC />}
        {variant === "D" && <DemoVariantD />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant A: Full demo with tabs, account, balance
// ---------------------------------------------------------------------------

function DemoVariantA() {
  return (
    <div className="w-full max-w-xl flex flex-col items-center gap-8">
      <div className="text-center space-y-3">
        <div style={{ marginBottom: "0.5rem" }}>
          <AsciiLogo />
        </div>
        <p
          className="text-sm leading-relaxed max-w-md mx-auto"
          style={{ color: "var(--vocs-text-color-secondary)" }}
        >
          Create an account, fund it with testnet tokens, and make a paid
          request to see the full payment flow.
        </p>
      </div>
      <div className="w-full">
        <Cli.Demo
          title="Make a request with payment"
          token={pathUsd}
          restartStep={1}
        >
          <Cli.Startup />
          <Cli.ConnectWallet />
          <Cli.Faucet />
          <Cli.Ping />
        </Cli.Demo>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant B: Simple demo — no account/tabs, compact view
// ---------------------------------------------------------------------------

function DemoVariantB() {
  return (
    <div className="w-full max-w-xl flex flex-col items-center gap-8">
      <div className="text-center space-y-3">
        <h2
          className="text-lg font-bold"
          style={{ color: "var(--vocs-text-color-heading)" }}
        >
          Simplified demo
        </h2>
        <p
          className="text-sm leading-relaxed max-w-md mx-auto"
          style={{ color: "var(--vocs-text-color-secondary)" }}
        >
          A streamlined view of the payment flow without account management.
        </p>
      </div>
      <div className="w-full">
        <Cli.Demo
          title="Payment flow"
          token={pathUsd}
          height={280}
          restartStep={1}
        >
          <Cli.Startup />
          <Cli.ConnectWallet />
          <Cli.Faucet />
          <Cli.Ping />
        </Cli.Demo>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant C: Playground — static CLI showcase
// ---------------------------------------------------------------------------

function DemoVariantC() {
  return (
    <div className="w-full max-w-xl flex flex-col items-center gap-8">
      <div className="text-center space-y-3">
        <h2
          className="text-lg font-bold"
          style={{ color: "var(--vocs-text-color-heading)" }}
        >
          CLI playground
        </h2>
        <p
          className="text-sm leading-relaxed max-w-md mx-auto"
          style={{ color: "var(--vocs-text-color-secondary)" }}
        >
          Preview of the CLI component primitives.
        </p>
      </div>
      <div className="w-full">
        <Cli.Window>
          <Cli.TitleBar title="Accept Payments" />
          <Cli.Panel height={300}>
            <Cli.Block>
              <Cli.Line variant="info">Session started at 10:32:15 AM</Cli.Line>
              <Cli.Line>Loading configuration...</Cli.Line>
              <Cli.Line variant="success" prefix="✓">
                Config loaded
              </Cli.Line>
            </Cli.Block>

            <Cli.Block>
              <Cli.Line variant="input" prefix="❯">
                connect wallet
              </Cli.Line>
              <Cli.Line>Connecting to Tempo network...</Cli.Line>
              <Cli.Line variant="success" prefix="✓">
                Connected: 0xf9D7E756...38E44209
              </Cli.Line>
            </Cli.Block>

            <Cli.Block>
              <Cli.Line variant="input" prefix="❯">
                get balance
              </Cli.Line>
              <Cli.Line>Fetching balance...</Cli.Line>
              <Cli.Line variant="success" prefix="✓">
                Balance: $1,000,000.0000 aUSD
              </Cli.Line>
            </Cli.Block>

            <Cli.Block>
              <Cli.Line variant="input" prefix="❯">
                search coffee shops
              </Cli.Line>
              <Cli.Line variant="warning" prefix="→">
                Paying $0.002 for places.search
              </Cli.Line>
              <Cli.Line>Searching nearby coffee shops...</Cli.Line>
              <Cli.Line variant="success" prefix="✓">
                Found 3 results
              </Cli.Line>
            </Cli.Block>

            <Cli.Block>
              <Cli.Line variant="input" prefix="❯">
                get reviews "Blue Bottle Coffee"
              </Cli.Line>
              <Cli.Line variant="loading">
                Paying $0.003 for reviews.aggregate
              </Cli.Line>
              <Cli.Line variant="error" prefix="✗">
                Payment failed: insufficient funds
              </Cli.Line>
            </Cli.Block>

            <Cli.Block>
              <Cli.Line variant="input" prefix="❯">
                retry
              </Cli.Line>
              <Cli.Line variant="loading">Retrying payment...</Cli.Line>
              <Cli.Line variant="success" prefix="✓">
                Payment successful
              </Cli.Line>
              <Cli.Line>Blue Bottle Coffee - 4.8★ (2,340 reviews)</Cli.Line>
            </Cli.Block>

            <Cli.Block>
              <Cli.Link href="https://tempo.xyz">
                View transaction on Explorer ↗
              </Cli.Link>
            </Cli.Block>
          </Cli.Panel>
          <Cli.FooterBar
            left={<Cli.Hint />}
            right={
              <>
                <Cli.Balance />
                <Cli.Spent />
                <Cli.Status variant="ready">Ready</Cli.Status>
              </>
            }
          />
        </Cli.Window>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant D: Compact — two demos side by side
// ---------------------------------------------------------------------------

function DemoVariantD() {
  return (
    <div className="w-full max-w-4xl flex flex-col items-center gap-8">
      <div className="text-center space-y-3">
        <h2
          className="text-lg font-bold"
          style={{ color: "var(--vocs-text-color-heading)" }}
        >
          Side-by-side demos
        </h2>
        <p
          className="text-sm leading-relaxed max-w-md mx-auto"
          style={{ color: "var(--vocs-text-color-secondary)" }}
        >
          Full interactive demo alongside a static CLI showcase.
        </p>
      </div>
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Cli.Demo
            title="Interactive demo"
            token={pathUsd}
            height={280}
            restartStep={1}
          >
            <Cli.Startup />
            <Cli.ConnectWallet />
            <Cli.Faucet />
            <Cli.Ping />
          </Cli.Demo>
        </div>
        <div>
          <Cli.Window>
            <Cli.TitleBar title="Static preview" />
            <Cli.Panel height={280}>
              <Cli.Block>
                <Cli.Line variant="info">
                  Session started at 10:32:15 AM
                </Cli.Line>
                <Cli.Line variant="success" prefix="✓">
                  Config loaded
                </Cli.Line>
              </Cli.Block>
              <Cli.Block>
                <Cli.Line variant="input" prefix="❯">
                  connect wallet
                </Cli.Line>
                <Cli.Line variant="success" prefix="✓">
                  Connected: 0xf9D7E756...38E44209
                </Cli.Line>
              </Cli.Block>
              <Cli.Block>
                <Cli.Line variant="input" prefix="❯">
                  search coffee shops
                </Cli.Line>
                <Cli.Line variant="warning" prefix="→">
                  Paying $0.002 for places.search
                </Cli.Line>
                <Cli.Line variant="success" prefix="✓">
                  Found 3 results
                </Cli.Line>
              </Cli.Block>
              <Cli.Block>
                <Cli.Line variant="input" prefix="❯">
                  get reviews "Blue Bottle Coffee"
                </Cli.Line>
                <Cli.Line variant="success" prefix="✓">
                  Payment successful
                </Cli.Line>
                <Cli.Line>Blue Bottle Coffee - 4.8★ (2,340 reviews)</Cli.Line>
              </Cli.Block>
            </Cli.Panel>
            <Cli.FooterBar
              left={<Cli.Hint />}
              right={<Cli.Status variant="ready">Ready</Cli.Status>}
            />
          </Cli.Window>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Default MDX export wrapper
// ---------------------------------------------------------------------------

export default function DemoPageWrapper() {
  return <DemoPage />;
}
