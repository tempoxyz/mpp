"use client";

import { useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const LAYOUT = {
	padding: 20,
	actorGap: 260,
	actorBoxH: 36,
	actorPadX: 24,
	headerGap: 50,
	rowHeight: 60,
	noteRowHeight: 60,
	footerPad: 0,
	blockPadX: 12,
	blockPadTop: 28,
	blockPadBottom: 10,
	labelLineGap: 14,
	/** Arrow triangle: width=height for equilateral look */
	arrowSize: 8,
	fontFamily:
		'"Berkeley Mono", "Commit Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
	actorFontSize: 14,
	actorFontWeight: 600,
	labelFontSize: 13,
	labelFontWeight: 400,
	noteFontSize: 12,
	noteFontWeight: 400,
	blockLabelFontSize: 11,
	blockLabelFontWeight: 600,
	messageStroke: 1.2,
	lifelineStroke: 0.75,
};

interface ThemeColors {
	bg: string;
	text: string;
	textMuted: string;
	line: string;
	lifeline: string;
	arrow: string;
	actorFill: string;
	actorStroke: string;
	blockStroke: string;
	blockHeaderBg: string;
}

const THEMES: Record<"light" | "dark", ThemeColors> = {
	light: {
		bg: "transparent",
		text: "#27272a",
		textMuted: "#71717a",
		line: "#a1a1aa",
		lifeline: "#d4d4d8",
		arrow: "#0166ff",
		actorFill: "#fafafa",
		actorStroke: "#e4e4e7",
		blockStroke: "#e4e4e7",
		blockHeaderBg: "#f4f4f5",
	},
	dark: {
		bg: "transparent",
		text: "#e4e4e7",
		textMuted: "#a1a1aa",
		line: "#71717a",
		lifeline: "#3f3f46",
		arrow: "#60a5fa",
		actorFill: "#27272a",
		actorStroke: "#3f3f46",
		blockStroke: "#3f3f46",
		blockHeaderBg: "#27272a",
	},
};

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

interface Participant {
	id: string;
	label: string;
}

type Step =
	| {
			type: "message";
			from: string;
			to: string;
			label: string;
			dashed: boolean;
	  }
	| { type: "note"; over: string; text: string }
	| { type: "loop-start"; label: string }
	| { type: "loop-end" };

interface ParsedDiagram {
	participants: Participant[];
	steps: Step[];
}

function parse(source: string): ParsedDiagram {
	const lines = source
		.split("\n")
		.map((l) => l.trim())
		.filter((l) => l && !l.startsWith("%%"));

	const participants: Participant[] = [];
	const steps: Step[] = [];
	const seen = new Set<string>();

	const ensure = (id: string) => {
		if (!seen.has(id)) {
			seen.add(id);
			participants.push({ id, label: id });
		}
	};

	for (const line of lines) {
		if (line === "sequenceDiagram") continue;

		const mPartAs = line.match(/^participant\s+(\S+)\s+as\s+(.+)$/i);
		if (mPartAs) {
			seen.add(mPartAs[1]);
			participants.push({ id: mPartAs[1], label: mPartAs[2].trim() });
			continue;
		}
		const mPart = line.match(/^participant\s+(\S+)$/i);
		if (mPart) {
			ensure(mPart[1]);
			continue;
		}
		const mNote = line.match(/^Note\s+over\s+(\S+?)\s*:\s*(.+)$/i);
		if (mNote) {
			ensure(mNote[1]);
			steps.push({ type: "note", over: mNote[1], text: mNote[2].trim() });
			continue;
		}
		const mLoop = line.match(/^loop\s+(.+)$/i);
		if (mLoop) {
			steps.push({ type: "loop-start", label: mLoop[1].trim() });
			continue;
		}
		if (/^end$/i.test(line)) {
			steps.push({ type: "loop-end" });
			continue;
		}
		const mMsg = line.match(/^(\S+?)(--?>>)(\S+?)\s*:\s*(.+)$/);
		if (mMsg) {
			ensure(mMsg[1]);
			ensure(mMsg[3]);
			steps.push({
				type: "message",
				from: mMsg[1],
				to: mMsg[3],
				label: mMsg[4].trim(),
				dashed: mMsg[2] === "-->>",
			});
		}
	}

	return { participants, steps };
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

interface LMsg {
	x1: number;
	x2: number;
	y: number;
	label: string;
	labelX: number;
	labelY: number;
	dashed: boolean;
	si: number;
}
interface LNote {
	text: string;
	x: number;
	y: number;
	si: number;
}
interface LActor {
	cx: number;
	boxX: number;
	boxY: number;
	boxW: number;
	boxH: number;
	label: string;
}
interface LBlock {
	label: string;
	x: number;
	y: number;
	w: number;
	h: number;
}
interface LLifeline {
	x: number;
	y1: number;
	y2: number;
}
interface Layout {
	w: number;
	h: number;
	actors: LActor[];
	lifelines: LLifeline[];
	messages: LMsg[];
	notes: LNote[];
	blocks: LBlock[];
}

function layout(p: ParsedDiagram): Layout {
	const L = LAYOUT;
	const n = p.participants.length;

	const aw = p.participants.map(
		(a) => estW(a.label, L.actorFontSize) + L.actorPadX * 2,
	);

	const cx: number[] = [];
	let xc = L.padding + aw[0] / 2;
	for (let i = 0; i < n; i++) {
		if (i > 0) xc += Math.max(L.actorGap, (aw[i - 1] + aw[i]) / 2 + 60);
		cx.push(xc);
	}

	const idx = new Map<string, number>();
	for (let i = 0; i < n; i++) idx.set(p.participants[i].id, i);

	const bY = L.padding;
	const actors: LActor[] = p.participants.map((a, i) => ({
		cx: cx[i],
		boxX: cx[i] - aw[i] / 2,
		boxY: bY,
		boxW: aw[i],
		boxH: L.actorBoxH,
		label: a.label,
	}));

	let y = bY + L.actorBoxH + L.headerGap;
	const messages: LMsg[] = [];
	const notes: LNote[] = [];
	const blocks: LBlock[] = [];
	const bStack: { label: string; x: number; y: number }[] = [];

	const rightEdge = cx[n - 1] + aw[n - 1] / 2;
	const leftEdge = cx[0] - aw[0] / 2;

	for (let si = 0; si < p.steps.length; si++) {
		const s = p.steps[si];

		if (s.type === "message") {
			const fi = idx.get(s.from) ?? 0;
			const ti = idx.get(s.to) ?? 0;
			messages.push({
				x1: cx[fi],
				x2: cx[ti],
				y,
				label: s.label,
				labelX: (cx[fi] + cx[ti]) / 2,
				labelY: y - L.labelLineGap,
				dashed: s.dashed,
				si,
			});
			y += L.rowHeight;
		} else if (s.type === "note") {
			// Center note between leftmost and rightmost actors
			const midX = (cx[0] + cx[n - 1]) / 2;
			notes.push({ text: s.text, x: midX, y, si });
			y += L.noteRowHeight;
		} else if (s.type === "loop-start") {
			bStack.push({
				label: s.label,
				x: leftEdge - L.blockPadX,
				y: y - L.blockPadTop / 2,
			});
			y += L.blockPadTop;
		} else if (s.type === "loop-end") {
			const blk = bStack.pop();
			if (blk) {
				const bw = rightEdge + L.blockPadX - blk.x;
				blocks.push({
					label: blk.label,
					x: blk.x,
					y: blk.y,
					w: bw,
					h: y - blk.y + L.blockPadBottom,
				});
				y += L.blockPadBottom;
			}
		}
	}

	// Lifelines end exactly at last y (no trailing gap)
	const llBot = y;
	const lifelines: LLifeline[] = cx.map((lx) => ({
		x: lx,
		y1: bY + L.actorBoxH,
		y2: llBot,
	}));

	const totalW = rightEdge + L.padding;
	const totalH = llBot + 10;

	return {
		w: totalW,
		h: totalH,
		actors,
		lifelines,
		messages,
		notes,
		blocks,
	};
}

function estW(text: string, fontSize: number): number {
	return text.length * fontSize * 0.6;
}

function wrapText(text: string, maxW: number, fontSize: number): string[] {
	const words = text.split(/\s+/);
	const lines: string[] = [];
	let cur = "";
	for (const word of words) {
		const test = cur ? `${cur} ${word}` : word;
		if (estW(test, fontSize) > maxW && cur) {
			lines.push(cur);
			cur = word;
		} else {
			cur = test;
		}
	}
	if (cur) lines.push(cur);
	return lines.length > 0 ? lines : [text];
}

// ---------------------------------------------------------------------------
// SVG renderer
// ---------------------------------------------------------------------------

function render(lo: Layout, th: ThemeColors): string {
	const L = LAYOUT;
	const o: string[] = [];
	const sz = L.arrowSize;

	o.push(
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lo.w} ${lo.h}" width="${lo.w}" height="${lo.h}">`,
	);
	o.push(`<style>text{font-family:${L.fontFamily}}</style>`);

	// Lifelines
	for (const ll of lo.lifelines)
		o.push(
			`<line x1="${ll.x}" y1="${ll.y1}" x2="${ll.x}" y2="${ll.y2}" stroke="${th.lifeline}" stroke-width="${L.lifelineStroke}" stroke-dasharray="6 4"/>`,
		);

	// Blocks
	for (const b of lo.blocks) {
		const tw = estW(b.label, L.blockLabelFontSize) + 20;
		const tH = 18;
		o.push(
			`<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="none" stroke="${th.blockStroke}" stroke-width="1"/>`,
		);
		o.push(
			`<rect x="${b.x}" y="${b.y}" width="${tw}" height="${tH}" fill="${th.blockHeaderBg}" stroke="${th.blockStroke}" stroke-width="1"/>`,
		);
		o.push(
			`<text x="${b.x + 8}" y="${b.y + tH / 2}" dy="0.35em" font-size="${L.blockLabelFontSize}" font-weight="${L.blockLabelFontWeight}" fill="${th.textMuted}">${esc(b.label)}</text>`,
		);
	}

	// Actors
	for (const a of lo.actors) {
		o.push(
			`<rect x="${a.boxX}" y="${a.boxY}" width="${a.boxW}" height="${a.boxH}" rx="4" fill="${th.actorFill}" stroke="${th.actorStroke}" stroke-width="1"/>`,
		);
		o.push(
			`<text x="${a.cx}" y="${a.boxY + a.boxH / 2}" text-anchor="middle" dy="0.35em" font-size="${L.actorFontSize}" font-weight="${L.actorFontWeight}" fill="${th.text}">${esc(a.label)}</text>`,
		);
	}

	// Messages — line + separate arrow polygon + label
	for (const m of lo.messages) {
		const da = m.dashed ? ' stroke-dasharray="6 4"' : "";
		const goingRight = m.x2 > m.x1;
		// Shorten line so arrow sits at the end
		const lineEndX = goingRight ? m.x2 - sz : m.x2 + sz;

		// Line (animated via stroke-dashoffset)
		o.push(
			`<line data-step="${m.si}" x1="${m.x1}" y1="${m.y}" x2="${lineEndX}" y2="${m.y}" stroke="${th.line}" stroke-width="${L.messageStroke}"${da}/>`,
		);

		// Arrow triangle (separate element, animated independently)
		const tipX = m.x2;
		const baseX = goingRight ? tipX - sz : tipX + sz;
		const fill = m.dashed ? th.actorFill : th.arrow;
		const stroke = th.arrow;
		o.push(
			`<polygon data-step-arrow="${m.si}" points="${tipX},${m.y} ${baseX},${m.y - sz / 2} ${baseX},${m.y + sz / 2}" fill="${fill}" stroke="${stroke}" stroke-width="1.2" stroke-linejoin="round"/>`,
		);

		// Label text
		o.push(
			`<text data-step-label="${m.si}" x="${m.labelX}" y="${m.labelY}" text-anchor="middle" font-size="${L.labelFontSize}" font-weight="${L.labelFontWeight}" fill="${th.textMuted}">${esc(m.label)}</text>`,
		);
	}

	// Notes — italic text, centered, with word wrap via tspan
	const maxNoteW = lo.w - L.padding * 2;
	for (const nt of lo.notes) {
		const wrapped = wrapText(nt.text, maxNoteW, L.noteFontSize);
		const lineH = L.noteFontSize + 4;
		const startY = nt.y - ((wrapped.length - 1) * lineH) / 2;
		o.push(
			`<text data-step-note="${nt.si}" text-anchor="middle" font-size="${L.noteFontSize}" font-weight="${L.noteFontWeight}" font-style="italic" fill="${th.textMuted}">`,
		);
		for (let li = 0; li < wrapped.length; li++) {
			o.push(
				`<tspan x="${nt.x}" y="${startY + li * lineH}">${esc(wrapped[li])}</tspan>`,
			);
		}
		o.push("</text>");
	}

	o.push("</svg>");
	return o.join("\n");
}

function esc(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Animation
// ---------------------------------------------------------------------------

function animate(svg: SVGSVGElement) {
	type Item = {
		si: number;
		draw?: SVGElement;
		arrow?: SVGElement;
		fade: SVGElement[];
	};
	const map = new Map<number, Item>();
	const get = (i: number) => {
		if (!map.has(i)) map.set(i, { si: i, fade: [] });
		return map.get(i)!;
	};

	svg.querySelectorAll<SVGElement>("[data-step]").forEach((el) => {
		get(Number.parseInt(el.dataset.step!, 10)).draw = el;
	});
	svg.querySelectorAll<SVGElement>("[data-step-arrow]").forEach((el) => {
		get(Number.parseInt(el.dataset.stepArrow!, 10)).arrow = el;
	});
	svg.querySelectorAll<SVGElement>("[data-step-label]").forEach((el) => {
		get(Number.parseInt(el.dataset.stepLabel!, 10)).fade.push(el);
	});
	svg.querySelectorAll<SVGElement>("[data-step-note]").forEach((el) => {
		get(Number.parseInt(el.dataset.stepNote!, 10)).fade.push(el);
	});

	const timeline = Array.from(map.values()).sort((a, b) => a.si - b.si);
	if (!timeline.length) {
		svg.style.opacity = "1";
		return;
	}

	svg.style.opacity = "1";

	// Hide animated elements
	for (const item of timeline) {
		if (item.draw) {
			const len = lineLen(item.draw);
			item.draw.style.strokeDasharray = `${len}`;
			item.draw.style.strokeDashoffset = `${len}`;
			item.draw.style.opacity = "0";
		}
		if (item.arrow) item.arrow.style.opacity = "0";
		for (const el of item.fade) el.style.opacity = "0";
	}

	const obs = new IntersectionObserver(
		([e]) => {
			if (!e.isIntersecting) return;
			obs.disconnect();
			for (let i = 0; i < timeline.length; i++) {
				const item = timeline[i];
				const delay = 800 + i * 1200;
				setTimeout(() => {
					// Phase 1: fade line in + draw it
					if (item.draw) {
						item.draw.style.transition =
							"opacity 0.3s ease, stroke-dashoffset 1.2s ease-out";
						item.draw.style.opacity = "1";
						item.draw.style.strokeDashoffset = "0";
					}
					// Phase 2: arrow appears at end of line draw
					if (item.arrow) {
						setTimeout(() => {
							item.arrow!.style.transition = "opacity 0.3s ease";
							item.arrow!.style.opacity = "1";
						}, 1000);
					}
					// Phase 3: label fades in after arrow
					setTimeout(
						() => {
							for (const el of item.fade) {
								el.style.transition = "opacity 0.8s ease";
								el.style.opacity = "1";
							}
						},
						item.draw ? 1200 : 0,
					);
				}, delay);
			}
		},
		{ threshold: 0.15 },
	);
	obs.observe(svg);
}

function lineLen(el: SVGElement): number {
	const x1 = Number.parseFloat(el.getAttribute("x1") || "0");
	const x2 = Number.parseFloat(el.getAttribute("x2") || "0");
	const y1 = Number.parseFloat(el.getAttribute("y1") || "0");
	const y2 = Number.parseFloat(el.getAttribute("y2") || "0");
	return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// ---------------------------------------------------------------------------
// React component
// ---------------------------------------------------------------------------

export function MermaidDiagram({ chart }: { chart: string }) {
	const ref = useRef<HTMLDivElement>(null);
	const [isDark, setIsDark] = useState(false);

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

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		let dead = false;

		const raf = requestAnimationFrame(() => {
			if (dead || !el.isConnected) return;
			try {
				const parsed = parse(chart);
				const lo = layout(parsed);
				const th = isDark ? THEMES.dark : THEMES.light;
				el.innerHTML = render(lo, th);

				const svg = el.querySelector("svg");
				if (!svg) return;
				svg.style.maxWidth = "100%";
				svg.style.height = "auto";
				svg.style.display = "block";
				svg.style.margin = "0 auto";
				animate(svg);
			} catch (err) {
				console.error("MermaidDiagram:", err);
			}
		});

		return () => {
			dead = true;
			cancelAnimationFrame(raf);
			el.innerHTML = "";
		};
	}, [chart, isDark]);

	return (
		<div
			ref={ref}
			className="mermaid-diagram"
			style={{
				margin: "2rem 0",
				padding: "1.5rem 1rem",
				borderRadius: "12px",
				overflow: "hidden",
				overflowX: "auto",
				minHeight: "100px",
			}}
		/>
	);
}
