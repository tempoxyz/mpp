"use client";

import { useState } from "react";
import { AsciiLogo } from "./AsciiLogo";
import { CliDemo } from "./CliDemo";

// Tempo logo SVG
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

// Stripe logo SVG
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

// GitHub icon
function GitHubIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="currentColor"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
		</svg>
	);
}

// Arrow icon for CTAs
function ArrowRightIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
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
	);
}

// Feature icons
function GlobeIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="10" />
			<path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
		</svg>
	);
}

function LayersIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
		</svg>
	);
}

function ZapIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
		</svg>
	);
}

// Status badge component with proper theming
function StatusBadge({
	status,
}: {
	status: "production" | "beta" | "available" | "planned";
}) {
	const styles: Record<
		typeof status,
		{ bg: string; border: string; text: string; label: string }
	> = {
		production: {
			bg: "rgba(34, 197, 94, 0.1)",
			border: "rgba(34, 197, 94, 0.3)",
			text: "#4ade80",
			label: "Production",
		},
		beta: {
			bg: "rgba(59, 130, 246, 0.1)",
			border: "rgba(59, 130, 246, 0.3)",
			text: "#60a5fa",
			label: "Beta",
		},
		available: {
			bg: "rgba(255, 255, 255, 0.05)",
			border: "rgba(255, 255, 255, 0.1)",
			text: "var(--vocs-color-text-2)",
			label: "Available",
		},
		planned: {
			bg: "rgba(255, 255, 255, 0.05)",
			border: "rgba(255, 255, 255, 0.1)",
			text: "var(--vocs-color-text-3)",
			label: "Planned",
		},
	};

	const { bg, border, text, label } = styles[status];

	return (
		<span
			className="vocs:text-[10px] vocs:font-medium vocs:uppercase vocs:tracking-wider vocs:px-2.5 vocs:py-1 vocs:rounded-full"
			style={{
				backgroundColor: bg,
				border: `1px solid ${border}`,
				color: text,
			}}
		>
			{label}
		</span>
	);
}

// Code tabs component for Client/Server examples
function CodeTabs() {
	const [activeTab, setActiveTab] = useState<"client" | "server">("client");

	return (
		<div
			style={{ flex: 1, border: "1px solid rgba(255,255,255,0.2)" }}
			className="vocs:bg-[var(--vocs-color-background-2)] vocs:rounded-xl vocs:overflow-hidden"
		>
			<div
				className="vocs:flex vocs:items-center vocs:gap-0"
				style={{ borderBottom: "1px solid rgba(255,255,255,0.2)" }}
			>
				<button
					type="button"
					onClick={() => setActiveTab("client")}
					className={`vocs:text-[13px] vocs:font-medium vocs:px-4 vocs:py-3 vocs:transition-colors vocs:border-b-2 ${
						activeTab === "client"
							? "vocs:text-[var(--vocs-color-text)] vocs:border-[#0166FF]"
							: "vocs:text-[var(--vocs-color-text-3)] vocs:border-transparent hover:vocs:text-[var(--vocs-color-text-2)]"
					}`}
					style={{
						background: "none",
						cursor: "pointer",
						marginBottom: "-1px",
					}}
				>
					Client
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("server")}
					className={`vocs:text-[13px] vocs:font-medium vocs:px-4 vocs:py-3 vocs:transition-colors vocs:border-b-2 ${
						activeTab === "server"
							? "vocs:text-[var(--vocs-color-text)] vocs:border-[#0166FF]"
							: "vocs:text-[var(--vocs-color-text-3)] vocs:border-transparent hover:vocs:text-[var(--vocs-color-text-2)]"
					}`}
					style={{
						background: "none",
						cursor: "pointer",
						marginBottom: "-1px",
					}}
				>
					Server
				</button>
			</div>
			<div className="vocs:p-4 vocs:font-mono vocs:text-sm vocs:overflow-x-auto">
				{activeTab === "client" ? (
					<pre className="vocs:m-0 vocs:leading-relaxed">
						<code>
							<span className="vocs:text-[var(--vocs-color-text-3)]">
								{"// Polyfill fetch once at startup"}
							</span>
							{"\n"}
							<span className="vocs:text-[#c678dd]">import</span>
							<span className="vocs:text-[var(--vocs-color-text)]">
								{" "}
								{"{"} Fetch, tempo {"}"}{" "}
							</span>
							<span className="vocs:text-[#c678dd]">from</span>
							<span className="vocs:text-[#98c379]"> 'mpay/client'</span>
							{"\n\n"}
							<span className="vocs:text-[#e5c07b]">Fetch</span>
							<span className="vocs:text-[var(--vocs-color-text)]">
								.polyfill({"{"}
							</span>
							{"\n"}
							<span className="vocs:text-[var(--vocs-color-text)]">
								{"  "}methods: [
							</span>
							<span className="vocs:text-[#e5c07b]">tempo</span>
							<span className="vocs:text-[var(--vocs-color-text)]">
								({"{"} account {"}"})]
							</span>
							{"\n"}
							<span className="vocs:text-[var(--vocs-color-text)]">{"}"})</span>
							{"\n\n"}
							<span className="vocs:text-[var(--vocs-color-text-3)]">
								{"// Now all fetch calls handle 402 automatically"}
							</span>
							{"\n"}
							<span className="vocs:text-[#c678dd]">const</span>
							<span className="vocs:text-[var(--vocs-color-text)]">
								{" "}
								response ={" "}
							</span>
							<span className="vocs:text-[#c678dd]">await</span>
							<span className="vocs:text-[var(--vocs-color-text)]"> </span>
							<span className="vocs:text-[#61afef]">fetch</span>
							<span className="vocs:text-[var(--vocs-color-text)]">(</span>
							<span className="vocs:text-[#98c379]">
								'https://api.example.com/resource'
							</span>
							<span className="vocs:text-[var(--vocs-color-text)]">)</span>
						</code>
					</pre>
				) : (
					<pre className="vocs:m-0 vocs:leading-relaxed">
						<code>
							<span className="vocs:text-[var(--vocs-color-text-3)]">
								{"// Add payment middleware to your server"}
							</span>
							{"\n"}
							<span className="vocs:text-[#c678dd]">import</span>
							<span className="vocs:text-[var(--vocs-color-text)]">
								{" "}
								{"{"} Mpay, tempo {"}"}{" "}
							</span>
							<span className="vocs:text-[#c678dd]">from</span>
							<span className="vocs:text-[#98c379]"> 'mpay/server'</span>
							{"\n\n"}
							<span className="vocs:text-[#c678dd]">const</span>
							<span className="vocs:text-[var(--vocs-color-text)]">
								{" "}
								mpay ={" "}
							</span>
							<span className="vocs:text-[#e5c07b]">Mpay</span>
							<span className="vocs:text-[var(--vocs-color-text)]">
								.create({"{"}
							</span>
							{"\n"}
							<span className="vocs:text-[var(--vocs-color-text)]">
								{"  "}methods: [
							</span>
							<span className="vocs:text-[#e5c07b]">tempo</span>
							<span className="vocs:text-[var(--vocs-color-text)]">
								({"{"} recipient {"}"})]
							</span>
							{"\n"}
							<span className="vocs:text-[var(--vocs-color-text)]">{"}"})</span>
							{"\n\n"}
							<span className="vocs:text-[var(--vocs-color-text-3)]">
								{"// Return 402 with payment challenge"}
							</span>
							{"\n"}
							<span className="vocs:text-[#c678dd]">return</span>
							<span className="vocs:text-[var(--vocs-color-text)]"> mpay.</span>
							<span className="vocs:text-[#61afef]">challenge</span>
							<span className="vocs:text-[var(--vocs-color-text)]">
								({"{"}{" "}
							</span>
							<span className="vocs:text-[var(--vocs-color-text)]">
								amount:{" "}
							</span>
							<span className="vocs:text-[#d19a66]">0.01</span>
							<span className="vocs:text-[var(--vocs-color-text)]">
								, currency:{" "}
							</span>
							<span className="vocs:text-[#98c379]">'USD'</span>
							<span className="vocs:text-[var(--vocs-color-text)]">
								{" "}
								{"}"})
							</span>
						</code>
					</pre>
				)}
			</div>
		</div>
	);
}

export function LandingPage() {
	// Break out of Vocs container
	const fullWidthStyle = {
		width: "100vw",
		marginLeft: "calc(-50vw + 50%)",
		position: "relative" as const,
	};

	const containerStyle = {
		maxWidth: "1600px",
		margin: "0 auto",
		padding: "0 80px",
	};

	return (
		<div className="vocs:not-prose">
			{/* Hero Section */}
			<section
				style={{
					...fullWidthStyle,
					paddingTop: "6rem",
					paddingBottom: "6rem",
					borderBottom: "1px solid rgba(255,255,255,0.06)",
				}}
			>
				<div style={containerStyle}>
					<div
						style={{
							display: "flex",
							flexDirection: "row",
							gap: "80px",
							alignItems: "center",
						}}
					>
						{/* Left side - Copy */}
						<div style={{ flex: 1 }} className="vocs:space-y-8">
							{/* ASCII Logo as title */}
							<AsciiLogo />

							{/* Subtitle */}
							<p className="vocs:text-lg sm:vocs:text-xl vocs:text-[var(--vocs-color-text-2)] vocs:leading-relaxed vocs:max-w-xl">
								The internet-native payments protocol. Accept payments from
								humans, software, or AI agents using standard HTTP—no billing
								accounts or manual signup required.
							</p>

							{/* CTAs */}
							<div className="vocs:flex vocs:flex-wrap vocs:gap-4">
								<a
									href="/quickstart/server"
									className="vocs:inline-flex vocs:items-center vocs:gap-2 vocs:px-6 vocs:py-3 vocs:bg-[#0166FF] vocs:text-white vocs:font-medium vocs:rounded-lg vocs:transition-all hover:vocs:bg-[#0052CC] vocs:no-underline"
								>
									Get started
									<ArrowRightIcon className="vocs:w-4 vocs:h-4" />
								</a>
								<a
									href="https://github.com/tempoxyz/payment-auth-spec"
									target="_blank"
									rel="noopener noreferrer"
									className="vocs:inline-flex vocs:items-center vocs:gap-2 vocs:px-6 vocs:py-3 vocs:border vocs:border-[var(--vocs-color-border)] vocs:text-[var(--vocs-color-text)] vocs:font-medium vocs:rounded-lg vocs:transition-all hover:vocs:bg-[var(--vocs-color-background-2)] vocs:no-underline"
								>
									<GitHubIcon className="vocs:w-5 vocs:h-5" />
									View on GitHub
								</a>
							</div>

							{/* Co-authors badge */}
							<div
								style={{ display: "flex", alignItems: "center", gap: "16px" }}
							>
								<span className="vocs:text-[13px] vocs:text-[var(--vocs-color-text-3)] vocs:uppercase vocs:tracking-wider vocs:font-medium vocs:opacity-50">
									Co-authored by
								</span>
								<div
									style={{ display: "flex", alignItems: "center", gap: "24px" }}
								>
									<a
										href="https://tempo.xyz"
										target="_blank"
										rel="noopener noreferrer"
										className="vocs:no-underline hover:vocs:opacity-80 vocs:transition-opacity"
									>
										<TempoLogo
											className="vocs:text-[var(--vocs-color-text-2)]"
											style={{ width: "80px" }}
										/>
									</a>
									<a
										href="https://stripe.com"
										target="_blank"
										rel="noopener noreferrer"
										className="vocs:no-underline hover:vocs:opacity-80 vocs:transition-opacity"
									>
										<StripeLogo
											className="vocs:text-[var(--vocs-color-text-2)]"
											style={{ width: "72px" }}
										/>
									</a>
								</div>
							</div>
						</div>

						{/* Right side - Demo */}
						<div style={{ flex: 1, minWidth: 0 }} className="vocs:relative">
							<div className="vocs:absolute vocs:-inset-4 vocs:bg-gradient-to-r vocs:from-[#0166FF]/10 vocs:to-[#0166FF]/5 vocs:rounded-2xl vocs:blur-xl" />
							<div className="vocs:relative">
								<CliDemo />
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Feature 1: Open Standard */}
			<section
				style={{
					...fullWidthStyle,
					paddingTop: "5rem",
					paddingBottom: "5rem",
					borderBottom: "1px solid rgba(255,255,255,0.06)",
				}}
			>
				<div style={containerStyle}>
					<div
						style={{
							display: "flex",
							flexDirection: "row",
							gap: "80px",
							alignItems: "center",
						}}
					>
						{/* Left - Copy */}
						<div style={{ flex: 1 }} className="vocs:space-y-6">
							<div className="vocs:inline-flex vocs:items-center vocs:justify-center vocs:w-12 vocs:h-12 vocs:rounded-xl vocs:bg-[#0166FF]/10">
								<GlobeIcon className="vocs:w-6 vocs:h-6 vocs:text-[#0166FF]" />
							</div>
							<h2 className="vocs:text-3xl sm:vocs:text-4xl vocs:font-semibold vocs:tracking-tight vocs:text-[var(--vocs-color-text)]">
								Open standard built for the internet
							</h2>
							<p className="vocs:text-lg vocs:text-[var(--vocs-color-text-2)] vocs:leading-relaxed">
								MPP standardizes HTTP 402 "Payment Required" with an IETF-track
								specification. No proprietary APIs or vendor lock-in—just HTTP
								headers and standard authentication flows.
							</p>
							<ul className="vocs:space-y-3">
								{[
									"Challenge → Credential → Receipt flow",
									"Works with any HTTP client or server",
									"Idempotency and replay protection built-in",
								].map((item) => (
									<li
										key={item}
										className="vocs:flex vocs:items-center vocs:gap-3 vocs:text-[var(--vocs-color-text-2)]"
									>
										<span className="vocs:w-1.5 vocs:h-1.5 vocs:rounded-full vocs:bg-[#0166FF]" />
										{item}
									</li>
								))}
							</ul>
						</div>

						{/* Right - Protocol Flow Diagram */}
						<div
							style={{ flex: 1, border: "1px solid rgba(255,255,255,0.2)" }}
							className="vocs:bg-[var(--vocs-color-background-2)] vocs:rounded-xl vocs:overflow-hidden"
						>
							{/* Step 1: Initial Request */}
							<div
								className="vocs:px-4 vocs:py-3"
								style={{ borderBottom: "1px solid rgba(255,255,255,0.2)" }}
							>
								<div className="vocs:flex vocs:items-center vocs:gap-2 vocs:mb-1">
									<span className="vocs:text-[10px] vocs:font-medium vocs:uppercase vocs:tracking-wider vocs:text-[var(--vocs-color-text-3)]">
										1. Request
									</span>
								</div>
								<code className="vocs:font-mono vocs:text-sm">
									<span className="vocs:text-[#0166FF]">GET</span>
									<span className="vocs:text-[var(--vocs-color-text)]">
										{" "}
										/resource
									</span>
								</code>
							</div>

							{/* Step 2: 402 Challenge */}
							<div
								className="vocs:px-4 vocs:py-3"
								style={{ borderBottom: "1px solid rgba(255,255,255,0.2)" }}
							>
								<div className="vocs:flex vocs:items-center vocs:gap-2 vocs:mb-1">
									<span className="vocs:text-[10px] vocs:font-medium vocs:uppercase vocs:tracking-wider vocs:text-[var(--vocs-color-text-3)]">
										2. Challenge
									</span>
								</div>
								<div className="vocs:font-mono vocs:text-sm vocs:space-y-0.5">
									<div>
										<span className="vocs:text-[var(--vocs-color-destructive)]">
											402
										</span>
										<span className="vocs:text-[var(--vocs-color-text-2)]">
											{" "}
											Payment Required
										</span>
									</div>
									<div className="vocs:text-[var(--vocs-color-text-3)]">
										WWW-Authenticate: Payment method="tempo" ...
									</div>
								</div>
							</div>

							{/* Step 3: Retry with Credential */}
							<div
								className="vocs:px-4 vocs:py-3"
								style={{ borderBottom: "1px solid rgba(255,255,255,0.2)" }}
							>
								<div className="vocs:flex vocs:items-center vocs:gap-2 vocs:mb-1">
									<span className="vocs:text-[10px] vocs:font-medium vocs:uppercase vocs:tracking-wider vocs:text-[var(--vocs-color-text-3)]">
										3. Retry with credential
									</span>
								</div>
								<div className="vocs:font-mono vocs:text-sm vocs:space-y-0.5">
									<div>
										<span className="vocs:text-[#0166FF]">GET</span>
										<span className="vocs:text-[var(--vocs-color-text)]">
											{" "}
											/resource
										</span>
									</div>
									<div className="vocs:text-[var(--vocs-color-text-3)]">
										Authorization: Payment {"<credential>"}
									</div>
								</div>
							</div>

							{/* Step 4: Success with Receipt */}
							<div className="vocs:px-4 vocs:py-3">
								<div className="vocs:flex vocs:items-center vocs:gap-2 vocs:mb-1">
									<span className="vocs:text-[10px] vocs:font-medium vocs:uppercase vocs:tracking-wider vocs:text-[var(--vocs-color-text-3)]">
										4. Success
									</span>
								</div>
								<div className="vocs:font-mono vocs:text-sm vocs:space-y-0.5">
									<div>
										<span className="vocs:text-[#16a34a]">200</span>
										<span className="vocs:text-[var(--vocs-color-text-2)]">
											{" "}
											OK
										</span>
									</div>
									<div className="vocs:text-[var(--vocs-color-text-3)]">
										Payment-Receipt: {"<receipt>"}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Feature 2: Multi-Rail (reversed layout) */}
			<section
				style={{
					...fullWidthStyle,
					paddingTop: "5rem",
					paddingBottom: "5rem",
					borderBottom: "1px solid rgba(255,255,255,0.06)",
				}}
			>
				<div style={containerStyle}>
					<div
						style={{
							display: "flex",
							flexDirection: "row",
							gap: "80px",
							alignItems: "center",
						}}
					>
						{/* Left - Payment Methods Grid */}
						<div style={{ flex: 1 }}>
							<div className="vocs:grid vocs:grid-cols-2 vocs:gap-4">
								{/* Tempo Card */}
								<div
									className="vocs:bg-[var(--vocs-color-background-2)] vocs:rounded-xl vocs:p-5 vocs:space-y-3"
									style={{ border: "1px solid rgba(255,255,255,0.2)" }}
								>
									<div className="vocs:flex vocs:items-center vocs:justify-between">
										<TempoLogo
											className="vocs:text-[var(--vocs-color-text)]"
											style={{ width: "70px", height: "auto" }}
										/>
										<StatusBadge status="production" />
									</div>
									<p className="vocs:text-sm vocs:text-[var(--vocs-color-text-2)] vocs:leading-relaxed">
										Instant stablecoin settlement on Tempo. Sub-second finality
										with USDC payments directly to your wallet—no invoices or
										delayed payouts.
									</p>
								</div>

								{/* Stripe Card */}
								<div
									className="vocs:bg-[var(--vocs-color-background-2)] vocs:rounded-xl vocs:p-5 vocs:space-y-3"
									style={{ border: "1px solid rgba(255,255,255,0.2)" }}
								>
									<div className="vocs:flex vocs:items-center vocs:justify-between">
										<StripeLogo
											className="vocs:text-[var(--vocs-color-text)]"
											style={{ width: "52px", height: "auto" }}
										/>
										<StatusBadge status="beta" />
									</div>
									<p className="vocs:text-sm vocs:text-[var(--vocs-color-text-2)] vocs:leading-relaxed">
										Accept cards, bank transfers, and invoices through Stripe.
										Leverage existing Stripe infrastructure with MPP's
										standardized protocol layer.
									</p>
								</div>

								{/* Custom Card */}
								<div
									className="vocs:bg-[var(--vocs-color-background-2)] vocs:rounded-xl vocs:p-5 vocs:space-y-3"
									style={{ border: "1px solid rgba(255,255,255,0.2)" }}
								>
									<div className="vocs:flex vocs:items-center vocs:justify-between">
										<span className="vocs:font-semibold vocs:text-[var(--vocs-color-text)]">
											Custom
										</span>
										<StatusBadge status="available" />
									</div>
									<p className="vocs:text-sm vocs:text-[var(--vocs-color-text-2)] vocs:leading-relaxed">
										Build your own payment method. MPP's extensible architecture
										lets you integrate any payment rail—internal credits,
										loyalty points, or custom currencies.
									</p>
								</div>

								{/* More Coming Card */}
								<div
									className="vocs:bg-[var(--vocs-color-background-2)] vocs:rounded-xl vocs:p-5 vocs:space-y-3"
									style={{ border: "1px solid rgba(255,255,255,0.2)" }}
								>
									<div className="vocs:flex vocs:items-center vocs:justify-between">
										<span className="vocs:font-semibold vocs:text-[var(--vocs-color-text)]">
											More coming
										</span>
										<StatusBadge status="planned" />
									</div>
									<p className="vocs:text-sm vocs:text-[var(--vocs-color-text-2)] vocs:leading-relaxed">
										Lightning Network for instant Bitcoin micropayments, ACH for
										low-cost bank transfers, and more payment rails on the
										roadmap.
									</p>
								</div>
							</div>
						</div>

						{/* Right - Copy */}
						<div style={{ flex: 1 }} className="vocs:space-y-6">
							<div className="vocs:inline-flex vocs:items-center vocs:justify-center vocs:w-12 vocs:h-12 vocs:rounded-xl vocs:bg-[#0166FF]/10">
								<LayersIcon className="vocs:w-6 vocs:h-6 vocs:text-[#0166FF]" />
							</div>
							<h2 className="vocs:text-3xl sm:vocs:text-4xl vocs:font-semibold vocs:tracking-tight vocs:text-[var(--vocs-color-text)]">
								Multi-rail, multi-currency
							</h2>
							<p className="vocs:text-lg vocs:text-[var(--vocs-color-text-2)] vocs:leading-relaxed">
								MPP is payment method agnostic. Crypto, cards, bank transfers,
								invoices—all payment methods work through one protocol. Support
								USD, EUR, BTC, USDC, or any currency.
							</p>
							<ul className="vocs:space-y-3">
								{[
									"Single integration, multiple payment rails",
									"Currency agnostic—from fiat to crypto",
									"Extensible: define your own payment methods",
								].map((item) => (
									<li
										key={item}
										className="vocs:flex vocs:items-center vocs:gap-3 vocs:text-[var(--vocs-color-text-2)]"
									>
										<span className="vocs:w-1.5 vocs:h-1.5 vocs:rounded-full vocs:bg-[#0166FF]" />
										{item}
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>
			</section>

			{/* Feature 3: Developer Experience */}
			<section
				style={{
					...fullWidthStyle,
					paddingTop: "5rem",
					paddingBottom: "5rem",
					borderBottom: "1px solid rgba(255,255,255,0.06)",
				}}
			>
				<div style={containerStyle}>
					<div
						style={{
							display: "flex",
							flexDirection: "row",
							gap: "80px",
							alignItems: "center",
						}}
					>
						{/* Left - Copy */}
						<div style={{ flex: 1 }} className="vocs:space-y-6">
							<div className="vocs:inline-flex vocs:items-center vocs:justify-center vocs:w-12 vocs:h-12 vocs:rounded-xl vocs:bg-[#0166FF]/10">
								<ZapIcon className="vocs:w-6 vocs:h-6 vocs:text-[#0166FF]" />
							</div>
							<h2 className="vocs:text-3xl sm:vocs:text-4xl vocs:font-semibold vocs:tracking-tight vocs:text-[var(--vocs-color-text)]">
								Developer-first experience
							</h2>
							<p className="vocs:text-lg vocs:text-[var(--vocs-color-text-2)] vocs:leading-relaxed">
								Official SDKs for TypeScript, Python, and Rust. Polyfill fetch
								or go low-level—MPP works the way you work. Add payments with
								minimal code changes.
							</p>
							<ul className="vocs:space-y-3">
								{[
									"Client: Polyfill fetch for automatic 402 handling",
									"Server: Works with Hono, Express, Next.js, and more",
									"CLI: Test with pget, a curl for paid resources",
								].map((item) => (
									<li
										key={item}
										className="vocs:flex vocs:items-center vocs:gap-3 vocs:text-[var(--vocs-color-text-2)]"
									>
										<span className="vocs:w-1.5 vocs:h-1.5 vocs:rounded-full vocs:bg-[#0166FF]" />
										{item}
									</li>
								))}
							</ul>
						</div>

						{/* Right - Code Snippet with Tabs */}
						<CodeTabs />
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section
				style={{ ...fullWidthStyle, paddingTop: "5rem", paddingBottom: "5rem" }}
			>
				<div
					style={{
						maxWidth: "900px",
						margin: "0 auto",
						padding: "0 80px",
						textAlign: "center",
					}}
				>
					<h2 className="vocs:text-3xl sm:vocs:text-4xl vocs:font-semibold vocs:tracking-tight vocs:text-[var(--vocs-color-text)] vocs:mb-4">
						Start accepting payments today
					</h2>
					<p className="vocs:text-lg vocs:text-[var(--vocs-color-text-2)] vocs:mb-8 vocs:max-w-2xl vocs:mx-auto">
						Add payments to your API in minutes. No signup required—just install
						the SDK and start charging for your resources.
					</p>
					<div className="vocs:flex vocs:flex-wrap vocs:justify-center vocs:gap-4">
						<a
							href="/quickstart/server"
							className="vocs:inline-flex vocs:items-center vocs:gap-2 vocs:px-6 vocs:py-3 vocs:bg-[#0166FF] vocs:text-white vocs:font-medium vocs:rounded-lg vocs:transition-all hover:vocs:bg-[#0052CC] vocs:no-underline"
						>
							Server quickstart
							<ArrowRightIcon className="vocs:w-4 vocs:h-4" />
						</a>
						<a
							href="/quickstart/client"
							className="vocs:inline-flex vocs:items-center vocs:gap-2 vocs:px-6 vocs:py-3 vocs:border vocs:border-[var(--vocs-color-border)] vocs:text-[var(--vocs-color-text)] vocs:font-medium vocs:rounded-lg vocs:transition-all hover:vocs:bg-[var(--vocs-color-background-2)] vocs:no-underline"
						>
							Client quickstart
						</a>
					</div>
				</div>
			</section>
		</div>
	);
}
