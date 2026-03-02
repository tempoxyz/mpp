"use client";

import { Receipt } from "mppx";
import type { ReactNode } from "react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { BlockCursorInput } from "./BlockCursorInput";
import { SPINNER_FRAMES } from "./terminal-data";
import {
  article as _article,
  ascii as _ascii,
  charge as _charge,
  chat as _chat,
  commands as _commands,
  gallery as _gallery,
  image as _image,
  lookup as _lookup,
  photo as _photo,
  ping as _ping,
  poem as _poem,
  search as _search,
  session as _session,
  stripe as _stripe,
  wizard as _wizard,
  COST_PER_TOKEN,
  type CommandsStepConfig,
  LOOKUP_COST,
  type PaymentStepConfig,
  type StepConfig,
  shuffle,
  type WizardStepConfig,
} from "./terminal-steps";

// ---------------------------------------------------------------------------
// Demo client hook
// ---------------------------------------------------------------------------

type DemoClient = Awaited<
  ReturnType<typeof import("../demo-client").createDemoClient>
>;

function useDemoClient() {
  const [client, setClient] = useState<DemoClient | null>(null);
  const [isLive] = useState(() => import.meta.env.VITE_DEMO_LIVE !== "false");

  useEffect(() => {
    if (!isLive) return;
    let cancelled = false;
    import("../demo-client").then(({ createDemoClient }) =>
      createDemoClient().then((c) => {
        if (!cancelled) setClient(c);
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [isLive]);

  return { client, isLive };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Link detection
// ---------------------------------------------------------------------------

export const linkPattern =
  /(https?:\/\/\S+|mpp\.dev\/\S+|mpp\.sh\/\S+|x\.com\/mpp|Tempo\.xyz|Stripe\.com|parallel\.ai|fal\.ai)/g;

function CssTriangle() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 0,
        height: 0,
        borderTop: "0.3em solid transparent",
        borderBottom: "0.3em solid transparent",
        borderLeft: "0.45em solid currentColor",
        verticalAlign: "middle",
      }}
    />
  );
}

const SUMMARY_LABEL_WIDTH = "5.5em";
const QUICKSTART_LABEL_WIDTH = "13em";

function BlankLine() {
  return <div className="h-6" />;
}

function PhotoOutput({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block relative rounded overflow-hidden"
      style={{
        width: 200,
        height: 200,
        borderColor: "var(--term-gray4)",
        borderWidth: 1,
        borderStyle: "solid",
      }}
    >
      {!loaded && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "var(--term-gray3)" }}
        />
      )}
      <img
        src={url}
        alt="Generated"
        onLoad={() => setLoaded(true)}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          transition: "opacity 0.5s",
          opacity: loaded ? 1 : 0,
        }}
      />
    </a>
  );
}

function GalleryThumb({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block relative rounded overflow-hidden"
      style={{
        width: 80,
        height: 80,
        borderColor: "var(--term-gray4)",
        borderWidth: 1,
        borderStyle: "solid",
      }}
    >
      {!loaded && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "var(--term-gray3)" }}
        />
      )}
      <img
        src={url}
        alt="Gallery"
        onLoad={() => setLoaded(true)}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          transition: "opacity 0.5s",
          opacity: loaded ? 1 : 0,
        }}
      />
    </a>
  );
}

function GalleryGrid({
  urls,
  loading = false,
}: {
  urls: string[];
  loading?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {urls.map((url) => (
        <GalleryThumb key={url} url={url} />
      ))}
      {loading && (
        <div
          className="rounded"
          style={{
            width: 80,
            height: 80,
            borderColor: "var(--term-gray4)",
            borderWidth: 1,
            borderStyle: "solid",
            backgroundColor: "var(--term-gray3)",
          }}
        />
      )}
    </div>
  );
}

function SummaryRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <p style={{ color: "var(--term-gray6)" }}>
      {"\u00a0\u00a0"}
      <span style={{ display: "inline-block", width: SUMMARY_LABEL_WIDTH }}>
        {label}
      </span>
      {children}
    </p>
  );
}

function TruncatedHex({
  hash,
  children,
}: {
  hash: string;
  children: ReactNode;
}) {
  return (
    <>
      {/* biome-ignore format: contains unicode … */}
      <span className="md:hidden">
        {hash.slice(0, 6)}…{hash.slice(-4)}
      </span>
      <span className="hidden md:inline">{children}</span>
    </>
  );
}

function renderText(text: string): ReactNode {
  const parts = text.split(linkPattern);
  if (parts.length === 1) return text;
  return parts.map((part, i) => {
    linkPattern.lastIndex = 0;
    if (!linkPattern.test(part)) return part;
    const href = part.startsWith("http")
      ? part
      : part === "Tempo.xyz"
        ? "https://tempo.xyz"
        : part === "Stripe.com"
          ? "https://stripe.com"
          : part === "parallel.ai"
            ? "https://parallel.ai"
            : part === "fal.ai"
              ? "https://fal.ai"
              : `https://${part}`;
    const color =
      part === "Stripe.com"
        ? "#635BFF"
        : part === "parallel.ai" || part === "fal.ai"
          ? "var(--term-blue9)"
          : "var(--term-teal9)";
    return (
      <a
        // biome-ignore lint/suspicious/noArrayIndexKey: static split parts never reorder
        key={i}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
        style={{ color }}
      >
        {part}
      </a>
    );
  });
}

// ---------------------------------------------------------------------------
// Quickstart output (shown after `cat quickstart.txt`)
// ---------------------------------------------------------------------------

function QuickstartOutput() {
  const rows = [
    { label: "Connect your agent:", value: "mpp.dev/llms.txt" },
    { label: "Discover services:", value: "mpp.dev/services" },
    { label: "Read the docs:", value: "mpp.dev/overview" },
  ];
  return (
    <div className="flex flex-col">
      {rows.map((row) => (
        <p key={row.label} style={{ color: "var(--term-gray6)" }}>
          {"  "}
          <span
            style={{
              display: "inline-block",
              width: QUICKSTART_LABEL_WIDTH,
            }}
          >
            {row.label}
          </span>
          {renderText(row.value)}
        </p>
      ))}
      <BlankLine />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Typewriter commands
// ---------------------------------------------------------------------------

const BASE_DELAY = 30;
const JITTER = 35;
const LINE_DELAY = 500;

function useTypewriter(commands: string[]) {
  const noCommands = commands.length === 0;
  const skip = SKIP_ANIMATION || noCommands;
  const [showLogin, setShowLogin] = useState(skip);
  const [showPrompt, setShowPrompt] = useState(skip);
  const [started, setStarted] = useState(skip);
  const [lineIndex, setLineIndex] = useState(skip ? commands.length : 0);
  const [charIndex, setCharIndex] = useState(0);
  const done = started && lineIndex >= commands.length;

  useEffect(() => {
    if (skip) return;
    const t1 = setTimeout(() => setShowLogin(true), 500);
    const t2 = setTimeout(() => setShowPrompt(true), 700);
    const t3 = setTimeout(() => setStarted(true), 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [skip]);

  const advance = () => {
    if (done) return;
    if (lineIndex >= commands.length) return;
    setLineIndex((l) => l + 1);
    setCharIndex(0);
  };

  useEffect(() => {
    if (!started || done) return;

    const currentLine = commands[lineIndex];

    if (charIndex < currentLine.length) {
      const delay = BASE_DELAY + Math.random() * JITTER;
      const timer = setTimeout(() => setCharIndex((c) => c + 1), delay);
      return () => clearTimeout(timer);
    }

    const delay = lineIndex === 0 ? 800 : LINE_DELAY;
    const timer = setTimeout(() => {
      setLineIndex((l) => l + 1);
      setCharIndex(0);
    }, delay);
    return () => clearTimeout(timer);
  }, [started, lineIndex, charIndex, done, commands]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") advance();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return { showLogin, showPrompt, started, lineIndex, charIndex, done };
}

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

function Spinner() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const timer = setInterval(
      () => setFrame((f) => (f + 1) % SPINNER_FRAMES.length),
      80,
    );
    return () => clearInterval(timer);
  }, []);
  return (
    <span style={{ color: "var(--term-blue9)" }}>{SPINNER_FRAMES[frame]}</span>
  );
}

// ---------------------------------------------------------------------------
// Crypto helpers
// ---------------------------------------------------------------------------

async function randomAddress() {
  const { generatePrivateKey, privateKeyToAccount } = await import(
    "viem/accounts"
  );
  const key = generatePrivateKey();
  return privateKeyToAccount(key).address;
}

export function randomTxHash() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

export const COMPANIES: Record<string, { title: string; description: string }> =
  {
    "stripe.com": {
      title: "Stripe | Financial Infrastructure for the Internet",
      description:
        "Stripe powers online and in-person payment processing and financial solutions for businesses of all sizes.",
    },
    "tempo.xyz": {
      title: "Tempo | The Network for Stablecoins",
      description:
        "Tempo is a high-performance blockchain network purpose-built for stablecoins and payments.",
    },
    "openai.com": {
      title: "OpenAI",
      description:
        "OpenAI is an AI research and deployment company dedicated to ensuring that artificial general intelligence benefits all of humanity.",
    },
    "github.com": {
      title: "GitHub: Let's build from here",
      description:
        "GitHub is where over 100 million developers shape the future of software, together.",
    },
    "vercel.com": {
      title:
        "Vercel: Build and deploy the best web experiences with the Frontend Cloud",
      description:
        "Vercel provides the developer tools and cloud infrastructure to build, scale, and secure a faster, more personalized web.",
    },
  };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function normalizeUrl(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

/** @internal kept for cleanup task */
export function lookupCompany(url: string): string[] {
  const domain = normalizeUrl(url);
  const company = COMPANIES[domain];
  if (company) {
    return [
      `  title       ${company.title}`,
      `  description ${company.description}`,
      `  url         https://${domain}`,
    ];
  }
  return [
    `  title       ${domain}`,
    "  description No description available",
    `  url         https://${domain}`,
  ];
}

export function randomStripeId(prefix: string) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = prefix;
  for (let i = 0; i < 24; i++)
    result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

// ---------------------------------------------------------------------------
// Service label for upstream API providers
// ---------------------------------------------------------------------------

export const SERVICE_LABELS: [string, string][] = [
  ["/article", "parallel.ai article extraction"],
  ["/ascii", "fal.ai image generation"],
  ["/image", "fal.ai image generation"],
  ["/lookup", "parallel.ai article extraction"],
  ["/search", "parallel.ai web search"],
];

export function serviceLabel(endpoint: string): string | undefined {
  return SERVICE_LABELS.find(([k]) => endpoint.includes(k))?.[1];
}

// ---------------------------------------------------------------------------
// Step components
// ---------------------------------------------------------------------------

const SKIP_ANIMATION = import.meta.env.VITE_SKIP_ANIMATION === "true";
const STREAM_DELAY = SKIP_ANIMATION ? 0 : 30;

export type {
  StepConfig,
  PaymentStepConfig,
  CommandsStepConfig,
  WizardStepConfig,
};
export { COST_PER_TOKEN, LOOKUP_COST, shuffle };

// biome-ignore format: contains unicode ✔︎
function StepIcon({
  spinning,
  icon = "✔︎",
}: {
  spinning: boolean;
  icon?: string;
}) {
  return (
    <span className="inline-block w-[1ch] text-center">
      {spinning ? (
        <Spinner />
      ) : (
        <span style={{ color: "var(--term-green9)" }}>{icon}</span>
      )}
    </span>
  );
}

function AsyncSteps({
  endpoint,
  liveEndpoint,
  isRestart = false,
  output,
  outputMode,
  walletState,
  paymentChannel = false,
  onDone,
  completed = false,
  demoClient,
  onContentReceived,
  initialTxHash,
  onTxHash,
}: {
  endpoint: string;
  liveEndpoint?: string;
  isRestart?: boolean;
  output: string[];
  outputMode?: "text" | "photo" | "gallery";
  walletState: WalletState;
  paymentChannel?: boolean;
  onDone?: () => void;
  completed?: boolean;
  demoClient?: DemoClient | null;
  onContentReceived?: (content: string[]) => void;
  initialTxHash?: string;
  onTxHash?: (hash: string) => void;
}) {
  const { address, funded, setFunded } = walletState;
  const [txHash, setTxHash] = useState(() => initialTxHash ?? randomTxHash());
  const [channelTxHash, setChannelTxHash] = useState(() => randomTxHash());
  const doneCalled = useRef(false);
  const liveStarted = useRef(false);

  const outputText = output.join("\n");

  const [steps] = useState(() => {
    const needsFunding = !funded || walletState.balance <= 0;
    const d = (ms: number) => (SKIP_ANIMATION ? 0 : ms);
    const s: { key: string; delay: number }[] = [];
    s.push({ key: "wallet", delay: isRestart ? 0 : d(600) });
    if (needsFunding || (completed && !isRestart))
      s.push({ key: "fund", delay: demoClient ? 0 : d(1500) });
    s.push({ key: "req402", delay: d(1200) });
    if (paymentChannel) {
      s.push({ key: "channel", delay: d(1200) });
      s.push({ key: "stream", delay: 0 });
      s.push({ key: "closeChannel", delay: d(1000) });
    } else {
      s.push({ key: "pay", delay: d(1500) });
      s.push({ key: "req200", delay: d(1000) });
    }
    return s;
  });

  const [step, setStep] = useState(() => (completed ? steps.length : 0));
  const [streamChars, setStreamChars] = useState(() =>
    completed ? outputText.length : 0,
  );
  const [tokenCount, setTokenCount] = useState(() => {
    if (!completed || !paymentChannel) return 0;
    return Math.ceil(outputText.length / 4);
  });

  const currentKey = steps[step]?.key ?? "done";
  const pastStep = (key: string) => {
    const idx = steps.findIndex((s) => s.key === key);
    return idx !== -1 && step > idx;
  };
  const atOrPast = (key: string) => {
    const idx = steps.findIndex((s) => s.key === key);
    return idx !== -1 && step >= idx;
  };
  const atStep = (key: string) => currentKey === key;

  // Live mode: run real operations
  useEffect(() => {
    if (!demoClient || completed || liveStarted.current) return;
    liveStarted.current = true;

    (async () => {
      try {
        // Wallet step
        const walletIdx = steps.findIndex((s) => s.key === "wallet");
        if (walletIdx !== -1) {
          walletState.setCreated(true);
          setStep(walletIdx + 1);
          await new Promise((r) => setTimeout(r, 400));
        }

        // Fund step
        const fundIdx = steps.findIndex((s) => s.key === "fund");
        if (fundIdx !== -1) {
          setStep(fundIdx);
          try {
            await demoClient.fundWallet();
          } catch (e) {
            console.error("Live funding failed, continuing:", e);
          }
          setFunded(true);
          walletState.setBalance(INITIAL_BALANCE);
          setStep(fundIdx + 1);
          await new Promise((r) => setTimeout(r, 400));
        }

        // 402 step (visual)
        const req402Idx = steps.findIndex((s) => s.key === "req402");
        setStep(req402Idx);
        await new Promise((r) => setTimeout(r, 800));
        setStep(req402Idx + 1);

        // Pay/channel step — fire real fetch
        const payIdx = steps.findIndex(
          (s) => s.key === "pay" || s.key === "channel",
        );
        setStep(payIdx);

        let liveContent: string[] = [];
        try {
          const demoEndpoint = liveEndpoint ?? endpoint;

          if (paymentChannel) {
            // Use session SSE for bidirectional voucher flow
            let sseReceipt: { txHash?: string; reference?: string } | undefined;
            const stream = await demoClient.session.sse(demoEndpoint, {
              onReceipt: (r) => {
                sseReceipt = r;
              },
            });

            // Capture channel ID after SSE opens the channel
            if (demoClient.session.channelId) {
              setChannelTxHash(demoClient.session.channelId);
            }

            // Move to stream step — channel is open
            setStep(payIdx + 1);
            await new Promise((r) => setTimeout(r, 200));

            // Stream chunks in real-time as they arrive from the server
            let text = "";
            let chunks = 0;
            for await (const chunk of stream) {
              text += chunk;
              chunks++;
              const decoded = text.replaceAll("\t", "\n").replace(/\n+$/, "");
              onContentReceived?.(decoded.split("\n"));
              setStreamChars(decoded.length);
              setTokenCount(chunks);
            }
            liveContent = text
              .replaceAll("\t", "\n")
              .replace(/\n+$/, "")
              .split("\n");

            // Close channel and capture the real close tx hash
            try {
              const closeReceipt = await demoClient.session.close();
              const hash =
                closeReceipt?.txHash ?? sseReceipt?.txHash ?? undefined;
              if (hash) {
                setTxHash(hash);
                onTxHash?.(hash);
              }
            } catch {
              // Channel close failed — keep random hash
            }
          } else {
            const res = await demoClient.fetch(demoEndpoint);

            // Extract real tx hash from Payment-Receipt header
            try {
              const receipt = Receipt.fromResponse(res);
              if (receipt.reference) {
                setTxHash(receipt.reference);
                onTxHash?.(receipt.reference);
              }
            } catch {
              // No receipt header — keep random hash
            }

            const data = (await res.json()) as { lines: string[] };
            liveContent = data.lines;
            onContentReceived?.(liveContent);
          }
        } catch (e) {
          console.error("Live fetch failed, using simulated content:", e);
        }

        if (!paymentChannel) {
          setStep(payIdx + 1);
          await new Promise((r) => setTimeout(r, 400));
        }

        // Remaining steps
        for (let i = payIdx + 2; i <= steps.length; i++) {
          setStep(i);
          if (i < steps.length) {
            await new Promise((r) => setTimeout(r, 600));
          }
        }
      } catch (e) {
        console.error("Live demo error:", e);
      }
    })();
  }, [
    demoClient,
    completed,
    endpoint,
    liveEndpoint,
    steps,
    paymentChannel,
    walletState.setBalance,
    walletState.setCreated,
    setFunded,
    onContentReceived,
    onTxHash,
  ]);

  // Simulated mode: timed step progression
  useEffect(() => {
    if (demoClient) return;
    if (currentKey === "done") {
      if (!doneCalled.current) {
        doneCalled.current = true;
        onDone?.();
      }
      return;
    }
    if (currentKey === "stream") {
      if (outputMode === "gallery") {
        if (tokenCount < output.length) {
          const delay = SKIP_ANIMATION ? 0 : 400;
          const timer = setTimeout(() => {
            setTokenCount((t) => t + 1);
          }, delay);
          return () => clearTimeout(timer);
        }
        setStep((s) => s + 1);
        return;
      }
      if (streamChars < outputText.length) {
        const timer = setTimeout(() => {
          setStreamChars((c) => c + 1);
          if (paymentChannel && (streamChars + 1) % 4 === 0) {
            setTokenCount((t) => t + 1);
          }
        }, STREAM_DELAY);
        return () => clearTimeout(timer);
      }
      setStep((s) => s + 1);
      return;
    }
    const delay = steps[step].delay;
    const timer = setTimeout(() => {
      if (currentKey === "wallet") walletState.setCreated(true);
      if (currentKey === "fund") {
        setFunded(true);
        walletState.setBalance(INITIAL_BALANCE);
      }
      setStep((s) => s + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [
    demoClient,
    step,
    streamChars,
    outputText.length,
    currentKey,
    output.length,
    outputMode,
    paymentChannel,
    tokenCount,
    walletState.setBalance,
    walletState.setCreated,
    steps,
    onDone,
    setFunded,
  ]);

  // Live mode: call onDone when steps complete
  useEffect(() => {
    if (!demoClient) return;
    if (currentKey === "done" && !doneCalled.current) {
      doneCalled.current = true;
      onDone?.();
    }
  }, [demoClient, currentKey, onDone]);

  return (
    <div className="flex flex-col">
      <BlankLine />
      {atOrPast("wallet") && (
        <p style={{ color: "var(--term-gray6)" }}>
          <StepIcon spinning={atStep("wallet")} />{" "}
          {isRestart ? "Using" : "Creating"} wallet{" "}
          <a
            href={`https://explore.tempo.xyz/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            <TruncatedHex hash={address}>{address}</TruncatedHex>
          </a>
        </p>
      )}
      {atOrPast("fund") && (
        <p style={{ color: "var(--term-gray6)" }}>
          <StepIcon spinning={atStep("fund")} /> Funding wallet with{" "}
          <span style={{ color: "var(--term-amber9)" }}>100 USDC</span>
        </p>
      )}
      {/* biome-ignore format: contains unicode → */}
      {atOrPast("req402") && (
        <>
          <p style={{ color: "var(--term-gray6)" }}>
            <StepIcon spinning={atStep("req402")} /> GET {endpoint}
            {pastStep("req402") && (
              <>
                {" "}
                →{" "}
                <span style={{ color: "var(--term-amber9)" }}>
                  402 Payment Required
                </span>
              </>
            )}
          </p>
          {pastStep("req402") && (
            <p
              style={{
                color: "var(--term-gray6)",
                paddingLeft: "2ch",
              }}
            >
              WWW-Authenticate: Payment
            </p>
          )}
          {pastStep("req402") && serviceLabel(liveEndpoint ?? endpoint) && (
            <p
              style={{
                color: "var(--term-gray6)",
                paddingLeft: "2ch",
              }}
            >
              via {renderText(serviceLabel(liveEndpoint ?? endpoint)!)}
            </p>
          )}
        </>
      )}
      {atOrPast("channel") && (
        <>
          <p style={{ color: "var(--term-gray6)" }}>
            <StepIcon spinning={atStep("channel")} /> Opening payment channel
          </p>
          {pastStep("channel") && (
            <p
              style={{
                color: "var(--term-gray6)",
                paddingLeft: "2ch",
              }}
            >
              channel{" "}
              <a
                href={`https://explore.tempo.xyz/receipt/${channelTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                <TruncatedHex hash={channelTxHash}>
                  {channelTxHash}
                </TruncatedHex>
              </a>
            </p>
          )}
          {pastStep("channel") && (
            <p
              style={{
                color: "var(--term-gray6)",
                paddingLeft: "2ch",
              }}
            >
              deposit{" "}
              <span style={{ color: "var(--term-amber9)" }}>5 USDC</span>
            </p>
          )}
        </>
      )}
      {atOrPast("pay") && (
        <>
          <p style={{ color: "var(--term-gray6)" }}>
            <StepIcon spinning={atStep("pay")} /> Fulfilling payment
          </p>
          {pastStep("pay") && (
            <p
              style={{
                color: "var(--term-gray6)",
                paddingLeft: "2ch",
              }}
            >
              tx{" "}
              <a
                href={`https://explore.tempo.xyz/receipt/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                <TruncatedHex hash={txHash}>{txHash}</TruncatedHex>
              </a>
            </p>
          )}
          {pastStep("pay") && (
            <p
              style={{
                color: "var(--term-gray6)",
                paddingLeft: "2ch",
              }}
            >
              amount{" "}
              <span style={{ color: "var(--term-amber9)" }}>0.001 USDC</span>
            </p>
          )}
        </>
      )}
      {/* biome-ignore format: contains unicode → */}
      {atOrPast("req200") && (
        <>
          <p style={{ color: "var(--term-gray6)" }}>
            <StepIcon spinning={atStep("req200")} /> GET {endpoint}
            {pastStep("req200") && (
              <>
                {" "}
                → <span style={{ color: "var(--term-green9)" }}>200 OK</span>
              </>
            )}
          </p>
          <p style={{ color: "var(--term-gray6)" }}>
            <span className="inline-block w-[1ch]" /> Authorization: Payment
          </p>
        </>
      )}
      {!paymentChannel && pastStep("req200") && (
        <>
          <BlankLine />
          {outputMode === "photo" && output.length > 0 ? (
            <PhotoOutput url={output[0]} />
          ) : (
            <pre
              className="whitespace-pre-wrap"
              style={{ color: "var(--term-gray10)" }}
            >
              {renderText(outputText)}
            </pre>
          )}
        </>
      )}
      {paymentChannel && atOrPast("stream") && (
        <>
          <BlankLine />
          {outputMode === "gallery" ? (
            <>
              <GalleryGrid
                urls={output.slice(0, tokenCount)}
                loading={tokenCount < output.length}
              />
              {/* biome-ignore format: contains unicode ✔︎ */}
              {tokenCount > 0 && (
                <p style={{ color: "var(--term-gray6)", marginTop: "0.5em" }}>
                  {tokenCount < output.length ? (
                    <Spinner />
                  ) : (
                    <span style={{ color: "var(--term-green9)" }}>✔︎</span>
                  )}{" "}
                  {tokenCount} photos —{" "}
                  <span style={{ color: "var(--term-amber9)" }}>
                    {(tokenCount * 0.01).toFixed(2)} USDC
                  </span>
                </p>
              )}
            </>
          ) : (
            <>
              <pre
                className="whitespace-pre-wrap"
                style={{ color: "var(--term-gray10)" }}
              >
                {outputText.slice(0, streamChars)}
              </pre>
              {/* biome-ignore format: contains unicode ✔︎ */}
              {tokenCount > 0 && (
                <p style={{ color: "var(--term-gray6)" }}>
                  {streamChars < outputText.length ? (
                    <Spinner />
                  ) : (
                    <span style={{ color: "var(--term-green9)" }}>✔︎</span>
                  )}{" "}
                  {tokenCount} tokens streamed —{" "}
                  <span style={{ color: "var(--term-amber9)" }}>
                    {(tokenCount * COST_PER_TOKEN).toFixed(4)} USDC
                  </span>
                </p>
              )}
            </>
          )}
        </>
      )}
      {atOrPast("closeChannel") && (
        <>
          <p style={{ color: "var(--term-gray6)" }}>
            <StepIcon spinning={atStep("closeChannel")} /> Closing payment
            channel
          </p>
          {pastStep("closeChannel") && (
            <p
              style={{
                color: "var(--term-gray6)",
                paddingLeft: "2ch",
              }}
            >
              tx{" "}
              <a
                href={`https://explore.tempo.xyz/receipt/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                <TruncatedHex hash={txHash}>{txHash}</TruncatedHex>
              </a>
            </p>
          )}
          {pastStep("closeChannel") &&
            (() => {
              const spent =
                outputMode === "gallery"
                  ? tokenCount * 0.01
                  : tokenCount * COST_PER_TOKEN;
              return (
                <>
                  <p
                    style={{
                      color: "var(--term-gray6)",
                      paddingLeft: "2ch",
                    }}
                  >
                    spent{" "}
                    <span style={{ color: "var(--term-amber9)" }}>
                      {spent.toFixed(outputMode === "gallery" ? 2 : 4)} USDC
                    </span>
                  </p>
                  <p
                    style={{
                      color: "var(--term-gray6)",
                      paddingLeft: "2ch",
                    }}
                  >
                    refunded{" "}
                    <span style={{ color: "var(--term-amber9)" }}>
                      {(5 - spent).toFixed(outputMode === "gallery" ? 2 : 4)}{" "}
                      USDC
                    </span>
                  </p>
                </>
              );
            })()}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stripe card form
// ---------------------------------------------------------------------------

type SavedCard = { last4: string; expiry: string };

function CardForm({
  onSubmit,
  completed = false,
  savedCard,
}: {
  onSubmit: (card: SavedCard) => void;
  completed?: boolean;
  savedCard?: SavedCard;
}) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [field, setField] = useState<"number" | "expiry" | "cvc" | "done">(
    completed || savedCard ? "done" : "number",
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (savedCard && !completed) onSubmit(savedCard);
  }, [savedCard, completed, onSubmit]);

  useEffect(() => {
    if (field !== "done") inputRef.current?.focus();
  }, [field]);

  if (savedCard) {
    return (
      <div style={{ paddingLeft: "2ch" }}>
        <p style={{ color: "var(--term-gray6)" }}>
          Using card:{" "}
          <span style={{ color: "var(--term-gray10)" }}>
            •••• •••• •••• {savedCard.last4}
          </span>
        </p>
      </div>
    );
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    if (field === "number" && cardNumber.trim()) setField("expiry");
    else if (field === "expiry" && expiry.trim()) setField("cvc");
    else if (field === "cvc" && cvc.trim()) {
      setField("done");
      const last4 = cardNumber.replace(/\s/g, "").slice(-4);
      onSubmit({ last4, expiry });
    }
  };

  const digits = cardNumber.replace(/\s/g, "");
  const last4 = digits.slice(-4);
  const maskedNumber = `•••• •••• •••• ${last4 || "••••"}`;
  const displayExpiry = expiry;
  const maskedCvc = "•••";

  const useTestCard = () => {
    setField("done");
    onSubmit({ last4: "4242", expiry: "12/34" });
  };

  return (
    <div className="flex flex-col" style={{ paddingLeft: "2ch" }}>
      <p style={{ color: "var(--term-gray6)" }}>
        Card number:{" "}
        {field === "number" ? (
          <>
            <BlockCursorInput
              ref={inputRef}
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              onKeyDown={handleKeyDown}
              className="term-url-input bg-transparent outline-none"
              style={{ color: "var(--term-gray10)" }}
              placeholder="4242 4242 4242 4242"
              autoComplete="off"
              data-1p-ignore
            />{" "}
            <button
              type="button"
              onClick={useTestCard}
              className="cursor-pointer hover:underline"
              style={{ color: "#635BFF" }}
            >
              [use test card]
            </button>{" "}
            <button
              type="button"
              onClick={useTestCard}
              className="cursor-pointer hover:underline"
              style={{ color: "#00D66F" }}
            >
              [use link]
            </button>
          </>
        ) : (
          <span style={{ color: "var(--term-gray10)" }}>
            {field === "done" ? maskedNumber : cardNumber}
          </span>
        )}
      </p>
      {field !== "number" && (
        <p style={{ color: "var(--term-gray6)" }}>
          Expiry:{" "}
          {field === "expiry" ? (
            <BlockCursorInput
              ref={inputRef}
              type="text"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              onKeyDown={handleKeyDown}
              className="term-url-input bg-transparent outline-none"
              style={{ color: "var(--term-gray10)" }}
              placeholder="MM/YY"
              autoComplete="off"
              data-1p-ignore
            />
          ) : (
            <span style={{ color: "var(--term-gray10)" }}>{displayExpiry}</span>
          )}
        </p>
      )}
      {field !== "number" && field !== "expiry" && (
        <p style={{ color: "var(--term-gray6)" }}>
          CVC:{" "}
          {field === "cvc" ? (
            <BlockCursorInput
              ref={inputRef}
              type="text"
              value={cvc}
              onChange={(e) => setCvc(e.target.value)}
              onKeyDown={handleKeyDown}
              className="term-url-input bg-transparent outline-none"
              style={{ color: "var(--term-gray10)" }}
              placeholder="123"
              autoComplete="off"
              data-1p-ignore
            />
          ) : (
            <span style={{ color: "var(--term-gray10)" }}>{maskedCvc}</span>
          )}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stripe payment steps
// ---------------------------------------------------------------------------

function StripeSteps({
  endpoint,
  output,
  outputMode,
  onDone,
  completed = false,
  savedCard,
  onCardSaved,
  demoClient,
  onContentReceived,
}: {
  endpoint: string;
  output: string[];
  outputMode?: "text" | "photo" | "gallery";
  onDone?: () => void;
  completed?: boolean;
  savedCard?: SavedCard;
  onCardSaved?: (card: SavedCard) => void;
  demoClient?: DemoClient | null;
  onContentReceived?: (content: string[]) => void;
}) {
  const [piId, setPiId] = useState(() => randomStripeId("pi_"));
  const doneCalled = useRef(false);
  const [, setCardSubmitted] = useState(completed);
  const liveStarted = useRef(false);
  const [liveCardSubmitted, setLiveCardSubmitted] = useState(false);

  const steps = useMemo<{ key: string; delay: number }[]>(() => {
    const d = (ms: number) => (SKIP_ANIMATION ? 0 : ms);
    return [
      { key: "req402", delay: d(1200) },
      { key: "cardInput", delay: 0 },
      { key: "createPI", delay: d(1500) },
      { key: "confirmPI", delay: d(1000) },
      { key: "req200", delay: d(1000) },
    ];
  }, []);

  const [step, setStep] = useState(() => (completed ? steps.length : 0));

  const currentKey = steps[step]?.key ?? "done";
  const pastStep = (key: string) => {
    const idx = steps.findIndex((s) => s.key === key);
    return idx !== -1 && step > idx;
  };
  const atOrPast = (key: string) => {
    const idx = steps.findIndex((s) => s.key === key);
    return idx !== -1 && step >= idx;
  };
  const atStep = (key: string) => currentKey === key;

  // Simulated mode: timed step progression
  useEffect(() => {
    if (demoClient) return;
    if (currentKey === "done") {
      if (!doneCalled.current) {
        doneCalled.current = true;
        onDone?.();
      }
      return;
    }
    if (currentKey === "cardInput") return;
    const delay = steps[step].delay;
    const timer = setTimeout(() => setStep((s) => s + 1), delay);
    return () => clearTimeout(timer);
  }, [demoClient, step, currentKey, onDone, steps]);

  // Live mode: visual req402, then wait for card, then real API call
  useEffect(() => {
    if (!demoClient || completed) return;
    // Advance req402 visually
    const timer = setTimeout(() => setStep(1), 800);
    return () => clearTimeout(timer);
  }, [demoClient, completed]);

  useEffect(() => {
    if (!demoClient || !liveCardSubmitted || liveStarted.current) return;
    liveStarted.current = true;

    (async () => {
      try {
        const createIdx = steps.findIndex((s) => s.key === "createPI");
        setStep(createIdx);

        const res = await demoClient.stripeFetch(endpoint);

        try {
          const receipt = Receipt.fromResponse(res);
          if (receipt.reference) setPiId(receipt.reference);
        } catch {
          // No receipt — keep random ID
        }

        setStep(createIdx + 1);
        await new Promise((r) => setTimeout(r, 600));

        const confirmIdx = steps.findIndex((s) => s.key === "confirmPI");
        setStep(confirmIdx + 1);
        await new Promise((r) => setTimeout(r, 600));

        const data = (await res.json()) as { lines: string[] };
        onContentReceived?.(data.lines);

        const req200Idx = steps.findIndex((s) => s.key === "req200");
        setStep(req200Idx + 1);
        await new Promise((r) => setTimeout(r, 400));

        setStep(steps.length);
      } catch (e) {
        console.error("Live Stripe fetch failed, using simulated content:", e);
        // Fall back to simulated steps
        const createIdx = steps.findIndex((s) => s.key === "createPI");
        setStep(createIdx);
        for (let i = createIdx; i <= steps.length; i++) {
          setStep(i);
          if (i < steps.length)
            await new Promise((r) => setTimeout(r, steps[i]?.delay ?? 600));
        }
      }
    })();
  }, [demoClient, liveCardSubmitted, steps, endpoint, onContentReceived]);

  // Live mode: call onDone when steps complete
  useEffect(() => {
    if (!demoClient) return;
    if (currentKey === "done" && !doneCalled.current) {
      doneCalled.current = true;
      onDone?.();
    }
  }, [demoClient, currentKey, onDone]);

  return (
    <div className="flex flex-col">
      <BlankLine />
      {/* biome-ignore format: contains unicode → */}
      {atOrPast("req402") && (
        <>
          <p style={{ color: "var(--term-gray6)" }}>
            <StepIcon spinning={atStep("req402")} /> GET {endpoint}
            {pastStep("req402") && (
              <>
                {" "}
                →{" "}
                <span style={{ color: "var(--term-amber9)" }}>
                  402 Payment Required
                </span>
              </>
            )}
          </p>
          {pastStep("req402") && (
            <p
              style={{
                color: "var(--term-gray6)",
                paddingLeft: "2ch",
              }}
            >
              WWW-Authenticate: Payment method=stripe intent=charge
            </p>
          )}
          {pastStep("req402") && serviceLabel(endpoint) && (
            <p
              style={{
                color: "var(--term-gray6)",
                paddingLeft: "2ch",
              }}
            >
              via {renderText(serviceLabel(endpoint)!)}
            </p>
          )}
        </>
      )}
      {atOrPast("cardInput") && (
        <CardForm
          completed={pastStep("cardInput")}
          savedCard={savedCard}
          onSubmit={(card) => {
            setCardSubmitted(true);
            onCardSaved?.(card);
            if (demoClient) {
              setLiveCardSubmitted(true);
            }
            setStep((s) => s + 1);
          }}
        />
      )}
      {atOrPast("createPI") && (
        <>
          <p style={{ color: "var(--term-gray6)" }}>
            <StepIcon spinning={atStep("createPI")} /> Creating PaymentIntent
          </p>
          {pastStep("createPI") && (
            <p
              style={{
                color: "var(--term-gray6)",
                paddingLeft: "2ch",
              }}
            >
              id {piId}
            </p>
          )}
          {pastStep("createPI") && (
            <p
              style={{
                color: "var(--term-gray6)",
                paddingLeft: "2ch",
              }}
            >
              amount{" "}
              <span style={{ color: "var(--term-amber9)" }}>
                ${LOOKUP_COST.toFixed(2)} USD
              </span>
            </p>
          )}
        </>
      )}
      {/* biome-ignore format: contains unicode → */}
      {atOrPast("confirmPI") && (
        <p style={{ color: "var(--term-gray6)" }}>
          <StepIcon spinning={atStep("confirmPI")} /> Confirming payment
          {pastStep("confirmPI") && (
            <>
              {" "}
              → <span style={{ color: "var(--term-green9)" }}>succeeded</span>
            </>
          )}
        </p>
      )}
      {/* biome-ignore format: contains unicode → */}
      {atOrPast("req200") && (
        <>
          <p style={{ color: "var(--term-gray6)" }}>
            <StepIcon spinning={atStep("req200")} /> GET {endpoint}
            {pastStep("req200") && (
              <>
                {" "}
                → <span style={{ color: "var(--term-green9)" }}>200 OK</span>
              </>
            )}
          </p>
          <p style={{ color: "var(--term-gray6)" }}>
            <span className="inline-block w-[1ch]" /> Authorization: Payment
          </p>
        </>
      )}
      {pastStep("req200") && output && output.length > 0 && (
        <>
          <BlankLine />
          {outputMode === "photo" ? (
            <PhotoOutput url={output[0]} />
          ) : (
            <div style={{ color: "var(--term-gray10)" }}>
              {output.map((line, i) => {
                const match = line.match(/^(\s*\S+\s+)(.*)$/);
                if (match) {
                  const indent = match[1].length;
                  return (
                    <pre
                      // biome-ignore lint/suspicious/noArrayIndexKey: static output lines never reorder
                      key={i}
                      className="whitespace-pre-wrap"
                      style={{
                        paddingLeft: `${indent}ch`,
                        textIndent: `-${indent}ch`,
                      }}
                    >
                      {renderText(line)}
                    </pre>
                  );
                }
                return (
                  <pre
                    // biome-ignore lint/suspicious/noArrayIndexKey: static output lines never reorder
                    key={i}
                    className="whitespace-pre-wrap"
                  >
                    {renderText(line)}
                  </pre>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wizard (interactive menu)
// ---------------------------------------------------------------------------

export type WalletState = {
  address: string;
  balance: number;
  created: boolean;
  funded: boolean;
  setBalance: (v: number) => void;
  setCreated: (v: boolean) => void;
  setFunded: (v: boolean) => void;
};

export const INITIAL_BALANCE = 100;

export type Run = {
  step: PaymentStepConfig;
  output: string[];
  url?: string;
  key: number;
  txHash?: string;
};

export function runCost(run: Run): number {
  const cost = run.step.cost;
  if (typeof cost === "function") return cost(run.output);
  return cost;
}

function scrollTerminalIntoView() {
  const el = document.querySelector("[data-terminal]");
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const offscreen = rect.bottom - window.innerHeight;
  if (offscreen > 0) {
    window.scrollBy({ top: offscreen + 64, behavior: "smooth" });
  }
}

function Wizard({
  steps,
  demoClient,
  onRestart,
  address,
  walletState,
  savedCard,
  setSavedCard,
}: {
  steps: PaymentStepConfig[];
  demoClient?: DemoClient | null;
  onRestart?: () => void;
  address: string;
  walletState: WalletState;
  savedCard: SavedCard | undefined;
  setSavedCard: (card: SavedCard | undefined) => void;
}) {
  const [selected, setSelected] = useState(0);
  const [chosen, setChosen] = useState<PaymentStepConfig | null>(null);
  const [chosenOutput, setChosenOutput] = useState<string[]>([]);
  const [waitingForUrl, setWaitingForUrl] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [chosenUrl, setChosenUrl] = useState<string | undefined>();
  const urlRef = useRef<HTMLInputElement>(null);
  const currentTxHashRef = useRef<string | undefined>(undefined);
  const [walletExistedAtMount] = useState(() => walletState.created);
  const [quit, setQuit] = useState(false);
  const [runs, setRuns] = useState<Run[]>([]);
  const [runKey, setRunKey] = useState(0);

  const currentItems: (PaymentStepConfig | "quit")[] =
    runs.length > 0 ? [...steps, "quit"] : steps;

  const handleContentReceived = (content: string[]) => {
    setChosenOutput(content);
  };

  const confirm = (index?: number) => {
    const item = currentItems[index ?? selected];
    if (item === "quit") {
      const usdcSpent = runs
        .filter((r) => r.step.type !== "stripe")
        .reduce((sum, r) => sum + runCost(r), 0);
      walletState.setBalance(INITIAL_BALANCE - usdcSpent);
      setQuit(true);
      document
        .querySelector(".landing-ctas")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const step = item;
    if (step.skipPrompt) {
      if (step.pickOutput) setChosenOutput(step.pickOutput());
      setChosenUrl(undefined);
      setChosen(step);
      scrollTerminalIntoView();
      return;
    }
    setWaitingForUrl(true);
    setUrlInput("");
    setTimeout(() => urlRef.current?.focus(), 0);
  };

  const submitUrl = () => {
    if (!urlInput.trim()) return;
    const step = currentItems[selected] as PaymentStepConfig;
    if (step.pickOutput) setChosenOutput(step.pickOutput());
    setChosenUrl(urlInput.trim());
    setWaitingForUrl(false);
    setChosen(step);
    scrollTerminalIntoView();
  };

  const handleDone = () => {
    setRuns((prev) => [
      ...prev,
      {
        step: chosen!,
        output: chosenOutput,
        url: chosenUrl,
        key: runKey,
        txHash: currentTxHashRef.current,
      },
    ]);
    setChosenUrl(undefined);
    currentTxHashRef.current = undefined;
    setRunKey((k) => k + 1);
    setChosen(null);
    setSelected(0);
  };

  useEffect(() => {
    if (!quit) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") onRestart?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [quit, onRestart]);

  useEffect(() => {
    if (chosen || quit || waitingForUrl) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((s) => (s - 1 + currentItems.length) % currentItems.length);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((s) => (s + 1) % currentItems.length);
      } else if (e.key === "Enter") {
        confirm();
      }
    };
    document
      .querySelector("[data-terminal]")
      ?.setAttribute("data-wizard-ready", "");
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document
        .querySelector("[data-terminal]")
        ?.removeAttribute("data-wizard-ready");
    };
  });

  const renderPaymentSteps = (
    stepConfig: PaymentStepConfig,
    output: string[],
    key: number,
    opts?: {
      isRestart?: boolean;
      onDone?: () => void;
      completed?: boolean;
      url?: string;
      txHash?: string;
    },
  ) => {
    const isActive = !opts?.completed;
    const liveEndpoint = stepConfig.liveEndpoint?.(opts?.url ?? "");

    if (stepConfig.type === "stripe") {
      return (
        <StripeSteps
          key={key}
          endpoint={liveEndpoint ?? stepConfig.endpoint}
          output={output}
          outputMode={stepConfig.outputMode}
          onDone={opts?.onDone}
          completed={opts?.completed}
          savedCard={savedCard}
          onCardSaved={setSavedCard}
          demoClient={isActive ? demoClient : undefined}
          onContentReceived={isActive ? handleContentReceived : undefined}
        />
      );
    }

    return (
      <AsyncSteps
        key={key}
        endpoint={stepConfig.endpoint}
        liveEndpoint={liveEndpoint}
        isRestart={opts?.isRestart}
        output={output}
        outputMode={stepConfig.outputMode}
        walletState={walletState}
        paymentChannel={stepConfig.type === "tempo-session"}
        onDone={opts?.onDone}
        completed={opts?.completed}
        demoClient={isActive ? demoClient : undefined}
        onContentReceived={isActive ? handleContentReceived : undefined}
        initialTxHash={opts?.txHash}
        onTxHash={
          isActive
            ? (hash) => {
                currentTxHashRef.current = hash;
              }
            : undefined
        }
      />
    );
  };

  return (
    <div className="flex flex-col">
      {runs.map((run, runIndex) => {
        const runItems: (PaymentStepConfig | "quit")[] =
          runIndex > 0 ? [...steps, "quit"] : steps;
        return (
          <div key={run.key}>
            <p style={{ color: "var(--term-gray10)" }}>
              What would you like to do?
            </p>
            <div className="flex flex-col" style={{ paddingLeft: "1rem" }}>
              {runItems.map((item) => {
                const label = item === "quit" ? "Quit" : item.label;
                const isChosen = item !== "quit" && item === run.step;
                return (
                  <p
                    key={label}
                    style={{
                      color: isChosen
                        ? "var(--term-pink9)"
                        : "var(--term-gray6)",
                    }}
                  >
                    {isChosen ? (
                      <>
                        <CssTriangle />{" "}
                      </>
                    ) : (
                      "  "
                    )}
                    {label}
                    {item !== "quit" && (
                      <span className="ml-2">({item.methodLabel})</span>
                    )}
                  </p>
                );
              })}
            </div>
            {run.url && run.step.prompt && (
              <p style={{ color: "var(--term-gray6)" }}>
                {run.step.prompt.label}:{" "}
                <span style={{ color: "var(--term-gray10)" }}>{run.url}</span>
              </p>
            )}
            {renderPaymentSteps(run.step, run.output, run.key, {
              isRestart: walletExistedAtMount || runIndex > 0,
              completed: true,
              url: run.url,
              txHash: run.txHash,
            })}
            <BlankLine />
          </div>
        );
      })}

      {!quit && (
        <div>
          <p style={{ color: "var(--term-gray10)" }}>
            What would you like to do?
          </p>
          <div className="flex flex-col" style={{ paddingLeft: "1rem" }}>
            {currentItems.map((item, i) => {
              const label = item === "quit" ? "Quit" : item.label;
              return (
                <button
                  key={label}
                  type="button"
                  className={`w-fit cursor-pointer text-left ${chosen || waitingForUrl ? "pointer-events-none" : ""}`}
                  style={{
                    color:
                      selected === i
                        ? "var(--term-pink9)"
                        : "var(--term-gray6)",
                  }}
                  onMouseEnter={() =>
                    !chosen && !waitingForUrl && setSelected(i)
                  }
                  onClick={() => {
                    if (!chosen && !waitingForUrl) {
                      setSelected(i);
                      confirm(i);
                    }
                  }}
                >
                  {selected === i ? (
                    <>
                      <CssTriangle />{" "}
                    </>
                  ) : (
                    "  "
                  )}
                  {label}
                  {item !== "quit" && (
                    <span className="ml-2">({item.methodLabel})</span>
                  )}
                </button>
              );
            })}
          </div>
          {/* biome-ignore format: contains unicode ↑↓ */}
          {!chosen && !waitingForUrl && (
            <p style={{ color: "var(--term-gray5)" }}>
              Use ↑↓ arrows and Enter to select
            </p>
          )}
          {waitingForUrl && (
            <p className="flex" style={{ color: "var(--term-gray6)" }}>
              <span className="shrink-0 whitespace-pre">
                {(currentItems[selected] as PaymentStepConfig).prompt?.label ??
                  "Enter prompt"}
                :{" "}
              </span>
              <BlockCursorInput
                ref={urlRef}
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitUrl();
                }}
                className="term-url-input min-w-0 flex-1 bg-transparent outline-none"
                style={{ color: "var(--term-gray10)" }}
                placeholder={
                  (currentItems[selected] as PaymentStepConfig).prompt
                    ?.placeholder ?? ""
                }
              />
            </p>
          )}
          {chosen?.prompt && chosenUrl && (
            <p style={{ color: "var(--term-gray6)" }}>
              {chosen.prompt.label}:{" "}
              <span style={{ color: "var(--term-gray10)" }}>{chosenUrl}</span>
            </p>
          )}
          {chosen &&
            renderPaymentSteps(chosen, chosenOutput, runKey, {
              isRestart: walletExistedAtMount || runs.length > 0,
              onDone: handleDone,
              url: chosenUrl,
            })}
        </div>
      )}

      {quit &&
        (() => {
          const usdcSpent = runs
            .filter((r) => r.step.type !== "stripe")
            .reduce((sum, r) => sum + runCost(r), 0);
          const usdSpent = runs
            .filter((r) => r.step.type === "stripe")
            .reduce((sum, r) => sum + runCost(r), 0);
          const balance = INITIAL_BALANCE - usdcSpent;
          return (
            <div className="flex flex-col">
              <p style={{ color: "var(--term-gray10)" }}>
                <strong>Machine Payments Protocol</strong> — open, programmable,
                Internet-native payments.
              </p>
              <p style={{ color: "var(--term-gray10)" }}>
                {"\u00a0\u00a0"}Spent
              </p>
              <SummaryRow label="Total">
                <span style={{ color: "var(--term-amber9)" }}>
                  ${(usdcSpent + usdSpent).toFixed(4)}
                </span>
              </SummaryRow>
              <SummaryRow label="Tempo">
                <span style={{ color: "var(--term-amber9)" }}>
                  {usdcSpent.toFixed(4)} USDC
                </span>
              </SummaryRow>
              <SummaryRow label="Stripe">
                <span style={{ color: "var(--term-amber9)" }}>
                  {usdSpent.toFixed(2)} USD
                </span>
              </SummaryRow>
              <p style={{ color: "var(--term-gray10)" }}>
                {"\u00a0\u00a0"}Wallet
              </p>
              <SummaryRow label="Address">
                <a
                  href={`https://explore.tempo.xyz/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  <TruncatedHex hash={address}>{address}</TruncatedHex>
                </a>
              </SummaryRow>
              <SummaryRow label="Balance">
                <span style={{ color: "var(--term-amber9)" }}>
                  {balance.toFixed(4)} USDC
                </span>
              </SummaryRow>
              <button
                type="button"
                className="cursor-pointer text-left"
                style={{ color: "var(--term-gray6)" }}
                onClick={() => onRestart?.()}
              >
                [Exited — press Enter to restart]
              </button>
            </div>
          );
        })()}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gallery step (session-based multi-run with count picker)
// ---------------------------------------------------------------------------

const GALLERY_COST = 0.01;
const GALLERY_COUNTS = [3, 5, 10] as const;

type GalleryPhase =
  | "gate"
  | "setup"
  | "picker"
  | "fetch"
  | "closing"
  | "restart";

function GalleryStep({
  step,
  walletState,
}: {
  step: PaymentStepConfig;
  walletState: WalletState;
}) {
  const [phase, setPhase] = useState<GalleryPhase>("gate");
  const [setupStep, setSetupStep] = useState(0);
  const [channelTxHash] = useState(() => randomTxHash());
  const [closeTxHash] = useState(() => randomTxHash());
  const [selected, setSelected] = useState(0);
  const [urls, setUrls] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(0);
  const [targetCount, setTargetCount] = useState(0);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [runIndex, setRunIndex] = useState(0);
  const [pastRuns, setPastRuns] = useState<{ count: number; urls: string[] }[]>(
    [],
  );

  const setupSteps = useMemo(() => {
    const d = (ms: number) => (SKIP_ANIMATION ? 0 : ms);
    return [
      { key: "wallet", delay: d(600) },
      { key: "fund", delay: d(1500) },
      { key: "req402", delay: d(1200) },
      { key: "channel", delay: d(1200) },
    ];
  }, []);

  const setupKey = setupSteps[setupStep]?.key ?? "done";
  const setupPast = (key: string) => {
    const idx = setupSteps.findIndex((s) => s.key === key);
    return idx !== -1 && setupStep > idx;
  };
  const setupAtOrPast = (key: string) => {
    const idx = setupSteps.findIndex((s) => s.key === key);
    return idx !== -1 && setupStep >= idx;
  };
  const setupAt = (key: string) => setupKey === key;

  // Setup phase: timed step progression
  useEffect(() => {
    if (phase !== "setup") return;
    if (setupKey === "done") {
      setPhase("picker");
      return;
    }
    const delay = setupSteps[setupStep].delay;
    const timer = setTimeout(() => {
      if (setupKey === "wallet") walletState.setCreated(true);
      if (setupKey === "fund") {
        walletState.setFunded(true);
        walletState.setBalance(INITIAL_BALANCE);
      }
      setSetupStep((s) => s + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [phase, setupStep, setupKey, setupSteps, walletState]);

  // Fetch phase: reveal photos one at a time
  useEffect(() => {
    if (phase !== "fetch") return;
    if (revealed < targetCount) {
      const delay = SKIP_ANIMATION ? 0 : 400;
      const timer = setTimeout(() => setRevealed((r) => r + 1), delay);
      return () => clearTimeout(timer);
    }
    // Run complete
    const runUrls = urls.slice(urls.length - targetCount);
    setPastRuns((prev) => [...prev, { count: targetCount, urls: runUrls }]);
    setTotalPhotos((t) => t + targetCount);
    setRunIndex((r) => r + 1);
    setSelected(0);
    setPhase("picker");
  }, [phase, revealed, targetCount, urls]);

  // Closing phase: timed
  useEffect(() => {
    if (phase !== "closing") return;
    const delay = SKIP_ANIMATION ? 0 : 1000;
    const timer = setTimeout(() => setPhase("restart"), delay);
    return () => clearTimeout(timer);
  }, [phase]);

  // Picker items
  const pickerItems = useMemo(() => {
    const items: { label: string; value: number | "done" }[] =
      GALLERY_COUNTS.map((n) => ({
        label: `${n} photos ($${(n * GALLERY_COST).toFixed(2)})`,
        value: n as number,
      }));
    if (runIndex > 0) items.push({ label: "Done", value: "done" });
    return items;
  }, [runIndex]);

  const pickCount = (count: number) => {
    const newUrls = Array.from(
      { length: count },
      (_, i) =>
        `https://picsum.photos/seed/mpp-gallery-${runIndex}-${i}/200/200`,
    );
    setUrls((prev) => [...prev, ...newUrls]);
    setTargetCount(count);
    setRevealed(0);
    setPhase("fetch");
  };

  // Keyboard handling for gate, picker, restart
  useEffect(() => {
    if (phase === "gate") {
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Enter") setPhase("setup");
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }
    if (phase === "picker") {
      const handler = (e: KeyboardEvent) => {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelected((s) => (s - 1 + pickerItems.length) % pickerItems.length);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelected((s) => (s + 1) % pickerItems.length);
        } else if (e.key === "Enter") {
          const item = pickerItems[selected];
          if (item.value === "done") {
            setPhase("closing");
          } else {
            pickCount(item.value);
          }
        }
      };
      document
        .querySelector("[data-terminal]")
        ?.setAttribute("data-demo-ready", "");
      window.addEventListener("keydown", handler);
      return () => {
        window.removeEventListener("keydown", handler);
        document
          .querySelector("[data-terminal]")
          ?.removeAttribute("data-demo-ready");
      };
    }
    if (phase === "restart") {
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
          setPhase("gate");
          setSetupStep(0);
          setUrls([]);
          setRevealed(0);
          setTargetCount(0);
          setTotalPhotos(0);
          setRunIndex(0);
          setPastRuns([]);
          setSelected(0);
        }
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }
  });

  if (phase === "gate") {
    return (
      <div className="flex flex-col">
        <BlankLine />
        <button
          type="button"
          data-demo-ready
          className="w-fit cursor-pointer text-left"
          style={{ color: "var(--term-pink9)" }}
          onClick={() => setPhase("setup")}
        >
          <CssTriangle /> Run demo
        </button>
        <p style={{ color: "var(--term-gray5)" }}>
          Press Enter or click to start
        </p>
      </div>
    );
  }

  const spent = totalPhotos * GALLERY_COST;

  return (
    <div className="flex flex-col">
      {/* Setup steps */}
      <BlankLine />
      {setupAtOrPast("wallet") && (
        <p style={{ color: "var(--term-gray6)" }}>
          <StepIcon spinning={setupAt("wallet")} /> Creating wallet{" "}
          <TruncatedHex hash={walletState.address}>
            {walletState.address}
          </TruncatedHex>
        </p>
      )}
      {setupAtOrPast("fund") && (
        <p style={{ color: "var(--term-gray6)" }}>
          <StepIcon spinning={setupAt("fund")} /> Funding wallet with{" "}
          <span style={{ color: "var(--term-amber9)" }}>100 USDC</span>
        </p>
      )}
      {/* biome-ignore format: contains unicode → */}
      {setupAtOrPast("req402") && (
        <>
          <p style={{ color: "var(--term-gray6)" }}>
            <StepIcon spinning={setupAt("req402")} /> GET {step.endpoint}
            {setupPast("req402") && (
              <>
                {" "}
                →{" "}
                <span style={{ color: "var(--term-amber9)" }}>
                  402 Payment Required
                </span>
              </>
            )}
          </p>
          {setupPast("req402") && (
            <p style={{ color: "var(--term-gray6)", paddingLeft: "2ch" }}>
              WWW-Authenticate: Payment
            </p>
          )}
        </>
      )}
      {setupAtOrPast("channel") && (
        <>
          <p style={{ color: "var(--term-gray6)" }}>
            <StepIcon spinning={setupAt("channel")} /> Opening payment channel
          </p>
          {setupPast("channel") && (
            <p style={{ color: "var(--term-gray6)", paddingLeft: "2ch" }}>
              channel{" "}
              <TruncatedHex hash={channelTxHash}>{channelTxHash}</TruncatedHex>
            </p>
          )}
          {setupPast("channel") && (
            <p style={{ color: "var(--term-gray6)", paddingLeft: "2ch" }}>
              deposit{" "}
              <span style={{ color: "var(--term-amber9)" }}>5 USDC</span>
            </p>
          )}
        </>
      )}

      {/* Past runs */}
      {pastRuns.map((run, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: stable run order
        <div key={i}>
          <BlankLine />
          <p style={{ color: "var(--term-gray10)" }}>How many photos?</p>
          <div style={{ paddingLeft: "1rem" }}>
            {GALLERY_COUNTS.map((n) => (
              <p
                key={n}
                style={{
                  color:
                    n === run.count ? "var(--term-pink9)" : "var(--term-gray6)",
                }}
              >
                {n === run.count ? (
                  <>
                    <CssTriangle />{" "}
                  </>
                ) : (
                  "  "
                )}
                {n} photos (${(n * GALLERY_COST).toFixed(2)})
              </p>
            ))}
            {i > 0 && <p style={{ color: "var(--term-gray6)" }}>{"  "}Done</p>}
          </div>
          <BlankLine />
          <GalleryGrid urls={run.urls} />
          {/* biome-ignore format: contains unicode ✔︎ */}
          <p style={{ color: "var(--term-gray6)", marginTop: "0.5em" }}>
            <span style={{ color: "var(--term-green9)" }}>✔︎</span>{" "}
            {run.count} photos —{" "}
            <span style={{ color: "var(--term-amber9)" }}>
              {(run.count * GALLERY_COST).toFixed(2)} USDC
            </span>
          </p>
        </div>
      ))}

      {/* Current picker or fetch */}
      {phase === "picker" && (
        <>
          <BlankLine />
          <p style={{ color: "var(--term-gray10)" }}>How many photos?</p>
          <div style={{ paddingLeft: "1rem" }}>
            {pickerItems.map((item, i) => (
              <button
                key={item.label}
                type="button"
                className="w-fit cursor-pointer text-left block"
                style={{
                  color:
                    selected === i ? "var(--term-pink9)" : "var(--term-gray6)",
                }}
                onMouseEnter={() => setSelected(i)}
                onClick={() => {
                  setSelected(i);
                  if (item.value === "done") {
                    setPhase("closing");
                  } else {
                    pickCount(item.value);
                  }
                }}
              >
                {selected === i ? (
                  <>
                    <CssTriangle />{" "}
                  </>
                ) : (
                  "  "
                )}
                {item.label}
              </button>
            ))}
          </div>
          {/* biome-ignore format: contains unicode ↑↓ */}
          <p style={{ color: "var(--term-gray5)" }}>
            Use ↑↓ arrows and Enter to select
          </p>
        </>
      )}

      {phase === "fetch" && (
        <>
          <BlankLine />
          <p style={{ color: "var(--term-gray10)" }}>How many photos?</p>
          <div style={{ paddingLeft: "1rem" }}>
            {pickerItems.map((item) => (
              <p
                key={item.label}
                style={{
                  color:
                    item.value === targetCount
                      ? "var(--term-pink9)"
                      : "var(--term-gray6)",
                }}
              >
                {item.value === targetCount ? (
                  <>
                    <CssTriangle />{" "}
                  </>
                ) : (
                  "  "
                )}
                {item.label}
              </p>
            ))}
          </div>
          <BlankLine />
          <GalleryGrid
            urls={urls.slice(
              urls.length - targetCount,
              urls.length - targetCount + revealed,
            )}
            loading={revealed < targetCount}
          />
          {/* biome-ignore format: contains unicode ✔︎ */}
          {revealed > 0 && (
            <p style={{ color: "var(--term-gray6)", marginTop: "0.5em" }}>
              {revealed < targetCount ? (
                <Spinner />
              ) : (
                <span style={{ color: "var(--term-green9)" }}>✔︎</span>
              )}{" "}
              {revealed} photos —{" "}
              <span style={{ color: "var(--term-amber9)" }}>
                {(revealed * GALLERY_COST).toFixed(2)} USDC
              </span>
            </p>
          )}
        </>
      )}

      {/* Close channel */}
      {(phase === "closing" || phase === "restart") && (
        <>
          <BlankLine />
          {/* Show "Done" as chosen in the picker */}
          <p style={{ color: "var(--term-gray10)" }}>How many photos?</p>
          <div style={{ paddingLeft: "1rem" }}>
            {pickerItems.map((item) => (
              <p
                key={item.label}
                style={{
                  color:
                    item.value === "done"
                      ? "var(--term-pink9)"
                      : "var(--term-gray6)",
                }}
              >
                {item.value === "done" ? (
                  <>
                    <CssTriangle />{" "}
                  </>
                ) : (
                  "  "
                )}
                {item.label}
              </p>
            ))}
          </div>
          <BlankLine />
          <p style={{ color: "var(--term-gray6)" }}>
            <StepIcon spinning={phase === "closing"} /> Closing payment channel
          </p>
          {phase === "restart" && (
            <>
              <p style={{ color: "var(--term-gray6)", paddingLeft: "2ch" }}>
                tx <TruncatedHex hash={closeTxHash}>{closeTxHash}</TruncatedHex>
              </p>
              <p style={{ color: "var(--term-gray6)", paddingLeft: "2ch" }}>
                spent{" "}
                <span style={{ color: "var(--term-amber9)" }}>
                  {spent.toFixed(2)} USDC
                </span>
              </p>
              <p style={{ color: "var(--term-gray6)", paddingLeft: "2ch" }}>
                refunded{" "}
                <span style={{ color: "var(--term-amber9)" }}>
                  {(5 - spent).toFixed(2)} USDC
                </span>
              </p>
              <button
                type="button"
                className="cursor-pointer text-left"
                style={{ color: "var(--term-gray6)" }}
                onClick={() => {
                  setPhase("gate");
                  setSetupStep(0);
                  setUrls([]);
                  setRevealed(0);
                  setTargetCount(0);
                  setTotalPhotos(0);
                  setRunIndex(0);
                  setPastRuns([]);
                  setSelected(0);
                }}
              >
                [Press Enter or click to restart]
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single payment step (no wizard menu)
// ---------------------------------------------------------------------------

function SingleStep({
  step,
  demoClient,
  walletState,
  savedCard,
  setSavedCard,
}: {
  step: PaymentStepConfig;
  demoClient?: DemoClient | null;
  walletState: WalletState;
  savedCard: SavedCard | undefined;
  setSavedCard: (card: SavedCard | undefined) => void;
}) {
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [key, setKey] = useState(0);
  const [output, setOutput] = useState<string[]>(
    () => step.pickOutput?.() ?? [],
  );

  const restart = () => {
    setStarted(false);
    setDone(false);
    setOutput(step.pickOutput?.() ?? []);
    setKey((k) => k + 1);
  };

  useEffect(() => {
    if (started && !done) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (done) restart();
        else setStarted(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  if (!started) {
    return (
      <div className="flex flex-col">
        <BlankLine />
        <button
          type="button"
          data-demo-ready
          className="w-fit cursor-pointer text-left"
          style={{ color: "var(--term-pink9)" }}
          onClick={() => setStarted(true)}
        >
          <CssTriangle /> Run demo
        </button>
        <p style={{ color: "var(--term-gray5)" }}>
          Press Enter or click to start
        </p>
      </div>
    );
  }

  const liveEndpoint = step.liveEndpoint?.("");

  return (
    <>
      {step.type === "stripe" ? (
        <StripeSteps
          key={key}
          endpoint={liveEndpoint ?? step.endpoint}
          output={output}
          outputMode={step.outputMode}
          savedCard={savedCard}
          onCardSaved={setSavedCard}
          demoClient={demoClient}
          onContentReceived={setOutput}
          onDone={() => setDone(true)}
        />
      ) : (
        <AsyncSteps
          key={key}
          endpoint={step.endpoint}
          liveEndpoint={liveEndpoint}
          output={output}
          outputMode={step.outputMode}
          walletState={walletState}
          paymentChannel={step.type === "tempo-session"}
          demoClient={demoClient}
          onContentReceived={setOutput}
          onDone={() => setDone(true)}
        />
      )}
      {done && (
        <button
          type="button"
          className="cursor-pointer text-left"
          style={{ color: "var(--term-gray6)" }}
          onClick={restart}
        >
          [Press Enter or click to restart]
        </button>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Exported Terminal component
// ---------------------------------------------------------------------------

function TerminalComponent({
  className,
  steps,
}: {
  className?: string;
  steps: StepConfig[];
}) {
  const { client: demoClient } = useDemoClient();

  const commandsStep = steps[0]?.type === "commands" ? steps[0] : null;
  const contentSteps = commandsStep ? steps.slice(1) : steps;

  const { showLogin, showPrompt, started, lineIndex, charIndex, done } =
    useTypewriter(commandsStep?.commands ?? []);
  const commands = commandsStep?.commands ?? [];

  const isClassic =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("mode") === "classic";
  const [wizardKey, setWizardKey] = useState(0);
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState(0);
  const [created, setCreated] = useState(false);
  const [funded, setFunded] = useState(false);
  const [savedCard, setSavedCard] = useState<SavedCard | undefined>();
  const walletState: WalletState = {
    address,
    balance,
    created,
    funded,
    setBalance,
    setCreated,
    setFunded,
  };
  useEffect(() => {
    if (demoClient) {
      setAddress(demoClient.address);
    } else {
      randomAddress().then(setAddress);
    }
  }, [demoClient]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;
    const LINE_HEIGHT = 24;
    const checkScroll = () => {
      requestAnimationFrame(() => {
        const distanceFromBottom =
          scrollEl.scrollHeight - scrollEl.clientHeight - scrollEl.scrollTop;
        autoScrollRef.current = distanceFromBottom < LINE_HEIGHT;
      });
    };
    scrollEl.addEventListener("wheel", checkScroll, { passive: true });
    scrollEl.addEventListener("touchmove", checkScroll, { passive: true });
    return () => {
      scrollEl.removeEventListener("wheel", checkScroll);
      scrollEl.removeEventListener("touchmove", checkScroll);
    };
  }, []);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    const contentEl = contentRef.current;
    if (!scrollEl || !contentEl) return;
    const LINE_HEIGHT = 24; // 1.5rem at 16px base
    const observer = new ResizeObserver(() => {
      if (!autoScrollRef.current) return;
      const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
      // Snap to line boundary so topmost visible line is never cut off
      const snapped = Math.ceil(maxScroll / LINE_HEIGHT) * LINE_HEIGHT;
      scrollEl.scrollTop = snapped;
    });
    observer.observe(contentEl);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`terminal-theme ${className ?? ""}`}
      style={{
        fontFamily: 'var(--font-mono, "Geist Mono", monospace)',
        height: "100%",
        minHeight: 0,
        userSelect: "text",
        WebkitUserSelect: "text",
      }}
    >
      <div
        data-terminal
        className="flex flex-col overflow-hidden rounded-xl"
        style={{
          height: "100%",
          minHeight: 0,
          borderColor: "var(--vocs-border-color-primary)",
          borderWidth: 1,
          borderStyle: "solid",
          backgroundColor: "var(--term-bg2)",
        }}
      >
        {/* Title bar */}
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{ backgroundColor: "var(--term-bg2)" }}
        >
          <span
            className="size-3 rounded-full"
            style={{ backgroundColor: "var(--term-gray4)" }}
          />
          <span
            className="size-3 rounded-full"
            style={{ backgroundColor: "var(--term-gray4)" }}
          />
          <span
            className="size-3 rounded-full"
            style={{ backgroundColor: "var(--term-gray4)" }}
          />
        </div>

        {/* Terminal body */}
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 pb-5 break-words text-[0.8125rem] md:text-[0.9rem] leading-[1.35rem] md:leading-[1.5rem]"
          style={{
            backgroundColor: "var(--term-bg2)",
          }}
        >
          <div ref={contentRef}>
            {/* Preload fallback fonts for unicode glyphs not in Geist Mono */}
            <span
              aria-hidden
              style={{
                position: "absolute",
                opacity: 0,
                pointerEvents: "none",
              }}
            >
              ✔︎▸↑↓→
            </span>
            <div className="h-2" />
            <p style={{ color: "var(--term-gray6)" }}>
              mpp.dev@{__COMMIT_SHA__.slice(0, 7)} (released{" "}
              {timeAgo(__COMMIT_TIMESTAMP__)})
            </p>
            {showLogin && (
              <p
                className="hidden md:block"
                style={{ color: "var(--term-gray6)" }}
              >
                Last login: Wed Oct 29 22:30:00 1969 on ttys000
              </p>
            )}
            {showPrompt && !started && (
              <p style={{ color: "var(--term-gray6)" }}>
                <span style={{ color: "var(--term-gray10)" }}>$ ~ </span>
                <span
                  className="ml-0.5 inline-block h-[1.1em] w-[0.6em] align-text-bottom"
                  style={{
                    backgroundColor: "var(--term-pink9)",
                    transform: "translateY(-2px)",
                    animation: "blink 1.4s step-end infinite",
                  }}
                />
              </p>
            )}
            {started &&
              commands.map((line, i) => {
                const visible =
                  i < lineIndex
                    ? line
                    : i === lineIndex
                      ? line.slice(0, charIndex)
                      : "";
                const isActive = i === lineIndex && !done;
                const isCommand = line !== "" && !line.startsWith("#");

                return (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static lines never reorder
                  <Fragment key={i}>
                    <p
                      style={{
                        color: "var(--term-gray6)",
                        visibility: i <= lineIndex ? "visible" : "hidden",
                      }}
                    >
                      <span style={{ color: "var(--term-gray10)" }}>$ ~ </span>
                      {isCommand
                        ? (() => {
                            const spaceIdx = visible.indexOf(" ");
                            if (spaceIdx === -1)
                              return (
                                <span style={{ color: "var(--term-blue9)" }}>
                                  {renderText(visible)}
                                </span>
                              );
                            return (
                              <>
                                <span style={{ color: "var(--term-blue9)" }}>
                                  {visible.slice(0, spaceIdx)}
                                </span>
                                <span style={{ color: "var(--term-gray10)" }}>
                                  {renderText(visible.slice(spaceIdx))}
                                </span>
                              </>
                            );
                          })()
                        : renderText(visible)}
                      <span
                        className="ml-0.5 inline-block h-[1.1em] w-[0.6em] align-text-bottom"
                        style={{
                          backgroundColor: "var(--term-pink9)",
                          visibility: isActive ? "visible" : "hidden",
                          transform: "translateY(-2px)",
                        }}
                      />
                    </p>
                    {i === 0 && lineIndex > 0 && <QuickstartOutput />}
                  </Fragment>
                );
              })}

            {done &&
              contentSteps.map((contentStep, i) => {
                if (contentStep.type === "wizard") {
                  const wizardOptions = isClassic
                    ? [_poem(), _ascii(), _lookup()]
                    : contentStep.options;
                  return (
                    <Wizard
                      // biome-ignore lint/suspicious/noArrayIndexKey: static steps never reorder
                      key={`${wizardKey}-${i}`}
                      steps={wizardOptions}
                      demoClient={demoClient}
                      address={address}
                      walletState={walletState}
                      savedCard={savedCard}
                      setSavedCard={setSavedCard}
                      onRestart={() => setWizardKey((k) => k + 1)}
                    />
                  );
                }
                if (
                  contentStep.type === "tempo-charge" ||
                  contentStep.type === "tempo-session" ||
                  contentStep.type === "stripe"
                ) {
                  if (contentStep.outputMode === "gallery") {
                    return (
                      <GalleryStep
                        // biome-ignore lint/suspicious/noArrayIndexKey: static steps never reorder
                        key={i}
                        step={contentStep}
                        walletState={walletState}
                      />
                    );
                  }
                  return (
                    <SingleStep
                      // biome-ignore lint/suspicious/noArrayIndexKey: static steps never reorder
                      key={i}
                      step={contentStep}
                      demoClient={demoClient}
                      walletState={walletState}
                      savedCard={savedCard}
                      setSavedCard={setSavedCard}
                    />
                  );
                }
                return null;
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

export const Terminal = Object.assign(TerminalComponent, {
  article: _article,
  ascii: _ascii,
  charge: _charge,
  chat: _chat,
  commands: _commands,
  gallery: _gallery,
  image: _image,
  lookup: _lookup,
  photo: _photo,
  ping: _ping,
  poem: _poem,
  search: _search,
  session: _session,
  stripe: _stripe,
  wizard: _wizard,
});

// Named re-exports for MDX/RSC contexts where Object.assign
// properties are not available across the server-client boundary.
export {
  _article as article,
  _ascii as ascii,
  _charge as charge,
  _chat as chat,
  _commands as commands,
  _gallery as gallery,
  _image as image,
  _lookup as lookup,
  _photo as photo,
  _ping as ping,
  _poem as poem,
  _search as search,
  _session as session,
  _stripe as stripe,
  _wizard as wizard,
};
