"use client";

import { useEffect, useRef, useState } from "react";

const FONT = "Berkeley Mono";
const FONT_STACK =
	'"Berkeley Mono", "Commit Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

const THEMES = {
	light: {
		bg: "#ffffff",
		fg: "#27272a",
		accent: "#0166ff",
		muted: "#71717a",
		line: "#d4d4d8",
		surface: "#fafafa",
		border: "#e4e4e7",
	},
	dark: {
		bg: "#18181b",
		fg: "#e4e4e7",
		accent: "#60a5fa",
		muted: "#a1a1aa",
		line: "#3f3f46",
		surface: "#27272a",
		border: "#3f3f46",
	},
} as const;

interface MermaidDiagramProps {
	chart: string;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
	const svgRef = useRef<HTMLDivElement>(null);
	const [svgHtml, setSvgHtml] = useState<string>("");
	const [isDark, setIsDark] = useState(false);
	const hasAnimated = useRef(false);

	// Detect dark mode
	useEffect(() => {
		const check = () =>
			setIsDark(
				document.documentElement.style.colorScheme === "dark" ||
					document.documentElement.classList.contains("dark"),
			);
		check();
		const obs = new MutationObserver(check);
		obs.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class", "style"],
		});
		return () => obs.disconnect();
	}, []);

	// Render diagram via beautiful-mermaid
	useEffect(() => {
		let cancelled = false;

		(async () => {
			try {
				const { renderMermaid } = await import("beautiful-mermaid");
				if (cancelled) return;

				const theme = isDark ? THEMES.dark : THEMES.light;
				let svg = await renderMermaid(chart, {
					...theme,
					font: FONT,
					transparent: true,
				});

				if (cancelled) return;

				// Remove Google Fonts @import (we use locally-loaded fonts)
				svg = svg.replace(/@import url\([^)]*\);?\s*/g, "");

				// Override font-family to use our full stack
				svg = svg.replace(
					/font-family:\s*'[^']*'[^;]*;/g,
					`font-family: ${FONT_STACK};`,
				);

				// Make the SVG responsive via attributes in the markup
				svg = svg.replace(/(<svg[^>]*)\s+width="[^"]*"/, '$1 width="100%"');
				svg = svg.replace(/(<svg[^>]*)\s+height="[^"]*"/, "$1");

				// Reset animation flag when theme changes so it re-animates
				hasAnimated.current = false;
				setSvgHtml(svg);
			} catch (err) {
				console.error("MermaidDiagram render error:", err);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [chart, isDark]);

	// Animate after SVG is in the DOM
	useEffect(() => {
		if (!svgHtml || !svgRef.current || hasAnimated.current) return;

		const svg = svgRef.current.querySelector("svg");
		if (!svg) return;

		hasAnimated.current = true;
		animateSequenceDiagram(svg);
	}, [svgHtml]);

	return (
		<div
			ref={svgRef}
			className="mermaid-diagram"
			style={{
				margin: "2rem 0",
				padding: "1.5rem 1rem",
				borderRadius: "12px",
				overflow: "hidden",
				minHeight: "150px",
			}}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: SVG from beautiful-mermaid
			dangerouslySetInnerHTML={{ __html: svgHtml }}
		/>
	);
}

// ---------------------------------------------------------------------------
// Animation engine
// ---------------------------------------------------------------------------

function animateSequenceDiagram(svg: SVGSVGElement) {
	// Find message arrows — they have a marker-end attribute pointing to seq-arrow
	const messageArrows = Array.from(
		svg.querySelectorAll<SVGLineElement | SVGPolylineElement>(
			"line[marker-end], polyline[marker-end]",
		),
	);

	if (messageArrows.length === 0) {
		// Not a sequence diagram or no messages — simple fade in
		svg.style.opacity = "0";
		requestAnimationFrame(() => {
			svg.style.transition = "opacity 0.6s ease";
			svg.style.opacity = "1";
		});
		return;
	}

	// Collect all text elements for grouping with messages
	const allTexts = Array.from(svg.querySelectorAll<SVGTextElement>("text"));

	// Sort messages by y-position (temporal order)
	messageArrows.sort((a, b) => getMessageY(a) - getMessageY(b));

	// Group each arrow with its nearby label text
	const messageGroups = messageArrows.map((arrow) => {
		const y = getMessageY(arrow);
		const nearbyTexts = allTexts.filter((t) => {
			const ty = Number.parseFloat(t.getAttribute("y") || "0");
			// Message labels sit ~6px above the line
			return Math.abs(ty - y) < 20 && !isActorLabel(t);
		});
		return { arrow, texts: nearbyTexts };
	});

	// Find note elements (rect + polygon fold + text)
	const noteGroups = findNoteElements(svg);

	// Build animation timeline: messages + notes sorted by y
	type AnimItem = {
		y: number;
		draw?: SVGElement; // line/polyline to draw in
		fade: SVGElement[]; // text/note elements to fade in
	};

	const timeline: AnimItem[] = [];

	for (const { arrow, texts } of messageGroups) {
		timeline.push({
			y: getMessageY(arrow),
			draw: arrow as SVGElement,
			fade: texts as SVGElement[],
		});
	}

	for (const note of noteGroups) {
		timeline.push({
			y: note.y,
			fade: note.elements,
		});
	}

	timeline.sort((a, b) => a.y - b.y);

	// Start with SVG visible (actors + lifelines show immediately)
	svg.style.opacity = "1";

	// Hide all animated elements
	for (const item of timeline) {
		if (item.draw) {
			const len = getElementLength(item.draw);
			item.draw.style.strokeDasharray = `${len}`;
			item.draw.style.strokeDashoffset = `${len}`;
		}
		for (const el of item.fade) {
			el.style.opacity = "0";
		}
	}

	// Trigger animation on intersection
	const observer = new IntersectionObserver(
		([entry]) => {
			if (!entry.isIntersecting) return;
			observer.disconnect();

			for (let i = 0; i < timeline.length; i++) {
				const item = timeline[i];
				const delay = 100 + i * 200;

				setTimeout(() => {
					// Draw the line
					if (item.draw) {
						item.draw.style.transition =
							"stroke-dashoffset 0.45s ease-out, opacity 0.3s ease";
						item.draw.style.strokeDashoffset = "0";
						item.draw.style.opacity = "1";
					}

					// Fade in text labels slightly after line starts
					setTimeout(() => {
						for (const el of item.fade) {
							el.style.transition = "opacity 0.35s ease";
							el.style.opacity = "1";
						}
					}, 100);
				}, delay);
			}
		},
		{ threshold: 0.15 },
	);

	observer.observe(svg);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMessageY(el: Element): number {
	if (el.tagName === "line") {
		return Number.parseFloat(el.getAttribute("y1") || "0");
	}
	// polyline (self-message) — parse first y from points
	const pts = el.getAttribute("points") || "";
	const firstY = pts.split(" ")[0]?.split(",")[1];
	return Number.parseFloat(firstY || "0");
}

function isActorLabel(text: SVGTextElement): boolean {
	// Actor labels have font-weight 500 and font-size 13 (nodeLabel defaults)
	const fw = text.getAttribute("font-weight");
	const fs = text.getAttribute("font-size");
	return fw === "500" && fs === "13";
}

function getElementLength(el: Element): number {
	if (el.tagName === "line") {
		const x1 = Number.parseFloat(el.getAttribute("x1") || "0");
		const x2 = Number.parseFloat(el.getAttribute("x2") || "0");
		const y1 = Number.parseFloat(el.getAttribute("y1") || "0");
		const y2 = Number.parseFloat(el.getAttribute("y2") || "0");
		return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
	}
	if (el.tagName === "polyline") {
		const pts = el.getAttribute("points") || "";
		const coords = pts.split(" ").map((p) => {
			const [x, y] = p.split(",").map(Number);
			return { x: x || 0, y: y || 0 };
		});
		let len = 0;
		for (let i = 1; i < coords.length; i++) {
			len += Math.sqrt(
				(coords[i].x - coords[i - 1].x) ** 2 +
					(coords[i].y - coords[i - 1].y) ** 2,
			);
		}
		return len;
	}
	return 200;
}

function findNoteElements(
	svg: SVGSVGElement,
): { y: number; elements: SVGElement[] }[] {
	// Notes are rendered as rect + polygon (fold corner) + text
	const polygons = Array.from(svg.querySelectorAll("polygon"));
	const notes: { y: number; elements: SVGElement[] }[] = [];

	for (const polygon of polygons) {
		// Skip arrow marker polygons (they're inside <defs>)
		if (polygon.closest("defs")) continue;

		const prev = polygon.previousElementSibling;
		const next = polygon.nextElementSibling;

		if (prev?.tagName === "rect" && next?.tagName === "text") {
			const y = Number.parseFloat(prev.getAttribute("y") || "0");
			notes.push({
				y,
				elements: [
					prev as SVGElement,
					polygon as SVGElement,
					next as SVGElement,
				],
			});
		}
	}

	return notes;
}
