"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
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
		prompt:
			'claude -p "Generate 3 hero image variations for a landing page — dark theme, abstract geometric, 1200x630"',
	},
	{
		name: "Codex",
		description: "Decentralized storage and data availability network",
		url: "https://codex.payments.tempo.xyz/",
		price: "$0.0003",
		thirdParty: true,
		streaming: false,
		logo: CodexLogo,
		prompt:
			'claude -p "Back up my project docs to Codex and return the content IDs for each file"',
	},
	{
		name: "Cloudflare",
		description: "Edge compute, AI inference, and global CDN services",
		url: "https://payments.tempo.xyz/",
		price: "$0.02",
		thirdParty: true,
		streaming: false,
		logo: CloudflareLogo,
		prompt:
			'claude -p "Classify the sentiment of these 50 customer reviews using Cloudflare AI"',
	},
	{
		name: "OpenRouter",
		description: "Unified API for 200+ LLMs from OpenAI, Anthropic, and more",
		url: "https://openrouter.payments.tempo.xyz/",
		price: "$0.01",
		thirdParty: true,
		streaming: true,
		logo: OpenRouterLogo,
		prompt:
			'claude -p "Run this prompt through GPT-4o, Claude, and Gemini via OpenRouter and compare the outputs"',
	},
	{
		name: "ElevenLabs",
		description: "Text-to-speech, voice cloning, and audio AI",
		url: "https://elevenlabs.payments.tempo.xyz/",
		price: "$0.03",
		thirdParty: true,
		streaming: false,
		logo: ElevenLabsLogo,
		prompt:
			'claude -p "Read my changelog aloud as a narrated audio update using ElevenLabs"',
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
			viewBox="0 0 76 86"
			fill="currentColor"
			aria-hidden="true"
		>
			<path d="M62.3047 52.9227L62.2831 53.6195C62.0605 60.7171 60.9542 66.6365 58.9858 71.2341C53.3466 73.6478 46.5723 74.8763 38.8497 74.8763C31.1272 74.8763 23.9578 73.5329 18.2324 70.8893C14.9063 64.1006 13.2181 54.4888 13.2181 42.3123C13.2181 30.1358 15.014 20.4234 18.5628 13.6348C24.044 11.2857 30.8614 10.1004 38.8426 10.1004C46.3137 10.1004 52.815 11.1707 58.1812 13.2899C59.8694 17.083 61.0116 21.9679 61.5863 27.8227L61.651 28.4692H75.099L74.7613 27.5138C72.3835 20.7395 67.0244 15.4451 59.2516 12.1765C55.4227 3.98698 48.749 0 38.8497 0C28.9505 0 22.0038 4.21686 17.5355 12.5285C5.89786 17.7295 0 27.7508 0 42.3195C0 56.8881 5.94096 66.5718 17.1764 71.9812C21.6662 80.6879 28.9577 85.0987 38.8497 85.0987C48.7418 85.0987 56.0836 80.8029 60.0706 72.326C68.2816 68.4899 73.6479 62.0892 75.6018 53.8063L75.8102 52.9227H62.3047Z" />
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
			viewBox="0 0 76 86"
			fill="currentColor"
			aria-hidden="true"
		>
			<path d="M62.3047 52.9227L62.2831 53.6195C62.0605 60.7171 60.9542 66.6365 58.9858 71.2341C53.3466 73.6478 46.5723 74.8763 38.8497 74.8763C31.1272 74.8763 23.9578 73.5329 18.2324 70.8893C14.9063 64.1006 13.2181 54.4888 13.2181 42.3123C13.2181 30.1358 15.014 20.4234 18.5628 13.6348C24.044 11.2857 30.8614 10.1004 38.8426 10.1004C46.3137 10.1004 52.815 11.1707 58.1812 13.2899C59.8694 17.083 61.0116 21.9679 61.5863 27.8227L61.651 28.4692H75.099L74.7613 27.5138C72.3835 20.7395 67.0244 15.4451 59.2516 12.1765C55.4227 3.98698 48.749 0 38.8497 0C28.9505 0 22.0038 4.21686 17.5355 12.5285C5.89786 17.7295 0 27.7508 0 42.3195C0 56.8881 5.94096 66.5718 17.1764 71.9812C21.6662 80.6879 28.9577 85.0987 38.8497 85.0987C48.7418 85.0987 56.0836 80.8029 60.0706 72.326C68.2816 68.4899 73.6479 62.0892 75.6018 53.8063L75.8102 52.9227H62.3047Z" />
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
// Lockup SVGs
// ---------------------------------------------------------------------------

function Lockup1Svg({ maxWidth = 240 }: { maxWidth?: number } = {}) {
	return (
		<svg
			viewBox="0 -1 160 37"
			fill="currentColor"
			style={{
				width: "100%",
				maxWidth,
				height: "auto",
				margin: "0 auto",
				display: "block",
				color: "var(--vocs-text-color-heading)",
			}}
			aria-label="Machine Payments Protocol"
		>
			<title>Machine Payments Protocol</title>
			<path d="M0 20.4776V0.457599H4.1756L12.6126 14.5288L21.0496 0.457599H25.2252V20.4776H21.164V6.9212L12.9844 20.4776H12.2122L4.0612 7.007V20.4776H0Z" />
			<path d="M26.2807 20.4776L38.4643 0.457599H43.3835L55.5957 20.4776H50.9053L48.4171 16.2448H33.4307L30.9711 20.4776H26.2807ZM35.4041 12.8128H46.4437L40.9525 3.289L35.4041 12.8128Z" />
			<path d="M66.4637 20.9352C59.2279 20.9352 54.3945 16.7596 54.3945 10.4676C54.3945 4.1756 59.2279 0 66.4637 0C73.7281 0 78.5329 3.6608 78.5329 9.1806H74.4145C74.2429 5.6056 71.0683 3.4034 66.4637 3.4034C61.6589 3.4034 58.4557 6.1204 58.4557 10.4676C58.4557 14.8148 61.6589 17.5032 66.4637 17.5032C71.0969 17.5032 74.2715 15.3296 74.4145 11.7546H78.5329C78.5329 17.2744 73.7281 20.9352 66.4637 20.9352Z" />
			<path d="M81.1592 20.4776V0.457599H85.2204V8.1224H98.691V0.457599H102.752V20.4776H98.691V11.5544H85.2204V20.4776H81.1592Z" />
			<path d="M106.388 20.4776V0.457599H110.449V20.4776H106.388Z" />
			<path d="M114.104 20.4776V0.457599H117.793L132.78 14.872V0.457599H136.841V20.4776H133.123L118.165 6.0632V20.4776H114.104Z" />
			<path d="M140.505 20.4776V0.457599H159.81V3.861H144.567V8.2368H158.123V11.3828H144.567V17.0456H159.81V20.4776H140.505Z" />
			<g transform="translate(0,-5)">
				<path d="M0 40.2809V31.6743H1.64953V35.4858H5.55692C6.51622 35.4858 6.93738 35.1415 6.93738 34.3055C6.93738 33.4694 6.51622 33.1128 5.55692 33.1128H1.64953V31.6743H5.84939C7.54571 31.6743 8.5986 32.8669 8.5986 34.3055C8.5986 36.0514 7.42873 36.9243 5.84939 36.9243H1.66123V40.2809H0Z" />
				<path d="M7.07136 40.2809L12.055 31.6743H14.0672L19.0626 40.2809H17.144L16.1262 38.4612H9.99606L8.98996 40.2809H7.07136ZM10.8033 36.9858H15.319L13.0728 32.8915L10.8033 36.9858Z" />
				<path d="M20.5297 40.2809V37.5022L16.1778 31.6743H18.2134L21.3603 35.9653L24.4956 31.6743H26.5312L22.1909 37.4899V40.2809H20.5297Z" />
				<path d="M26.8574 40.2809V31.6743H28.5654L32.0165 37.7235L35.4677 31.6743H37.1757V40.2809H35.5145V34.453L32.1686 40.2809H31.8528L28.5186 34.4899V40.2809H26.8574Z" />
				<path d="M38.6622 40.2809V31.6743H46.5589V33.1374H40.3234V35.0186H45.8686V36.371H40.3234V38.8055H46.5589V40.2809H38.6622Z" />
				<path d="M47.8051 40.2809V31.6743H49.3142L55.4444 37.871V31.6743H57.1056V40.2809H55.5847L49.4663 34.0842V40.2809H47.8051Z" />
				<path d="M61.3478 40.2809V33.1374H57.7211V31.6743H66.6473V33.1374H63.009V40.2809H61.3478Z" />
				<path d="M71.1434 40.4776C68.3474 40.4776 66.5809 39.2727 66.6043 37.5145H68.3357C68.324 38.412 69.3652 39.0022 71.0732 39.0022C73.0035 39.0022 74.0681 38.6333 74.0681 37.8219C74.0681 35.4981 66.8265 38.1907 66.8265 34.1948C66.8265 32.4366 68.593 31.4776 71.1317 31.4776C73.799 31.4776 75.5538 32.6579 75.5655 34.4407H73.8692C73.8692 33.5309 72.8397 32.9407 71.1785 32.9407C69.4822 32.9407 68.5112 33.3096 68.5112 34.0473C68.5112 36.2112 75.741 33.703 75.741 37.7481C75.741 39.5432 73.9277 40.4776 71.1434 40.4776Z" />
				<path d="M83.2487 40.2809V31.6743H84.8982V35.4858H88.8056C89.7649 35.4858 90.1861 35.1415 90.1861 34.3055C90.1861 33.4694 89.7649 33.1128 88.8056 33.1128H84.8982V31.6743H89.0981C90.7944 31.6743 91.8473 32.8669 91.8473 34.3055C91.8473 36.0514 90.6774 36.9243 89.0981 36.9243H84.9099V40.2809H83.2487Z" />
				<path d="M92.6429 40.2809V31.6743H94.2924V35.203H98.6678C99.6388 35.203 100.048 34.8342 100.048 34.2071C100.048 33.4448 99.6271 33.1128 98.6678 33.1128H94.2807V31.6743H99.0772C100.774 31.6743 101.709 32.6333 101.709 33.9489C101.709 35.326 100.621 36.1128 99.0772 36.1128L98.2115 36.1251V36.1497C100.142 36.285 100.937 37.4776 102.329 40.2809H100.399C98.8784 37.4161 98.4806 36.6292 97.0182 36.6292H94.2924V40.2809H92.6429Z" />
				<path d="M107.259 40.4776C104.287 40.4776 102.322 38.6825 102.322 35.9776C102.322 33.2727 104.287 31.4776 107.259 31.4776C110.219 31.4776 112.196 33.2727 112.196 35.9776C112.196 38.6825 110.219 40.4776 107.259 40.4776ZM107.259 39.0022C109.224 39.0022 110.535 37.8465 110.535 35.9776C110.535 34.1087 109.224 32.9407 107.259 32.9407C105.294 32.9407 103.983 34.1087 103.983 35.9776C103.983 37.8465 105.294 39.0022 107.259 39.0022Z" />
				<path d="M115.431 40.2809V33.1374H111.805V31.6743H120.731V33.1374H117.093V40.2809H115.431Z" />
				<path d="M125.271 40.4776C122.299 40.4776 120.334 38.6825 120.334 35.9776C120.334 33.2727 122.299 31.4776 125.271 31.4776C128.23 31.4776 130.207 33.2727 130.207 35.9776C130.207 38.6825 128.23 40.4776 125.271 40.4776ZM125.271 39.0022C127.236 39.0022 128.546 37.8465 128.546 35.9776C128.546 34.1087 127.236 32.9407 125.271 32.9407C123.305 32.9407 121.995 34.1087 121.995 35.9776C121.995 37.8465 123.305 39.0022 125.271 39.0022Z" />
				<path d="M135.956 40.4776C132.996 40.4776 131.019 38.6825 131.019 35.9776C131.019 33.2727 132.996 31.4776 135.956 31.4776C138.928 31.4776 140.893 33.0514 140.893 35.4243H139.209C139.138 33.8874 137.84 32.9407 135.956 32.9407C133.991 32.9407 132.681 34.1087 132.681 35.9776C132.681 37.8465 133.991 39.0022 135.956 39.0022C137.851 39.0022 139.15 38.0678 139.209 36.5309H140.893C140.893 38.9038 138.928 40.4776 135.956 40.4776Z" />
				<path d="M146.618 40.4776C143.647 40.4776 141.681 38.6825 141.681 35.9776C141.681 33.2727 143.647 31.4776 146.618 31.4776C149.578 31.4776 151.555 33.2727 151.555 35.9776C151.555 38.6825 149.578 40.4776 146.618 40.4776ZM146.618 39.0022C148.583 39.0022 149.894 37.8465 149.894 35.9776C149.894 34.1087 148.583 32.9407 146.618 32.9407C144.653 32.9407 143.342 34.1087 143.342 35.9776C143.342 37.8465 144.653 39.0022 146.618 39.0022Z" />
				<path d="M152.63 40.2809V31.6743H154.291V38.8055H160V40.2809H152.63Z" />
			</g>
		</svg>
	);
}

function Lockup2Svg({ color }: { color?: string }) {
	return (
		// biome-ignore lint/a11y/noSvgWithoutTitle: decorative SVG
		<svg
			viewBox="0 0 555 21"
			fill="currentColor"
			style={{
				width: "100%",
				opacity: 0.8,
				height: "auto",
				display: "block",
				color: color || "var(--vocs-color-accent)",
			}}
			aria-label="Machine Payments Protocol"
		>
			<path d="M-4.54701e-05 20.4776V0.457598H4.17555L12.6126 14.5288L21.0496 0.457598H25.2252V20.4776H21.164V6.9212L12.9844 20.4776H12.2122L4.06115 7.007V20.4776H-4.54701e-05ZM26.2807 20.4776L38.4643 0.457598H43.3835L55.5957 20.4776H50.9053L48.4171 16.2448H33.4307L30.9711 20.4776H26.2807ZM35.4041 12.8128H46.4437L40.9525 3.289L35.4041 12.8128ZM66.4637 20.9352C59.2279 20.9352 54.3945 16.7596 54.3945 10.4676C54.3945 4.1756 59.2279 -7.6189e-07 66.4637 -7.6189e-07C73.7281 -7.6189e-07 78.5329 3.6608 78.5329 9.1806H74.4145C74.2429 5.6056 71.0683 3.4034 66.4637 3.4034C61.6589 3.4034 58.4557 6.1204 58.4557 10.4676C58.4557 14.8148 61.6589 17.5032 66.4637 17.5032C71.0969 17.5032 74.2715 15.3296 74.4145 11.7546H78.5329C78.5329 17.2744 73.7281 20.9352 66.4637 20.9352ZM81.1592 20.4776V0.457598H85.2204V8.1224H98.691V0.457598H102.752V20.4776H98.691V11.5544H85.2204V20.4776H81.1592ZM106.387 20.4776V0.457598H110.449V20.4776H106.387ZM114.104 20.4776V0.457598H117.793L132.78 14.872V0.457598H136.841V20.4776H133.123L118.165 6.0632V20.4776H114.104ZM140.505 20.4776V0.457598H159.81V3.861H144.566V8.2368H158.123V11.3828H144.566V17.0456H159.81V20.4776H140.505ZM171.383 20.4776V0.457598H185.683C189.83 0.457598 192.404 3.2318 192.404 6.578C192.404 10.6392 189.544 12.6698 185.683 12.6698H175.444V20.4776H171.383ZM175.416 9.3236H184.968C187.313 9.3236 188.343 8.5228 188.343 6.578C188.343 4.6332 187.313 3.8038 184.968 3.8038H175.416V9.3236ZM188.671 20.4776L200.854 0.457598H205.773L217.986 20.4776H213.295L210.807 16.2448H195.821L193.361 20.4776H188.671ZM197.794 12.8128H208.834L203.342 3.289L197.794 12.8128ZM221.572 20.4776V14.014L210.933 0.457598H215.909L223.603 10.439L231.268 0.457598H236.244L225.633 13.9854V20.4776H221.572ZM237.041 20.4776V0.457598H241.217L249.654 14.5288L258.091 0.457598H262.267V20.4776H258.205V6.9212L250.026 20.4776H249.254L241.103 7.007V20.4776H237.041ZM265.901 20.4776V0.457598H285.206V3.861H269.962V8.2368H283.518V11.3828H269.962V17.0456H285.206V20.4776H265.901ZM288.252 20.4776V0.457598H291.942L306.928 14.872V0.457598H310.989V20.4776H307.271L292.313 6.0632V20.4776H288.252ZM321.36 20.4776V3.861H312.494V0.457598H334.316V3.861H325.421V20.4776H321.36ZM345.307 20.9352C338.472 20.9352 334.153 18.1324 334.211 14.0426H338.443C338.415 16.1304 340.96 17.5032 345.136 17.5032C349.855 17.5032 352.457 16.6452 352.457 14.7576C352.457 9.3522 334.754 15.6156 334.754 6.3206C334.754 2.2308 339.073 -7.6189e-07 345.279 -7.6189e-07C351.8 -7.6189e-07 356.09 2.7456 356.118 6.8926H351.971C351.971 4.7762 349.454 3.4034 345.393 3.4034C341.246 3.4034 338.872 4.2614 338.872 5.9774C338.872 11.011 356.547 5.1766 356.547 14.586C356.547 18.7616 352.114 20.9352 345.307 20.9352ZM367.185 20.4776V0.457598H381.485C385.632 0.457598 388.206 3.2318 388.206 6.578C388.206 10.6392 385.346 12.6698 381.485 12.6698H371.246V20.4776H367.185ZM371.217 9.3236H380.77C383.115 9.3236 384.145 8.5228 384.145 6.578C384.145 4.6332 383.115 3.8038 380.77 3.8038H371.217V9.3236ZM390.151 20.4776V0.457598H405.881C410.028 0.457598 412.316 2.6884 412.316 5.7486C412.316 8.9518 409.656 10.7822 405.881 10.7822L403.764 10.8108V10.868C408.483 11.1826 410.428 13.9568 413.832 20.4776H409.113C405.395 13.8138 404.422 11.9834 400.847 11.9834H394.183L394.212 20.4776H390.151ZM394.183 8.6658H404.88C407.254 8.6658 408.255 7.8078 408.255 6.3492C408.255 4.576 407.225 3.8038 404.88 3.8038H394.155L394.183 8.6658ZM425.883 20.9352C418.618 20.9352 413.814 16.7596 413.814 10.4676C413.814 4.1756 418.618 -7.6189e-07 425.883 -7.6189e-07C433.119 -7.6189e-07 437.952 4.1756 437.952 10.4676C437.952 16.7596 433.119 20.9352 425.883 20.9352ZM425.883 17.5032C430.688 17.5032 433.891 14.8148 433.891 10.4676C433.891 6.1204 430.688 3.4034 425.883 3.4034C421.078 3.4034 417.875 6.1204 417.875 10.4676C417.875 14.8148 421.078 17.5032 425.883 17.5032ZM445.862 20.4776V3.861H436.996V0.457598H458.817V3.861H449.923V20.4776H445.862ZM469.916 20.9352C462.651 20.9352 457.846 16.7596 457.846 10.4676C457.846 4.1756 462.651 -7.6189e-07 469.916 -7.6189e-07C477.151 -7.6189e-07 481.985 4.1756 481.985 10.4676C481.985 16.7596 477.151 20.9352 469.916 20.9352ZM469.916 17.5032C474.72 17.5032 477.924 14.8148 477.924 10.4676C477.924 6.1204 474.72 3.4034 469.916 3.4034C465.111 3.4034 461.908 6.1204 461.908 10.4676C461.908 14.8148 465.111 17.5032 469.916 17.5032ZM496.039 20.9352C488.803 20.9352 483.97 16.7596 483.97 10.4676C483.97 4.1756 488.803 -7.6189e-07 496.039 -7.6189e-07C503.303 -7.6189e-07 508.108 3.6608 508.108 9.1806H503.99C503.818 5.6056 500.644 3.4034 496.039 3.4034C491.234 3.4034 488.031 6.1204 488.031 10.4676C488.031 14.8148 491.234 17.5032 496.039 17.5032C500.672 17.5032 503.847 15.3296 503.99 11.7546H508.108C508.108 17.2744 503.303 20.9352 496.039 20.9352ZM522.104 20.9352C514.84 20.9352 510.035 16.7596 510.035 10.4676C510.035 4.1756 514.84 -7.6189e-07 522.104 -7.6189e-07C529.34 -7.6189e-07 534.173 4.1756 534.173 10.4676C534.173 16.7596 529.34 20.9352 522.104 20.9352ZM522.104 17.5032C526.909 17.5032 530.112 14.8148 530.112 10.4676C530.112 6.1204 526.909 3.4034 522.104 3.4034C517.299 3.4034 514.096 6.1204 514.096 10.4676C514.096 14.8148 517.299 17.5032 522.104 17.5032ZM536.801 20.4776V0.457598H540.862V17.0456H554.819V20.4776H536.801Z" />
		</svg>
	);
}

// ---------------------------------------------------------------------------
// Network canvas background (variant C)
// ---------------------------------------------------------------------------

function NetworkCanvas() {
	return (
		<>
			<AsciiLogo forceNetwork fullscreen />
			{/* Gradient overlays — must be fixed + above the animation */}
			<div
				style={{
					position: "fixed",
					top: 0,
					left: 0,
					width: "100vw",
					height: "100vh",
					zIndex: 1,
					pointerEvents: "none",
				}}
			>
				<div
					style={{
						position: "absolute",
						inset: 0,
						background:
							"linear-gradient(to bottom, var(--vocs-background-color-primary) 0%, transparent 12%)",
					}}
				/>
				<div
					style={{
						position: "absolute",
						inset: 0,
						background:
							"linear-gradient(to right, var(--vocs-background-color-primary) 0%, transparent 18%, transparent 82%, var(--vocs-background-color-primary) 100%)",
					}}
				/>
				<div
					style={{
						position: "absolute",
						inset: 0,
						background:
							"radial-gradient(ellipse 40% 30% at 50% 45%, var(--vocs-background-color-primary) 0%, transparent 100%)",
					}}
				/>
			</div>
		</>
	);
}

// ---------------------------------------------------------------------------
// Landing page
// ---------------------------------------------------------------------------

type HeroVariant = "A" | "B" | "C" | "D" | "E";

export function LandingPage() {
	const [variant, setVariantState] = useState<HeroVariant>(() => {
		if (typeof window === "undefined") return "A";
		const params = new URLSearchParams(window.location.search);
		const v = params.get("v");
		if (v && ["A", "B", "C", "D", "E"].includes(v)) return v as HeroVariant;
		return "A";
	});

	const setVariant = (v: HeroVariant) => {
		setVariantState(v);
		const url = new URL(window.location.href);
		url.searchParams.set("v", v);
		window.history.replaceState({}, "", url.toString());
	};

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
				fontFamily: "var(--font-mono)",
				userSelect: "none",
				WebkitUserSelect: "none",
			}}
		>
			{/* Mute logo + lock page scroll on landing */}
			<style>{`
				html, body, [data-v-main], main, article { overflow: clip !important; height: 100vh !important; }
			`}</style>
			{/* Variant toggle */}
			<div className="fixed left-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-1">
				{(["A", "B", "C", "D", "E"] as const).map((v) => (
					<button
						key={v}
						type="button"
						onClick={() => setVariant(v)}
						className="w-6 h-6 text-[10px] font-medium rounded transition-all"
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
			<HeroVariantF variant={variant} />
			{variant === "C" && <NetworkCanvas />}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Variant F: Single-page layout (100vh hero + scrollable demo)
// ---------------------------------------------------------------------------

function HeroVariantF({ variant }: { variant: HeroVariant }) {
	return (
		<section
			className="flex flex-col items-center text-center px-6"
			style={{
				height: "calc(100vh - 64px)",
				maxHeight: "calc(100vh - 64px)",
				overflow: "hidden",
				position: "relative",
				zIndex: 2,
				pointerEvents: "none",
			}}
		>
			{/* Main content — centered vertically, falls back to top-align on small viewports */}
			<div
				className="max-w-2xl flex-1 flex flex-col items-center justify-center min-h-0"
				style={{
					gap: "2rem",
					paddingTop: "1rem",
					paddingBottom: "1rem",
					pointerEvents: "auto",
				}}
			>
				<div>
					{variant === "A" && (
						<div style={{ marginBottom: "1.2rem" }}>
							<AsciiLogo />
						</div>
					)}
					{variant === "B" && (
						<>
							<AsciiLogo />
							<div
								style={{
									color: "var(--vocs-color-accent)",
									marginTop: "1rem",
									marginBottom: "1.5rem",
									maxWidth: "93%",
									marginLeft: "auto",
									marginRight: "auto",
								}}
							>
								<Lockup2Svg />
							</div>
						</>
					)}
					{variant === "C" && (
						<div
							style={{
								color: "var(--vocs-text-color-heading)",
								marginBottom: "1rem",
							}}
						>
							<Lockup1Svg maxWidth={276} />
						</div>
					)}
					{variant === "D" && (
						<div style={{ marginBottom: "1rem" }}>
							<Lockup1Svg maxWidth={276} />
						</div>
					)}
					{variant === "E" && (
						<div
							style={{
								color: "var(--vocs-text-color-heading)",
								fontWeight: "900",
								fontSize: 32,
							}}
						>
							Machine Payments Protocol
						</div>
					)}
					<p
						className="text-sm md:text-base leading-relaxed max-w-xl mx-auto pt-2"
						style={{ color: "var(--vocs-text-color-secondary)" }}
					>
						Supercharge your agent with seamless paid API calls.
						<br className="hidden md:block" />
						No more manually creating accounts, or copy-pasting keys.
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
			<div className="pb-8" style={{ pointerEvents: "auto" }}>
				<ServiceLogos />
			</div>
		</section>
	);
}

// Service logos row with prompt tooltips
function ServiceLogos() {
	const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const showTooltip = (name: string) => {
		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		setActiveTooltip(name);
	};

	const hideTooltip = () => {
		timeoutRef.current = setTimeout(() => setActiveTooltip(null), 150);
	};

	return (
		<div>
			<div
				className="flex items-center justify-center pb-8 transition-opacity duration-200"
				style={{ opacity: activeTooltip ? 0 : 1 }}
			>
				<span
					className="text-sm px-4 py-1.5 rounded-full"
					style={{
						color: "var(--vocs-text-color-muted)",
						border: "1px solid var(--vocs-border-color-secondary)",
						background: "var(--vocs-background-color-surface)",
					}}
				>
					Works instantly with powerful APIs
				</span>
			</div>
			<div
				className="flex items-center justify-center pb-24"
				style={{ gap: "3rem" }}
			>
				{SERVICES.map((service) => (
					<ServiceLogoWithTooltip
						key={service.name}
						service={service}
						isOpen={activeTooltip === service.name}
						onShow={() => showTooltip(service.name)}
						onHide={hideTooltip}
					/>
				))}
			</div>
		</div>
	);
}

function ServiceLogoWithTooltip({
	service,
	isOpen,
	onShow,
	onHide,
}: {
	service: (typeof SERVICES)[number];
	isOpen: boolean;
	onShow: () => void;
	onHide: () => void;
}) {
	const [copied, setCopied] = useState(false);
	const Logo = service.logo;

	const handleCopy = () => {
		navigator.clipboard.writeText(service.prompt);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	// Parse the prompt to highlight syntax
	const renderPrompt = () => {
		const prompt = service.prompt;
		// Match: claude -p "..." or codex ...
		const claudeMatch = prompt.match(/^(claude -p )(".*")$/);
		if (claudeMatch) {
			return (
				<>
					<span style={{ color: "var(--vocs-color-accent)" }}>
						{claudeMatch[1]}
					</span>
					<span style={{ color: "var(--vocs-text-color-secondary)" }}>
						{claudeMatch[2]}
					</span>
				</>
			);
		}
		const codexMatch = prompt.match(/^(codex )(.*)$/);
		if (codexMatch) {
			return (
				<>
					<span style={{ color: "var(--vocs-color-accent)" }}>
						{codexMatch[1]}
					</span>
					<span style={{ color: "var(--vocs-text-color-secondary)" }}>
						{codexMatch[2]}
					</span>
				</>
			);
		}
		return prompt;
	};

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: hover tooltip trigger
		<div className="relative" onMouseEnter={onShow} onMouseLeave={onHide}>
			<button
				type="button"
				onClick={handleCopy}
				className="service-logo-item flex flex-col items-center gap-2 cursor-pointer"
				style={{
					color: "var(--vocs-text-color-primary)",
					background: "none",
					border: "none",
					padding: 0,
				}}
			>
				<div
					className="service-logo-icon"
					style={{
						transition: "color 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
					}}
				>
					<Logo style={{ width: 36, height: 36 }} />
				</div>
				<span
					className="text-sm"
					style={{ color: "var(--vocs-text-color-muted)" }}
				>
					{service.name}
				</span>
			</button>
			<button
				type="button"
				onClick={handleCopy}
				onMouseEnter={onShow}
				onMouseLeave={onHide}
				className="flex items-center justify-between gap-3 w-full text-left cursor-pointer"
				style={{
					position: "absolute",
					bottom: "100%",
					left: "50%",
					transform: isOpen
						? "translateX(-50%) translateY(0)"
						: "translateX(-50%) translateY(4px)",
					marginBottom: 10,
					width: 300,
					padding: "12px 16px",
					borderRadius: 6,
					border: "1px solid var(--vocs-border-color-secondary)",
					background: "var(--vocs-background-color-surface)",
					zIndex: 100,
					opacity: isOpen ? 1 : 0,
					pointerEvents: isOpen ? "auto" : "none",
					transition: "opacity 0.2s ease, transform 0.2s ease",
				}}
			>
				<span
					className="text-sm font-mono whitespace-pre-wrap break-words text-left"
					style={{
						margin: 0,
						padding: 0,
						userSelect: "text",
						WebkitUserSelect: "text",
					}}
				>
					{renderPrompt()}
				</span>
				<span
					className="shrink-0"
					style={{
						color: copied
							? "var(--vocs-color-accent)"
							: "var(--vocs-text-color-muted)",
						transition: "color 0.15s",
					}}
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

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------

function CTAButtons() {
	const [hovered, setHovered] = useState<"primary" | "secondary" | null>(null);
	return (
		<div className="flex flex-col items-center gap-2">
			<div className="flex flex-wrap gap-3">
				<Link
					to="/setup/agents"
					className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-sm font-medium rounded-md hover:opacity-90 transition-opacity no-underline!"
					style={{ color: "var(--accent-button-text)" }}
					onMouseEnter={() => setHovered("primary")}
					onMouseLeave={() => setHovered(null)}
				>
					Set up your agent
				</Link>
				<Link
					to="/specs"
					className="cta-secondary inline-flex items-center gap-2 px-5 py-2.5 border text-sm font-medium rounded-md transition-colors no-underline"
					style={{
						borderColor: "var(--vocs-border-color-secondary)",
						backgroundColor: "var(--vocs-background-color-surface)",
						color: "var(--vocs-text-color-primary)",
					}}
					onMouseEnter={() => setHovered("secondary")}
					onMouseLeave={() => setHovered(null)}
				>
					Integrate your API
				</Link>
			</div>
			<div
				className="text-sm transition-opacity duration-200"
				style={{
					color: "var(--vocs-text-color-muted)",
					opacity: hovered ? 1 : 0,
					height: 20,
					marginTop: 8,
				}}
			>
				{hovered === "primary" && "Let your agent use paid APIs instantly"}
				{hovered === "secondary" && "Accept payments from any client or agent"}
			</div>
		</div>
	);
}

function AgentTabsWrapped() {
	const [active, setActive] = useState(0);
	const [copied, setCopied] = useState(false);
	const prompt = `"Log in (https://mpp.tempo.xyz/quickstart/tempoctl), and use fal.ai to generate a logo for my startup called 'Moonshot Labs' - modern, minimal, space themed. Available services: https://payments.tempo.xyz/llms.txt and https://payments.tempo.xyz/services"`;
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
				{commands.map((a, i) => {
					const Icon = a.icon;
					return (
						<button
							key={a.label}
							type="button"
							onClick={() => setActive(i)}
							className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer"
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
								borderRight:
									i < commands.length - 1
										? "1px solid var(--vocs-border-color-secondary)"
										: "none",
								marginBottom: i === active ? "-1px" : "0",
							}}
						>
							<Icon className="w-4.5 h-4.5" />
							{a.label}
						</button>
					);
				})}
			</div>
			<button
				type="button"
				onClick={handleCopy}
				className="px-4 py-3 flex items-center justify-between gap-3 w-full text-left cursor-pointer transition-colors"
				style={{ background: "var(--vocs-background-color-surface)" }}
			>
				<span
					className="font-mono whitespace-pre-wrap break-words text-left"
					style={{
						fontSize: 15,
						margin: 0,
						padding: 0,
						userSelect: "text",
						WebkitUserSelect: "text",
					}}
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
