"use client";

import { Receipt } from "mppx";
import type { ReactNode } from "react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
// import { ASCII_MPP } from "./AsciiLogo";
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

function BlankLine() {
  return <div className="h-6" />;
}

function PhotoOutput({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <div>
      <div
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
      </div>
      <p style={{ color: "var(--term-gray5)", fontSize: 11, marginTop: 4 }}>
        Simulated result
      </p>
      <div className="flex gap-3" style={{ marginTop: 2 }}>
        <a
          href={url}
          download
          className="cursor-pointer"
          style={{
            color: "#635BFF",
            fontSize: 12,
            fontFamily: "var(--font-mono)",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--term-gray10)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#635BFF";
          }}
        >
          [⬇ Save]
        </a>
        <button
          type="button"
          className="cursor-pointer"
          style={{
            color: "#635BFF",
            fontSize: 12,
            fontFamily: "var(--font-mono)",
            background: "none",
            border: "none",
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--term-gray10)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#635BFF";
          }}
          onClick={() => {
            navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? "Copied!" : "[⬆ Share]"}
        </button>
      </div>
    </div>
  );
}

function GalleryThumb({
  url,
  animate = true,
}: {
  url: string;
  animate?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
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
          transition: animate ? "opacity 0.5s" : undefined,
          opacity: loaded ? 1 : 0,
        }}
      />
    </div>
  );
}

function GalleryGrid({
  urls,
  loading = false,
  animate = true,
}: {
  urls: string[];
  loading?: boolean;
  animate?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {urls.map((url) => (
        <GalleryThumb key={url} url={url} animate={animate} />
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
  description,
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
  description?: string;
}) {
  const { address, funded, setFunded } = walletState;
  const [txHash, setTxHash] = useState(() => initialTxHash ?? randomTxHash());
  const [channelTxHash, setChannelTxHash] = useState(() => randomTxHash());
  const doneCalled = useRef(false);
  const liveStarted = useRef(false);

  const outputText = (output ?? []).join("\n");

  const skipSetup = walletState.created && walletState.funded;

  const [steps] = useState(() => {
    const needsFunding = !funded || walletState.balance <= 0;
    const d = (ms: number) => (SKIP_ANIMATION ? 0 : ms);
    const s: { key: string; delay: number }[] = [];
    if (!skipSetup) {
      s.push({ key: "wallet", delay: isRestart ? 0 : d(600) });
      if (needsFunding || (completed && !isRestart))
        s.push({ key: "fund", delay: demoClient ? 0 : d(1500) });
    }
    s.push({ key: "req402", delay: d(500) });
    if (paymentChannel) {
      s.push({ key: "channel", delay: d(500) });
      s.push({ key: "deposit", delay: d(500) });
      s.push({ key: "req200", delay: d(500) });
      s.push({ key: "stream", delay: 0 });
      s.push({ key: "closeChannel", delay: d(500) });
    } else {
      s.push({ key: "pay", delay: d(500) });
      s.push({ key: "req200", delay: d(500) });
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
        // Wallet step (only if not already set up)
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

            // Advance through deposit → req200 → stream
            setStep(payIdx + 1);
            await new Promise((r) => setTimeout(r, 400));
            const depositIdx = steps.findIndex((s) => s.key === "deposit");
            if (depositIdx !== -1) {
              setStep(depositIdx + 1);
              await new Promise((r) => setTimeout(r, 400));
            }
            const req200Idx = steps.findIndex((s) => s.key === "req200");
            if (req200Idx !== -1) {
              setStep(req200Idx + 1);
              await new Promise((r) => setTimeout(r, 200));
            }

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

            const data = (await res.json()) as {
              lines?: string[];
              url?: string;
            };
            liveContent = data.lines ?? (data.url ? [data.url] : []);
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
        const lastIdx = paymentChannel
          ? steps.findIndex((s) => s.key === "stream")
          : payIdx + 1;
        for (let i = lastIdx + 1; i <= steps.length; i++) {
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
      {description && (
        <>
          <BlankLine />
          <p style={{ color: "var(--term-gray5)" }}># {description}</p>
        </>
      )}
      {!description && <BlankLine />}
      {atOrPast("wallet") && (
        <p style={{ color: "var(--term-gray6)" }}>
          <StepIcon spinning={atStep("wallet")} />{" "}
          {isRestart ? "Using" : "Create a"} wallet{" "}
          <span style={{ color: "var(--term-gray5)" }}>⋅</span>{" "}
          <a
            href={`https://explore.tempo.xyz/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            style={{ color: "var(--term-blue9)" }}
          >
            <TruncatedHex hash={address}>{address}</TruncatedHex>
          </a>
        </p>
      )}
      {atOrPast("fund") && (
        <p style={{ color: "var(--term-gray6)" }}>
          <StepIcon spinning={atStep("fund")} /> Add test funds{" "}
          <span style={{ color: "var(--term-gray5)" }}>⋅</span>{" "}
          <span style={{ color: "var(--term-amber9)" }}>100 USDC</span>
        </p>
      )}
      {/* biome-ignore format: contains unicode → */}
      {atOrPast("req402") && (
        <p style={{ color: "var(--term-gray6)" }}>
          <StepIcon spinning={atStep("req402")} /> Call {endpoint}
          {pastStep("req402") && (
            <>
              {" "}
              → <span style={{ color: "var(--term-orange9)" }}>402</span>{" "}
              <span style={{ color: "var(--term-gray6)" }}>
                (payment required)
              </span>
            </>
          )}
        </p>
      )}
      {atOrPast("channel") && (
        <p style={{ color: "var(--term-gray6)" }}>
          <StepIcon spinning={atStep("channel")} /> Open payment channel
          {pastStep("channel") && (
            <>
              {" "}
              <span style={{ color: "var(--term-gray5)" }}>⋅</span>{" "}
              <a
                href={`https://explore.tempo.xyz/receipt/${channelTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
                style={{ color: "var(--term-blue9)" }}
              >
                {channelTxHash.slice(0, 6)}…{channelTxHash.slice(-4)}
              </a>
            </>
          )}
        </p>
      )}
      {atOrPast("deposit") && (
        <p style={{ color: "var(--term-gray6)" }}>
          <StepIcon spinning={atStep("deposit")} /> Deposit funds{" "}
          <span style={{ color: "var(--term-gray5)" }}>⋅</span>{" "}
          <span style={{ color: "var(--term-green9)" }}>5 USDC</span>
        </p>
      )}
      {atOrPast("pay") && (
        <p style={{ color: "var(--term-gray6)" }}>
          <StepIcon spinning={atStep("pay")} /> Fulfill payment
          {pastStep("pay") && (
            <>
              {" "}
              <span style={{ color: "var(--term-gray5)" }}>⋅</span>{" "}
              <a
                href={`https://explore.tempo.xyz/receipt/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
                style={{ color: "var(--term-blue9)" }}
              >
                {txHash.slice(0, 6)}…{txHash.slice(-4)}
              </a>
            </>
          )}
        </p>
      )}
      {/* biome-ignore format: contains unicode → */}
      {atOrPast("req200") && (
        <p style={{ color: "var(--term-gray6)" }}>
          <StepIcon spinning={atStep("req200")} /> Call {endpoint}
          {pastStep("req200") && (
            <>
              {" "}
              → <span style={{ color: "var(--term-orange9)" }}>200</span>{" "}
              <span style={{ color: "var(--term-gray6)" }}>(success)</span>
            </>
          )}
        </p>
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
          <BlankLine />
        </>
      )}
      {paymentChannel &&
        atOrPast("stream") &&
        (outputMode === "gallery" ? (
          <>
            <BlankLine />
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
                <span style={{ color: "var(--term-green9)" }}>
                  {(tokenCount * 0.01).toFixed(2)} USDC
                </span>
              </p>
            )}
          </>
        ) : (
          <>
            <BlankLine />
            <p
              style={{
                color: "var(--term-gray5)",
                borderBottom: "1px solid var(--term-gray4)",
                paddingBottom: "0.25rem",
                marginBottom: "0.5rem",
              }}
            >
              {" "}
            </p>
            <div
              style={{
                color: "var(--term-gray5)",
                fontSize: "inherit",
                lineHeight: "1.5",
              }}
            >
              <p>
                Available:{" "}
                <span style={{ color: "var(--term-green9)" }}>
                  {(5 - tokenCount * COST_PER_TOKEN).toFixed(4)}
                </span>{" "}
                USDC in channel
              </p>
              <p>
                Spent:{" "}
                <span style={{ color: "var(--term-amber9)" }}>
                  {(tokenCount * COST_PER_TOKEN).toFixed(4)}
                </span>{" "}
                USDC paid
              </p>
              <p>
                Streamed:{" "}
                <span style={{ color: "var(--term-gray10)" }}>
                  {tokenCount}
                </span>{" "}
                tokens received
              </p>
            </div>
            <BlankLine />
            <pre
              className="whitespace-pre-wrap"
              style={{ color: "var(--term-gray10)" }}
            >
              {outputText.slice(0, streamChars)}
            </pre>
            {streamChars >= outputText.length && (
              <>
                <BlankLine />
                <p
                  style={{
                    color: "var(--term-gray5)",
                    borderBottom: "1px solid var(--term-gray4)",
                    paddingBottom: "0.25rem",
                  }}
                >
                  {" "}
                </p>
              </>
            )}
          </>
        ))}
      {atOrPast("closeChannel") && (
        <>
          <BlankLine />
          {/* biome-ignore format: contains unicode ✔︎ ⋅ */}
          {pastStep("closeChannel") && tokenCount > 0 && (
            <p style={{ color: "var(--term-gray6)" }}>
              <span style={{ color: "var(--term-green9)" }}>✔︎</span>{" "}
              {tokenCount} tokens streamed
            </p>
          )}
          <p style={{ color: "var(--term-gray6)" }}>
            <StepIcon spinning={atStep("closeChannel")} /> Closed payment
            channel
            {pastStep("closeChannel") && (
              <>
                {" "}
                <span style={{ color: "var(--term-gray5)" }}>⋅</span>{" "}
                <a
                  href={`https://explore.tempo.xyz/receipt/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  style={{ color: "var(--term-blue9)" }}
                >
                  {txHash.slice(0, 6)}…{txHash.slice(-4)}
                </a>
              </>
            )}
          </p>
          {pastStep("closeChannel") &&
            (() => {
              const spent =
                outputMode === "gallery"
                  ? tokenCount * 0.01
                  : tokenCount * COST_PER_TOKEN;
              return (
                <>
                  {/* biome-ignore format: contains unicode ✔︎ */}
                  <p style={{ color: "var(--term-gray6)" }}>
                    <span style={{ color: "var(--term-green9)" }}>✔︎</span> Spent{" "}
                    <span style={{ color: "var(--term-green9)" }}>
                      {spent.toFixed(outputMode === "gallery" ? 2 : 4)} USDC
                    </span>
                  </p>
                  <p style={{ color: "var(--term-gray6)" }}>
                    <span style={{ color: "var(--term-green9)" }}>✔︎</span>{" "}
                    Refunded{" "}
                    <span style={{ color: "var(--term-green9)" }}>
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
  const defaultCardNumber = "4242 4242 4242 4242";
  const defaultExpiry = "12/34";
  const defaultCvc = "123";

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

  const applyTestCard = () => {
    setField("done");
    onSubmit({ last4: "4242", expiry: defaultExpiry });
  };

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
    if (e.key === "Tab") {
      e.preventDefault();
      if (field === "number" && !cardNumber.trim()) {
        applyTestCard();
      }
      return;
    }
    if (e.key !== "Enter") return;
    if (field === "number") {
      if (!cardNumber.trim()) {
        applyTestCard();
        return;
      }
      setField("expiry");
    } else if (field === "expiry") {
      if (!expiry.trim()) setExpiry(defaultExpiry);
      setField("cvc");
    } else if (field === "cvc") {
      const resolvedExpiry = expiry.trim() || defaultExpiry;
      const resolvedCvc = cvc.trim() || defaultCvc;
      if (!expiry.trim()) setExpiry(resolvedExpiry);
      if (!cvc.trim()) setCvc(resolvedCvc);
      setField("done");
      const last4 = cardNumber.replace(/\s/g, "").slice(-4);
      onSubmit({ last4, expiry: resolvedExpiry });
    }
  };

  const digits = cardNumber.replace(/\s/g, "");
  const last4 = digits.slice(-4);
  const maskedNumber = `•••• •••• •••• ${last4 || "••••"}`;
  const displayExpiry = expiry;
  const maskedCvc = "•••";

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
              placeholder={defaultCardNumber}
              autoComplete="off"
              data-1p-ignore
            />{" "}
            <button
              type="button"
              onClick={applyTestCard}
              className="cursor-pointer hover:underline"
              style={{ color: "#00D66F" }}
            >
              [Use Stripe Link]
            </button>{" "}
            <button
              type="button"
              onClick={applyTestCard}
              className="cursor-pointer hover:underline"
              style={{ color: "#635BFF" }}
            >
              [use test card]
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
  description,
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
  description?: string;
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

        const data = (await res.json()) as {
          lines?: string[];
        };
        onContentReceived?.(data.lines ?? []);

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
      {description && (
        <>
          <BlankLine />
          <p style={{ color: "var(--term-gray5)" }}># {description}</p>
        </>
      )}
      {!description && <BlankLine />}
      {/* biome-ignore format: contains unicode → */}
      {atOrPast("req402") && (
        <p style={{ color: "var(--term-gray6)" }}>
          <StepIcon spinning={atStep("req402")} /> Call {endpoint}
          {pastStep("req402") && (
            <>
              {" "}
              → <span style={{ color: "var(--term-orange9)" }}>402</span>{" "}
              <span style={{ color: "var(--term-gray6)" }}>
                (payment required)
              </span>
            </>
          )}
        </p>
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
              ID {piId}
            </p>
          )}
          {pastStep("createPI") && (
            <p
              style={{
                color: "var(--term-gray6)",
                paddingLeft: "2ch",
              }}
            >
              Amount{" "}
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
        <p style={{ color: "var(--term-gray6)" }}>
          <StepIcon spinning={atStep("req200")} /> Call {endpoint}
          {pastStep("req200") && (
            <>
              {" "}
              → <span style={{ color: "var(--term-orange9)" }}>200</span>{" "}
              <span style={{ color: "var(--term-gray6)" }}>(success)</span>
            </>
          )}
        </p>
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
          <BlankLine />
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
  address,
  walletState,
  savedCard,
  setSavedCard,
}: {
  steps: PaymentStepConfig[];
  demoClient?: DemoClient | null;
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
  const [urlError, setUrlError] = useState("");
  const urlRef = useRef<HTMLInputElement>(null);
  const currentTxHashRef = useRef<string | undefined>(undefined);
  const [runs, setRuns] = useState<Run[]>([]);
  const [runKey, setRunKey] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const menuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Wallet setup phase — runs before menu is shown
  const [walletSetupStep, setWalletSetupStep] = useState(() =>
    walletState.created && walletState.funded ? 2 : 0,
  );
  const walletReady = walletSetupStep >= 2;

  useEffect(() => {
    if (walletState.created && walletState.funded) {
      setWalletSetupStep(2);
      return;
    }
    if (walletSetupStep === 0) {
      const d = SKIP_ANIMATION ? 0 : 600;
      const timer = setTimeout(() => {
        walletState.setCreated(true);
        setWalletSetupStep(1);
      }, d);
      return () => clearTimeout(timer);
    }
    if (walletSetupStep === 1) {
      const d = demoClient ? 0 : SKIP_ANIMATION ? 0 : 1500;
      const doFund = async () => {
        if (demoClient) {
          try {
            await demoClient.fundWallet();
          } catch (e) {
            console.error("Live funding failed, continuing:", e);
          }
        }
        walletState.setFunded(true);
        walletState.setBalance(INITIAL_BALANCE);
        setWalletSetupStep(2);
      };
      if (d === 0) {
        doFund();
      } else {
        const timer = setTimeout(doFund, d);
        return () => clearTimeout(timer);
      }
    }
  }, [walletSetupStep, walletState, demoClient]);

  const currentItems = steps;

  const handleContentReceived = (content: string[]) => {
    setChosenOutput(content);
  };

  const confirm = (index?: number) => {
    const step = currentItems[index ?? selected];
    if (step.skipPrompt) {
      if (step.pickOutput) setChosenOutput(step.pickOutput());
      setChosenUrl(undefined);
      setChosen(step);
      scrollTerminalIntoView();
      return;
    }
    setWaitingForUrl(true);
    setUrlInput("");
    setUrlError("");
    setTimeout(() => urlRef.current?.focus(), 0);
  };

  const submitUrl = () => {
    const step = currentItems[selected];
    const defaultInput = step.prompt?.placeholder?.trim() ?? "";
    const resolvedInput = urlInput.trim() || defaultInput;
    if (!resolvedInput) return;
    const prefix = step.prompt?.prefix ?? "";
    const fullUrl = resolvedInput.startsWith(prefix)
      ? resolvedInput
      : `${prefix}${resolvedInput}`;
    if (fullUrl.startsWith("http://") || fullUrl.startsWith("https://")) {
      try {
        new URL(fullUrl);
      } catch {
        setUrlError("Enter a valid URL");
        return;
      }
    }
    setUrlError("");
    if (step.pickOutput) setChosenOutput(step.pickOutput());
    setChosenUrl(fullUrl);
    setWaitingForUrl(false);
    setChosen(step);
    scrollTerminalIntoView();
  };

  // Show menu immediately on first load (once wallet ready)
  useEffect(() => {
    if (walletReady && runs.length === 0 && !menuVisible) {
      setMenuVisible(true);
    }
  }, [walletReady, runs.length, menuVisible]);

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
    setSelected((s) => (s + 1) % currentItems.length);
    setMenuVisible(false);
    const delay = SKIP_ANIMATION ? 0 : 5000;
    menuTimerRef.current = setTimeout(() => setMenuVisible(true), delay);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (menuTimerRef.current) clearTimeout(menuTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (chosen || !menuVisible || waitingForUrl) return;
    const terminal = document.querySelector("[data-terminal]");
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((s) => (s - 1 + currentItems.length) % currentItems.length);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((s) => (s + 1) % currentItems.length);
      } else if (e.key === "Tab") {
        if (
          terminal?.contains(document.activeElement) ||
          document.activeElement === document.body
        ) {
          e.preventDefault();
          confirm();
        }
      } else if (e.key === "Enter") {
        confirm();
      }
    };
    terminal?.setAttribute("data-wizard-ready", "");
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      terminal?.removeAttribute("data-wizard-ready");
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
          description={stepConfig.description}
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
        description={stepConfig.description}
      />
    );
  };

  return (
    <div className="flex flex-col">
      {/* Wallet setup phase */}
      <BlankLine />
      {/* biome-ignore format: contains unicode ✔︎ ⋅ */}
      <p style={{ color: "var(--term-gray6)" }}>
        <StepIcon spinning={walletSetupStep < 1} /> Create a wallet{" "}
        <span style={{ color: "var(--term-gray5)" }}>⋅</span>{" "}
        <a
          href={`https://explore.tempo.xyz/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
          style={{ color: "var(--term-blue9)" }}
        >
          {address.slice(0, 6)}…{address.slice(-4)}
        </a>
      </p>
      {walletSetupStep >= 1 && (
        <p style={{ color: "var(--term-gray6)" }}>
          <StepIcon spinning={walletSetupStep < 2} /> Add test funds{" "}
          <span style={{ color: "var(--term-gray5)" }}>⋅</span>{" "}
          <span style={{ color: "var(--term-amber9)" }}>100 USDC</span>
        </p>
      )}

      {/* Completed runs */}
      {runs.map((run) => (
        <div key={run.key}>
          <BlankLine />
          <p style={{ color: "var(--term-gray10)" }}>
            What would you like to do?
          </p>
          <BlankLine />
          <div className="flex flex-col">
            {steps.map((item) => {
              const isChosen = item === run.step;
              return (
                <p
                  key={item.label}
                  style={{
                    color: isChosen ? "var(--term-pink9)" : "var(--term-gray6)",
                  }}
                >
                  {isChosen ? (
                    <>
                      <CssTriangle />{" "}
                    </>
                  ) : (
                    "  "
                  )}
                  {item.label}
                  <span className="ml-2">({item.methodLabel})</span>
                </p>
              );
            })}
          </div>
          {run.url && run.step.prompt && (
            <p style={{ color: "var(--term-pink9)" }}>
              {run.step.prompt.label}:{" "}
              <span style={{ color: "var(--term-gray10)" }}>{run.url}</span>
            </p>
          )}
          {renderPaymentSteps(run.step, run.output, run.key, {
            isRestart: true,
            completed: true,
            url: run.url,
            txHash: run.txHash,
          })}
          <BlankLine />
        </div>
      ))}

      {/* Current wizard menu */}
      {menuVisible && (
        <div
          style={{
            animation: runs.length > 0 ? "fadeIn 0.5s ease-out" : undefined,
          }}
        >
          <div
            style={{
              borderTop: "1px solid var(--term-gray4)",
              margin: "0.5rem 0",
            }}
          />
          <BlankLine />
          <p style={{ color: "var(--term-gray10)" }}>
            What would you like to do?
          </p>
          <BlankLine />
          <div className="flex flex-col term-wizard-list">
            {currentItems.map((item, i) => (
              <button
                key={item.label}
                type="button"
                className={`term-wizard-btn w-fit cursor-pointer text-left ${chosen || waitingForUrl ? "pointer-events-none" : ""}`}
                style={{
                  color:
                    selected === i ? "var(--term-pink9)" : "var(--term-gray6)",
                }}
                onMouseEnter={() => !chosen && !waitingForUrl && setSelected(i)}
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
                {item.label}
                <span className="ml-2">({item.methodLabel})</span>
              </button>
            ))}
          </div>
          {/* biome-ignore format: contains unicode ↑↓⇥⏎ */}
          {!chosen && !waitingForUrl && (
            <p
              className="hidden md:block"
              style={{
                color: "var(--term-gray5)",
                marginTop: "auto",
                paddingTop: "1rem",
              }}
            >
              Use ↑↓ or ⇥ to select, and ⏎ to confirm.
            </p>
          )}
          {waitingForUrl && (
            <>
              <BlankLine />
              <p className="flex" style={{ color: "var(--term-pink9)" }}>
                <span className="shrink-0 whitespace-pre">
                  {currentItems[selected].prompt?.label ?? "Enter prompt"}:{" "}
                </span>
                {currentItems[selected].prompt?.prefix && (
                  <span style={{ color: "var(--term-gray10)" }}>
                    {currentItems[selected].prompt?.prefix}
                  </span>
                )}
                <BlockCursorInput
                  ref={urlRef}
                  type="text"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    if (urlError) setUrlError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Tab") {
                      e.preventDefault();
                      const placeholder =
                        currentItems[selected].prompt?.placeholder ?? "";
                      if (!urlInput && placeholder) setUrlInput(placeholder);
                    } else if (e.key === "Enter") {
                      submitUrl();
                    }
                  }}
                  className="term-url-input min-w-0 flex-1 bg-transparent outline-none"
                  style={{ color: "var(--term-gray10)" }}
                  placeholder={currentItems[selected].prompt?.placeholder ?? ""}
                />
              </p>
              {urlError && (
                <p style={{ color: "var(--term-red7)" }}>{urlError}</p>
              )}
            </>
          )}
          {chosen?.prompt && chosenUrl && (
            <>
              <BlankLine />
              <p style={{ color: "var(--term-pink9)" }}>
                {chosen.prompt.label}:{" "}
                <span style={{ color: "var(--term-gray10)" }}>{chosenUrl}</span>
              </p>
            </>
          )}
          {chosen &&
            renderPaymentSteps(chosen, chosenOutput, runKey, {
              isRestart: true,
              onDone: handleDone,
              url: chosenUrl,
            })}
        </div>
      )}
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
      const terminal = document.querySelector("[data-terminal]");
      const handler = (e: KeyboardEvent) => {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelected((s) => (s - 1 + pickerItems.length) % pickerItems.length);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelected((s) => (s + 1) % pickerItems.length);
        } else if (e.key === "Tab") {
          if (
            terminal?.contains(document.activeElement) ||
            document.activeElement === document.body
          ) {
            e.preventDefault();
            const item = pickerItems[selected];
            if (item.value === "done") {
              setPhase("closing");
            } else {
              pickCount(item.value);
            }
          }
        } else if (e.key === "Enter") {
          const item = pickerItems[selected];
          if (item.value === "done") {
            setPhase("closing");
          } else {
            pickCount(item.value);
          }
        }
      };
      terminal?.setAttribute("data-demo-ready", "");
      window.addEventListener("keydown", handler);
      return () => {
        window.removeEventListener("keydown", handler);
        terminal?.removeAttribute("data-demo-ready");
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
      {/* biome-ignore format: contains unicode ⋅ */}
      {setupAtOrPast("wallet") && (
        <p style={{ color: "var(--term-gray6)" }}>
          <StepIcon spinning={setupAt("wallet")} /> Create a wallet{" "}
          <span style={{ color: "var(--term-gray5)" }}>⋅</span>{" "}
          <a
            href={`https://explore.tempo.xyz/address/${walletState.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            style={{ color: "var(--term-blue9)" }}
          >
            {walletState.address.slice(0, 6)}…{walletState.address.slice(-4)}
          </a>
        </p>
      )}
      {setupAtOrPast("fund") && (
        <p style={{ color: "var(--term-gray6)" }}>
          <StepIcon spinning={setupAt("fund")} /> Add test funds{" "}
          <span style={{ color: "var(--term-gray5)" }}>⋅</span>{" "}
          <span style={{ color: "var(--term-amber9)" }}>100 USDC</span>
        </p>
      )}
      {/* biome-ignore format: contains unicode → */}
      {setupAtOrPast("req402") && (
        <p style={{ color: "var(--term-gray6)" }}>
          <StepIcon spinning={setupAt("req402")} /> Call {step.endpoint}
          {setupPast("req402") && (
            <>
              {" "}
              → <span style={{ color: "var(--term-orange9)" }}>402</span>{" "}
              <span style={{ color: "var(--term-gray6)" }}>
                (payment required)
              </span>
            </>
          )}
        </p>
      )}
      {setupAtOrPast("channel") && (
        <p style={{ color: "var(--term-gray6)" }}>
          <StepIcon spinning={setupAt("channel")} /> Open payment channel
          {setupPast("channel") && (
            <>
              {" "}
              <span style={{ color: "var(--term-gray5)" }}>⋅</span>{" "}
              <a
                href={`https://explore.tempo.xyz/receipt/${channelTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
                style={{ color: "var(--term-blue9)" }}
              >
                {channelTxHash.slice(0, 6)}…{channelTxHash.slice(-4)}
              </a>
            </>
          )}
        </p>
      )}
      {setupPast("channel") && (
        <p style={{ color: "var(--term-gray6)" }}>
          <StepIcon spinning={false} /> Deposit funds{" "}
          <span style={{ color: "var(--term-gray5)" }}>⋅</span>{" "}
          <span style={{ color: "var(--term-amber9)" }}>5 USDC</span>
        </p>
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
          <GalleryGrid urls={run.urls} animate={false} />
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
                className="term-wizard-btn w-fit cursor-pointer text-left block"
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
          {/* biome-ignore format: contains unicode ↑↓⇥⏎ */}
          <p className="hidden md:block" style={{ color: "var(--term-gray5)", marginTop: "1rem" }}>
            Use ↑↓ or ⇥ to select, and ⏎ to confirm.
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
          {/* biome-ignore format: contains unicode ✔︎ ⋅ */}
          {phase === "restart" && (
            <p style={{ color: "var(--term-gray6)" }}>
              <span style={{ color: "var(--term-green9)" }}>✔︎</span> Spent{" "}
              <span style={{ color: "var(--term-green9)" }}>
                {spent.toFixed(2)} USDC
              </span>
            </p>
          )}
          <p style={{ color: "var(--term-gray6)" }}>
            <StepIcon spinning={phase === "closing"} /> Closed payment channel
            {phase === "restart" && (
              <>
                {" "}
                <span style={{ color: "var(--term-gray5)" }}>⋅</span>{" "}
                <a
                  href={`https://explore.tempo.xyz/receipt/${closeTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  style={{ color: "var(--term-blue9)" }}
                >
                  {closeTxHash.slice(0, 6)}…{closeTxHash.slice(-4)}
                </a>
              </>
            )}
          </p>
          {phase === "restart" && (
            <>
              {/* biome-ignore format: contains unicode ✔︎ */}
              <p style={{ color: "var(--term-gray6)" }}>
                <span style={{ color: "var(--term-green9)" }}>✔︎</span>
                {" "}Refunded{" "}
                <span style={{ color: "var(--term-green9)" }}>
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
  const [liveTime] = useState(() => {
    const fmt = (d: Date) => {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")} ${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
    };
    const key = "mpp-terminal-last-visit";
    const stored =
      typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
    const now = new Date();
    if (typeof localStorage !== "undefined")
      localStorage.setItem(key, now.toISOString());
    if (stored) return fmt(new Date(stored));
    return fmt(now);
  });
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
  const [showTopFade, setShowTopFade] = useState(false);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;
    const LINE_HEIGHT = 24;
    const checkScroll = () => {
      requestAnimationFrame(() => {
        const distanceFromBottom =
          scrollEl.scrollHeight - scrollEl.clientHeight - scrollEl.scrollTop;
        autoScrollRef.current = distanceFromBottom < LINE_HEIGHT;
        setShowTopFade(scrollEl.scrollTop > 10);
      });
    };
    scrollEl.addEventListener("scroll", checkScroll, { passive: true });
    scrollEl.addEventListener("wheel", checkScroll, { passive: true });
    scrollEl.addEventListener("touchmove", checkScroll, { passive: true });
    return () => {
      scrollEl.removeEventListener("scroll", checkScroll);
      scrollEl.removeEventListener("wheel", checkScroll);
      scrollEl.removeEventListener("touchmove", checkScroll);
    };
  }, []);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    const contentEl = contentRef.current;
    if (!scrollEl || !contentEl) return;
    const observer = new ResizeObserver(() => {
      if (!autoScrollRef.current) return;
      scrollEl.scrollTo({
        top: scrollEl.scrollHeight - scrollEl.clientHeight,
        behavior: "smooth",
      });
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
            className="rounded-full"
            style={{
              width: 14,
              height: 14,
              backgroundColor: "var(--term-gray4)",
            }}
          />
          <span
            className="rounded-full"
            style={{
              width: 14,
              height: 14,
              backgroundColor: "var(--term-gray4)",
            }}
          />
          <span
            className="rounded-full"
            style={{
              width: 14,
              height: 14,
              backgroundColor: "var(--term-gray4)",
            }}
          />
          <span
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: "0.9375rem",
              color: "var(--term-green9)",
            }}
          >
            ./demo.sh
          </span>
          <button
            type="button"
            onClick={() => {
              setWizardKey((k) => k + 1);
              setCreated(false);
              setFunded(false);
              setBalance(0);
              setSavedCard(undefined);
            }}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--term-gray5)",
              padding: 2,
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--term-gray10)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--term-gray5)";
            }}
            aria-label="Restart demo"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-label="Restart"
            >
              <title>Restart</title>
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
          </button>
        </div>

        {/* Top gradient fade */}
        {showTopFade && (
          <div
            style={{
              position: "absolute",
              top: 44,
              left: 0,
              right: 0,
              height: 24,
              background:
                "linear-gradient(to bottom, var(--term-bg2), transparent)",
              zIndex: 2,
              pointerEvents: "none",
            }}
          />
        )}

        {/* Terminal body */}
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 pb-5 break-words text-[0.8125rem] md:text-[0.9rem] leading-[1.35rem] md:leading-[1.5rem] md:overscroll-contain"
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
            {/* ASCII logo temporarily disabled
            <div
              style={{
                position: "relative",
                overflow: "hidden",
                height: 72,
                marginBottom: "0.25rem",
              }}
            >
              <pre
                style={{
                  color: "var(--term-gray5)",
                  fontSize: "3.2px",
                  lineHeight: 1.15,
                  margin: 0,
                  letterSpacing: "0.5px",
                  transformOrigin: "top left",
                  whiteSpace: "pre",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {ASCII_MPP.trimStart()}
              </pre>
            </div>
            */}
            <p style={{ color: "var(--term-gray6)" }}>
              mpp.dev@{__COMMIT_SHA__.slice(0, 7)} (released{" "}
              {timeAgo(__COMMIT_TIMESTAMP__)})
            </p>
            {showLogin && (
              <p
                className="hidden md:block"
                style={{ color: "var(--term-gray6)" }}
              >
                Last visit: {liveTime} on ttys000
              </p>
            )}
            {showPrompt && !started && (
              <>
                <BlankLine />
                <p style={{ color: "var(--term-gray6)" }}>
                  <span style={{ color: "var(--term-gray10)" }}>{"$"} </span>
                  <span
                    className="ml-0.5 inline-block h-[1.1em] w-[0.6em] align-text-bottom"
                    style={{
                      backgroundColor: "var(--term-pink9)",
                      transform: "translateY(-2px)",
                      animation: "blink 1.4s step-end infinite",
                    }}
                  />
                </p>
              </>
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
                    {i === 0 && <BlankLine />}
                    <p
                      style={{
                        color: "var(--term-gray6)",
                        visibility: i <= lineIndex ? "visible" : "hidden",
                      }}
                    >
                      <span style={{ color: "var(--term-gray10)" }}>
                        {"$"}{" "}
                      </span>
                      <span
                        style={{
                          color:
                            i === 0 && isCommand
                              ? "var(--term-green9)"
                              : "var(--term-gray10)",
                        }}
                      >
                        {renderText(visible)}
                      </span>
                      <span
                        className="ml-0.5 inline-block h-[1.1em] w-[0.6em] align-text-bottom"
                        style={{
                          backgroundColor: "var(--term-pink9)",
                          visibility: isActive ? "visible" : "hidden",
                          transform: "translateY(-2px)",
                        }}
                      />
                    </p>
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
