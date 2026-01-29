import type React from "react";

const COLORS = {
	line: "#6b7280",
	accent: "#3b82f6",
	success: "#22c55e",
	error: "#ef4444",
};

function Arrow({
	direction,
	label,
	subLabel,
	color = COLORS.line,
	step,
}: {
	direction: "right" | "left";
	label: string;
	subLabel?: string;
	color?: string;
	step: number;
}) {
	const lineStyle: React.CSSProperties = {
		flex: 1,
		height: "2px",
		backgroundColor: "transparent",
		backgroundImage: `repeating-linear-gradient(90deg, ${color} 0, ${color} 8px, transparent 8px, transparent 16px)`,
		backgroundSize: "16px 2px",
	};

	const arrowRight = (
		<svg
			width="12"
			height="12"
			viewBox="0 0 12 12"
			fill="none"
			aria-hidden="true"
		>
			<title>Arrow pointing right</title>
			<path
				d="M2 6H10M10 6L6 2M10 6L6 10"
				stroke={color}
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);

	const arrowLeft = (
		<svg
			width="12"
			height="12"
			viewBox="0 0 12 12"
			fill="none"
			aria-hidden="true"
		>
			<title>Arrow pointing left</title>
			<path
				d="M10 6H2M2 6L6 2M2 6L6 10"
				stroke={color}
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);

	const stepBadge = (
		<div
			style={{
				width: "28px",
				height: "28px",
				borderRadius: "50%",
				background: "transparent",
				border: `2px solid ${color}`,
				color: color,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				fontSize: "12px",
				fontWeight: 600,
				flexShrink: 0,
			}}
		>
			{step}
		</div>
	);

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: "12px",
				padding: "12px 0",
			}}
		>
			{stepBadge}
			<div
				style={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: "6px",
				}}
			>
				<div style={{ textAlign: "center" }}>
					<div
						style={{
							fontSize: "13px",
							fontFamily: "var(--vocs-fontFamily_mono)",
							color: "var(--vocs-color_text)",
							fontWeight: 500,
							opacity: 0.8,
						}}
					>
						{label}
					</div>
					{subLabel && (
						<div
							style={{
								fontSize: "11px",
								fontFamily: "var(--vocs-fontFamily_mono)",
								color: "var(--vocs-color_text3)",
								marginTop: "2px",
								opacity: 0.8,
							}}
						>
							{subLabel}
						</div>
					)}
				</div>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						width: "100%",
						gap: "4px",
					}}
				>
					{direction === "left" && arrowLeft}
					<div style={lineStyle} />
					{direction === "right" && arrowRight}
				</div>
			</div>
		</div>
	);
}

function Note({ children, step }: { children: React.ReactNode; step: number }) {
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: "12px",
				padding: "12px 0",
			}}
		>
			<div
				style={{
					width: "28px",
					height: "28px",
					borderRadius: "50%",
					background: "transparent",
					border: `2px solid ${COLORS.line}`,
					color: COLORS.line,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					fontSize: "12px",
					fontWeight: 600,
					flexShrink: 0,
				}}
			>
				{step}
			</div>
			<div
				style={{
					flex: 1,
					padding: "14px 20px",
					background: "var(--vocs-color_background3)",
					borderRadius: "8px",
					textAlign: "center",
					fontSize: "13px",
					color: "var(--vocs-color_text2)",
					border: "1px dashed var(--vocs-color_border)",
					opacity: 0.8,
				}}
			>
				{children}
			</div>
		</div>
	);
}

function Participant({ name, emoji }: { name: string; emoji: string }) {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: "6px",
			}}
		>
			<span style={{ fontSize: "28px" }}>{emoji}</span>
			<div
				style={{
					padding: "8px 16px",
					background: "var(--vocs-color_backgroundAccent)",
					borderRadius: "8px",
					fontWeight: 600,
					fontSize: "13px",
					color: "var(--vocs-color_textAccent)",
					textAlign: "center",
					opacity: 0.9,
				}}
			>
				{name}
			</div>
		</div>
	);
}

export function PaymentSequence() {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				padding: "24px",
				background: "var(--vocs-color_background2)",
				borderRadius: "12px",
				fontFamily: "var(--vocs-fontFamily_default)",
				overflow: "hidden",
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					marginBottom: "16px",
					paddingLeft: "40px",
				}}
			>
				<Participant name="Client" emoji="🤖" />
				<Participant name="Server" emoji="🎛️" />
			</div>

			<Arrow step={1} direction="right" label="GET /api/resource" />

			<Arrow
				step={2}
				direction="left"
				label="402 Payment Required"
				subLabel="WWW-Authenticate: Payment ..."
				color={COLORS.error}
			/>

			<Note step={3}>
				Client fulfills payment
				<br />
				<span style={{ opacity: 0.7, fontSize: "12px" }}>
					(sign tx, pay invoice, etc.)
				</span>
			</Note>

			<Arrow
				step={4}
				direction="right"
				label="GET /api/resource"
				subLabel="Authorization: Payment <credential>"
				color={COLORS.accent}
			/>

			<Arrow
				step={5}
				direction="left"
				label="200 OK"
				subLabel="Payment-Receipt: <receipt>"
				color={COLORS.success}
			/>
		</div>
	);
}

export function VerificationSequence() {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				padding: "24px",
				background: "var(--vocs-color_background2)",
				borderRadius: "12px",
				fontFamily: "var(--vocs-fontFamily_default)",
				overflow: "hidden",
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					marginBottom: "16px",
					paddingLeft: "40px",
				}}
			>
				<Participant name="Client" emoji="🤖" />
				<Participant name="Server" emoji="🎛️" />
				<Participant name="Chain" emoji="⛓️" />
			</div>

			<Arrow step={1} direction="right" label="GET /resource" />

			<Arrow
				step={2}
				direction="left"
				label="402 Payment Required"
				subLabel="WWW-Authenticate: Payment ..."
				color={COLORS.error}
			/>

			<Arrow
				step={3}
				direction="right"
				label="Submit transaction"
				color={COLORS.accent}
			/>

			<Arrow step={4} direction="left" label="tx hash" color={COLORS.success} />

			<Arrow
				step={5}
				direction="right"
				label="GET /resource"
				subLabel="Authorization: Payment <credential>"
				color={COLORS.accent}
			/>

			<Arrow
				step={6}
				direction="left"
				label="200 OK"
				subLabel="Payment-Receipt: <receipt>"
				color={COLORS.success}
			/>
		</div>
	);
}
