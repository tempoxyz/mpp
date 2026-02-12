"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "vocs";
import { useConnectorClient } from "wagmi";
import { fetch } from "../mpay.client";
import { pathUsd } from "../wagmi.config";
import { AgentTabs } from "./AgentTabs";
import { AsciiLogo } from "./AsciiLogo";
import * as Cli from "./Cli";

type Variant = "A" | "B" | "C" | "D";

export function LandingPage() {
	const [variant, setVariant] = useState<Variant>("A");

	return (
		<div
			className="not-prose"
			style={{
				color: "#111",
				fontFamily:
					'"Berkeley Mono", "Commit Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
			}}
		>
			{/* Variant Toggle */}
			<div
				className="fixed left-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-1"
				style={{ opacity: 0.6 }}
			>
				{(["A", "B", "C", "D"] as const).map((v) => (
					<button
						key={v}
						type="button"
						onClick={() => setVariant(v)}
						className={`w-6 h-6 text-[10px] font-medium rounded transition-all ${
							variant === v
								? "bg-[#0166FF] text-white"
								: "bg-gray-200 text-gray-500 hover:bg-gray-300"
						}`}
					>
						{v}
					</button>
				))}
			</div>

			{/* Render variant-specific hero */}
			{variant === "A" && <HeroVariantA />}
			{variant === "B" && <HeroVariantB />}
			{variant === "C" && <HeroVariantC />}
			{variant === "D" && <HeroVariantD />}
		</div>
	);
}

// ============================================================
// VARIANT A: Wrapped prompt text (full prompt visible)
// ============================================================
function HeroVariantA() {
	return (
		<section className="pt-4 pb-12 lg:pt-24 lg:pb-16">
			<div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-stretch">
				{/* Right pane */}
				<div className="flex-9 space-y-8 min-w-0 order-first lg:order-last">
					<div className="lg:hidden">
						<AsciiLogo />
					</div>
					<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-black leading-[1.1] tracking-tight">
						Machine Payments Protocol
					</h1>
					<div className="space-y-1.5 max-w-xl">
						<p className="text-sm md:text-base text-gray-600 leading-relaxed">
							Accept payments from humans, software, or AI agents using standard
							HTTP. No billing accounts or manual signup required.
						</p>
					</div>
					<CoAuthoredBy />
					<AgentTabsWrapped />
					<CTAButtons />
				</div>
				{/* Left pane — interactive demo */}
				<div className="flex-11 w-full min-w-0 flex flex-col order-last lg:order-first max-w-[574px] lg:max-w-none">
					<Cli.Demo
						title="agent-demo"
						token={pathUsd}
						height={337}
						restartStep={1}
					>
						<Cli.Startup />
						<Cli.ConnectWallet />
						<Cli.Faucet />
						<SelectQuery />
					</Cli.Demo>
				</div>
			</div>
		</section>
	);
}

// ============================================================
// VARIANT B: Multiple prompts with numbers and comments
// ============================================================
function HeroVariantB() {
	return (
		<section className="pt-4 pb-12 lg:pt-12 lg:pb-16">
			{/* Co-authored by - top left */}
			<div className="mb-8">
				<CoAuthoredBy />
			</div>

			<div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-stretch">
				{/* Right pane */}
				<div className="flex-9 space-y-6 min-w-0 order-first lg:order-last">
					<div className="lg:hidden">
						<AsciiLogo />
					</div>
					<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-black leading-[1.1] tracking-tight">
						Machine Payments Protocol
					</h1>
					<div className="space-y-1.5 max-w-xl">
						<p className="text-sm md:text-base text-gray-600 leading-relaxed">
							Accept payments from humans, software, or AI agents using standard
							HTTP. No billing accounts or manual signup required.
						</p>
					</div>
					<MultiPromptBox />
					<CTAButtons />
				</div>
				{/* Left pane — interactive demo */}
				<div className="flex-11 w-full min-w-0 flex flex-col order-last lg:order-first max-w-[574px] lg:max-w-none">
					<Cli.Demo
						title="agent-demo"
						token={pathUsd}
						height={337}
						restartStep={1}
					>
						<Cli.Startup />
						<Cli.ConnectWallet />
						<Cli.Faucet />
						<SelectQuery />
					</Cli.Demo>
				</div>
			</div>
		</section>
	);
}

// ============================================================
// VARIANT C: Split sections with scroll snap
// ============================================================
function HeroVariantC() {
	return (
		<div
			className="overflow-y-auto"
			style={{
				height: "calc(100vh - 64px)",
				scrollSnapType: "y mandatory",
			}}
		>
			{/* Section 1: Hero content */}
			<section
				className="flex flex-col items-center justify-center text-center px-6 relative"
				style={{
					height: "calc(100vh - 64px)",
					scrollSnapAlign: "start",
				}}
			>
				<div className="max-w-2xl space-y-8">
					<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-black leading-[1.1] tracking-tight">
						Machine Payments Protocol
					</h1>
					<p className="text-sm md:text-base text-gray-600 leading-relaxed max-w-xl mx-auto">
						Accept payments from humans, software, or AI agents using standard
						HTTP. No billing accounts or manual signup required.
					</p>
					<div className="flex items-center justify-center">
						<CoAuthoredBy />
					</div>
					<AgentTabs />
					<div className="flex justify-center">
						<CTAButtons />
					</div>
				</div>
				{/* Bouncing scroll indicator */}
				<div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
					<span className="text-xs text-gray-400">Scroll to try demo</span>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="text-gray-400"
						aria-hidden="true"
					>
						<path d="M12 5v14M5 12l7 7 7-7" />
					</svg>
				</div>
			</section>

			{/* Section 2: CLI Demo */}
			<section
				className="flex items-center justify-center px-6"
				style={{
					height: "calc(100vh - 64px)",
					scrollSnapAlign: "start",
				}}
			>
				<div className="max-w-[574px] w-full">
					<Cli.Demo
						title="agent-demo"
						token={pathUsd}
						height={337}
						restartStep={1}
					>
						<Cli.Startup />
						<Cli.ConnectWallet />
						<Cli.Faucet />
						<SelectQuery />
					</Cli.Demo>
				</div>
			</section>
		</div>
	);
}

// ============================================================
// VARIANT D: Google search-style with typing animation
// ============================================================
function HeroVariantD() {
	return (
		<div
			className="overflow-y-auto"
			style={{
				height: "calc(100vh - 64px)",
				scrollSnapType: "y mandatory",
			}}
		>
			{/* Hero section */}
			<section
				className="flex flex-col items-center justify-center text-center px-6 relative"
				style={{
					height: "calc(100vh - 64px)",
					scrollSnapAlign: "start",
				}}
			>
				<div className="max-w-3xl space-y-8">
					<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-black leading-[1.1] tracking-tight">
						Machine Payments Protocol
					</h1>
					<p className="text-sm md:text-base text-gray-600 leading-relaxed max-w-xl mx-auto">
						Accept payments from humans, software, or AI agents using standard
						HTTP. No billing accounts or manual signup required.
					</p>

					{/* Google-style search input with typing animation */}
					<div className="pt-4">
						<SearchInputAnimated />
					</div>

					{/* Minimal CTA */}
					<div className="flex gap-3 justify-center pt-4">
						<Link
							to="/quickstart"
							className="inline-flex items-center gap-2 px-6 py-3 bg-[#0166FF] text-white! text-sm font-medium rounded-full hover:bg-[#0052CC] transition-colors no-underline!"
						>
							Get started
						</Link>
						<Link
							to="/specs"
							className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-200 transition-colors no-underline"
						>
							Read specs
						</Link>
					</div>

					{/* Co-authored by - subtle */}
					<div className="flex items-center gap-4 justify-center pt-4 opacity-50">
						<span className="text-[10px] font-medium tracking-widest text-gray-400 uppercase">
							Co-authored by
						</span>
						<a
							href="https://tempo.xyz"
							target="_blank"
							rel="noopener noreferrer"
							className="no-underline text-gray-400 hover:text-gray-600 transition-colors"
						>
							<TempoLogo style={{ width: "50px" }} />
						</a>
						<a
							href="https://stripe.com"
							target="_blank"
							rel="noopener noreferrer"
							className="no-underline text-gray-400 hover:text-[#635BFF] transition-colors"
						>
							<StripeLogo style={{ width: "40px" }} />
						</a>
					</div>
				</div>
				{/* Bouncing scroll indicator */}
				<div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
					<span className="text-xs text-gray-400">Scroll to try demo</span>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="text-gray-400"
						aria-hidden="true"
					>
						<path d="M12 5v14M5 12l7 7 7-7" />
					</svg>
				</div>
			</section>

			{/* CLI Demo section */}
			<section
				className="flex items-center justify-center px-6"
				style={{
					height: "calc(100vh - 64px)",
					scrollSnapAlign: "start",
				}}
			>
				<div className="max-w-[574px] w-full">
					<Cli.Demo
						title="agent-demo"
						token={pathUsd}
						height={337}
						restartStep={1}
					>
						<Cli.Startup />
						<Cli.ConnectWallet />
						<Cli.Faucet />
						<SelectQuery />
					</Cli.Demo>
				</div>
			</section>
		</div>
	);
}

// ============================================================
// Shared Components
// ============================================================

function CoAuthoredBy() {
	return (
		<div className="flex items-center gap-5">
			<span className="text-xs font-medium tracking-widest text-gray-400 uppercase">
				Co-authored by
			</span>
			<div className="flex items-center gap-5">
				<a
					href="https://tempo.xyz"
					target="_blank"
					rel="noopener noreferrer"
					className="no-underline text-gray-400 hover:text-gray-600 transition-colors"
				>
					<TempoLogo style={{ width: "70px" }} />
				</a>
				<a
					href="https://stripe.com"
					target="_blank"
					rel="noopener noreferrer"
					className="no-underline text-gray-400 hover:text-[#635BFF] transition-colors"
				>
					<StripeLogo style={{ width: "55px" }} />
				</a>
			</div>
		</div>
	);
}

function CTAButtons() {
	return (
		<div className="flex flex-wrap gap-3">
			<Link
				to="/quickstart"
				className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0166FF] text-white! text-sm font-medium rounded-md hover:bg-[#0052CC] transition-colors no-underline!"
			>
				Get started
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<path d="M5 12h14M12 5l7 7-7 7" />
				</svg>
			</Link>
			<Link
				to="/specs"
				className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors no-underline"
			>
				Read the specs
			</Link>
		</div>
	);
}

// Variant A: AgentTabs but with wrapped text
function AgentTabsWrapped() {
	const [active, setActive] = useState(0);
	const [copied, setCopied] = useState(false);
	const commands = [
		{
			label: "Claude",
			bin: "claude",
			args: "-p",
			str: '"charge $0.01 per api call with MPP"',
		},
		{
			label: "Codex",
			bin: "codex",
			args: "--full-auto",
			str: '"charge $0.01 per api call with MPP"',
		},
		{
			label: "Amp",
			bin: "amp",
			args: null,
			str: '"charge $0.01 per api call with MPP"',
		},
	];
	const cmd = commands[active];
	const fullCommand = [cmd.bin, cmd.args, cmd.str].filter(Boolean).join(" ");

	const handleCopy = () => {
		navigator.clipboard.writeText(fullCommand);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="max-w-xl border border-gray-200 rounded-md overflow-hidden">
			<div className="flex bg-gray-50 border-b border-gray-200">
				{commands.map((a, i) => (
					<button
						key={a.label}
						type="button"
						onClick={() => setActive(i)}
						className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
							i === active
								? "text-gray-900 bg-white border-b-2 border-gray-900 -mb-px"
								: "text-gray-400 hover:text-gray-600"
						}`}
					>
						{a.label}
					</button>
				))}
			</div>
			{/* Wrapped text with copy button */}
			<div className="bg-white px-4 py-3 flex items-start justify-between gap-3">
				<pre className="text-sm m-0 p-0 bg-transparent font-mono whitespace-pre-wrap wrap-break-word text-left">
					<code>
						<span className="text-gray-400">$ </span>
						<span className="text-gray-800">{cmd.bin}</span>
						{cmd.args && <span className="text-gray-500"> {cmd.args}</span>}
						<span className="text-green-700"> {cmd.str}</span>
					</code>
				</pre>
				<button
					type="button"
					onClick={handleCopy}
					className="text-gray-400 hover:text-[#0166FF] transition-colors shrink-0"
					aria-label="Copy to clipboard"
				>
					{copied ? (
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<path d="M20 6 9 17l-5-5" />
						</svg>
					) : (
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
							<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
						</svg>
					)}
				</button>
			</div>
		</div>
	);
}

// Variant B: Multiple prompts with numbers and comments
const MULTI_PROMPTS = [
	{
		comment: "Monetize your API instantly",
		prompt: "charge $0.01 per api call with MPP",
	},
	{
		comment: "Let agents pay for premium features",
		prompt: "add MPP payments to my /premium endpoint",
	},
	{
		comment: "Metered usage billing",
		prompt: "charge $0.001 per token for my LLM proxy",
	},
	{
		comment: "Subscription-style access",
		prompt: "require $5/month payment for /pro routes",
	},
	{
		comment: "Pay-per-result pricing",
		prompt: "charge $0.10 per successful search result",
	},
];

function MultiPromptBox() {
	const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

	const handleCopy = (text: string, index: number) => {
		navigator.clipboard.writeText(text);
		setCopiedIndex(index);
		setTimeout(() => setCopiedIndex(null), 2000);
	};

	return (
		<div className="max-w-xl border border-gray-200 rounded-md overflow-hidden">
			<div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
				<span className="text-xs font-medium text-gray-500">
					Example prompts for your AI agent
				</span>
			</div>
			<div className="bg-white divide-y divide-gray-100">
				{MULTI_PROMPTS.map((item, i) => {
					const fullCommand = `claude -p "${item.prompt}"`;
					return (
						<div
							key={item.prompt}
							className="px-4 py-3 flex items-start justify-between gap-3"
						>
							<div className="font-mono text-sm min-w-0">
								<div className="text-gray-400 text-xs mb-0.5">
									# {item.comment}
								</div>
								<div>
									<span className="text-gray-800">claude -p </span>
									<span className="text-green-700">"{item.prompt}"</span>
								</div>
							</div>
							<button
								type="button"
								onClick={() => handleCopy(fullCommand, i)}
								className="text-gray-400 hover:text-[#0166FF] transition-colors shrink-0 mt-4"
								aria-label="Copy to clipboard"
							>
								{copiedIndex === i ? (
									<svg
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										aria-hidden="true"
									>
										<path d="M20 6 9 17l-5-5" />
									</svg>
								) : (
									<svg
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										aria-hidden="true"
									>
										<rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
										<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
									</svg>
								)}
							</button>
						</div>
					);
				})}
			</div>
		</div>
	);
}

// Variant D: Google search-style input with typing animation
const SEARCH_PROMPTS = [
	"charge $0.01 per api call with MPP",
	"add payments to my REST API",
	"monetize my AI agent's tools",
	"require payment for /premium routes",
	"let machines pay for my service",
];

function SearchInputAnimated() {
	const [displayText, setDisplayText] = useState("");
	const [promptIndex, setPromptIndex] = useState(0);
	const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">(
		"typing",
	);

	useEffect(() => {
		const currentPrompt = SEARCH_PROMPTS[promptIndex];
		let timeout: ReturnType<typeof setTimeout>;

		if (phase === "typing") {
			if (displayText.length < currentPrompt.length) {
				timeout = setTimeout(
					() => {
						setDisplayText(currentPrompt.slice(0, displayText.length + 1));
					},
					50 + Math.random() * 30,
				);
			} else {
				setPhase("pausing");
			}
		} else if (phase === "pausing") {
			timeout = setTimeout(() => setPhase("deleting"), 2000);
		} else if (phase === "deleting") {
			if (displayText.length > 0) {
				timeout = setTimeout(() => {
					setDisplayText(displayText.slice(0, -1));
				}, 30);
			} else {
				setPromptIndex((i) => (i + 1) % SEARCH_PROMPTS.length);
				setPhase("typing");
			}
		}

		return () => clearTimeout(timeout);
	}, [displayText, phase, promptIndex]);

	return (
		<div className="w-full max-w-lg">
			<div
				className="flex items-center gap-3 px-5 py-4 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow"
				style={{ minHeight: "56px" }}
			>
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					className="text-gray-400 shrink-0"
					aria-hidden="true"
				>
					<circle cx="11" cy="11" r="8" />
					<path d="m21 21-4.3-4.3" />
				</svg>
				<div className="flex-1 text-left">
					<span className="text-gray-800 text-sm">{displayText}</span>
					<span className="inline-block w-0.5 h-4 bg-[#0166FF] ml-0.5 animate-pulse" />
				</div>
			</div>
		</div>
	);
}

function TempoLogo({
	className,
	style,
}: {
	className?: string;
	style?: React.CSSProperties;
}) {
	return (
		<svg
			className={className}
			style={style}
			viewBox="0 0 830 185"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			aria-label="Tempo"
		>
			<title>Tempo</title>
			<path
				d="M61.5297 181.489H12.6398L57.9524 43.1662H0L12.6398 2.62335H174.096L161.456 43.1662H106.604L61.5297 181.489Z"
				fill="currentColor"
			/>
			<path
				d="M243.464 181.489H127.559L185.75 2.62335H301.178L290.207 36.727H223.192L211.029 75.1235H275.898L264.928 108.75H199.821L187.658 147.385H254.196L243.464 181.489Z"
				fill="currentColor"
			/>
			<path
				d="M295.923 181.489H257.05L315.479 2.62335H380.348L378.202 99.2107L441.401 2.62335H512.47L454.279 181.489H405.628L444.262 61.2912H443.547L364.131 181.489H335.274L336.466 59.8603H335.989L295.923 181.489Z"
				fill="currentColor"
			/>
			<path
				d="M567.193 35.7731L548.353 93.487H553.6C565.524 93.487 575.461 90.7046 583.411 85.1399C591.36 79.4162 596.527 71.3077 598.912 60.8142C600.979 51.7517 599.866 45.3126 595.573 41.4968C591.281 37.681 584.126 35.7731 574.109 35.7731H567.193ZM519.973 181.489H471.083L529.274 2.62335H588.657C602.331 2.62335 614.096 4.84923 623.953 9.30099C633.97 13.5938 641.283 19.7944 645.894 27.903C650.664 35.8526 652.254 45.1536 650.664 55.806C648.597 69.7973 643.191 82.1191 634.447 92.7715C625.702 103.424 614.334 111.692 600.343 117.574C586.511 123.298 571.009 126.16 553.838 126.16H537.859L519.973 181.489Z"
				fill="currentColor"
			/>
			<path
				d="M767.195 170.041C750.977 179.581 733.727 184.351 715.443 184.351H714.966C698.749 184.351 685.076 180.773 673.946 173.619C662.976 166.305 655.106 156.448 650.336 144.046C645.725 131.645 644.612 118.051 646.997 103.265C650.018 84.6629 656.934 67.4919 667.745 51.7517C678.557 36.0116 692.071 23.4512 708.288 14.0707C724.505 4.69025 741.836 0 760.279 0H760.755C777.609 0 791.52 3.57731 802.491 10.7319C813.62 17.8865 821.331 27.6645 825.624 40.0658C830.076 52.3082 831.03 66.061 828.486 81.3241C825.465 99.2902 818.549 116.223 807.737 132.122C796.926 147.862 783.412 160.502 767.195 170.041ZM699.703 139.277C703.995 147.385 711.468 151.439 722.121 151.439H722.597C731.342 151.439 739.451 148.18 746.923 141.661C754.555 134.984 760.994 126.08 766.241 114.951C771.646 103.821 775.621 91.4201 778.165 77.7468C780.55 64.3915 779.596 53.6596 775.303 45.551C771.01 37.2835 763.617 33.1497 753.124 33.1497H752.647C744.538 33.1497 736.668 36.4885 729.037 43.1662C721.564 49.8438 715.045 58.8268 709.481 70.1152C703.916 81.4036 699.862 93.646 697.318 106.842C694.774 120.198 695.569 131.009 699.703 139.277Z"
				fill="currentColor"
			/>
		</svg>
	);
}

function StripeLogo({
	className,
	style,
}: {
	className?: string;
	style?: React.CSSProperties;
}) {
	return (
		<svg
			className={className}
			style={style}
			viewBox="0 0 640 512"
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			aria-label="Stripe"
		>
			<title>Stripe</title>
			<path
				d="M165 144.7l-43.3 9.2-.2 142.4c0 26.3 19.8 43.3 46.1 43.3 14.6 0 25.3-2.7 31.2-5.9v-33.8c-5.7 2.3-33.7 10.5-33.7-15.7V221h33.7v-37.8h-33.7zm89.1 51.6l-2.7-13.1H213v153.2h44.3V233.3c10.5-13.8 28.2-11.1 33.9-9.3v-40.8c-6-2.1-26.7-6-37.1 13.1zm92.3-72.3l-44.6 9.5v36.2l44.6-9.5zM44.9 228.3c0-6.9 5.8-9.6 15.1-9.7 13.5 0 30.7 4.1 44.2 11.4v-41.8c-14.7-5.8-29.4-8.1-44.1-8.1-36 0-60 18.8-60 50.2 0 49.2 67.5 41.2 67.5 62.4 0 8.2-7.1 10.9-17 10.9-14.7 0-33.7-6.1-48.6-14.2v40c16.5 7.1 33.2 10.1 48.5 10.1 36.9 0 62.3-15.8 62.3-47.8 0-52.9-67.9-43.4-67.9-63.4zM640 261.6c0-45.5-22-81.4-64.2-81.4s-67.9 35.9-67.9 81.1c0 53.5 30.3 78.2 73.5 78.2 21.2 0 37.1-4.8 49.2-11.5v-33.4c-12.1 6.1-26 9.8-43.6 9.8-17.3 0-32.5-6.1-34.5-26.9h86.9c.2-2.3.6-11.6.6-15.9zm-87.9-16.8c0-20 12.3-28.4 23.4-28.4 10.9 0 22.5 8.4 22.5 28.4zm-112.9-64.6c-17.4 0-28.6 8.2-34.8 13.9l-2.3-11H363v204.8l44.4-9.4.1-50.2c6.4 4.7 15.9 11.2 31.4 11.2 31.8 0 60.8-23.2 60.8-79.6.1-51.6-29.3-79.7-60.5-79.7zm-10.6 122.5c-10.4 0-16.6-3.8-20.9-8.4l-.3-66c4.6-5.1 11-8.8 21.2-8.8 16.2 0 27.4 18.2 27.4 41.4.1 23.9-10.9 41.8-27.4 41.8zm-126.7 33.7h44.6V183.2h-44.6z"
				fill="currentColor"
			/>
		</svg>
	);
}

///////////////////////////////////////////////////////////////
// CLI

type ApiCall = {
	description: string;
	endpoint: string;
	name: string;
	params?: Record<string, string>;
	price: string;
};

type QueryPreset = {
	calls: ApiCall[];
	id: string;
	label: string;
	prompt: string;
	response: string;
};

const presets: QueryPreset[] = [
	{
		calls: [
			{
				description: "Get current location",
				endpoint: "/api/agent/location",
				name: "location.lookup",
				price: "$0.001",
			},
			{
				description: "Search nearby coffee shops",
				endpoint: "/api/agent/search",
				name: "places.search",
				params: { q: "coffee" },
				price: "$0.002",
			},
			{
				description: "Aggregate reviews for top result",
				endpoint: "/api/agent/reviews",
				name: "reviews.aggregate",
				params: { place: "place_001" },
				price: "$0.003",
			},
			{
				description: "Get walking directions",
				endpoint: "/api/agent/directions",
				name: "directions.get",
				params: { to: "The Coffee Movement" },
				price: "$0.002",
			},
		],
		id: "coffee",
		label: "Coffee Shop",
		prompt: "Find the best coffee shop nearby",
		response:
			'"The Coffee Movement is the top-rated coffee shop nearby (4.6★, 0.4mi). Known for specialty pour-overs and single-origin beans. It\'s an 8 minute walk — head north on Market St to Nob Hill, 1030 Washington St."',
	},
	{
		calls: [
			{
				description: "Get current location",
				endpoint: "/api/agent/location",
				name: "location.lookup",
				price: "$0.001",
			},
			{
				description: "Search Italian restaurants",
				endpoint: "/api/agent/search",
				name: "places.search",
				params: { q: "italian restaurant" },
				price: "$0.002",
			},
			{
				description: "Check ratings and availability",
				endpoint: "/api/agent/reviews",
				name: "reviews.aggregate",
				params: { place: "place_002" },
				price: "$0.003",
			},
			{
				description: "Get directions to restaurant",
				endpoint: "/api/agent/directions",
				name: "directions.get",
				params: { to: "Flour + Water" },
				price: "$0.002",
			},
		],
		id: "restaurant",
		label: "Restaurant",
		prompt: "Find a highly-rated Italian restaurant",
		response:
			'"Flour + Water is an excellent choice — 4.7★ with 2,400+ reviews. Known for house-made pasta. It\'s 0.8mi away, about 15 min walk or 5 min drive."',
	},
	{
		calls: [
			{
				description: "Get current location",
				endpoint: "/api/agent/location",
				name: "location.lookup",
				price: "$0.001",
			},
			{
				description: "Search parking garages",
				endpoint: "/api/agent/search",
				name: "places.search",
				params: { q: "parking garage Union Square" },
				price: "$0.002",
			},
			{
				description: "Check availability and rates",
				endpoint: "/api/agent/reviews",
				name: "reviews.aggregate",
				params: { place: "place_003" },
				price: "$0.003",
			},
			{
				description: "Get driving directions",
				endpoint: "/api/agent/directions",
				name: "directions.get",
				params: { to: "Union Square Garage" },
				price: "$0.002",
			},
		],
		id: "parking",
		label: "Parking",
		prompt: "Find available parking near Union Square",
		response:
			'"Union Square Garage has spots available — $8/hr or $32 max daily. 450 Post St entrance. Turn right on Geary, 2 blocks, garage on left. ~3 min drive."',
	},
	{
		calls: [
			{
				description: "Get current location",
				endpoint: "/api/agent/location",
				name: "location.lookup",
				price: "$0.001",
			},
			{
				description: "Get weather data",
				endpoint: "/api/agent/search",
				name: "places.search",
				params: { q: "weather forecast" },
				price: "$0.002",
			},
			{
				description: "Aggregate hourly forecast",
				endpoint: "/api/agent/reviews",
				name: "reviews.aggregate",
				params: { place: "weather_001" },
				price: "$0.003",
			},
			{
				description: "Check precipitation timing",
				endpoint: "/api/agent/directions",
				name: "directions.get",
				params: { to: "forecast" },
				price: "$0.002",
			},
		],
		id: "weather",
		label: "Weather",
		prompt: "What's the weather today?",
		response:
			'"Currently 62°F and partly cloudy in San Francisco. 20% chance of light rain after 4pm. I\'d suggest bringing a light jacket — umbrella optional."',
	},
];

function SelectQuery() {
	const { data: client } = useConnectorClient();

	const [results, setResults] = useState<
		{
			calls: ApiCall[];
			query: QueryPreset;
			status: "pending" | "done" | "error";
		}[]
	>([]);

	const { mutate, isPending } = useMutation({
		mutationFn: async (queryId: string) => {
			const query = presets.find((q) => q.id === queryId);
			if (!query) throw new Error("Unknown query");

			const index = results.length;
			setResults((r) => [...r, { calls: [], query, status: "pending" }]);

			for (const call of query.calls) {
				const url = new URL(call.endpoint, window.location.origin);
				if (call.params)
					for (const [key, value] of Object.entries(call.params))
						url.searchParams.set(key, value);

				setResults((r) =>
					r.map((item, i) =>
						i === index ? { ...item, calls: [...item.calls, call] } : item,
					),
				);

				await fetch(url.toString(), {
					context: { account: client?.account },
				});

				await new Promise((r) => setTimeout(r, 800));
			}

			setResults((r) =>
				r.map((item, i) => (i === index ? { ...item, status: "done" } : item)),
			);

			await new Promise((r) => setTimeout(r, 1000));
		},
		onError: () => {
			setResults((r) => {
				const last = r.length - 1;
				return r.map((item, i) =>
					i === last ? { ...item, status: "error" } : item,
				);
			});
		},
	});

	return (
		<>
			{results.map((result, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: stable list
				<QueryResult key={i} {...result} />
			))}
			{!isPending && (
				<Cli.Block>
					<Cli.Line variant="info">Select a query to run:</Cli.Line>
					<Cli.Select autoFocus onSubmit={(v) => mutate(v)}>
						{presets.map((query) => (
							<Cli.Select.Option key={query.id} value={query.id}>
								{query.prompt}
							</Cli.Select.Option>
						))}
					</Cli.Select>
				</Cli.Block>
			)}
		</>
	);
}

function QueryResult({
	calls,
	query,
	status,
}: {
	calls: ApiCall[];
	query: QueryPreset;
	status: "pending" | "done" | "error";
}) {
	return (
		<Cli.Block>
			<Cli.Line variant="input" prefix="❯">
				agent.query("{query.prompt}")
			</Cli.Line>
			<Cli.Line variant="info">
				Planning: {query.calls.length} API calls, ~$
				{query.calls
					.reduce((sum, c) => sum + Number.parseFloat(c.price.slice(1)), 0)
					.toFixed(3)}{" "}
				total
			</Cli.Line>
			<Cli.Blank />
			{calls.map((call, i) => (
				<div key={call.name}>
					<Cli.Line variant="warning" prefix="→">
						[{i + 1}/{query.calls.length}] {call.name} — {call.price}
					</Cli.Line>
					{i === calls.length - 1 && status === "pending" ? (
						<Cli.Line variant="loading">{call.description}...</Cli.Line>
					) : (
						<Cli.Line variant="success" prefix="✓">
							{call.description}
						</Cli.Line>
					)}
				</div>
			))}
			{status === "done" && (
				<>
					<Cli.Blank />
					<Cli.Line variant="success" prefix="✓">
						Complete — {query.calls.length} calls
					</Cli.Line>
					<Cli.Blank />
					<Cli.Line>{query.response}</Cli.Line>
				</>
			)}
			{status === "error" && (
				<>
					<Cli.Blank />
					<Cli.Line variant="error" prefix="✗">
						Query failed
					</Cli.Line>
				</>
			)}
		</Cli.Block>
	);
}
