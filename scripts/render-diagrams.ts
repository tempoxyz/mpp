import { renderMermaidAscii } from "beautiful-mermaid";
import { writeFileSync, mkdirSync } from "node:fs";

const opts = { useAscii: false, paddingX: 3, paddingY: 1, boxBorderPadding: 1 };

const diagrams: Record<string, string> = {
	"payment-flow": `sequenceDiagram
    participant Client
    participant Server
    Client->>Server: GET /resource
    Server-->>Client: 402 + challenge
    Note over Client: Fulfill payment
    Client->>Server: GET /resource + credential
    Note over Server: Verify payment
    Server-->>Client: 200 OK + receipt`,

	"protocol-flow": `sequenceDiagram
    participant Client
    participant Server
    Client->>Server: GET /resource
    Server-->>Client: 402 + challenge
    Note over Client: Fulfill payment
    Client->>Server: GET /resource + credential
    Note over Server: Verify and settle
    Server-->>Client: 200 OK + receipt`,
};

mkdirSync("src/snippets/diagrams", { recursive: true });

for (const [name, chart] of Object.entries(diagrams)) {
	const ascii = renderMermaidAscii(chart, opts);
	writeFileSync(`src/snippets/diagrams/${name}.txt`, ascii);
	console.log(`✓ ${name}`);
}
