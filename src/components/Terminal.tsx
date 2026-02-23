"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { AsciiLogo } from "./AsciiLogo";
import { BlockCursorInput } from "./BlockCursorInput";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(iso: string) {
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

const linkPattern = /(mpp\.sh\/\S+|x\.com\/mpp|Tempo\.xyz|Stripe\.com)/g;

const SUMMARY_LABEL_WIDTH = "5.5em";

function BlankLine() {
	return <div className="h-6" />;
}

function SummaryRow({
	label,
	children,
}: { label: string; children: ReactNode }) {
	return (
		<p style={{ color: "var(--term-gray6)" }}>
			{"  "}
			<span
				style={{ display: "inline-block", width: SUMMARY_LABEL_WIDTH }}
			>
				{label}
			</span>
			{children}
		</p>
	);
}

function TruncatedHex({
	hash,
	children,
}: { hash: string; children: ReactNode }) {
	return (
		<>
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
		const href =
			part === "Tempo.xyz"
				? "https://tempo.xyz"
				: part === "Stripe.com"
					? "https://stripe.com"
					: `https://${part}`;
		const color = part === "Stripe.com" ? "#635BFF" : "var(--term-teal9)";
		return (
			<a
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

const lines = ["./demo.sh"];

const BASE_DELAY = 45;
const JITTER = 50;
const LINE_DELAY = 500;

function useTypewriter() {
	const [showLogin, setShowLogin] = useState(false);
	const [showPrompt, setShowPrompt] = useState(false);
	const [started, setStarted] = useState(false);
	const [lineIndex, setLineIndex] = useState(0);
	const [charIndex, setCharIndex] = useState(0);
	const [done, setDone] = useState(false);

	useEffect(() => {
		const t1 = setTimeout(() => setShowLogin(true), 500);
		const t2 = setTimeout(() => setShowPrompt(true), 700);
		const t3 = setTimeout(() => setStarted(true), 1500);
		return () => {
			clearTimeout(t1);
			clearTimeout(t2);
			clearTimeout(t3);
		};
	}, []);

	useEffect(() => {
		if (!started || done) return;

		if (lineIndex >= lines.length) {
			setDone(true);
			return;
		}

		const currentLine = lines[lineIndex];

		if (charIndex < currentLine.length) {
			const delay = BASE_DELAY + Math.random() * JITTER;
			const timer = setTimeout(() => setCharIndex((c) => c + 1), delay);
			return () => clearTimeout(timer);
		}

		const timer = setTimeout(() => {
			setLineIndex((l) => l + 1);
			setCharIndex(0);
		}, LINE_DELAY);
		return () => clearTimeout(timer);
	}, [started, lineIndex, charIndex, done]);

	return { showLogin, showPrompt, started, lineIndex, charIndex, done };
}

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function Spinner() {
	const [frame, setFrame] = useState(0);
	useEffect(() => {
		const timer = setInterval(
			() => setFrame((f) => (f + 1) % SPINNER_FRAMES.length),
			80,
		);
		return () => clearInterval(timer);
	}, []);
	return <span style={{ color: "var(--term-blue9)" }}>{SPINNER_FRAMES[frame]}</span>;
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

function randomTxHash() {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

// ---------------------------------------------------------------------------
// Content data
// ---------------------------------------------------------------------------

const POEMS = [
	[
		"In circuits deep where data streams,",
		"A payment flows like whispered dreams,",
		"No card, no form, no human hand—",
		"Just code that speaks, and coins that land.",
	],
	[
		"A merchant waits behind a gate,",
		"Four-oh-two, the price of fate.",
		"A coin slides through the wire thin,",
		"The door swings wide — the stream begins.",
	],
	[
		"Ones and zeros, wallets hum,",
		"Micro-pennies, here they come.",
		"Each token spent, a verse returned,",
		"A fair exchange, autonomously earned.",
	],
	[
		"No invoice sent, no bill to pay,",
		"The protocol knows the way.",
		"A handshake signed in cryptic light,",
		"Two machines agree: the price is right.",
	],
	[
		"From wallet A to wallet B,",
		"A fraction of a cent runs free.",
		"The API responds in kind,",
		"A paid-for thought, from mind to mind.",
	],
	[
		"The ledger hums beneath the wire,",
		"A thousand calls, they never tire.",
		"Each micropayment, signed and sealed,",
		"A trustless bond the chain revealed.",
		"No middleman to slow the trade,",
		"No paper trail, no debt unpaid.",
		"The protocol speaks clear and true—",
		"A cent for me, a byte for you.",
	],
	[
		"A key was born at half past three,",
		"Derived from entropy and sea.",
		"It signed a channel, locked a bond,",
		"And whispered to the world beyond.",
		"The service answered, line by line,",
		"Each response worth a fraction fine.",
		"When all was spent, the channel closed,",
		"And both sides settled, well-disposed.",
		"No court, no clerk, no arbiter—",
		"Just math, and trust in what they were.",
	],
];

const ASCII_ARTS = [
	[
		"       ╔══════════╗",
		"       ║  WALLET  ║",
		"       ╚════╤═════╝",
		"            │ sign",
		"       ╔════╧═════╗",
		"       ║ CHANNEL  ║",
		"       ╚════╤═════╝",
		"            │ stream",
		"       ╔════╧═════╗",
		"       ║ SERVICE  ║",
		"       ╚══════════╝",
	],
	[
		"  ╭──────────────────────╮",
		"  │ MPP v1.0             │",
		"  │ ──────────────────── │",
		"  │ requests   1,204,891 │",
		"  │ payments   1,204,891 │",
		"  │ failures           0 │",
		"  │ avg cost    $0.00010 │",
		"  ╰──────────────────────╯",
	],
	[
		"        ┌─┐",
		"       ╱│$│╲        ♪ cha-ching! ♪",
		"      ╱ └─┘ ╲",
		"     ╱  ╱ ╲  ╲",
		"    ▼  ▼   ▼  ▼",
		"   🅰  🅱  🅲  🅳",
		"   ok  ok  ok  ok",
	],
	[
		"  ┌──────────────────────────────┐",
		"  │  ░░░░░░░░░░░░░░░░░░░░  100% │",
		"  │  ████████████████████        │",
		"  │                              │",
		"  │  payments:  ✔ ✔ ✔ ✔ ✔ ✔ ✔ ✔  │",
		"  │  refunds:   (none)           │",
		"  │  vibe:      immaculate       │",
		"  └──────────────────────────────┘",
	],
	[
		"      $ 0 . 0 0 1",
		"     ┌─┬─┬─┬─┬─┬─┐",
		"     │ │ │ │ │ │ │ │  ← per request",
		"     └─┴─┴─┴─┴─┴─┘",
		"         │",
		"    ─────┼───── the cost of a thought",
		"         │",
	],
];

const COMPANIES: Record<string, { title: string; description: string }> = {
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
		title: "Vercel: Build and deploy the best web experiences with the Frontend Cloud",
		description:
			"Vercel provides the developer tools and cloud infrastructure to build, scale, and secure a faster, more personalized web.",
	},
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeUrl(input: string): string {
	return input
		.trim()
		.toLowerCase()
		.replace(/^https?:\/\//, "")
		.replace(/^www\./, "")
		.replace(/\/.*$/, "");
}

function lookupCompany(url: string): string[] {
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

function randomStripeId(prefix: string) {
	const chars =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let result = prefix;
	for (let i = 0; i < 24; i++)
		result += chars[Math.floor(Math.random() * chars.length)];
	return result;
}

function shuffle<T>(arr: T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

function createCyclicPicker<T>(items: T[], first?: T): () => T {
	let queue = first
		? [first, ...shuffle(items.filter((i) => i !== first))]
		: shuffle(items);
	let index = 0;
	return () => {
		if (index >= queue.length) {
			queue = shuffle(items);
			index = 0;
		}
		return queue[index++];
	};
}

const pickPoem = createCyclicPicker(POEMS, POEMS[POEMS.length - 1]);
const pickAscii = createCyclicPicker(ASCII_ARTS);

// ---------------------------------------------------------------------------
// Step components
// ---------------------------------------------------------------------------

const STREAM_DELAY = 30;

function StepIcon({
	spinning,
	icon = "✔",
}: { spinning: boolean; icon?: string }) {
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

const COST_PER_TOKEN = 0.0001;

function AsyncSteps({
	endpoint,
	output,
	walletState,
	paymentChannel = false,
	onDone,
	completed = false,
}: {
	endpoint: string;
	output: string[];
	walletState: WalletState;
	paymentChannel?: boolean;
	onDone?: () => void;
	completed?: boolean;
}) {
	const { address, funded, setFunded } = walletState;
	const [txHash] = useState(() => randomTxHash());
	const [channelTxHash] = useState(() => randomTxHash());
	const doneCalled = useRef(false);

	const outputText = output.join("\n");

	const [steps] = useState(() => {
		const s: { key: string; delay: number }[] = [];
		if (!walletState.created) s.push({ key: "wallet", delay: 600 });
		if (!funded) s.push({ key: "fund", delay: 1500 });
		s.push({ key: "req402", delay: 1200 });
		if (paymentChannel) {
			s.push({ key: "channel", delay: 1200 });
			s.push({ key: "stream", delay: 0 });
			s.push({ key: "closeChannel", delay: 1000 });
		} else {
			s.push({ key: "pay", delay: 1500 });
			s.push({ key: "req200", delay: 1000 });
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

	useEffect(() => {
		if (currentKey === "done") {
			if (!doneCalled.current) {
				doneCalled.current = true;
				onDone?.();
			}
			return;
		}
		if (currentKey === "stream") {
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
			if (currentKey === "fund") setFunded(true);
			setStep((s) => s + 1);
		}, delay);
		return () => clearTimeout(timer);
	}, [step, streamChars, outputText.length]);

	return (
		<div className="flex flex-col">
			<BlankLine />
			{atOrPast("wallet") && (
				<p style={{ color: "var(--term-gray6)" }}>
					<StepIcon spinning={atStep("wallet")} /> Creating wallet{" "}
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
								href={`https://explore.tempo.xyz/tx/${channelTxHash}`}
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
								href={`https://explore.tempo.xyz/tx/${txHash}`}
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
			{atOrPast("req200") && (
				<>
					<p style={{ color: "var(--term-gray6)" }}>
						<StepIcon spinning={atStep("req200")} /> GET {endpoint}
						{pastStep("req200") && (
							<>
								{" "}
								→{" "}
								<span style={{ color: "var(--term-green9)" }}>200 OK</span>
							</>
						)}
					</p>
					<p style={{ color: "var(--term-gray6)" }}>
						<span className="inline-block w-[1ch]" />{" "}
						Authorization: Payment
					</p>
				</>
			)}
			{!paymentChannel && pastStep("req200") && (
				<>
					<BlankLine />
					<pre
						className="whitespace-pre-wrap"
						style={{ color: "var(--term-gray10)" }}
					>
						{outputText}
					</pre>
				</>
			)}
			{paymentChannel && atOrPast("stream") && (
				<>
					<BlankLine />
					<pre
						className="whitespace-pre-wrap"
						style={{ color: "var(--term-gray10)" }}
					>
						{outputText.slice(0, streamChars)}
					</pre>
					{tokenCount > 0 && (
						<p style={{ color: "var(--term-gray6)" }}>
							{streamChars < outputText.length ? (
								<Spinner />
							) : (
								<span style={{ color: "var(--term-green9)" }}>✔</span>
							)}{" "}
							{tokenCount} tokens streamed —{" "}
							<span style={{ color: "var(--term-amber9)" }}>
								{(tokenCount * COST_PER_TOKEN).toFixed(4)} USDC
							</span>
						</p>
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
								href={`https://explore.tempo.xyz/tx/${txHash}`}
								target="_blank"
								rel="noopener noreferrer"
								className="hover:underline"
							>
								<TruncatedHex hash={txHash}>{txHash}</TruncatedHex>
							</a>
						</p>
					)}
					{pastStep("closeChannel") && (
						<p
							style={{
								color: "var(--term-gray6)",
								paddingLeft: "2ch",
							}}
						>
							spent{" "}
							<span style={{ color: "var(--term-amber9)" }}>
								{(tokenCount * COST_PER_TOKEN).toFixed(4)} USDC
							</span>
						</p>
					)}
					{pastStep("closeChannel") && (
						<p
							style={{
								color: "var(--term-gray6)",
								paddingLeft: "2ch",
							}}
						>
							refunded{" "}
							<span style={{ color: "var(--term-amber9)" }}>
								{(5 - tokenCount * COST_PER_TOKEN).toFixed(4)} USDC
							</span>
						</p>
					)}
				</>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Stripe card form
// ---------------------------------------------------------------------------

const LOOKUP_COST = 0.05;

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
	}, []);

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
		<div
			className="flex flex-col"
			style={{ paddingLeft: "2ch" }}
		>
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
							Use test card (4242)
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
						<span style={{ color: "var(--term-gray10)" }}>
							{displayExpiry}
						</span>
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
	onDone,
	completed = false,
	savedCard,
	onCardSaved,
}: {
	endpoint: string;
	output: string[];
	onDone?: () => void;
	completed?: boolean;
	savedCard?: SavedCard;
	onCardSaved?: (card: SavedCard) => void;
}) {
	const [piId] = useState(() => randomStripeId("pi_"));
	const doneCalled = useRef(false);
	const [, setCardSubmitted] = useState(completed);

	const steps: { key: string; delay: number }[] = [
		{ key: "req402", delay: 1200 },
		{ key: "cardInput", delay: 0 },
		{ key: "createPI", delay: 1500 },
		{ key: "confirmPI", delay: 1000 },
		{ key: "req200", delay: 1000 },
	];

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

	useEffect(() => {
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
	}, [step]);

	return (
		<div className="flex flex-col">
			<BlankLine />
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
				</>
			)}
			{atOrPast("cardInput") && (
				<CardForm
					completed={pastStep("cardInput")}
					savedCard={savedCard}
					onSubmit={(card) => {
						setCardSubmitted(true);
						onCardSaved?.(card);
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
			{atOrPast("confirmPI") && (
				<p style={{ color: "var(--term-gray6)" }}>
					<StepIcon spinning={atStep("confirmPI")} /> Confirming payment
					{pastStep("confirmPI") && (
						<>
							{" "}
							→{" "}
							<span style={{ color: "var(--term-green9)" }}>succeeded</span>
						</>
					)}
				</p>
			)}
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
						<span className="inline-block w-[1ch]" />{" "}
						Authorization: Payment
					</p>
				</>
			)}
			{pastStep("req200") && (
				<>
				<BlankLine />
				<div style={{ color: "var(--term-gray10)" }}>
					{output.map((line, i) => {
						const match = line.match(/^(\s*\S+\s+)(.*)$/);
						if (match) {
							const indent = match[1].length;
							return (
								<pre
									key={i}
									className="whitespace-pre-wrap"
									style={{
										paddingLeft: `${indent}ch`,
										textIndent: `-${indent}ch`,
									}}
								>
									{line}
								</pre>
							);
						}
						return (
							<pre key={i} className="whitespace-pre-wrap">
								{line}
							</pre>
						);
					})}
				</div>
				</>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Wizard (interactive menu)
// ---------------------------------------------------------------------------

type WalletState = {
	address: string;
	created: boolean;
	setCreated: (v: boolean) => void;
	funded: boolean;
	setFunded: (v: boolean) => void;
};

const INITIAL_BALANCE = 100;

type Run = { chosen: string; output: string[]; url?: string; key: number };

function runCost(run: Run): number {
	if (run.chosen === "Write poem") {
		const tokens = Math.ceil(run.output.join("\n").length / 4);
		return tokens * COST_PER_TOKEN;
	}
	if (run.chosen === "Create ASCII art") return 0.001;
	if (run.chosen === "Lookup company") return LOOKUP_COST;
	return 0;
}

const METHOD_LABELS: Record<string, string> = {
	"Write poem": "Tempo session",
	"Create ASCII art": "Tempo charge",
	"Lookup company": "Stripe charge",
};

function scrollTerminalIntoView() {
	const el = document.querySelector("[data-terminal]");
	if (!el) return;
	const rect = el.getBoundingClientRect();
	const offscreen = rect.bottom - window.innerHeight;
	if (offscreen > 0) {
		window.scrollBy({ top: offscreen + 64, behavior: "smooth" });
	}
}

function Wizard({ options }: { options: string[] }) {
	const [selected, setSelected] = useState(0);
	const [chosen, setChosen] = useState<string | null>(null);
	const [chosenOutput, setChosenOutput] = useState<string[]>([]);
	const [waitingForUrl, setWaitingForUrl] = useState(false);
	const [urlInput, setUrlInput] = useState("");
	const [chosenUrl, setChosenUrl] = useState<string | undefined>();
	const urlRef = useRef<HTMLInputElement>(null);
	const [quit, setQuit] = useState(false);
	const [runs, setRuns] = useState<Run[]>([]);
	const [runKey, setRunKey] = useState(0);
	const [address, setAddress] = useState("");
	const [created, setCreated] = useState(false);
	const [funded, setFunded] = useState(false);
	const [savedCard, setSavedCard] = useState<SavedCard | undefined>();

	useEffect(() => {
		randomAddress().then(setAddress);
	}, []);

	const walletState: WalletState = {
		address,
		created,
		setCreated,
		funded,
		setFunded,
	};

	const currentOptions = runs.length > 0 ? [...options, "Quit"] : options;

	const confirm = () => {
		const opt = currentOptions[selected];
		if (opt === "Quit") {
			setQuit(true);
			return;
		}
		if (opt === "Lookup company") {
			setWaitingForUrl(true);
			setUrlInput("");
			setTimeout(() => urlRef.current?.focus(), 0);
			return;
		}
		const output = opt === "Write poem" ? pickPoem() : pickAscii();
		setChosenOutput(output);
		setChosen(opt);
		scrollTerminalIntoView();
	};

	const submitUrl = () => {
		if (!urlInput.trim()) return;
		const output = lookupCompany(urlInput);
		setChosenOutput(output);
		setChosenUrl(urlInput.trim());
		setWaitingForUrl(false);
		setChosen("Lookup company");
		scrollTerminalIntoView();
	};

	const handleDone = () => {
		setRuns((prev) => [
			...prev,
			{ chosen: chosen!, output: chosenOutput, url: chosenUrl, key: runKey },
		]);
		setChosenUrl(undefined);
		setRunKey((k) => k + 1);
		setChosen(null);
		setSelected(0);
	};

	useEffect(() => {
		if (chosen || quit || waitingForUrl) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "ArrowUp") {
				e.preventDefault();
				setSelected(
					(s) => (s - 1 + currentOptions.length) % currentOptions.length,
				);
			} else if (e.key === "ArrowDown") {
				e.preventDefault();
				setSelected((s) => (s + 1) % currentOptions.length);
			} else if (e.key === "Enter") {
				confirm();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	});

	const renderSteps = (
		choice: string,
		output: string[],
		key: number,
		opts?: { onDone?: () => void; completed?: boolean; url?: string },
	) => {
		if (choice === "Write poem")
			return (
				<AsyncSteps
					key={key}
					endpoint="/api/poem"
					output={output}
					walletState={walletState}
					paymentChannel
					onDone={opts?.onDone}
					completed={opts?.completed}
				/>
			);
		if (choice === "Create ASCII art")
			return (
				<AsyncSteps
					key={key}
					endpoint="/api/ascii"
					output={output}
					walletState={walletState}
					onDone={opts?.onDone}
					completed={opts?.completed}
				/>
			);
		if (choice === "Lookup company")
			return (
				<StripeSteps
					key={key}
					endpoint={`/api/lookup?url=${encodeURIComponent(opts?.url ?? "")}`}
					output={output}
					onDone={opts?.onDone}
					completed={opts?.completed}
					savedCard={savedCard}
					onCardSaved={setSavedCard}
				/>
			);
		return null;
	};

	return (
		<div className="flex flex-col">
			{runs.map((run, runIndex) => {
				const runOptions =
					runIndex > 0 ? [...options, "Quit"] : options;
				return (
					<div key={run.key}>
						<p style={{ color: "var(--term-gray10)" }}>
							What would you like to do?
						</p>
						<div
							className="flex flex-col"
							style={{ paddingLeft: "1rem" }}
						>
							{runOptions.map((option) => (
								<p
									key={option}
									style={{
										color:
											option === run.chosen
												? "var(--term-pink9)"
												: "var(--term-gray6)",
									}}
								>
									{option === run.chosen ? "▸ " : "  "}
									{option}
									{METHOD_LABELS[option] && (
										<span className="ml-2">({METHOD_LABELS[option]})</span>
									)}
								</p>
							))}
						</div>
						{run.url && (
							<p style={{ color: "var(--term-gray6)" }}>
								Enter URL:{" "}
								<span style={{ color: "var(--term-gray10)" }}>{run.url}</span>
							</p>
						)}
						{renderSteps(run.chosen, run.output, run.key, {
							completed: true,
							url: run.url,
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
					<div
						className="flex flex-col"
						style={{ paddingLeft: "1rem" }}
					>
						{currentOptions.map((option, i) => (
							<button
								key={option}
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
								onClick={() => !chosen && !waitingForUrl && confirm()}
							>
								{selected === i ? "▸ " : "  "}
								{option}
								{METHOD_LABELS[option] && (
									<span className="ml-2">({METHOD_LABELS[option]})</span>
								)}
							</button>
						))}
					</div>
					{!chosen && !waitingForUrl && (
						<p style={{ color: "var(--term-gray5)" }}>
							Use ↑↓ arrows and Enter to select
						</p>
					)}
					{waitingForUrl && (
						<p style={{ color: "var(--term-gray6)" }}>
							Enter URL:{" "}
							<BlockCursorInput
								ref={urlRef}
								type="text"
								value={urlInput}
								onChange={(e) => setUrlInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") submitUrl();
								}}
								className="term-url-input bg-transparent outline-none"
								style={{ color: "var(--term-gray10)" }}
								placeholder="stripe.com"
							/>
						</p>
					)}
					{chosen === "Lookup company" && chosenUrl && (
						<p style={{ color: "var(--term-gray6)" }}>
							Enter URL:{" "}
							<span style={{ color: "var(--term-gray10)" }}>{chosenUrl}</span>
						</p>
					)}
					{chosen &&
						renderSteps(chosen, chosenOutput, runKey, {
							onDone: handleDone,
							url: chosenUrl,
						})}
				</div>
			)}

			{quit &&
				(() => {
					const usdcSpent = runs
						.filter((r) => r.chosen !== "Lookup company")
						.reduce((sum, r) => sum + runCost(r), 0);
					const usdSpent = runs
						.filter((r) => r.chosen === "Lookup company")
						.reduce((sum, r) => sum + runCost(r), 0);
					const balance = INITIAL_BALANCE - usdcSpent;
					return (
						<div className="flex flex-col">
							<BlankLine />
							<p style={{ color: "var(--term-gray10)" }}>
								Machine Payments Protocol — open, programmable, Internet-native
								payments.
							</p>
							<BlankLine />
							<p style={{ color: "var(--term-gray10)" }}>
								Spent
							</p>
							<SummaryRow label="Total">
								<span style={{ color: "var(--term-amber9)" }}>
									${(usdcSpent + usdSpent).toFixed(4)}
								</span>
							</SummaryRow>
							{usdcSpent > 0 && (
								<SummaryRow label="Tempo">
									<span style={{ color: "var(--term-amber9)" }}>
										{usdcSpent.toFixed(4)} USDC
									</span>
								</SummaryRow>
							)}
							{usdSpent > 0 && (
								<SummaryRow label="Stripe">
									<span style={{ color: "var(--term-amber9)" }}>
										{usdSpent.toFixed(2)} USD
									</span>
								</SummaryRow>
							)}
							<BlankLine />
							<p style={{ color: "var(--term-gray10)" }}>
								Wallet
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
							<BlankLine />
							<p style={{ color: "var(--term-gray6)" }}>
								<span style={{ color: "var(--term-gray10)" }}>$ ~ </span>
								<span
									className="ml-0.5 inline-block h-[1em] w-[0.6em] align-text-bottom"
									style={{
										backgroundColor: "var(--term-pink9)",
										transform: "translateY(-3px)",
										animation: "blink 1.4s step-end infinite",
									}}
								/>
							</p>
						</div>
					);
				})()}
		</div>
	);
}

function DiscoverServices() {
	return (
		<Wizard
			options={["Write poem", "Create ASCII art", "Lookup company"]}
		/>
	);
}

// ---------------------------------------------------------------------------
// Exported Terminal component
// ---------------------------------------------------------------------------

export function Terminal({ className }: { className?: string }) {
	const { showLogin, showPrompt, started, lineIndex, charIndex, done } =
		useTypewriter();
	const scrollRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const autoScrollRef = useRef(true);

	useEffect(() => {
		const scrollEl = scrollRef.current;
		if (!scrollEl) return;
		const LINE_HEIGHT = 24;
		const handleScroll = () => {
			const distanceFromBottom =
				scrollEl.scrollHeight - scrollEl.clientHeight - scrollEl.scrollTop;
			autoScrollRef.current = distanceFromBottom < LINE_HEIGHT;
		};
		scrollEl.addEventListener("scroll", handleScroll);
		return () => scrollEl.removeEventListener("scroll", handleScroll);
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
				fontFamily:
					'var(--font-mono, "Geist Mono", monospace)',
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
					borderColor: "var(--term-gray3)",
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
						style={{ backgroundColor: "var(--term-gray5)" }}
					/>
					<span
						className="size-3 rounded-full"
						style={{ backgroundColor: "var(--term-gray5)" }}
					/>
					<span
						className="size-3 rounded-full"
						style={{ backgroundColor: "var(--term-gray5)" }}
					/>
				</div>

				{/* Terminal body */}
				<div
					ref={scrollRef}
					className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 pb-5 break-words"
					style={{
						backgroundColor: "var(--term-bg2)",
						fontSize: "0.9rem",
						lineHeight: "1.5rem",
					}}
				>
					<div ref={contentRef}>
						<div className="hidden sm:block">
							<AsciiLogo />
						</div>
						<div className="h-2" />
						<p style={{ color: "var(--term-gray6)" }}>
							mpp.sh@{__COMMIT_SHA__.slice(0, 7)} (released{" "}
							{timeAgo(__COMMIT_TIMESTAMP__)})
						</p>
						{showLogin && (
							<p style={{ color: "var(--term-gray6)" }}>
								Last login: Wed Oct 29 22:30:00 1969 on ttys000
							</p>
						)}
						{showPrompt && !started && (
							<p style={{ color: "var(--term-gray6)" }}>
								<span style={{ color: "var(--term-gray10)" }}>$ ~ </span>
								<span
									className="ml-0.5 inline-block h-[1em] w-[0.6em] align-text-bottom"
									style={{
										backgroundColor: "var(--term-pink9)",
										transform: "translateY(-3px)",
										animation: "blink 1.4s step-end infinite",
									}}
								/>
							</p>
						)}
						{started &&
							lines.map((line, i) => {
								const visible =
									i < lineIndex
										? line
										: i === lineIndex
											? line.slice(0, charIndex)
											: "";
								const isActive = i === lineIndex && !done;
								const isCommand = line !== "" && !line.startsWith("#");

								return (
									<p
										key={i}
										style={{
											color: isCommand
												? "var(--term-blue9)"
												: "var(--term-gray6)",
											visibility:
												i <= lineIndex ? "visible" : "hidden",
										}}
									>
										<span style={{ color: "var(--term-gray10)" }}>
											$ ~{" "}
										</span>
										{renderText(visible)}
										<span
											className="ml-0.5 inline-block h-[1em] w-[0.6em] align-text-bottom"
											style={{
												backgroundColor: "var(--term-pink9)",
												visibility: isActive ? "visible" : "hidden",
												transform: "translateY(-3px)",
											}}
										/>
									</p>
								);
							})}

						{done && <DiscoverServices />}
					</div>
				</div>
			</div>
		</div>
	);
}
