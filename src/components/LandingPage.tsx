"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Link } from "vocs";
import { AsciiLogo } from "./AsciiLogo";

// ---------------------------------------------------------------------------
// Service logos & data
// ---------------------------------------------------------------------------

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
	{
		name: "ElevenLabs",
		description: "Text-to-speech, voice cloning, and audio AI",
		url: "https://elevenlabs.payments.tempo.xyz/",
		price: "$0.03",
		thirdParty: true,
		streaming: false,
		logo: ElevenLabsLogo,
	},
];

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

function ElevenLabsLogo({
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
			viewBox="310 250 256 376"
			fill="currentColor"
			aria-hidden="true"
		>
			<path d="M468 292H528V584H468V292Z" />
			<path d="M348 292H408V584H348V292Z" />
		</svg>
	);
}

// ---------------------------------------------------------------------------
// Agent tab logos
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Landing page
// ---------------------------------------------------------------------------

export function LandingPage() {
	useEffect(() => {
		const bgColor = "var(--vocs-background-color-primary)";
		const selectors = [
			"header",
			"[data-v-header]",
			"[data-v-gutter-top]",
			"[data-v-gutter-left]",
			"[data-v-gutter-right]",
			"nav",
		];

		const elements: HTMLElement[] = [];
		for (const selector of selectors) {
			document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
				el.style.setProperty("background", bgColor, "important");
				el.style.setProperty("background-color", bgColor, "important");
				elements.push(el);
			});
		}

		return () => {
			for (const el of elements) {
				el.style.removeProperty("background");
				el.style.removeProperty("background-color");
			}
		};
	}, []);

	return (
		<div
			className="not-prose"
			style={{
				color: "var(--vocs-text-color-heading)",
				fontFamily:
					'"Berkeley Mono", "Commit Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
			}}
		>
			{/* Mute logo + lock page scroll on landing */}
			<style>{`
				html, body, [data-v-main], main, article { overflow: hidden !important; height: 100vh !important; }
			`}</style>
			<HeroVariantF />
		</div>
	);
}

// ---------------------------------------------------------------------------
// Variant F: Single-page layout (100vh hero + scrollable demo)
// ---------------------------------------------------------------------------

function HeroVariantF() {
	return (
		<section
			className="flex flex-col items-center text-center px-6"
			style={{
				height: "calc(100vh - 64px)",
				maxHeight: "calc(100vh - 64px)",
				overflow: "hidden",
			}}
		>
			{/* Main content — centered vertically, falls back to top-align on small viewports */}
			<div
				className="max-w-2xl flex-1 flex flex-col items-center justify-center min-h-0"
				style={{ gap: "2rem", paddingTop: "1rem", paddingBottom: "1rem" }}
			>
				<div>
					<AsciiLogo />
					<p
						className="text-sm md:text-base leading-relaxed max-w-xl mx-auto pt-6"
						style={{ color: "var(--vocs-text-color-secondary)" }}
					>
						Supercharge your agent with seamless paid API calls. No more
						manually creating accounts, or copy-pasting keys.
					</p>
				</div>
				<div className="flex justify-center">
					<AgentTabsWrapped />
				</div>
				<div className="flex justify-center">
					<CTAButtons />
				</div>
			</div>
			{/* Service logos at bottom */}
			<div className="pb-8">
				<ServiceLogos />
			</div>
		</section>
	);
}

// Service logos row — icon + name, muted, links to services list
function ServiceLogos() {
	return (
		<div>
			<div
				className="flex items-center justify-center gap-8 pb-8 no-underline"
				style={{ color: "var(--vocs-text-color-muted)" }}
			>
				Works out-of-the-box with world-class APIs
			</div>{" "}
			<Link
				to="/for-humans/agents#services-available-today"
				className="flex items-center justify-center pb-24 no-underline"
				style={{ textDecoration: "none", gap: "3rem" }}
			>
				{SERVICES.map((service) => {
					const Logo = service.logo;
					return (
						<div
							key={service.name}
							className="flex flex-col items-center gap-2"
							style={{ color: "var(--vocs-text-color-primary)" }}
						>
							<Logo style={{ width: 36, height: 36 }} />
							<span
								className="text-sm"
								style={{ color: "var(--vocs-text-color-muted)" }}
							>
								{service.name}
							</span>
						</div>
					);
				})}
			</Link>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------

function CTAButtons() {
	return (
		<div className="flex flex-wrap gap-3">
			<Link
				to="/for-humans/agents"
				className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-sm font-medium rounded-md hover:bg-accent6 transition-colors no-underline!"
				style={{ color: "var(--accent-button-text)" }}
			>
				For humans
			</Link>
			<Link
				to="/specs"
				className="cta-secondary inline-flex items-center gap-2 px-5 py-2.5 border text-sm font-medium rounded-md transition-colors no-underline"
				style={{
					borderColor: "var(--vocs-border-color-secondary)",
					backgroundColor: "var(--vocs-background-color-surface)",
					color: "var(--vocs-text-color-primary)",
				}}
			>
				For agents
			</Link>
		</div>
	);
}

function AgentTabsWrapped() {
	const [active, setActive] = useState(0);
	const [copied, setCopied] = useState(false);
	const prompt = `"Log in (https://mpp.tempo.xyz/quickstart/tempoctl), and use fal.ai to generate a logo for my startup called 'Moonshot Labs' - modern, minimal, space themed - using this MCP server (https://payments.tempo.xyz/discover)."`;
	const displayPrompt = `"Use fal.ai to generate a logo for my startup called 'Moonshot Labs' - modern, minimal, space themed."`;
	const commands = [
		{
			label: "Claude",
			bin: "claude",
			args: "-p",
			str: prompt,
			displayStr: displayPrompt,
			icon: ClaudeLogoSmall,
		},
		{
			label: "Codex",
			bin: "codex",
			args: "--full-auto",
			str: prompt,
			displayStr: displayPrompt,
			icon: CodexLogoSmall,
		},
		{
			label: "Amp",
			bin: "amp",
			args: null,
			str: prompt,
			displayStr: displayPrompt,
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
		<div
			className="max-w-xl rounded-md overflow-hidden text-left"
			style={{ border: "1px solid var(--vocs-border-color-secondary)" }}
		>
			<div
				className="flex"
				style={{
					background: "var(--vocs-background-color-surfaceMuted)",
					borderBottom: "1px solid var(--vocs-border-color-secondary)",
				}}
			>
				{commands.map((a, i) => {
					const Icon = a.icon;
					return (
						<button
							key={a.label}
							type="button"
							onClick={() => setActive(i)}
							className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
							style={{
								color:
									i === active
										? "var(--vocs-text-color-heading)"
										: "var(--vocs-text-color-muted)",
								background:
									i === active
										? "var(--vocs-background-color-surface)"
										: "transparent",
								borderBottom:
									i === active
										? "2px solid var(--vocs-text-color-heading)"
										: "none",
								marginBottom: i === active ? "-1px" : "0",
							}}
						>
							<Icon className="w-3.5 h-3.5" />
							{a.label}
						</button>
					);
				})}
			</div>
			<button
				type="button"
				onClick={handleCopy}
				className="px-4 py-3 flex items-start justify-between gap-3 w-full text-left cursor-pointer transition-colors"
				style={{ background: "var(--vocs-background-color-surface)" }}
			>
				<span
					className="text-sm font-mono whitespace-pre-wrap break-words text-left"
					style={{ margin: 0, padding: 0 }}
				>
					<span style={{ color: "var(--vocs-text-color-muted)" }}>$</span>
					<span style={{ color: "var(--vocs-text-color-primary)" }}>
						{" "}
						{cmd.bin}
					</span>
					{cmd.args && (
						<span style={{ color: "var(--vocs-text-color-secondary)" }}>
							{" "}
							{cmd.args}
						</span>
					)}
					<span style={{ color: "var(--vocs-color-success)" }}>
						{" "}
						{cmd.displayStr}
					</span>
				</span>
				<span
					className="hover:text-accent transition-colors shrink-0"
					style={{ color: "var(--vocs-text-color-muted)" }}
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
				</span>
			</button>
		</div>
	);
}
