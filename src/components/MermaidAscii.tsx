"use client";

import { renderMermaidAscii } from "beautiful-mermaid";
import { useMemo } from "react";

export function MermaidAscii({ chart }: { chart: string }) {
	const ascii = useMemo(
		() =>
			renderMermaidAscii(chart, {
				useAscii: false,
				paddingX: 3,
				paddingY: 1,
				boxBorderPadding: 1,
			}),
		[chart],
	);
	return (
		<div style={{ display: "flex", justifyContent: "center" }}>
			<pre
				style={{
					display: "inline-block",
					padding: "1rem",
					fontSize: "0.7rem",
					lineHeight: 1.3,
					fontFamily:
						'"Berkeley Mono", "Commit Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
				}}
			>
				<code>{ascii}</code>
			</pre>
		</div>
	);
}
