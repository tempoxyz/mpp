const COLOR_PROPS = new Set([
	"color",
	"background-color",
	"--shiki-light",
	"--shiki-dark",
	"--shiki-light-bg",
	"--shiki-dark-bg",
]);

function splitStyle(style: string): {
	color: string;
	rest: string;
} {
	const colorParts: string[] = [];
	const restParts: string[] = [];

	for (const raw of style.split(";")) {
		const decl = raw.trim();
		if (!decl) continue;
		const i = decl.indexOf(":");
		if (i < 0) continue;
		const prop = decl.slice(0, i).trim();
		if (COLOR_PROPS.has(prop)) {
			colorParts.push(decl);
		} else {
			restParts.push(decl);
		}
	}

	return {
		color: colorParts.join(";"),
		rest: restParts.join(";"),
	};
}

// biome-ignore lint/suspicious/noExplicitAny: HAST node types
type HastNode = any;

function walkSpans(node: HastNode, cb: (span: HastNode) => void) {
	if (!node.children) return;
	for (const child of node.children) {
		if (child.type !== "element") continue;
		if (child.tagName === "span" && child.properties?.style) {
			cb(child);
		}
		walkSpans(child, cb);
	}
}

let scopeCounter = 0;

/**
 * Shiki transformer that replaces repeated inline color styles with CSS classes.
 *
 * Shiki's dual-theme output puts a ~77-char `style` attribute on every token span
 * (e.g. `color:light-dark(#D73A49,#F47067);--shiki-light:#D73A49;--shiki-dark:#F47067`).
 * With only ~8 unique color combinations repeated 20K–40K times, this bloats
 * uncompressed page size by 1.6–3.2 MB — especially in the RSC flight payload.
 * This transformer deduplicates those styles into scoped CSS classes.
 */
export function shikiStyleToClass() {
	return {
		name: "mpp:style-to-class",
		enforce: "post" as const,
		root(root: HastNode) {
			const pre = root.children?.find(
				(n: HastNode) => n.type === "element" && n.tagName === "pre",
			);
			if (!pre) return;

			const code = pre.children?.find(
				(n: HastNode) => n.type === "element" && n.tagName === "code",
			);
			if (!code) return;

			const colorToClass = new Map<string, string>();
			let classIndex = 0;
			const scopeId = `sc${scopeCounter++}`;

			// Add scope class to <pre>
			const existing = pre.properties?.class;
			const classes = Array.isArray(existing)
				? [...existing]
				: typeof existing === "string"
					? existing.split(" ")
					: [];
			classes.push(scopeId);
			pre.properties.class = classes.join(" ");

			// Walk all spans and replace color styles with classes
			walkSpans(code, (span: HastNode) => {
				const style =
					typeof span.properties.style === "string"
						? span.properties.style
						: "";
				if (!style) return;

				const { color, rest } = splitStyle(style);
				if (!color) return;

				let cls = colorToClass.get(color);
				if (!cls) {
					cls = `s${classIndex++}`;
					colorToClass.set(color, cls);
				}

				// Replace style with class
				const spanClasses = span.properties.class
					? `${span.properties.class} ${cls}`
					: cls;
				span.properties.class = spanClasses;

				if (rest) {
					span.properties.style = rest;
				} else {
					delete span.properties.style;
				}
			});

			if (colorToClass.size === 0) return;

			// Build CSS rules scoped to this code block
			const rules = Array.from(colorToClass.entries())
				.map(([style, cls]) => `.${scopeId} .${cls}{${style}}`)
				.join("");

			// Inject <style> as sibling before <pre> in the root
			const preIndex = root.children.indexOf(pre);
			root.children.splice(preIndex, 0, {
				type: "element",
				tagName: "style",
				properties: { "data-shiki-colors": "" },
				children: [{ type: "text", value: rules }],
			});
		},
	};
}
