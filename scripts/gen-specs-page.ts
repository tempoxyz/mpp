import * as fs from "node:fs";
import * as path from "node:path";

const specsDir = path.resolve(process.cwd(), "public/specs");
const outputFile = path.resolve(process.cwd(), "src/pages/specs/index.mdx");

function writeFallback(reason: string) {
	const fallback = [
		"# Specifications [Normative protocol specifications for MPP]",
		"",
		"Spec artifacts are not available in this build.",
		"",
		`View the specifications at [paymentauth.tempo.xyz](https://paymentauth.tempo.xyz) or in the [source repository](https://github.com/tempoxyz/payment-auth-spec).`,
		"",
	];
	fs.mkdirSync(path.dirname(outputFile), { recursive: true });
	fs.writeFileSync(outputFile, `${fallback.join("\n").trimEnd()}\n`);
	console.log(`${reason} -- wrote fallback specs page.`);
	process.exit(0);
}

if (!fs.existsSync(specsDir)) {
	writeFallback("public/specs/ not found");
}

const xmlFiles = fs
	.readdirSync(specsDir)
	.filter((f) => f.startsWith("draft-") && f.endsWith(".xml"))
	.sort();

if (xmlFiles.length === 0) {
	writeFallback("No spec artifacts found");
}

interface Spec {
	title: string;
	basename: string;
	category: string;
}

function parseXml(file: string): Spec {
	const content = fs.readFileSync(path.join(specsDir, file), "utf-8");
	const basename = file.replace(/\.xml$/, "");

	const rfcMatch = content.match(/<rfc[^>]*category="([^"]+)"/);
	const category = rfcMatch?.[1] ?? "info";

	const frontIdx = content.indexOf("<front>");
	const afterFront = frontIdx >= 0 ? content.slice(frontIdx) : content;
	const titleMatch = afterFront.match(/<title[^>]*>(.*?)<\/title>/);
	const title = titleMatch
		? titleMatch[1]
				.replace(/&amp;/g, "&")
				.replace(/&lt;/g, "<")
				.replace(/&gt;/g, ">")
				.replace(/&#34;/g, '"')
				.replace(/&quot;/g, '"')
		: basename;

	return { title, basename, category };
}

const specs = xmlFiles.map(parseXml);

const categories: [string, (b: string) => boolean, string | null][] = [
	["Core", (b) => b.startsWith("draft-httpauth-"), null],
	["Extensions", (b) => b.startsWith("draft-payment-discovery"), null],
	["Transports", (b) => b.startsWith("draft-payment-transport"), null],
	["Intents", (b) => b.startsWith("draft-payment-intent"), null],
	["Tempo", (b) => b.startsWith("draft-tempo-"), "Payment Methods"],
	["Stripe", (b) => b.startsWith("draft-stripe-"), "Payment Methods"],
];

const lines: string[] = [
	"# Specifications [Normative protocol specifications for MPP]",
	"",
	"The IETF-track Internet-Drafts that define the Machine Payments Protocol.",
	"",
	"[Source repository](https://github.com/tempoxyz/payment-auth-spec) · [Contributing](https://github.com/tempoxyz/payment-auth-spec/blob/main/CONTRIBUTING.md)",
	"",
];

const used = new Set<string>();
let lastParent: string | null = null;

for (const [heading, matcher, parent] of categories) {
	const matched = specs.filter((s) => matcher(s.basename));
	if (matched.length === 0) continue;

	if (parent && parent !== lastParent) {
		lines.push(`## ${parent}`);
		lines.push("");
		lastParent = parent;
	}

	const prefix = parent ? "###" : "##";
	lines.push(`${prefix} ${heading}`);
	lines.push("");
	for (const spec of matched) {
		const hasTxt = fs.existsSync(path.join(specsDir, `${spec.basename}.txt`));
		const txtLink = hasTxt
			? ` <a href="/specs/${spec.basename}.txt"><code data-v="true">.txt</code></a>`
			: "";
		lines.push(
			`- ${spec.title} <a href="/specs/${spec.basename}.html"><code data-v="true">.html</code></a>${txtLink}`,
		);
		used.add(spec.basename);
	}
	lines.push("");
}

const uncategorized = specs.filter((s) => !used.has(s.basename));
if (uncategorized.length > 0) {
	lines.push("## Other");
	lines.push("");
	for (const spec of uncategorized) {
		const hasTxt = fs.existsSync(path.join(specsDir, `${spec.basename}.txt`));
		const txtLink = hasTxt
			? ` <a href="/specs/${spec.basename}.txt"><code data-v="true">.txt</code></a>`
			: "";
		lines.push(
			`- ${spec.title} <a href="/specs/${spec.basename}.html"><code data-v="true">.html</code></a>${txtLink}`,
		);
	}
	lines.push("");
}

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, `${lines.join("\n").trimEnd()}\n`);
console.log(`Generated ${path.relative(process.cwd(), outputFile)}`);
