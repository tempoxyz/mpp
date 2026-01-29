export default function Footer() {
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
			<div style={{ display: "flex", gap: "16px", fontSize: "14px" }}>
				<a
					href="https://paymentauth.tempo.xyz"
					style={{ color: "var(--vocs-color_text2)" }}
				>
					Specification
				</a>
				<a
					href="https://github.com/wevm/mpay"
					style={{ color: "var(--vocs-color_text2)" }}
				>
					GitHub
				</a>
				<a
					href="https://tempo.xyz"
					style={{ color: "var(--vocs-color_text2)" }}
				>
					Tempo
				</a>
			</div>
			<div style={{ color: "var(--vocs-color_text3)", fontSize: "13px" }}>
				Released under the MIT License. Copyright © 2024-present Tempo Labs.
			</div>
		</div>
	);
}
