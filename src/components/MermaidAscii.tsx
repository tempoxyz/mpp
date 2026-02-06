"use client";

import { renderMermaidAscii } from "beautiful-mermaid";
import { useMemo } from "react";

export function MermaidAscii({ chart }: { chart: string }) {
	const ascii = useMemo(() => renderMermaidAscii(chart), [chart]);
	return (
		<pre
			style={{
				overflow: "auto",
				padding: "1rem",
				fontSize: "0.8rem",
				lineHeight: 1.4,
				fontFamily:
					'"Berkeley Mono", "Commit Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
			}}
		>
			<code>{ascii}</code>
		</pre>
	);
}
