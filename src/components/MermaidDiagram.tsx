"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

export const LAYOUT = {
  padding: 20,
  actorGap: 260,
  actorGap2: 360,
  actorBoxH: 36,
  actorPadX: 24,
  headerGap: 72,

  rowHeight: 72,
  blockPadX: 12,
  blockPadTop: 28,
  blockPadBottom: 10,
  labelLineGap: 22,
  arrowSize: 8,
  badgeR: 10,
  noteBoxPadX: 16,
  noteBoxPadY: 8,
  noteExtraMargin: 28,
  fontFamily:
    '"Geist Pixel Square", "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  actorFontSize: 14,
  actorFontWeight: 600,
  labelFontSize: 14,
  labelFontWeight: 400,
  noteFontSize: 13,
  noteFontWeight: 500,
  badgeFontSize: 10,
  blockLabelFontSize: 11,
  blockLabelFontWeight: 600,
  messageStroke: 1.2,
  lifelineStroke: 0.75,
};

export interface ThemeColors {
  text: string;
  textMuted: string;
  line: string;
  lifeline: string;
  arrow: string;
  successArrow: string;
  errorCode: string;
  actorFill: string;
  actorStroke: string;
  blockStroke: string;
  blockHeaderBg: string;
  badgeBg: string;
  badgeText: string;
}

export const THEMES: Record<"light" | "dark", ThemeColors> = {
  light: {
    text: "#27272a",
    textMuted: "#3f3f46",
    line: "#a1a1aa",
    lifeline: "#d4d4d8",
    arrow: "#0166ff",
    successArrow: "#16a34a",
    errorCode: "#dc2626",
    actorFill: "#ffffff",
    actorStroke: "#e4e4e7",
    blockStroke: "#e4e4e7",
    blockHeaderBg: "#f4f4f5",
    badgeBg: "#e4e4e7",
    badgeText: "#52525b",
  },
  dark: {
    text: "#e4e4e7",
    textMuted: "#e4e4e7",
    line: "#71717a",
    lifeline: "#3f3f46",
    arrow: "#60a5fa",
    successArrow: "#4ade80",
    errorCode: "#f87171",
    actorFill: "#27272a",
    actorStroke: "#3f3f46",
    blockStroke: "#3f3f46",
    blockHeaderBg: "#27272a",
    badgeBg: "#3f3f46",
    badgeText: "#a1a1aa",
  },
};

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

export interface Participant {
  id: string;
  label: string;
}

export type Step =
  | {
      type: "message";
      from: string;
      to: string;
      label: string;
      num: string | null;
      dashed: boolean;
    }
  | { type: "note"; over: string; text: string; num: string | null }
  | { type: "loop-start"; label: string }
  | { type: "loop-end" };

export interface ParsedDiagram {
  participants: Participant[];
  steps: Step[];
}

export function extractNum(text: string): { num: string | null; rest: string } {
  const m = text.match(/^\((\d+)\)\s*(.+)$/);
  return m ? { num: m[1], rest: m[2] } : { num: null, rest: text };
}

export function parse(source: string): ParsedDiagram {
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
      const e = extractNum(mNote[2].trim());
      steps.push({ type: "note", over: mNote[1], text: e.rest, num: e.num });
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
      const e = extractNum(mMsg[4].trim());
      steps.push({
        type: "message",
        from: mMsg[1],
        to: mMsg[3],
        label: e.rest,
        num: e.num,
        dashed: mMsg[2] === "-->>",
      });
    }
  }
  return { participants, steps };
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export interface LMsg {
  x1: number;
  x2: number;
  y: number;
  label: string;
  num: string | null;
  labelX: number;
  labelY: number;
  dashed: boolean;
  si: number;
  isLast: boolean;
}
export interface LNote {
  text: string;
  num: string | null;
  x: number;
  y: number;
  boxX: number;
  boxY: number;
  boxW: number;
  boxH: number;
  lines: string[];
  si: number;
}
export interface LActor {
  cx: number;
  boxX: number;
  boxY: number;
  boxW: number;
  boxH: number;
  label: string;
}
export interface LBlock {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface LLifeline {
  x: number;
  y1: number;
  y2: number;
}
export interface Layout {
  w: number;
  h: number;
  actors: LActor[];
  lifelines: LLifeline[];
  messages: LMsg[];
  notes: LNote[];
  blocks: LBlock[];
  msgCount: number;
}

export function doLayout(p: ParsedDiagram): Layout {
  const L = LAYOUT;
  const n = p.participants.length;
  const gap = n === 2 ? L.actorGap2 : L.actorGap;

  const aw = p.participants.map(
    (a) => estW(a.label, L.actorFontSize) + L.actorPadX * 2,
  );
  const cx: number[] = [];
  let xc = L.padding + aw[0] / 2;
  for (let i = 0; i < n; i++) {
    if (i > 0) xc += Math.max(gap, (aw[i - 1] + aw[i]) / 2 + 60);
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
  const midX = (cx[0] + cx[n - 1]) / 2;

  // Count total messages to identify the last one
  let totalMsgs = 0;
  for (const s of p.steps) {
    if (s.type === "message") totalMsgs++;
  }
  let msgIdx = 0;

  for (let si = 0; si < p.steps.length; si++) {
    const s = p.steps[si];
    if (s.type === "message") {
      const fi = idx.get(s.from) ?? 0;
      const ti = idx.get(s.to) ?? 0;
      msgIdx++;
      messages.push({
        x1: cx[fi],
        x2: cx[ti],
        y,
        label: s.label,
        num: s.num,
        labelX: (cx[fi] + cx[ti]) / 2,
        labelY: y - L.labelLineGap,
        dashed: s.dashed,
        si,
        isLast: msgIdx === totalMsgs,
      });
      y += L.rowHeight;
    } else if (s.type === "note") {
      const maxNW = (rightEdge - leftEdge) * 0.8;
      const wrapped = wrapText(s.text, maxNW, L.noteFontSize);
      const lineH = L.noteFontSize + 4;
      const boxW =
        Math.max(...wrapped.map((t) => estW(t, L.noteFontSize))) +
        L.noteBoxPadX * 2;
      const boxH = wrapped.length * lineH + L.noteBoxPadY * 2;
      const boxX = midX - boxW / 2;
      const boxY = y - boxH / 2;
      notes.push({
        text: s.text,
        num: s.num,
        x: midX,
        y,
        boxX,
        boxY,
        boxW: boxW + (s.num ? L.badgeR * 2 + 6 : 0),
        boxH,
        lines: wrapped,
        si,
      });
      y += L.rowHeight + L.noteExtraMargin;
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

  const llBot = y - L.rowHeight / 2;
  const lifelines: LLifeline[] = cx.map((lx) => ({
    x: lx,
    y1: bY + L.actorBoxH,
    y2: llBot,
  }));
  const totalW = rightEdge + L.padding;
  const totalH = llBot + L.padding;

  return {
    w: totalW,
    h: totalH,
    actors,
    lifelines,
    messages,
    notes,
    blocks,
    msgCount: totalMsgs,
  };
}

export function estW(text: string, fontSize: number): number {
  return text.length * fontSize * 0.6;
}

export function wrapText(
  text: string,
  maxW: number,
  fontSize: number,
): string[] {
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

export function render(lo: Layout, th: ThemeColors): string {
  const L = LAYOUT;
  const o: string[] = [];
  const sz = L.arrowSize;
  const br = L.badgeR;

  o.push(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
      lo.w +
      " " +
      lo.h +
      '" width="' +
      lo.w +
      '" height="' +
      lo.h +
      '">',
  );
  o.push(`<style>text{font-family:${L.fontFamily}}</style>`);

  // Gradient for last (success) message line — use userSpaceOnUse to avoid
  // zero-height bounding box issues on horizontal <line> elements.
  const lastMsg = lo.messages.find((m) => m.isLast);
  if (lastMsg) {
    o.push(
      '<defs><linearGradient id="grad-success" gradientUnits="userSpaceOnUse" x1="' +
        lastMsg.x1 +
        '" y1="0" x2="' +
        lastMsg.x2 +
        '" y2="0"><stop offset="0%" stop-color="' +
        th.line +
        '"/><stop offset="85%" stop-color="' +
        th.successArrow +
        '"/></linearGradient></defs>',
    );
  }

  // Lifelines
  for (const ll of lo.lifelines) {
    o.push(
      '<line x1="' +
        ll.x +
        '" y1="' +
        ll.y1 +
        '" x2="' +
        ll.x +
        '" y2="' +
        ll.y2 +
        '" stroke="' +
        th.lifeline +
        '" stroke-width="' +
        L.lifelineStroke +
        '" stroke-dasharray="6 4"/>',
    );
  }

  // Blocks
  for (const b of lo.blocks) {
    const tw = estW(b.label, L.blockLabelFontSize) + 20;
    o.push(
      '<rect x="' +
        b.x +
        '" y="' +
        b.y +
        '" width="' +
        b.w +
        '" height="' +
        b.h +
        '" fill="none" stroke="' +
        th.blockStroke +
        '" stroke-width="1"/>',
    );
    o.push(
      '<rect x="' +
        b.x +
        '" y="' +
        b.y +
        '" width="' +
        tw +
        '" height="18" fill="' +
        th.blockHeaderBg +
        '" stroke="' +
        th.blockStroke +
        '" stroke-width="1"/>',
    );
    o.push(
      '<text x="' +
        (b.x + 8) +
        '" y="' +
        (b.y + 9) +
        '" dy="0.35em" font-size="' +
        L.blockLabelFontSize +
        '" font-weight="' +
        L.blockLabelFontWeight +
        '" fill="' +
        th.textMuted +
        '">' +
        esc(b.label) +
        "</text>",
    );
  }

  // Actors
  for (const a of lo.actors) {
    o.push(
      '<rect x="' +
        a.boxX +
        '" y="' +
        a.boxY +
        '" width="' +
        a.boxW +
        '" height="' +
        a.boxH +
        '" rx="4" fill="' +
        th.actorFill +
        '" stroke="' +
        th.actorStroke +
        '" stroke-width="1"/>',
    );
    o.push(
      '<text x="' +
        a.cx +
        '" y="' +
        (a.boxY + a.boxH / 2) +
        '" text-anchor="middle" dy="0.35em" font-size="' +
        L.actorFontSize +
        '" font-weight="' +
        L.actorFontWeight +
        '" fill="' +
        th.text +
        '">' +
        esc(a.label) +
        "</text>",
    );
  }

  // Messages
  for (const m of lo.messages) {
    const da = m.dashed ? ' stroke-dasharray="6 4"' : "";
    const goingRight = m.x2 > m.x1;
    const lineEndX = goingRight ? m.x2 - sz : m.x2 + sz;
    const lineStroke = m.isLast ? "url(#grad-success)" : th.line;
    // Solid arrows (->>): filled triangle; dashed arrows (-->>): outline triangle
    const arrowFill = m.isLast
      ? m.dashed
        ? th.actorFill
        : th.successArrow
      : m.dashed
        ? th.actorFill
        : th.line;
    const arrowStroke = m.isLast ? th.successArrow : th.line;

    // Line
    o.push(
      '<line data-step="' +
        m.si +
        '" x1="' +
        m.x1 +
        '" y1="' +
        m.y +
        '" x2="' +
        lineEndX +
        '" y2="' +
        m.y +
        '" stroke="' +
        lineStroke +
        '" stroke-width="' +
        L.messageStroke +
        '"' +
        da +
        "/>",
    );

    // Arrow
    const tipX = m.x2;
    const baseX = goingRight ? tipX - sz : tipX + sz;
    o.push(
      '<polygon data-step-arrow="' +
        m.si +
        '" points="' +
        tipX +
        "," +
        m.y +
        " " +
        baseX +
        "," +
        (m.y - sz / 2) +
        " " +
        baseX +
        "," +
        (m.y + sz / 2) +
        '" fill="' +
        arrowFill +
        '" stroke="' +
        arrowStroke +
        '" stroke-width="1.2" stroke-linejoin="round"/>',
    );

    // Compute label text width to place badge to its left
    const labelW = estW(m.label, L.labelFontSize);
    const totalLabelW = labelW + (m.num ? br * 2 + 6 : 0);
    const groupLeft = m.labelX - totalLabelW / 2;

    // Badge (subtle bg color, not blue)
    if (m.num) {
      const bcx = groupLeft + br;
      const bcy = m.labelY;
      o.push(
        '<circle data-step-label="' +
          m.si +
          '" cx="' +
          bcx +
          '" cy="' +
          bcy +
          '" r="' +
          br +
          '" fill="' +
          th.badgeBg +
          '"/>',
      );
      o.push(
        '<text data-step-label="' +
          m.si +
          '" x="' +
          bcx +
          '" y="' +
          bcy +
          '" text-anchor="middle" dy="0.35em" font-size="' +
          L.badgeFontSize +
          '" font-weight="600" fill="' +
          th.badgeText +
          '">' +
          m.num +
          "</text>",
      );
    }

    // Label text (to the right of badge)
    const textX = m.num ? groupLeft + br * 2 + 6 + labelW / 2 : m.labelX;
    o.push(
      '<text data-step-label="' +
        m.si +
        '" x="' +
        textX +
        '" y="' +
        m.labelY +
        '" text-anchor="middle" dy="0.35em" font-size="' +
        L.labelFontSize +
        '" font-weight="' +
        L.labelFontWeight +
        '" fill="' +
        th.textMuted +
        '">' +
        highlightLabel(m.label, th) +
        "</text>",
    );
  }

  // Notes — rounded box with wrapped text, no italic
  for (const nt of lo.notes) {
    const lineH = L.noteFontSize + 4;
    // Recenter box now that boxW includes badge space
    const centeredBoxX = nt.x - nt.boxW / 2;
    const textStartY = nt.boxY + L.noteBoxPadY + L.noteFontSize;

    o.push(
      '<rect data-step-note="' +
        nt.si +
        '" x="' +
        centeredBoxX +
        '" y="' +
        nt.boxY +
        '" width="' +
        nt.boxW +
        '" height="' +
        nt.boxH +
        '" rx="6" fill="' +
        th.actorFill +
        '" stroke="' +
        th.actorStroke +
        '" stroke-width="1"/>',
    );

    if (nt.num) {
      const bx = centeredBoxX + L.noteBoxPadX + br;
      const by = nt.boxY + nt.boxH / 2;
      o.push(
        '<circle data-step-note="' +
          nt.si +
          '" cx="' +
          bx +
          '" cy="' +
          by +
          '" r="' +
          br +
          '" fill="' +
          th.badgeBg +
          '"/>',
      );
      o.push(
        '<text data-step-note="' +
          nt.si +
          '" x="' +
          bx +
          '" y="' +
          by +
          '" text-anchor="middle" dy="0.35em" font-size="' +
          L.badgeFontSize +
          '" font-weight="600" fill="' +
          th.badgeText +
          '">' +
          nt.num +
          "</text>",
      );
    }

    const textX = nt.num
      ? centeredBoxX + L.noteBoxPadX + br * 2 + 6
      : centeredBoxX + L.noteBoxPadX;
    for (let li = 0; li < nt.lines.length; li++) {
      o.push(
        '<text data-step-note="' +
          nt.si +
          '" x="' +
          textX +
          '" y="' +
          (textStartY + li * lineH) +
          '" font-size="' +
          L.noteFontSize +
          '" font-weight="' +
          L.noteFontWeight +
          '" fill="' +
          th.textMuted +
          '">' +
          esc(nt.lines[li]) +
          "</text>",
      );
    }
  }

  o.push("</svg>");
  return o.join("\n");
}

// Syntax highlight HTTP codes and methods in labels
export function highlightLabel(label: string, th: ThemeColors): string {
  // Tokenize: split label into segments with optional color overrides
  const re =
    /(GET|POST|PUT|DELETE|PATCH|\b[45]\d{2}\b|\b2\d{2}\s*OK\b|\b2\d{2}\b)/g;
  let lastIdx = 0;
  let result = "";
  let match: RegExpExecArray | null = re.exec(label);
  while (match !== null) {
    // Text before match
    if (match.index > lastIdx) {
      result += esc(label.slice(lastIdx, match.index));
    }
    const tok = match[0];
    let color = th.textMuted;
    if (/^(GET|POST|PUT|DELETE|PATCH)$/.test(tok)) color = th.arrow;
    else if (/^[45]\d{2}$/.test(tok)) color = th.errorCode;
    else if (/^2\d{2}/.test(tok)) color = th.successArrow;
    result += `<tspan fill="${color}">${esc(tok)}</tspan>`;
    lastIdx = match.index + tok.length;
    match = re.exec(label);
  }
  // Remaining text
  if (lastIdx < label.length) {
    result += esc(label.slice(lastIdx));
  }
  return result;
}

export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Animation
// ---------------------------------------------------------------------------

export interface AnimationHandle {
  skipToEnd: () => void;
}

export function showAllItems(svg: SVGSVGElement) {
  svg.style.opacity = "1";
  for (const el of svg.querySelectorAll<SVGElement>(
    "[data-step],[data-step-arrow],[data-step-label],[data-step-note]",
  )) {
    el.style.transition = "none";
    el.style.opacity = "1";
    el.style.strokeDashoffset = "0";
  }
}

export function animate(
  svg: SVGSVGElement,
  onComplete: () => void,
  onStart: () => void,
): AnimationHandle {
  type Item = {
    si: number;
    draw?: SVGElement;
    arrow?: SVGElement;
    fade: SVGElement[];
    isNote: boolean;
  };
  const map = new Map<number, Item>();
  const get = (i: number, isNote = false) => {
    if (!map.has(i)) map.set(i, { si: i, fade: [], isNote });
    return map.get(i)!;
  };

  svg.querySelectorAll<SVGElement>("[data-step]").forEach((el) => {
    get(+el.dataset.step!).draw = el;
  });
  svg.querySelectorAll<SVGElement>("[data-step-arrow]").forEach((el) => {
    get(+el.dataset.stepArrow!).arrow = el;
  });
  svg.querySelectorAll<SVGElement>("[data-step-label]").forEach((el) => {
    get(+el.dataset.stepLabel!).fade.push(el);
  });
  svg.querySelectorAll<SVGElement>("[data-step-note]").forEach((el) => {
    const item = get(+el.dataset.stepNote!, true);
    item.isNote = true;
    item.fade.push(el);
  });

  const timeline = Array.from(map.values()).sort((a, b) => a.si - b.si);
  let skipped = false;
  const timers: ReturnType<typeof setTimeout>[] = [];

  const handle: AnimationHandle = {
    skipToEnd() {
      if (skipped) return;
      skipped = true;
      for (const t of timers) clearTimeout(t);
      showAllItems(svg);
      onComplete();
    },
  };

  if (!timeline.length) {
    svg.style.opacity = "1";
    onComplete();
    return handle;
  }

  svg.style.opacity = "1";
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
      onStart();
      let lastDelay = 0;
      let cumDelay = 800;
      for (let i = 0; i < timeline.length; i++) {
        const item = timeline[i];
        const delay = cumDelay;
        if (delay > lastDelay) lastDelay = delay;
        cumDelay += item.isNote ? 2000 : 1200;

        timers.push(
          setTimeout(() => {
            if (skipped) return;
            if (item.draw) {
              item.draw.style.transition =
                "opacity 0.3s ease, stroke-dashoffset 1.2s ease-out";
              item.draw.style.opacity = "1";
              item.draw.style.strokeDashoffset = "0";
            }
            for (const el of item.fade) {
              el.style.transition = item.draw
                ? "opacity 0.6s ease"
                : "opacity 0.8s ease";
              el.style.opacity = "1";
            }
            if (item.arrow) {
              timers.push(
                setTimeout(() => {
                  if (skipped) return;
                  item.arrow!.style.transition = "opacity 0.3s ease";
                  item.arrow!.style.opacity = "1";
                }, 1000),
              );
            }
          }, delay),
        );
      }
      timers.push(
        setTimeout(() => {
          if (!skipped) onComplete();
        }, lastDelay + 1800),
      );
    },
    { threshold: 0.15 },
  );
  obs.observe(svg);

  return handle;
}

export function lineLen(el: SVGElement): number {
  const x1 = +(el.getAttribute("x1") || 0);
  const x2 = +(el.getAttribute("x2") || 0);
  const y1 = +(el.getAttribute("y1") || 0);
  const y2 = +(el.getAttribute("y2") || 0);
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// ---------------------------------------------------------------------------
// React component
// ---------------------------------------------------------------------------

export function MermaidDiagram({ chart }: { chart: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationHandle | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");

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

  const renderDiagram = useCallback(() => {
    const el = svgRef.current;
    if (!el || !el.isConnected) return;
    setPhase("idle");
    try {
      const parsed = parse(chart);
      const lo = doLayout(parsed);
      const th = isDark ? THEMES.dark : THEMES.light;
      el.innerHTML = render(lo, th);
      const svg = el.querySelector("svg");
      if (!svg) return;
      svg.style.maxWidth = "100%";
      svg.style.height = "auto";
      svg.style.display = "block";
      svg.style.margin = "0 auto";
      animRef.current = animate(
        svg,
        () => setPhase("done"),
        () => setPhase("playing"),
      );
    } catch (err) {
      console.error("MermaidDiagram:", err);
    }
  }, [chart, isDark]);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    let dead = false;
    const raf = requestAnimationFrame(() => {
      if (!dead) renderDiagram();
    });
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      el.innerHTML = "";
    };
  }, [renderDiagram]);

  const th = isDark ? THEMES.dark : THEMES.light;

  const btnStyle: React.CSSProperties = {
    position: "absolute",
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: `1px solid ${th.actorStroke}`,
    background: th.actorFill,
    color: th.textMuted,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    padding: 0,
    opacity: 0.7,
    transition: "opacity 0.2s",
  };

  return (
    <div
      ref={wrapperRef}
      className="mermaid-diagram"
      style={{
        margin: "2rem 0",
        padding: "1.5rem 1rem",
        borderRadius: "12px",
        overflow: "hidden",
        overflowX: "auto",
        minHeight: "100px",
        position: "relative",
      }}
    >
      <div ref={svgRef} />
      {phase === "playing" && (
        <button
          type="button"
          onClick={() => animRef.current?.skipToEnd()}
          aria-label="Skip to end"
          style={btnStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "0.7";
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="none"
            aria-hidden="true"
          >
            <path d="M5 4l10 8-10 8V4z" />
            <rect x="17" y="4" width="3" height="16" />
          </svg>
        </button>
      )}
      {phase === "done" && (
        <button
          type="button"
          onClick={() => {
            if (svgRef.current) {
              svgRef.current.innerHTML = "";
            }
            requestAnimationFrame(renderDiagram);
          }}
          aria-label="Replay animation"
          style={btnStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "0.7";
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      )}
    </div>
  );
}
