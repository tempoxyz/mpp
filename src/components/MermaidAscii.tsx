export function MermaidAscii({ content }: { content: string }) {
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
				<code>{content}</code>
			</pre>
		</div>
	);
}
