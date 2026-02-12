"use client";

import { useMutation } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { Link } from "vocs";
import { useConnectorClient } from "wagmi";
import { fetch } from "../mpay.client";
import { pathUsd } from "../wagmi.config";
import { AgentTabs } from "./AgentTabs";
import { AsciiLogo } from "./AsciiLogo";
import * as Cli from "./Cli";

type Variant = "A" | "B" | "C" | "D" | "E" | "F";

// Hook for scroll-based variants - applies scroll snap to body/html
// Scroll snap container component - uses a fixed overlay to bypass Vocs scroll containers
function ScrollSnapContainer({
	children,
	scrollOpacity,
	setScrollOpacity,
}: {
	children: React.ReactNode;
	scrollOpacity: number;
	setScrollOpacity: (v: number) => void;
}) {
	const containerRef = React.useRef<HTMLDivElement>(null);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const handleScroll = () => {
			const scrollY = container.scrollTop;
			const fadeStart = 50;
			const fadeEnd = 150;
			if (scrollY <= fadeStart) {
				setScrollOpacity(1);
			} else if (scrollY >= fadeEnd) {
				setScrollOpacity(0);
			} else {
				setScrollOpacity(1 - (scrollY - fadeStart) / (fadeEnd - fadeStart));
			}
		};

		container.addEventListener("scroll", handleScroll);
		return () => container.removeEventListener("scroll", handleScroll);
	}, [setScrollOpacity]);

	// Hide the parent page's scrollbar and content
	useEffect(() => {
		const html = document.documentElement;
		const body = document.body;

		const originalHtmlOverflow = html.style.overflow;
		const originalBodyOverflow = body.style.overflow;

		html.style.overflow = "hidden";
		body.style.overflow = "hidden";

		return () => {
			html.style.overflow = originalHtmlOverflow;
			body.style.overflow = originalBodyOverflow;
		};
	}, []);

	return (
		<>
			{/* Background layer behind header */}
			<div
				className="fixed inset-x-0 top-0 h-[64px] z-5"
				style={{
					background: "light-dark(#f9fafb, var(--vocs-color-bg, #1a1a1a))",
				}}
			/>
			<div
				ref={containerRef}
				className="scroll-snap-container fixed inset-0 top-[64px] overflow-y-auto z-10"
				style={{
					scrollSnapType: "y mandatory",
					scrollBehavior: "smooth",
					msOverflowStyle: "none",
					scrollbarWidth: "none",
					background: "light-dark(#f9fafb, var(--vocs-color-bg, #1a1a1a))",
				}}
			>
				<style>
					{`
						.scroll-snap-container::-webkit-scrollbar { display: none; }
						body, html, [data-layout], [data-v-layout], main, article {
							background: #f9fafb !important;
							background-color: #f9fafb !important;
						}
						[data-v-gutter-top], [data-v-header], header, [data-layout] > div:first-child {
							background: #f9fafb !important;
							background-color: #f9fafb !important;
							position: relative !important;
							z-index: 50 !important;
						}
						@media (prefers-color-scheme: dark) {
							body, html, [data-layout], [data-v-layout], main, article {
								background: var(--vocs-color-bg, #1a1a1a) !important;
								background-color: var(--vocs-color-bg, #1a1a1a) !important;
							}
							[data-v-gutter-top], [data-v-header], header, [data-layout] > div:first-child {
								background: var(--vocs-color-bg, #1a1a1a) !important;
								background-color: var(--vocs-color-bg, #1a1a1a) !important;
							}
						}
					`}
				</style>
				{children}
				<ScrollIndicator opacity={scrollOpacity} />
			</div>
		</>
	);
}

function useScrollSnap() {
	const [scrollOpacity, setScrollOpacity] = useState(1);
	return { scrollOpacity, setScrollOpacity };
}

// Scroll indicator component
function ScrollIndicator({
	opacity,
	text = "Scroll to try demo",
}: {
	opacity: number;
	text?: string;
}) {
	return (
		<div
			className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce pointer-events-none transition-opacity duration-200 z-50"
			style={{ opacity }}
		>
			<span className="text-xs text-gray-400">{text}</span>
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
	);
}

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
				{(["A", "B", "C", "D", "E", "F"] as const).map((v) => (
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
			{variant === "E" && <HeroVariantE />}
			{variant === "F" && <HeroVariantF />}
		</div>
	);
}

// ============================================================
// VARIANT A: Wrapped prompt text (full prompt visible)
// ============================================================
function HeroVariantA() {
	return (
		<>
			<section className="pt-4 pb-8">
				<div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-stretch">
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
								Accept payments from humans, software, or AI agents using
								standard HTTP. No billing accounts or manual signup required.
							</p>
						</div>
						<AgentTabsWrapped />
						<CTAButtons />
						<CoAuthoredBy />
					</div>
					{/* Left pane — interactive demo */}
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
			<ServiceCards />
		</>
	);
}

// Service cards for available integrations
const SERVICES = [
	{
		name: "fal.ai",
		description: "Run generative AI models for images, video, and audio",
		url: "https://fal.payments.tempo.xyz/",
		price: "$0.05",
		thirdParty: true,
		streaming: false,
		logo: FalLogo,
	},
	{
		name: "Codex",
		description: "Decentralized storage and data availability network",
		url: "https://codex.payments.tempo.xyz/",
		price: "$0.0003",
		thirdParty: true,
		streaming: false,
		logo: CodexLogo,
	},
	{
		name: "Cloudflare",
		description: "Edge compute, AI inference, and global CDN services",
		url: "https://payments.tempo.xyz/",
		price: "$0.02",
		thirdParty: true,
		streaming: false,
		logo: CloudflareLogo,
	},
	{
		name: "OpenRouter",
		description: "Unified API for 200+ LLMs from OpenAI, Anthropic, and more",
		url: "https://openrouter.payments.tempo.xyz/",
		price: "$0.01",
		thirdParty: true,
		streaming: true,
		logo: OpenRouterLogo,
	},
];

// Service provider logos
function FalLogo({
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
			viewBox="0 0 202 200"
			fill="currentColor"
			aria-hidden="true"
		>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M124.46 19C127.267 19 129.515 21.282 129.783 24.0755C132.176 48.9932 152.007 68.8231 176.924 71.2162C179.719 71.4845 182 73.7336 182 76.54V123.46C182 126.266 179.719 128.515 176.924 128.784C152.007 131.177 132.176 151.007 129.783 175.924C129.515 178.718 127.267 181 124.46 181H77.5404C74.734 181 72.4849 178.718 72.2165 175.924C69.8235 151.007 49.9933 131.177 25.0755 128.784C22.282 128.515 20 126.266 20 123.46V76.54C20 73.7336 22.282 71.4845 25.0755 71.2162C49.9933 68.8231 69.8235 48.9932 72.2165 24.0755C72.4849 21.282 74.734 19 77.5404 19H124.46ZM52.5273 99.8627C52.5273 126.817 74.3534 148.667 101.277 148.667C128.201 148.667 150.028 126.817 150.028 99.8627C150.028 72.9087 128.201 51.058 101.277 51.058C74.3534 51.058 52.5273 72.9087 52.5273 99.8627Z"
			/>
		</svg>
	);
}

function CodexLogo({
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
			viewBox="0 0 202 200"
			fill="currentColor"
			aria-hidden="true"
		>
			<path d="M81.9546 77.7824V62.2028C81.9546 60.8901 82.446 59.906 83.5903 59.2505L114.824 41.2108C119.076 38.7509 124.146 37.6035 129.378 37.6035C149.001 37.6035 161.43 52.8558 161.43 69.0915C161.43 70.2391 161.43 71.5509 161.266 72.8628L128.887 53.8388C126.926 52.6914 124.962 52.6914 123 53.8388L81.9546 77.7824ZM154.888 138.463V101.234C154.888 98.9381 153.906 97.2976 151.944 96.1501L110.899 72.2064L124.309 64.4979C125.453 63.8424 126.434 63.8424 127.579 64.4979L158.813 82.5378C167.808 87.7861 173.857 98.9381 173.857 109.761C173.857 122.225 166.499 133.705 154.888 138.461V138.463ZM72.3066 105.663L58.8975 97.7913C57.7534 97.1366 57.2623 96.1517 57.2623 94.8398V58.7599C57.2623 41.2125 70.6717 27.9275 88.8234 27.9275C95.6923 27.9275 102.069 30.2241 107.467 34.3239L75.252 53.0206C73.2903 54.168 72.3083 55.8079 72.3083 58.1048V105.665L72.3066 105.663ZM101.169 122.39L81.9546 111.567V88.6083L101.169 77.7841L120.383 88.6083V111.567L101.169 122.39ZM113.515 172.248C106.647 172.248 100.271 169.951 94.8732 165.852L127.088 147.155C129.049 146.007 130.031 144.368 130.031 142.071V94.5104L143.604 102.382C144.749 103.037 145.24 104.022 145.24 105.334V141.414C145.24 158.961 131.666 172.246 113.515 172.246V172.248ZM74.7598 135.676L43.5249 117.636C34.5302 112.387 28.4805 101.236 28.4805 90.4122C28.4805 77.7841 36.0028 66.4686 47.6126 61.7124V99.104C47.6126 101.401 48.5944 103.04 50.5561 104.188L91.4388 127.967L78.0296 135.676C76.8853 136.331 75.904 136.331 74.7598 135.676ZM72.9619 162.572C54.483 162.572 40.9099 148.632 40.9099 131.412C40.9099 130.099 41.0738 128.787 41.2364 127.475L73.4509 146.171C75.4126 147.319 77.3759 147.319 79.3376 146.171L120.383 122.392V137.973C120.383 139.284 119.893 140.269 118.748 140.924L87.5137 158.965C83.2619 161.424 78.1925 162.572 72.9602 162.572H72.9619ZM113.515 182.087C133.303 182.087 149.818 167.983 153.581 149.286C171.896 144.53 183.67 127.31 183.67 109.763C183.67 98.2825 178.764 87.1314 169.934 79.0951C170.751 75.6508 171.242 72.2064 171.242 68.7637C171.242 45.312 152.273 27.7628 130.359 27.7628C125.945 27.7628 121.693 28.418 117.441 29.8949C110.082 22.6786 99.9425 18.0869 88.8234 18.0869C69.0368 18.0869 52.5213 32.1901 48.7587 50.8867C30.4439 55.6431 18.6699 72.8628 18.6699 90.4106C18.6699 101.891 23.5751 113.042 32.4059 121.079C31.5883 124.523 31.0976 127.967 31.0976 131.41C31.0976 154.862 50.0671 172.411 71.9798 172.411C76.3947 172.411 80.6465 171.756 84.8984 170.279C92.2562 177.495 102.396 182.087 113.515 182.087Z" />
		</svg>
	);
}

function CloudflareLogo({
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
			viewBox="0 0 202 200"
			fill="currentColor"
			aria-hidden="true"
		>
			<path d="M137.698 138.284C138.356 136.546 138.587 134.675 138.374 132.828C138.161 130.982 137.509 129.213 136.472 127.67C135.407 126.394 134.101 125.341 132.629 124.571C131.156 123.8 129.546 123.327 127.89 123.179L56.7796 122.362C56.3709 122.362 55.9622 121.954 55.5535 121.954C55.4583 121.883 55.3811 121.79 55.3279 121.684C55.2747 121.578 55.247 121.461 55.247 121.342C55.247 121.223 55.2747 121.106 55.3279 120.999C55.3811 120.893 55.4583 120.801 55.5535 120.729C55.9622 119.913 56.3709 119.505 57.1882 119.505L128.707 118.688C133.248 118.185 137.572 116.482 141.235 113.756C144.898 111.029 147.768 107.377 149.55 103.174L153.637 92.5597C153.637 92.1514 154.045 91.7432 153.637 91.3349C151.415 81.4486 146.023 72.5572 138.281 66.0116C130.538 59.466 120.869 55.6241 110.741 55.0697C100.613 54.5154 90.5814 57.2788 82.1695 62.9402C73.7576 68.6015 67.4256 76.8513 64.1358 86.4358C59.8649 83.3887 54.6555 81.9432 49.4233 82.3533C44.6216 82.8881 40.1449 85.0386 36.7285 88.4514C33.3122 91.8642 31.1595 96.3363 30.6241 101.133C30.3519 103.588 30.4901 106.072 31.0327 108.482C23.2635 108.696 15.8846 111.93 10.4657 117.496C5.04675 123.062 2.01543 130.52 2.01651 138.284C1.94944 139.793 2.08691 141.304 2.42518 142.775C2.44395 143.094 2.57915 143.395 2.80514 143.62C3.03113 143.846 3.33219 143.981 3.65123 144H134.837C135.655 144 136.472 143.592 136.472 142.775L137.698 138.284Z" />
			<path d="M160.175 92.5597H158.132C157.723 92.5597 157.315 92.9679 156.906 93.3762L154.045 103.174C153.388 104.913 153.156 106.784 153.369 108.63C153.583 110.477 154.235 112.246 155.271 113.789C156.336 115.064 157.642 116.117 159.115 116.888C160.587 117.659 162.198 118.132 163.854 118.28L178.975 119.096C179.383 119.096 179.792 119.505 180.201 119.505C180.296 119.576 180.373 119.668 180.426 119.775C180.48 119.881 180.507 119.998 180.507 120.117C180.507 120.236 180.48 120.353 180.426 120.459C180.373 120.566 180.296 120.658 180.201 120.729C179.792 121.546 179.383 121.954 178.566 121.954L163.036 122.771C158.496 123.274 154.172 124.977 150.508 127.703C146.845 130.43 143.975 134.082 142.194 138.284L141.376 141.959C140.968 142.367 141.376 143.183 142.194 143.183H196.139C196.306 143.207 196.476 143.192 196.635 143.139C196.795 143.086 196.94 142.996 197.059 142.877C197.178 142.758 197.267 142.614 197.321 142.454C197.374 142.295 197.389 142.125 197.365 141.959C198.338 138.5 198.887 134.935 199 131.344C198.935 121.078 194.824 111.25 187.557 103.991C180.29 96.7314 170.452 92.6244 160.175 92.5597Z" />
		</svg>
	);
}

function OpenRouterLogo({
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
			viewBox="0 0 202 200"
			fill="currentColor"
			aria-hidden="true"
		>
			<path d="M11.0968 99.4902C16.428 99.4902 37.0417 94.9289 47.7039 88.9388C58.3662 82.9486 58.3662 82.9486 80.4016 67.4447C108.3 47.8157 128.026 54.3879 160.369 54.3879" />
			<path d="M71.1457 54.5138C104.459 31.0751 132.161 38.5316 160.369 38.5316V70.2441C123.892 70.2441 112.142 64.5564 89.6578 80.3755C67.576 95.9121 67.0111 96.3169 55.5889 102.734C48.4606 106.739 39.0677 109.789 31.5183 111.783C24.3264 113.682 16.0521 115.346 11.0968 115.346V83.6338C10.8661 83.6338 11.9296 83.5911 14.6641 83.0908C17.0682 82.651 20.0716 81.9872 23.2842 81.1387C30.0399 79.3545 36.285 77.1288 39.819 75.1434C49.7213 69.5802 49.1569 69.9849 71.1457 54.5138Z" />
			<path d="M191.645 54.5835L137 85.8619V23.3052L191.645 54.5835Z" />
			<path d="M192 54.5835L136.823 86.167V23L192 54.5835ZM137.178 85.5565L191.289 54.5835L137.178 23.6101V85.5565Z" />
			<path d="M10.0306 99.5096C15.3617 99.5096 35.9754 104.071 46.6377 110.061C57.3 116.051 57.3 116.051 79.3353 131.555C107.234 151.184 126.96 144.612 159.302 144.612" />
			<path d="M10.0306 83.6533C14.9859 83.6533 23.2602 85.3177 30.452 87.2172C38.0015 89.2111 47.3944 92.261 54.5227 96.2657C65.9449 102.683 66.5097 103.088 88.5916 118.624C111.075 134.443 122.826 128.756 159.302 128.756V160.468C131.095 160.468 103.393 167.925 70.0794 144.486C48.0907 129.015 48.6551 129.419 38.7528 123.856C35.2188 121.871 28.9736 119.645 22.2179 117.861C19.0053 117.012 16.0019 116.349 13.5979 115.909C10.8633 115.409 9.79985 115.366 10.0306 115.366V83.6533Z" />
			<path d="M190.578 144.416L135.934 113.138V175.695L190.578 144.416Z" />
			<path d="M190.934 144.416L135.757 176V112.833L190.934 144.416ZM136.112 175.389L190.223 144.416L136.112 113.443V175.389Z" />
		</svg>
	);
}

function ServiceCards() {
	return (
		<section className="pt-10 pb-6">
			<div className="flex items-start justify-between align-middle mb-6">
				<div>
					<h2
						style={{ fontSize: "1.25rem" }}
						className="font-semibold text-gray-900"
					>
						Available services
					</h2>
					<p className="text-sm text-gray-500 mt-1">
						Pay-per-call APIs ready to use with MPP
					</p>
				</div>
				<a
					href="https://payments.tempo.xyz"
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors no-underline"
				>
					View more →
				</a>
			</div>
			<div className="flex gap-3 overflow-x-auto pb-2">
				{SERVICES.map((service) => {
					const Logo = service.logo;
					return (
						<a
							key={service.name}
							href={service.url}
							target="_blank"
							rel="noopener noreferrer"
							className="group flex-1 min-w-[200px] p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors flex flex-col"
							style={{ textDecoration: "none" }}
						>
							<div className="flex items-center gap-2 mb-2">
								<Logo className="w-5 h-5 text-gray-600" />
								<span
									style={{ fontSize: "1rem" }}
									className="font-semibold text-gray-900 group-hover:text-[#0166FF] transition-colors"
								>
									{service.name}
								</span>
								{service.streaming && (
									<span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-50 text-green-700 rounded">
										Streaming
									</span>
								)}
							</div>
							<p className="text-xs text-gray-500 leading-relaxed flex-1">
								{service.description}
							</p>
							<div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
								<div className="text-sm font-mono text-gray-900">
									{service.price}
									<span className="text-gray-400 text-xs font-sans">
										{" "}
										/ call
									</span>
								</div>
								<span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500 rounded">
									{service.thirdParty ? "Third-party" : "First-party"}
								</span>
							</div>
						</a>
					);
				})}
			</div>
		</section>
	);
}

// ============================================================
// VARIANT B: Multiple prompts with numbers and comments
// ============================================================
function HeroVariantB() {
	return (
		<>
			<section className="pt-4 lg:pt-6">
				{/* Two column layout */}
				<div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
					{/* Left pane — title, subheading, demo */}
					<div className="flex-1 w-full min-w-0 max-w-[574px] space-y-5">
						<div className="lg:hidden">
							<AsciiLogo />
						</div>
						<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-black leading-[1.1] tracking-tight">
							Machine Payments Protocol
						</h1>
						<p className="text-sm md:text-base text-gray-600 leading-relaxed">
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
					{/* Right pane — prompts and buttons */}
					<div className="flex-1 space-y-5 min-w-0">
						<MultiPromptBox />
						<CTAButtons />
					</div>
				</div>
			</section>
			{/* Co-authored by - fixed bottom center */}
			<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
				<CoAuthoredBy />
			</div>
		</>
	);
}

// ============================================================
// VARIANT C: Split sections with scroll snap
// ============================================================
function HeroVariantC() {
	const { scrollOpacity, setScrollOpacity } = useScrollSnap();

	return (
		<ScrollSnapContainer
			scrollOpacity={scrollOpacity}
			setScrollOpacity={setScrollOpacity}
		>
			{/* Section 1: Hero content */}
			<section
				className="relative flex flex-col items-center justify-center text-center px-6"
				style={{ height: "calc(100vh - 64px)", scrollSnapAlign: "start" }}
			>
				{/* Content */}
				<div className="max-w-2xl space-y-6">
					<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-black leading-[1.1] tracking-tight">
						Machine Payments Protocol
					</h1>
					<p className="text-sm md:text-base text-gray-600 leading-relaxed max-w-xl mx-auto">
						Accept payments from humans, software, or AI agents using standard
						HTTP. No billing accounts or manual signup required.
					</p>
					<div className="flex justify-center">
						<AgentTabs />
					</div>
					<div className="flex justify-center">
						<CTAButtons />
					</div>
					<div className="flex items-center justify-center pt-2">
						<CoAuthoredBy />
					</div>
				</div>
			</section>

			{/* Section 2: CLI Demo */}
			<section
				className="flex flex-col items-center justify-center px-6 py-16"
				style={{ height: "calc(100vh - 64px)", scrollSnapAlign: "start" }}
			>
				<div className="max-w-[574px] w-full mx-auto space-y-6">
					<div className="text-center space-y-2">
						<h2 className="text-2xl font-semibold text-gray-900">Try it out</h2>
						<p className="text-sm text-gray-500">
							Connect a wallet and run paid API calls
						</p>
					</div>
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
		</ScrollSnapContainer>
	);
}

// ============================================================
// VARIANT D: CLI demo first, then animated prompts
// ============================================================
function HeroVariantD() {
	const { scrollOpacity, setScrollOpacity } = useScrollSnap();

	return (
		<ScrollSnapContainer
			scrollOpacity={scrollOpacity}
			setScrollOpacity={setScrollOpacity}
		>
			{/* Section 1: Hero with CLI Demo */}
			<section
				className="relative flex flex-col items-center justify-center text-center px-6"
				style={{ height: "calc(100vh - 64px)", scrollSnapAlign: "start" }}
			>
				{/* Content */}
				<div className="max-w-2xl space-y-6">
					<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-black leading-[1.1] tracking-tight">
						Machine Payments Protocol
					</h1>
					<p className="text-sm md:text-base text-gray-600 leading-relaxed max-w-xl mx-auto">
						Accept payments from humans, software, or AI agents using standard
						HTTP. No billing accounts or manual signup required.
					</p>
					{/* CLI Demo inline */}
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

			{/* Section 2: Run locally with agent prompts */}
			<section
				className="flex flex-col items-center justify-center px-6 py-16"
				style={{ height: "calc(100vh - 64px)", scrollSnapAlign: "start" }}
			>
				<div className="max-w-xl w-full mx-auto text-center space-y-8">
					<div className="space-y-2">
						<h2 className="text-2xl font-semibold text-gray-900">
							Run locally
						</h2>
						<p className="text-sm text-gray-500">
							Use your favorite AI agent CLI to get started
						</p>
					</div>
					<div className="flex justify-center">
						<AgentTabs />
					</div>
					<div className="flex justify-center pt-2">
						<CTAButtons />
					</div>
				</div>
			</section>
		</ScrollSnapContainer>
	);
}

// ============================================================
// VARIANT E: Animated CLI prompts hero with demo below
// ============================================================
function HeroVariantE() {
	const { scrollOpacity, setScrollOpacity } = useScrollSnap();

	return (
		<ScrollSnapContainer
			scrollOpacity={scrollOpacity}
			setScrollOpacity={setScrollOpacity}
		>
			{/* Hero section */}
			<section
				className="relative flex flex-col items-center justify-center text-center px-6"
				style={{ height: "calc(100vh - 64px)", scrollSnapAlign: "start" }}
			>
				{/* Content */}
				<div className="max-w-3xl space-y-6">
					<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-black leading-[1.1] tracking-tight">
						Machine Payments Protocol
					</h1>
					<p className="text-sm md:text-base text-gray-600 leading-relaxed max-w-xl mx-auto">
						Accept payments from humans, software, or AI agents using standard
						HTTP. No billing accounts or manual signup required.
					</p>

					{/* CLI-style animated prompt */}
					<div className="pt-2">
						<CliPromptAnimated />
					</div>

					{/* Minimal CTA */}
					<div className="flex gap-3 justify-center pt-2">
						<Link
							to="/for-humans"
							className="inline-flex items-center gap-2 px-6 py-3 bg-[#0166FF] text-white! text-sm font-medium rounded-md hover:bg-[#0052CC] transition-colors no-underline!"
						>
							For humans →
						</Link>
						<Link
							to="/specs"
							className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors no-underline"
						>
							For agents
						</Link>
					</div>

					{/* Co-authored by */}
					<div className="flex items-center gap-5 justify-center pt-4">
						<span className="text-xs font-medium tracking-widest text-gray-400 uppercase">
							Co-authored by
						</span>
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
			</section>

			{/* CLI Demo section */}
			<section
				className="flex flex-col items-center justify-center px-6 py-16"
				style={{ height: "calc(100vh - 64px)", scrollSnapAlign: "start" }}
			>
				<div className="max-w-[574px] w-full mx-auto space-y-6">
					<div className="text-center space-y-2">
						<h2 className="text-2xl font-semibold text-gray-900">Try it out</h2>
						<p className="text-sm text-gray-500">
							Connect a wallet and run paid API calls
						</p>
					</div>
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
		</ScrollSnapContainer>
	);
}

// ============================================================
// VARIANT F: Single-page layout (100vh, no passkey)
// ============================================================

const DEMO_STORAGE_KEY = "mpp-demo-private-key";

// Lazy-initialized demo wallet state (client-only)
let _demoAccount: import("viem/accounts").PrivateKeyAccount | null = null;
// biome-ignore lint/suspicious/noExplicitAny: complex mpay generic type
let _demoMpay: any = null;

async function initDemoAccount() {
	if (_demoAccount) return _demoAccount;

	const { generatePrivateKey, privateKeyToAccount } = await import(
		"viem/accounts"
	);

	const stored = localStorage.getItem(DEMO_STORAGE_KEY);
	let privateKey: string;
	if (stored?.startsWith("0x") && stored.length === 66) {
		privateKey = stored;
	} else {
		privateKey = generatePrivateKey();
		localStorage.setItem(DEMO_STORAGE_KEY, privateKey);
	}

	_demoAccount = privateKeyToAccount(privateKey as `0x${string}`);
	return _demoAccount;
}

// Create a dedicated mpay client for demo that works with local accounts
async function getDemoFetch() {
	if (_demoMpay) return _demoMpay.fetch;

	const account = await initDemoAccount();
	const { Mpay, tempo } = await import("mpay/client");
	const { wrapFetch } = await import("../lib/network-store");
	const { createWalletClient, http } = await import("viem");
	const { tempoModerato } = await import("viem/chains");

	// Create a wallet client with proper chain config
	const client = createWalletClient({
		account,
		chain: tempoModerato,
		transport: http(),
	});

	const trackedFetch = wrapFetch(globalThis.fetch);
	_demoMpay = Mpay.create({
		fetch: trackedFetch,
		methods: [
			tempo.charge({
				getClient: () => client,
			}),
		],
		polyfill: false,
	});

	return _demoMpay.fetch;
}

function HeroVariantF() {
	const [demoAddress, setDemoAddress] = useState<`0x${string}` | null>(null);

	useEffect(() => {
		// Only initialize on client
		initDemoAccount().then((account) => setDemoAddress(account.address));
	}, []);

	return (
		<section
			className="flex flex-col items-center justify-center px-6 gap-6"
			style={{ minHeight: "calc(100vh - 64px)" }}
		>
			{/* Top: Title + Subtitle */}
			<div className="text-center space-y-2">
				<h1 className="text-2xl md:text-3xl font-bold text-black leading-[1.1] tracking-tight">
					Machine Payments Protocol
				</h1>
				<p className="text-sm text-gray-600 leading-relaxed max-w-[500px] mx-auto">
					Accept payments from humans, software, or AI agents using standard
					HTTP. No billing accounts or manual signup required.
				</p>
			</div>

			{/* Middle: Demo with chrome */}
			<div className="w-full max-w-xl">
				{demoAddress && (
					<Cli.DemoSimple
						title="Try it out"
						token={pathUsd}
						height={330}
						restartStep={1}
					>
						<Cli.Startup />
						<Cli.SilentDemoSetup demoAddress={demoAddress} />
						<DemoSelectQuery />
					</Cli.DemoSimple>
				)}
			</div>

			{/* Agent Tabs */}
			<div className="w-full max-w-xl flex flex-col items-center">
				<span className="text-sm text-gray-400 pb-6">
					or, start using it with your agent
				</span>
				<div className="w-full">
					<AgentTabsWrapped />
				</div>
			</div>

			{/* CTAs */}
			<div className="flex justify-center">
				<CTAButtons />
			</div>

			{/* Compact Services */}
			<ServiceCardsCompact />
		</section>
	);
}

// Compact services for variant F (horizontal, minimal)
function ServiceCardsCompact() {
	return (
		<div className="flex flex-wrap items-center justify-center gap-3 mt-3">
			<span className="text-sm text-gray-400">Works with</span>
			{SERVICES.slice(0, 4).map((service) => {
				const Logo = service.logo;
				return (
					<a
						key={service.name}
						href={service.url}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-800 transition-colors text-sm"
					>
						<Logo style={{ width: 18, height: 18 }} />
						{service.name}
					</a>
				);
			})}
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
				to="/for-humans"
				className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0166FF] text-white! text-sm font-medium rounded-md hover:bg-[#0052CC] transition-colors no-underline!"
			>
				For humans
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
				For agents
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
			str: `"Log in (https://mpp.tempo.xyz/quickstart/tempoctl), and create an image saying 'welcome to MPP $(whoami)' using this MCP server (https://payments.tempo.xyz/discover)."`,
			displayStr: `"Log in, and create an image saying 'welcome to MPP $(whoami)' using this MCP server."`,
			icon: ClaudeLogoSmall,
		},
		{
			label: "Codex",
			bin: "codex",
			args: "--full-auto",
			str: `"Log in (https://mpp.tempo.xyz/quickstart/tempoctl), and create an image saying 'welcome to MPP $(whoami)' using this MCP server (https://payments.tempo.xyz/discover)."`,
			displayStr: `"Log in, and create an image saying 'welcome to MPP $(whoami)' using this MCP server."`,
			icon: CodexLogoSmall,
		},
		{
			label: "Amp",
			bin: "amp",
			args: null,
			str: `"Log in (https://mpp.tempo.xyz/quickstart/tempoctl), and create an image saying 'welcome to MPP $(whoami)' using this MCP server (https://payments.tempo.xyz/discover)."`,
			displayStr: `"Log in, and create an image saying 'welcome to MPP $(whoami)' using this MCP server."`,
			icon: AmpLogoSmall,
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
				{commands.map((a, i) => {
					const Icon = a.icon;
					return (
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
							<Icon className="w-3.5 h-3.5" />
							{a.label}
						</button>
					);
				})}
			</div>
			{/* Wrapped text with copy button - entire area clickable */}
			<button
				type="button"
				onClick={handleCopy}
				className="bg-white px-4 py-3 flex items-start justify-between gap-3 w-full text-left cursor-pointer hover:bg-gray-50 transition-colors"
			>
				<span
					className="text-sm font-mono whitespace-pre-wrap break-words text-left"
					style={{ margin: 0, padding: 0 }}
				>
					<span className="text-gray-400">$</span>
					<span className="text-gray-800"> {cmd.bin}</span>
					{cmd.args && <span className="text-gray-500"> {cmd.args}</span>}
					<span className="text-green-700"> {cmd.displayStr}</span>
				</span>
				<span className="text-gray-400 hover:text-[#0166FF] transition-colors shrink-0">
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
				</span>
			</button>
		</div>
	);
}

// Variant B: Multiple prompts with numbers and comments
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

// Variant D/E: CLI-style animated prompts
const CLI_PROMPTS = [
	"Log in (https://mpp.tempo.xyz/quickstart/tempoctl), and create an image saying 'welcome to MPP $(whoami)' using this MCP server (https://payments.tempo.xyz/discover).",
	"Log in (https://mpp.tempo.xyz/quickstart/tempoctl), and get the current price and liquidity data for WETH, USDC, and ARB on Ethereum, then generate a visual summary image using this MCP server (https://payments.tempo.xyz/discover).",
	"Log in (https://mpp.tempo.xyz/quickstart/tempoctl), and search for recent AI research papers, scrape and summarize the top 3, write a 2-minute podcast script, and convert it to speech using this MCP server (https://payments.tempo.xyz/discover).",
];

// Agent logos for CliPromptAnimated
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
					50 + Math.random() * 30,
				);
			} else {
				setPhase("pausing");
			}
		} else if (phase === "pausing") {
			// Longer pause (4s) so users can read and copy
			timeout = setTimeout(() => setPhase("deleting"), 4000);
		} else if (phase === "deleting") {
			if (displayText.length > 0) {
				timeout = setTimeout(() => {
					setDisplayText(displayText.slice(0, -1));
				}, 30);
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
		<div className="w-full max-w-xl mx-auto border border-gray-200 rounded-md overflow-hidden">
			{/* Agent tabs */}
			<div className="flex bg-gray-50 border-b border-gray-200">
				{CLI_AGENTS.map((agent, i) => {
					const AgentIcon = agent.icon;
					return (
						<button
							key={agent.label}
							type="button"
							onClick={() => setAgentIndex(i)}
							className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
								i === agentIndex
									? "text-gray-900 bg-white border-b-2 border-gray-900 -mb-px"
									: "text-gray-400 hover:text-gray-600"
							}`}
						>
							<AgentIcon className="w-3.5 h-3.5" />
							{agent.label}
						</button>
					);
				})}
			</div>
			<div
				className="flex items-center gap-2 px-4 py-3 bg-white font-mono"
				style={{ minHeight: "48px" }}
			>
				<span className="text-gray-400 shrink-0 text-sm">$</span>
				<span className="text-gray-600 shrink-0 text-sm">
					{currentAgent.bin}
					{currentAgent.args ? ` ${currentAgent.args}` : ""}
				</span>
				<div className="flex-1 text-left">
					<span className="text-green-700 text-sm">"{displayText}</span>
					<span className="inline-block w-0.5 h-4 bg-green-600 ml-0.5 animate-pulse" />
					<span className="text-green-700 text-sm">"</span>
				</div>
				{/* Copy button - visible when paused */}
				<button
					type="button"
					onClick={handleCopy}
					className={`shrink-0 transition-all ${
						phase === "pausing"
							? "opacity-100 text-gray-400 hover:text-[#0166FF]"
							: "opacity-0 pointer-events-none"
					}`}
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

type CompletedCall = ApiCall & {
	txHash?: string;
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

				// Extract transaction hash from response header
				const txHash = response.headers.get("x-payment-tx") || undefined;

				// Update the call with the txHash
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

// Demo version that uses a pre-funded local wallet (no user interaction required)
function DemoSelectQuery() {
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

				// Use demo fetch (account baked into dedicated mpay client)
				const demoFetch = await getDemoFetch();
				let response: Response;
				try {
					response = await demoFetch(url.toString());
				} catch (err) {
					console.error("Demo fetch error:", err);
					throw err;
				}

				// Extract transaction hash from response header
				const txHash = response.headers.get("x-payment-tx") || undefined;
				console.log(
					"[DemoSelectQuery] Response:",
					response.status,
					"txHash:",
					txHash,
				);

				// Update the call with the txHash
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
	calls: CompletedCall[];
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
						<>
							<Cli.Line variant="success" prefix="✓">
								{call.description}
							</Cli.Line>
							{call.txHash && (
								<Cli.Line variant="info">
									tx:{" "}
									<a
										href={`https://explorer.tempo.xyz/tx/${call.txHash}`}
										target="_blank"
										rel="noopener noreferrer"
										className="text-accent hover:underline"
									>
										{call.txHash.slice(0, 10)}…{call.txHash.slice(-8)}
									</a>
								</Cli.Line>
							)}
						</>
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
