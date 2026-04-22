"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { doLayout, parse, render, THEMES } from "./MermaidDiagram";

/**
 * Renders a Mermaid sequence diagram using the same parser, layout, and
 * theme as MermaidDiagram — but without animation. The diagram appears
 * fully drawn immediately.
 */
export function StaticMermaidDiagram({ chart }: { chart: string }) {
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
      // Make everything visible immediately (no animation)
      for (const node of svg.querySelectorAll("[style]")) {
        (node as HTMLElement).style.opacity = "1";
        (node as HTMLElement).style.strokeDashoffset = "0";
      }
    } catch (err) {
      console.error("StaticMermaidDiagram:", err);
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
