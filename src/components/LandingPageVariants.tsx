/**
 * Unused landing page variants (A–E) preserved for reference.
 * Only variant F is active — see LandingPage.tsx.
 */

"use client";

import { useMutation } from "@tanstack/react-query";
import type React from "react";
import { useEffect, useState } from "react";
import { useConnectorClient } from "wagmi";
import { fetch } from "../mppx.client";
import { pathUsd } from "../wagmi.config";
import { AgentTabs } from "./AgentTabs";
import { AsciiLogo } from "./AsciiLogo";
import * as Cli from "./Cli";

// Re-use shared components from the main file (these are NOT exported from
// LandingPage.tsx in production — copy them here if you ever need to
// resurrect a variant).

// ============================================================
// Shared helpers duplicated here for self-containment
// ============================================================

function CoAuthoredBy() {
	return (
		<div className="flex items-center gap-5">
			<span
				className="text-xs font-medium tracking-widest uppercase"
				style={{ color: "var(--vocs-text-color-muted)" }}
			>
				Co-authored by
			</span>
			<div className="flex items-center gap-5">
				<a
					href="https://tempo.xyz"
					target="_blank"
					rel="noopener noreferrer"
					className="no-underline transition-colors"
					style={{ color: "var(--vocs-text-color-muted)" }}
				>
					<TempoLogo style={{ width: "70px" }} />
				</a>
				<a
					href="https://stripe.com"
					target="_blank"
					rel="noopener noreferrer"
					className="no-underline transition-colors"
					style={{ color: "var(--vocs-text-color-muted)" }}
				>
					<StripeLogo style={{ width: "55px" }} />
				</a>
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

// ============================================================
// VARIANT A
// ============================================================
export function HeroVariantA() {
	return (
		<section className="pt-4 pb-8">
			<div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-stretch">
				<div className="flex-9 space-y-6 min-w-0 order-first lg:order-last">
					<div className="lg:hidden">
						<AsciiLogo />
					</div>
					<h1
						className="text-2xl md:text-3xl lg:text-4xl font-bold leading-[1.1] tracking-tight"
						style={{ color: "var(--vocs-text-color-heading)" }}
					>
						Machine Payments Protocol
					</h1>
					<div className="space-y-1.5 max-w-xl">
						<p
							className="text-sm md:text-base leading-relaxed"
							style={{ color: "var(--vocs-text-color-secondary)" }}
						>
							Accept payments from humans, software, or AI agents using standard
							HTTP. No billing accounts or manual signup required.
						</p>
					</div>
					<CoAuthoredBy />
				</div>
				<div className="flex-11 w-full min-w-0 flex flex-col order-last lg:order-first max-w-[574px] lg:max-w-none">
					<Cli.Demo
						title="agent-demo"
						token={pathUsd}
						height={320}
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
// VARIANT B
// ============================================================
export function HeroVariantB() {
	return (
		<>
			<section className="pt-4 lg:pt-6">
				<div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
					<div className="flex-1 w-full min-w-0 max-w-[574px] space-y-5">
						<div className="lg:hidden">
							<AsciiLogo />
						</div>
						<h1
							className="text-2xl md:text-3xl lg:text-4xl font-bold leading-[1.1] tracking-tight"
							style={{ color: "var(--vocs-text-color-heading)" }}
						>
							Machine Payments Protocol
						</h1>
						<p
							className="text-sm md:text-base leading-relaxed"
							style={{ color: "var(--vocs-text-color-secondary)" }}
						>
							Accept payments from humans, software, or AI agents using standard
							HTTP. No billing accounts or manual signup required.
						</p>
						<Cli.Demo
							title="agent-demo"
							token={pathUsd}
							height={320}
							restartStep={1}
						>
							<Cli.Startup />
							<Cli.ConnectWallet />
							<Cli.Faucet />
							<SelectQuery />
						</Cli.Demo>
					</div>
					<div className="flex-1 space-y-5 min-w-0">
						<MultiPromptBox />
					</div>
				</div>
			</section>
			<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
				<CoAuthoredBy />
			</div>
		</>
	);
}

// ============================================================
// VARIANT C
// ============================================================
export function HeroVariantC() {
	return (
		<section className="pt-6 text-center">
			<div className="max-w-2xl mx-auto space-y-6">
				<h1
					className="text-2xl md:text-3xl lg:text-4xl font-bold leading-[1.1] tracking-tight"
					style={{ color: "var(--vocs-text-color-heading)" }}
				>
					Machine Payments Protocol
				</h1>
				<p
					className="text-sm md:text-base leading-relaxed max-w-xl mx-auto"
					style={{ color: "var(--vocs-text-color-secondary)" }}
				>
					Accept payments from humans, software, or AI agents using standard
					HTTP. No billing accounts or manual signup required.
				</p>
				<div className="flex justify-center">
					<AgentTabs />
				</div>
				<div className="flex items-center justify-center pt-2">
					<CoAuthoredBy />
				</div>
			</div>
		</section>
	);
}

// ============================================================
// VARIANT D
// ============================================================
export function HeroVariantD() {
	return (
		<section className="pt-6 text-center">
			<div className="max-w-2xl mx-auto space-y-6">
				<h1
					className="text-2xl md:text-3xl lg:text-4xl font-bold leading-[1.1] tracking-tight"
					style={{ color: "var(--vocs-text-color-heading)" }}
				>
					Machine Payments Protocol
				</h1>
				<p
					className="text-sm md:text-base leading-relaxed max-w-xl mx-auto"
					style={{ color: "var(--vocs-text-color-secondary)" }}
				>
					Accept payments from humans, software, or AI agents using standard
					HTTP. No billing accounts or manual signup required.
				</p>
				<div className="flex justify-center pt-2">
					<div className="w-full max-w-[500px]">
						<Cli.Demo
							title="agent-demo"
							token={pathUsd}
							height={280}
							restartStep={1}
						>
							<Cli.Startup />
							<Cli.ConnectWallet />
							<Cli.Faucet />
							<SelectQuery />
						</Cli.Demo>
					</div>
				</div>
				<div className="flex items-center justify-center pt-2">
					<CoAuthoredBy />
				</div>
			</div>
		</section>
	);
}

// ============================================================
// VARIANT E
// ============================================================
export function HeroVariantE() {
	return (
		<section className="pt-6 text-center">
			<div className="max-w-3xl mx-auto space-y-6">
				<h1
					className="text-2xl md:text-3xl lg:text-4xl font-bold leading-[1.1] tracking-tight"
					style={{ color: "var(--vocs-text-color-heading)" }}
				>
					Machine Payments Protocol
				</h1>
				<p
					className="text-sm md:text-base leading-relaxed max-w-xl mx-auto"
					style={{ color: "var(--vocs-text-color-secondary)" }}
				>
					Accept payments from humans, software, or AI agents using standard
					HTTP. No billing accounts or manual signup required.
				</p>
				<div className="pt-2">
					<CliPromptAnimated />
				</div>
				<div className="flex items-center gap-5 justify-center pt-4">
					<span
						className="text-xs font-medium tracking-widest uppercase"
						style={{ color: "var(--vocs-text-color-muted)" }}
					>
						Co-authored by
					</span>
					<a
						href="https://tempo.xyz"
						target="_blank"
						rel="noopener noreferrer"
						className="no-underline transition-colors"
						style={{ color: "var(--vocs-text-color-muted)" }}
					>
						<TempoLogo style={{ width: "70px" }} />
					</a>
					<a
						href="https://stripe.com"
						target="_blank"
						rel="noopener noreferrer"
						className="no-underline transition-colors"
						style={{ color: "var(--vocs-text-color-muted)" }}
					>
						<StripeLogo style={{ width: "55px" }} />
					</a>
				</div>
			</div>
		</section>
	);
}

// ============================================================
// Variant-specific components (not used by F)
// ============================================================

const MULTI_PROMPTS = [
	{
		comment: "Generate images with fal.ai",
		prompt: "use fal to generate a logo for my coffee shop startup",
	},
	{
		comment: "Query LLMs via OpenRouter",
		prompt: "use openrouter to compare GPT-4 and Claude on this code review",
	},
	{
		comment: "Run AI inference on Cloudflare",
		prompt: "use cloudflare ai to summarize this PDF and extract key points",
	},
	{
		comment: "Create video content with fal.ai",
		prompt: "use fal to generate a 5-second product demo video from this image",
	},
	{
		comment: "Access premium models instantly",
		prompt: "use openrouter to run claude-3-opus on my research paper",
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
		<div
			className="max-w-xl rounded-md overflow-hidden"
			style={{ border: "1px solid var(--vocs-border-color-secondary)" }}
		>
			<div
				className="px-4 py-2"
				style={{
					background: "var(--vocs-background-color-surfaceMuted)",
					borderBottom: "1px solid var(--vocs-border-color-secondary)",
				}}
			>
				<span
					className="text-xs font-medium"
					style={{ color: "var(--vocs-text-color-secondary)" }}
				>
					Example prompts for your AI agent
				</span>
			</div>
			<div style={{ background: "var(--vocs-background-color-surface)" }}>
				{MULTI_PROMPTS.map((item, i) => {
					const fullCommand = `claude -p "${item.prompt}"`;
					return (
						<div
							key={item.prompt}
							className="px-4 py-3 flex items-start justify-between gap-3"
							style={{
								borderBottom:
									i < MULTI_PROMPTS.length - 1
										? "1px solid var(--vocs-border-color-secondary)"
										: "none",
							}}
						>
							<div className="font-mono text-sm min-w-0">
								<div
									className="text-xs mb-0.5"
									style={{ color: "var(--vocs-text-color-muted)" }}
								>
									# {item.comment}
								</div>
								<div>
									<span style={{ color: "var(--vocs-text-color-primary)" }}>
										claude -p{" "}
									</span>
									<span style={{ color: "var(--vocs-color-success)" }}>
										"{item.prompt}"
									</span>
								</div>
							</div>
							<button
								type="button"
								onClick={() => handleCopy(fullCommand, i)}
								className="hover:text-accent transition-colors shrink-0 mt-4"
								style={{ color: "var(--vocs-text-color-muted)" }}
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

const CLI_PROMPTS = [
	"Log in (https://mpp.tempo.xyz/quickstart/tempoctl), and create an image saying 'welcome to MPP $(whoami)' using this MCP server (https://payments.tempo.xyz/discover).",
	"Log in (https://mpp.tempo.xyz/quickstart/tempoctl), and get the current price and liquidity data for WETH, USDC, and ARB on Ethereum, then generate a visual summary image using this MCP server (https://payments.tempo.xyz/discover).",
	"Log in (https://mpp.tempo.xyz/quickstart/tempoctl), and search for recent AI research papers, scrape and summarize the top 3, write a 2-minute podcast script, and convert it to speech using this MCP server (https://payments.tempo.xyz/discover).",
];

function ClaudeLogoSmall({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 16 16"
			fill="currentColor"
			aria-hidden="true"
		>
			<path d="M3.127 10.604l3.135-1.76.053-.153-.053-.085H6.11l-.525-.032-1.791-.048-1.554-.065-1.505-.08-.38-.081L0 7.832l.036-.234.32-.214.455.04 1.009.069 1.513.105 1.097.064 1.626.17h.259l.036-.105-.089-.065-.068-.064-1.566-1.062-1.695-1.121-.887-.646-.48-.327-.243-.306-.104-.67.435-.48.585.04.15.04.593.456 1.267.981 1.654 1.218.242.202.097-.068.012-.049-.109-.181-.9-1.626-.96-1.655-.428-.686-.113-.411a2 2 0 0 1-.068-.484l.496-.674L4.446 0l.662.089.279.242.411.94.666 1.48 1.033 2.014.302.597.162.553.06.17h.105v-.097l.085-1.134.157-1.392.154-1.792.052-.504.25-.605.497-.327.387.186.319.456-.045.294-.19 1.23-.37 1.93-.243 1.29h.142l.161-.16.654-.868 1.097-1.372.484-.545.565-.601.363-.287h.686l.505.751-.226.775-.707.895-.585.759-.839 1.13-.524.904.048.072.125-.012 1.897-.403 1.024-.186 1.223-.21.553.258.06.263-.218.536-1.307.323-1.533.307-2.284.54-.028.02.032.04 1.029.098.44.024h1.077l2.005.15.525.346.315.424-.053.323-.807.411-3.631-.863-.872-.218h-.12v.073l.726.71 1.331 1.202 1.667 1.55.084.383-.214.302-.226-.032-1.464-1.101-.565-.497-1.28-1.077h-.084v.113l.295.432 1.557 2.34.08.718-.112.234-.404.141-.444-.08-.911-1.28-.94-1.44-.759-1.291-.093.053-.448 4.821-.21.246-.484.186-.403-.307-.214-.496.214-.98.258-1.28.21-1.016.19-1.263.112-.42-.008-.028-.092.012-.953 1.307-1.448 1.957-1.146 1.227-.274.109-.477-.247.045-.44.266-.39 1.586-2.018.956-1.25.617-.723-.004-.105h-.036l-4.212 2.736-.75.096-.324-.302.04-.496.154-.162 1.267-.871z" />
		</svg>
	);
}

function CodexLogoSmall({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="currentColor"
			aria-hidden="true"
		>
			<path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.998 5.998 0 0 0-3.998 2.9 6.042 6.042 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
		</svg>
	);
}

function AmpLogoSmall({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 28 28"
			fill="currentColor"
			aria-hidden="true"
		>
			<path d="M13.9197 13.61L17.3816 26.566L14.242 27.4049L11.2645 16.2643L0.119926 13.2906L0.957817 10.15L13.9197 13.61Z" />
			<path d="M13.7391 16.0892L4.88169 24.9056L2.58872 22.6019L11.4461 13.7865L13.7391 16.0892Z" />
			<path d="M18.9386 8.58315L22.4005 21.5392L19.2609 22.3781L16.2833 11.2374L5.13879 8.26381L5.97668 5.12318L18.9386 8.58315Z" />
			<path d="M23.9803 3.55632L27.4422 16.5124L24.3025 17.3512L21.325 6.21062L10.1805 3.23698L11.0183 0.0963593L23.9803 3.55632Z" />
		</svg>
	);
}

const CLI_AGENTS = [
	{ label: "Claude", bin: "claude", args: "-p", icon: ClaudeLogoSmall },
	{ label: "Codex", bin: "codex", args: "--full-auto", icon: CodexLogoSmall },
	{ label: "Amp", bin: "amp", args: null, icon: AmpLogoSmall },
];

function CliPromptAnimated() {
	const [displayText, setDisplayText] = useState("");
	const [promptIndex, setPromptIndex] = useState(0);
	const [agentIndex, setAgentIndex] = useState(0);
	const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">(
		"typing",
	);
	const [copied, setCopied] = useState(false);

	const currentPrompt = CLI_PROMPTS[promptIndex];
	const currentAgent = CLI_AGENTS[agentIndex];

	useEffect(() => {
		let timeout: ReturnType<typeof setTimeout>;
		if (phase === "typing") {
			if (displayText.length < currentPrompt.length) {
				timeout = setTimeout(
					() => {
						setDisplayText(currentPrompt.slice(0, displayText.length + 1));
					},
					18 + Math.random() * 12,
				);
			} else {
				setPhase("pausing");
			}
		} else if (phase === "pausing") {
			timeout = setTimeout(() => setPhase("deleting"), 4000);
		} else if (phase === "deleting") {
			if (displayText.length > 0) {
				timeout = setTimeout(() => {
					setDisplayText(displayText.slice(0, -1));
				}, 8);
			} else {
				setPromptIndex((i) => (i + 1) % CLI_PROMPTS.length);
				setPhase("typing");
			}
		}
		return () => clearTimeout(timeout);
	}, [displayText, phase, currentPrompt]);

	const handleCopy = () => {
		const cmd = currentAgent.args
			? `${currentAgent.bin} ${currentAgent.args} "${currentPrompt}"`
			: `${currentAgent.bin} "${currentPrompt}"`;
		navigator.clipboard.writeText(cmd);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div
			className="w-full max-w-xl rounded-md overflow-hidden text-left"
			style={{ border: "1px solid var(--vocs-border-color-secondary)" }}
		>
			<div
				className="flex"
				style={{
					background: "var(--vocs-background-color-surfaceMuted)",
					borderBottom: "1px solid var(--vocs-border-color-secondary)",
				}}
			>
				{CLI_AGENTS.map((agent, i) => {
					const AgentIcon = agent.icon;
					return (
						<button
							key={agent.label}
							type="button"
							onClick={() => setAgentIndex(i)}
							className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
							style={{
								color:
									i === agentIndex
										? "var(--vocs-text-color-heading)"
										: "var(--vocs-text-color-muted)",
								background:
									i === agentIndex
										? "var(--vocs-background-color-surface)"
										: "transparent",
								borderBottom:
									i === agentIndex
										? "2px solid var(--vocs-text-color-heading)"
										: "none",
								marginBottom: i === agentIndex ? "-1px" : "0",
							}}
						>
							<AgentIcon className="w-3.5 h-3.5" />
							{agent.label}
						</button>
					);
				})}
			</div>
			<div
				className="relative px-4 py-3 pr-10 font-mono text-sm leading-relaxed"
				style={{
					minHeight: "56px",
					background: "var(--vocs-background-color-surface)",
				}}
			>
				<span style={{ color: "var(--vocs-text-color-muted)" }}>$ </span>
				<span style={{ color: "var(--vocs-text-color-secondary)" }}>
					{currentAgent.bin}
					{currentAgent.args ? ` ${currentAgent.args}` : ""}
				</span>
				<span style={{ color: "var(--vocs-color-success)" }}>
					{" "}
					"{displayText}
				</span>
				<span
					className="inline-block w-0.5 h-4 mx-0.5 align-middle animate-pulse"
					style={{ background: "var(--vocs-color-success)" }}
				/>
				<span style={{ color: "var(--vocs-color-success)" }}>"</span>
				<button
					type="button"
					onClick={handleCopy}
					className="absolute top-3 right-3 hover:text-accent transition-colors"
					style={{ color: "var(--vocs-text-color-muted)" }}
					aria-label="Copy prompt"
				>
					{copied ? (
						<svg
							width="18"
							height="18"
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
							width="18"
							height="18"
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

// SelectQuery — uses wagmi wallet connector (variants A–D only)
type ApiCall = {
	description: string;
	endpoint: string;
	name: string;
	params?: Record<string, string>;
	price: string;
};

type CompletedCall = ApiCall & { txHash?: string };

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
];

function SelectQuery() {
	const { data: client } = useConnectorClient();
	const [results, setResults] = useState<
		{
			calls: CompletedCall[];
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
				const response = await fetch(url.toString(), {
					context: { account: client?.account },
				});
				const txHash = response.headers.get("x-payment-tx") || undefined;
				setResults((r) =>
					r.map((item, i) =>
						i === index
							? {
									...item,
									calls: item.calls.map((c, ci) =>
										ci === item.calls.length - 1 ? { ...c, txHash } : c,
									),
								}
							: item,
					),
				);
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
			{results.map((_result, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: stable demo list
				<Cli.Block key={i}>
					<Cli.Line variant="info">Result {i}</Cli.Line>
				</Cli.Block>
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
