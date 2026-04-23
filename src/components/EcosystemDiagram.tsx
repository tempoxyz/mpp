"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LAYOUT, THEMES } from "./MermaidDiagram";

export function EcosystemDiagram() {
  const svgRef = useRef<HTMLDivElement>(null);
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

  const renderDiagram = useCallback(() => {
    const el = svgRef.current;
    if (!el?.isConnected) return;

    const th = isDark ? THEMES.dark : THEMES.light;
    const L = LAYOUT;

    const W = 820;
    const H = 370;
    const nw = 120;
    const nh = L.actorBoxH;
    const sz = L.arrowSize;

    // Node centers (evenly spaced)
    const client = { x: 110, y: 150 };
    const s1 = { x: W / 2, y: 80 };
    const s2 = { x: W / 2, y: 220 };
    const reg = { x: 710, y: 150 };

    // Subgraph
    const sgPad = 20;
    const sgX = s1.x - nw / 2 - sgPad;
    const sgY = s1.y - nh / 2 - sgPad - 16;
    const sgW = nw + sgPad * 2;
    const sgH = s2.y - s1.y + nh + sgPad * 2 + 16;

    function node(cx: number, cy: number, label: string) {
      return (
        `<rect x="${cx - nw / 2}" y="${cy - nh / 2}" width="${nw}" height="${nh}" rx="4" ` +
        `fill="${th.actorFill}" stroke="${th.actorStroke}" stroke-width="1"/>` +
        `<text x="${cx}" y="${cy}" text-anchor="middle" dy="0.35em" ` +
        `font-size="${L.actorFontSize}" font-weight="${L.actorFontWeight}" fill="${th.text}">${label}</text>`
      );
    }

    // Line from edge of source box to edge of target box
    function line(
      fromCx: number,
      fromCy: number,
      toCx: number,
      toCy: number,
      label: string,
      color: string,
      markerId: string,
      dashed: boolean,
    ) {
      const dx = toCx - fromCx;
      const dy = toCy - fromCy;
      const len = Math.sqrt(dx * dx + dy * dy);
      const ux = dx / len;
      const uy = dy / len;

      // Start at edge of source box
      const sx =
        Math.abs(ux) * (nw / 2) > Math.abs(uy) * (nh / 2)
          ? fromCx + (nw / 2) * Math.sign(ux)
          : fromCx + (uy !== 0 ? (ux / Math.abs(uy)) * (nh / 2) : 0);
      const sy =
        Math.abs(uy) * (nh / 2) > Math.abs(ux) * (nw / 2)
          ? fromCy + (nh / 2) * Math.sign(uy)
          : fromCy + (ux !== 0 ? (uy / Math.abs(ux)) * (nw / 2) : 0);

      // End at edge of target box (with arrow offset)
      const ex =
        Math.abs(ux) * (nw / 2) > Math.abs(uy) * (nh / 2)
          ? toCx - (nw / 2 + sz) * Math.sign(ux)
          : toCx - (uy !== 0 ? (ux / Math.abs(uy)) * (nh / 2 + sz) : 0);
      const ey =
        Math.abs(uy) * (nh / 2) > Math.abs(ux) * (nw / 2)
          ? toCy - (nh / 2 + sz) * Math.sign(uy)
          : toCy - (ux !== 0 ? (uy / Math.abs(ux)) * (nw / 2 + sz) : 0);

      const mx = (sx + ex) / 2;
      const my = (sy + ey) / 2;
      const da = dashed ? ` stroke-dasharray="6 4"` : "";

      return (
        `<line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" ` +
        `stroke="${color}" stroke-width="${L.messageStroke}"${da} marker-end="url(#${markerId})"/>` +
        `<text x="${mx}" y="${my - 10}" text-anchor="middle" ` +
        `font-size="${L.labelFontSize}" font-weight="${L.labelFontWeight}" ` +
        `fill="${dashed ? th.textMuted : color}">${label}</text>`
      );
    }

    // Discovers edge: curved path below the servers subgraph
    const discY = sgY + sgH + 50;
    const discX1 = client.x;
    const discX2 = reg.x;
    const discMx = (discX1 + discX2) / 2;

    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
      `<style>text{font-family:${L.fontFamily}}</style>` +
      `<defs>` +
      `<marker id="eco-green" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="${sz}" markerHeight="${sz}" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${th.successArrow}"/></marker>` +
      `<marker id="eco-muted" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="${sz}" markerHeight="${sz}" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${th.line}"/></marker>` +
      `</defs>` +
      // Subgraph
      `<rect x="${sgX}" y="${sgY}" width="${sgW}" height="${sgH}" rx="4" fill="none" stroke="${th.blockStroke}" stroke-width="1"/>` +
      `<rect x="${sgX}" y="${sgY}" width="72" height="18" fill="${th.blockHeaderBg}" stroke="${th.blockStroke}" stroke-width="1"/>` +
      `<text x="${sgX + 8}" y="${sgY + 9}" dy="0.35em" font-size="${L.blockLabelFontSize}" font-weight="${L.blockLabelFontWeight}" fill="${th.textMuted}">Servers</text>` +
      // Pay edges (green)
      line(
        client.x,
        client.y,
        s1.x,
        s1.y,
        "402 + pay",
        th.successArrow,
        "eco-green",
        true,
      ) +
      line(
        client.x,
        client.y,
        s2.x,
        s2.y,
        "402 + pay",
        th.successArrow,
        "eco-green",
        true,
      ) +
      // Discovery edges (dashed muted)
      line(s1.x, s1.y, reg.x, reg.y, "", th.line, "eco-muted", true) +
      line(s2.x, s2.y, reg.x, reg.y, "", th.line, "eco-muted", true) +
      // Discovers edge (curved below, ends at Registry bottom)
      `<path d="M ${discX1} ${client.y + nh / 2} C ${discX1} ${discY}, ${discX2} ${discY}, ${discX2} ${reg.y + nh / 2 + sz}" fill="none" stroke="${th.line}" stroke-width="${L.messageStroke}" stroke-dasharray="6 4" marker-end="url(#eco-muted)"/>` +
      `<text x="${discMx}" y="${discY - 10}" text-anchor="middle" font-size="${L.labelFontSize}" font-weight="${L.labelFontWeight}" fill="${th.textMuted}">discovers</text>` +
      // Nodes (on top)
      node(client.x, client.y, "Agent") +
      node(s1.x, s1.y, "Server A") +
      node(s2.x, s2.y, "Server B") +
      node(reg.x, reg.y, "Registry") +
      `</svg>`;

    el.innerHTML = svg;
    const svgEl = el.querySelector("svg");
    if (svgEl) {
      svgEl.style.maxWidth = "100%";
      svgEl.style.height = "auto";
      svgEl.style.display = "block";
      svgEl.style.margin = "0 auto";
    }
  }, [isDark]);

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

  return (
    <div
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
    </div>
  );
}
