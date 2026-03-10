"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const ASCII_MPP = `
@@##@+                          :#@#@@+     :@@#####################@@@@@@@#########@@@@@@@@@@@@@@@@@@@@@@@@@##@%-      
@@@@@@&.                       =@@@@@@+     :@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%-    
@@@@@@@@@-                  .&@@@@@@@@+     :@@@@@@@$$$$$$$$$$$$$$$$$8@@@@@@@@@#****8@@@@@@8$$$$$$$$$$$$$$$$&@@@@@@@@@8-
@@@@@@@@@@+                .8@@@@@@@@@+     :@@@@@@@                  -%@@@@@@@@*   $@@@@@@$                 .*@@@@@@@@@
@@@@@@@@@@@&.             -#@@@@@@@@@@+     :@@@@@@@                    -#@@@@@@*   $@@@@@@$                   .*@@@@@@@
@@@@@@@@@@@@8:           =@@@@@@@@@@@@+     :@@@@@@@                     %@@@@@@*   $@@@@@@$                    :@@@@@@@
@@@@@@@@@@@@@@-        .*@@@@@@@@@@@@@+     :@@@@@@@                     %@@@@@@*   $@@@@@@$                    :@@@@@@@
@@@@@@@@@@@@@@@+      .%@@@@@@@@@@@@@@+     :@@@@@@@                     %@@@@@@*   $@@@@@@$                    :@@@@@@@
@@@@@@@:.&@@@@@@@8: -@@@@@@@#: 8@@@@@@+     :@@@@@@@                   -8@@@@@@@*   $@@@@@@$                  .*@@@@@@@@
@@@@@@@:  *@@@@@@@@*@@@@@@@%.  8@@@@@@+     :@@@@@@@.................-8@@@@@@@@@-   $@@@@@@$.................*@@@@@@@@@%
@@@@@@@:   =@@@@@@@@@@@@@@$.   8@@@@@@+     :@@@@@@@#################@@@@@@@@@*.    $@@@@@@##################@@@@@@@@%- 
@@@@@@@:    :#@@@@@@@@@@@+     8@@@@@@+     :@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#+.      $@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%-   
@@@@@@@:      .*@@@@@@8.       8@@@@@@+     :@@@@@@@$$$$$$$$$$$$$$$$$$$$+.          $@@@@@@8$$$$$$$$$$$$$$$$$$$*:       
@@@@@@@:        =@@@@&.        8@@@@@@+     :@@@@@@@                                $@@@@@@$                            
@@@@@@@:                       8@@@@@@+     :@@@@@@@                                $@@@@@@$                            
@@@@@@@:                       8@@@@@@+     :@@@@@@@                                $@@@@@@$                            
@@@@@@@:                       8@@@@@@+     :@@@@@@@                                $@@@@@@$                            
@@@@@@@:                       8@@@@@@#888888@@@@@@@                                $@@@@@@$                            
@@@@@@@:                       8@@@@@@@@@@@@@@@@@@@@                                $@@@@@@$                            
@@###@@:                       8@@@@@@@#####@@@@@#@@                                $@####@$                            
`;

// Characters to cycle through for "filled" positions
export const FILL_CHARS = [
  "@",
  "#",
  "%",
  "&",
  "£",
  "$",
  "█",
  "▓",
  "▒",
  "░",
  "■",
  "●",
  "◆",
  "★",
];

// ---------------------------------------------------------------------------
// Network simulation types & constants
// ---------------------------------------------------------------------------

interface NetNode {
  x: number;
  y: number;
  radius: number;
}

interface Packet {
  x: number;
  y: number;
  targetIdx: number;
  trail: { x: number; y: number }[];
}

export const PACKET_SPEED = 0.55;
export const TRAIL_LENGTH = 15;
export const NUM_PACKETS = 8;

// Node characters (rendered as small 3×3 clusters)
const NODE_CHAR = "█";
// Trail characters by recency: head → tail
export const TRAIL_CHARS = [
  "●",
  "●",
  "●",
  "•",
  "•",
  "•",
  "·",
  "·",
  "·",
  ":",
  ":",
  ":",
  ".",
  ".",
  ".",
];

interface CharState {
  charIndex: number;
  nextChangeTime: number;
  cycleDuration: number;
}

export function AsciiLogo({
  forceNetwork = false,
  fillHeight = false,
  fullscreen = false,
}: {
  forceNetwork?: boolean;
  fillHeight?: boolean;
  fullscreen?: boolean;
} = {}) {
  const [morphProgress, setMorphProgress] = useState(forceNetwork ? 1 : 0);
  const morphStartTime = useRef<number | null>(null);
  const morphStartProgress = useRef(0);
  const morphTarget = useRef<0 | 1>(0);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const closeMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Close menu on click outside
  useEffect(() => {
    if (!contextMenu) return;

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [contextMenu, closeMenu]);

  const baseMppLines = useMemo(() => ASCII_MPP.split("\n"), []);

  // When fillHeight, repeat the pattern ~30 times vertically with blank line gaps
  const mppLines = useMemo(() => {
    if (!fillHeight) return baseMppLines;
    const repeats = 8;
    const gap = Array.from({ length: 3 }, () =>
      " ".repeat(baseMppLines[0]?.length || 1),
    );
    const result: string[] = [];
    for (let i = 0; i < repeats; i++) {
      if (i > 0) result.push(...gap);
      result.push(...baseMppLines);
    }
    return result;
  }, [baseMppLines, fillHeight]);

  // Fullscreen: dynamically compute rows/cols from viewport, re-measure on resize

  const [fsDims, setFsDims] = useState({ rows: 200, cols: 300 }); // generous default
  useEffect(() => {
    if (!fullscreen) return;
    const measure = () => {
      const probe = document.createElement("div");
      probe.style.cssText =
        "position:absolute;top:-9999px;left:-9999px;font-family:monospace;font-size:10px;line-height:1;white-space:pre;letter-spacing:0";
      probe.textContent = "X\nX";
      document.body.appendChild(probe);
      const lh = probe.offsetHeight / 2 || 10;
      probe.textContent = "X";
      const cw = probe.offsetWidth || 6;
      document.body.removeChild(probe);
      setFsDims({
        rows: Math.ceil(window.innerHeight / lh) + 5,
        cols: Math.ceil(window.innerWidth / cw) + 5,
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [fullscreen]);
  const fsRows = fullscreen ? fsDims.rows : 0;
  const fsCols = fullscreen ? fsDims.cols : 0;
  const maxLines = fullscreen ? fsRows : mppLines.length;
  const maxWidth = useMemo(
    () => (fullscreen ? fsCols : Math.max(...mppLines.map((l) => l.length))),
    [mppLines, fullscreen, fsCols],
  );

  // Pre-compute random transition order for each character (stable across renders)
  const charTransitionOrder = useMemo(() => {
    return Array.from({ length: maxLines }, () =>
      Array.from({ length: maxWidth }, () => Math.random()),
    );
  }, [maxLines, maxWidth]);

  // ---------------------------------------------------------------------------
  // Network simulation refs (no React state — updated in rAF, read during render)
  // ---------------------------------------------------------------------------

  // Node positions — letter vertices in normal mode, random in fullscreen
  const nodesRef = useRef<NetNode[]>(
    fullscreen
      ? Array.from({ length: 20 }, (_, i) => ({
          x: Math.floor(Math.random() * fsCols),
          y: Math.floor(Math.random() * fsRows),
          radius: (i % 2) + 1,
        }))
      : [
          // M — outer strokes and diagonals
          { x: 0, y: 0, radius: 1 },
          { x: 0, y: 20, radius: 1 },
          { x: 8, y: 10, radius: 1 },
          { x: 16, y: 20, radius: 1 },
          { x: 24, y: 0, radius: 1 },
          { x: 24, y: 9, radius: 1 },
          // First P — stem + bowl outline
          { x: 41, y: 0, radius: 1 },
          { x: 41, y: 9, radius: 1 },
          { x: 41, y: 20, radius: 1 },
          { x: 55, y: 0, radius: 1 },
          { x: 55, y: 5, radius: 1 },
          { x: 55, y: 9, radius: 1 },
          { x: 48, y: 9, radius: 1 },
          // Second P — stem + bowl outline
          { x: 77, y: 0, radius: 1 },
          { x: 77, y: 9, radius: 1 },
          { x: 77, y: 20, radius: 1 },
          { x: 112, y: 0, radius: 1 },
          { x: 112, y: 5, radius: 1 },
          { x: 112, y: 9, radius: 1 },
          { x: 95, y: 9, radius: 1 },
        ],
  );

  // Dynamic network grid — updated each frame
  const networkGridRef = useRef<string[][]>(
    Array.from({ length: maxLines }, () =>
      Array.from({ length: maxWidth }, () => " "),
    ),
  );

  // Active packets
  const nodeCount = nodesRef.current.length;
  const packetCount = fullscreen ? 30 : NUM_PACKETS;
  const packetsRef = useRef<Packet[]>(
    Array.from({ length: packetCount }, () => {
      const startIdx = Math.floor(Math.random() * nodeCount);
      let endIdx = Math.floor(Math.random() * nodeCount);
      while (endIdx === startIdx)
        endIdx = Math.floor(Math.random() * nodeCount);
      const node = nodesRef.current[startIdx];
      return {
        x: node.x,
        y: node.y,
        targetIdx: endIdx,
        trail: [],
      };
    }),
  );

  // Compute which character to show at a given position
  const getCharAt = (lineIdx: number, charIdx: number): string => {
    const mppChar = mppLines[lineIdx]?.[charIdx] || " ";
    const netChar = networkGridRef.current[lineIdx]?.[charIdx] || " ";

    if (morphProgress === 0) return mppChar;
    if (morphProgress === 1) return netChar;

    const threshold = charTransitionOrder[lineIdx]?.[charIdx] ?? 0.5;
    return morphProgress > threshold ? netChar : mppChar;
  };

  const [charStates, setCharStates] = useState<CharState[][]>(() => {
    return Array.from({ length: maxLines }, () =>
      Array.from({ length: maxWidth }, () => ({
        charIndex: 0,
        nextChangeTime: 0,
        cycleDuration: 1000,
      })),
    );
  });

  // Randomize after mount to avoid hydration mismatch
  const hasRandomized = useRef(false);
  useEffect(() => {
    if (hasRandomized.current) return;
    hasRandomized.current = true;
    setCharStates(
      Array.from({ length: maxLines }, () =>
        Array.from({ length: maxWidth }, () => ({
          charIndex: Math.floor(Math.random() * FILL_CHARS.length),
          nextChangeTime: Date.now() + Math.random() * 1000,
          cycleDuration: 600 + Math.random() * 1200,
        })),
      ),
    );
  }, [maxLines, maxWidth]);

  const startMorph = (target: 0 | 1) => {
    if (morphTarget.current === target) return;
    morphTarget.current = target;
    morphStartProgress.current = morphProgress;
    morphStartTime.current = Date.now();
  };

  // Track when tab becomes visible to prevent animation glitches
  const lastVisibleTime = useRef<number>(Date.now());
  const isTransitioning = useRef(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isTransitioning.current = true;
      } else {
        lastVisibleTime.current = Date.now();
        setTimeout(() => {
          isTransitioning.current = false;
        }, 100);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    let animationId: number;
    const MORPH_DURATION = 600;

    const animate = () => {
      if (isTransitioning.current) {
        animationId = requestAnimationFrame(animate);
        return;
      }

      const now = Date.now();

      // Handle morph animation
      if (morphStartTime.current !== null) {
        const elapsed = now - morphStartTime.current;
        const t = Math.min(elapsed / MORPH_DURATION, 1);
        const start = morphStartProgress.current;
        const target = morphTarget.current;
        const newProgress = start + (target - start) * t;
        setMorphProgress(newProgress);
        if (t >= 1) {
          morphStartTime.current = null;
        }
      }

      // --- Network simulation (runs every frame, cheap) ---
      const nodes = nodesRef.current;
      const packets = packetsRef.current;
      const grid = networkGridRef.current;

      // Clear grid
      for (let li = 0; li < maxLines; li++) {
        for (let ci = 0; ci < maxWidth; ci++) {
          grid[li][ci] = " ";
        }
      }

      // Stamp node clusters (variable size, irregular edges)
      for (const node of nodes) {
        const r = node.radius || 1;
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            // Skip some edge cells for irregular shape
            const dist = Math.abs(dy) + Math.abs(dx);
            if (dist >= r * 2 && Math.random() < 0.5) continue;
            if (dist >= r && Math.random() < 0.2) continue;
            const ny = node.y + dy;
            const nx = node.x + dx;
            if (ny >= 0 && ny < maxLines && nx >= 0 && nx < maxWidth) {
              grid[ny][nx] = NODE_CHAR;
            }
          }
        }
      }

      // Move packets and stamp trails (Manhattan movement: horizontal then vertical)
      for (let pi = packets.length - 1; pi >= 0; pi--) {
        const pkt = packets[pi];
        if (pkt.targetIdx >= nodes.length)
          pkt.targetIdx = Math.floor(Math.random() * nodes.length);
        const target = nodes[pkt.targetIdx];
        const dx = target.x - pkt.x;
        const dy = target.y - pkt.y;
        const adx = Math.abs(dx);
        const ady = Math.abs(dy);

        if (adx < 1 && ady < 1) {
          // Arrived at target node — snap to it, clear trail
          pkt.x = target.x;
          pkt.y = target.y;
          pkt.trail = [];
          // 40% chance consumed (removed), 60% redirected to new target
          if (Math.random() < 0.4) {
            packets.splice(pi, 1);
            // Spawn a replacement packet from a random node after a delay
            const srcIdx = Math.floor(Math.random() * nodes.length);
            let destIdx = Math.floor(Math.random() * nodes.length);
            while (destIdx === srcIdx)
              destIdx = Math.floor(Math.random() * nodes.length);
            packets.push({
              x: nodes[srcIdx].x,
              y: nodes[srcIdx].y,
              targetIdx: destIdx,
              trail: [],
            });
            continue;
          }
          let newTarget = Math.floor(Math.random() * nodes.length);
          while (newTarget === pkt.targetIdx)
            newTarget = Math.floor(Math.random() * nodes.length);
          pkt.targetIdx = newTarget;
        } else {
          // Record trail
          pkt.trail.unshift({ x: Math.round(pkt.x), y: Math.round(pkt.y) });
          const maxTrail = fullscreen ? 30 : TRAIL_LENGTH;
          if (pkt.trail.length > maxTrail) pkt.trail.length = maxTrail;
          // Move horizontally first, then vertically
          const speed = fullscreen ? 0.3 : PACKET_SPEED;
          if (adx > 0.5) {
            pkt.x += Math.sign(dx) * Math.min(speed, adx);
          } else {
            pkt.y += Math.sign(dy) * Math.min(speed, ady);
          }
        }

        // Stamp trail (oldest first so newer overwrites)
        for (let i = pkt.trail.length - 1; i >= 0; i--) {
          const ty = Math.round(pkt.trail[i].y);
          const tx = Math.round(pkt.trail[i].x);
          if (ty >= 0 && ty < maxLines && tx >= 0 && tx < maxWidth) {
            const trailChar = TRAIL_CHARS[Math.min(i, TRAIL_CHARS.length - 1)];
            // Don't overwrite nodes
            if (grid[ty][tx] !== NODE_CHAR) {
              grid[ty][tx] = trailChar;
            }
          }
        }

        // Stamp packet head
        const hy = Math.round(pkt.y);
        const hx = Math.round(pkt.x);
        if (hy >= 0 && hy < maxLines && hx >= 0 && hx < maxWidth) {
          if (grid[hy][hx] !== NODE_CHAR) {
            grid[hy][hx] = "█";
          }
        }
      }

      // Handle character cycling
      setCharStates((prevStates) => {
        let hasChanges = false;
        const newStates = prevStates.map((lineStates) =>
          lineStates.map((state) => {
            if (now >= state.nextChangeTime) {
              hasChanges = true;
              return {
                charIndex: (state.charIndex + 1) % FILL_CHARS.length,
                nextChangeTime:
                  now + state.cycleDuration + (Math.random() - 0.5) * 200,
                cycleDuration: state.cycleDuration,
              };
            }
            return state;
          }),
        );
        return hasChanges ? newStates : prevStates;
      });

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [maxLines, maxWidth, fullscreen]);

  // Canvas rendering for fullscreen mode — avoids 60k DOM nodes
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!fullscreen) return;
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const accent =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--vocs-text-color-heading")
        .trim() || "#D66331";
    let rafId: number;

    const w = window.innerWidth;
    const h = window.innerHeight;
    cvs.width = w * dpr;
    cvs.height = h * dpr;
    cvs.style.width = `${w}px`;
    cvs.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Match ASCII logo proportions: each cell = fontSize tall, ~0.6*fontSize wide
    const cellH = h / maxLines;
    const fontSize = cellH;
    const cellW = w / maxWidth;

    const draw = () => {
      const now = Date.now();
      ctx.clearRect(0, 0, w, h);
      ctx.font = `${fontSize}px monospace`;
      ctx.textBaseline = "top";
      const grid = networkGridRef.current;

      for (let row = 0; row < maxLines; row++) {
        const rowData = grid[row];
        if (!rowData) continue;
        for (let col = 0; col < maxWidth; col++) {
          const ch = rowData[col];
          if (!ch || ch === " ") continue;

          const x = col * cellW;
          const y = row * cellH;

          if (ch === NODE_CHAR) {
            // Node cells: cycle through FILL_CHARS slowly (every 2-4s per cell)
            const idx =
              Math.floor(
                now / (2000 + ((row * 7 + col * 13) % 2000)) + row + col,
              ) % FILL_CHARS.length;
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = accent;
            ctx.fillText(FILL_CHARS[idx], x, y);
          } else {
            // Trail cells: map character to opacity (head=bright, tail=faint)
            const trailIdx = TRAIL_CHARS.indexOf(ch);
            const alpha =
              trailIdx >= 0
                ? 0.8 - (trailIdx / TRAIL_CHARS.length) * 0.65
                : 0.4;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = accent;
            ctx.fillText(ch, x, y);
          }
        }
      }
      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [fullscreen, maxLines, maxWidth]);

  // Click to spawn nodes in fullscreen mode
  const handleBgClick = useCallback(
    (e: React.MouseEvent) => {
      if (!fullscreen) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const gridX = Math.round(((e.clientX - rect.left) / rect.width) * fsCols);
      const gridY = Math.round(((e.clientY - rect.top) / rect.height) * fsRows);
      // Cap at 20 nodes — FIFO remove oldest
      if (nodesRef.current.length >= 20) {
        nodesRef.current.shift();
        // Fix packet targetIdx references after shift
        for (const pkt of packetsRef.current) {
          if (pkt.targetIdx > 0) pkt.targetIdx--;
          else
            pkt.targetIdx = Math.floor(Math.random() * nodesRef.current.length);
        }
      }
      nodesRef.current.push({
        x: gridX,
        y: gridY,
        radius: 1 + Math.floor(Math.random() * 2),
      });
      const newIdx = nodesRef.current.length - 1;
      const spawnCount = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < spawnCount; i++) {
        let t = Math.floor(Math.random() * nodesRef.current.length);
        while (t === newIdx)
          t = Math.floor(Math.random() * nodesRef.current.length);
        packetsRef.current.push({
          x: gridX,
          y: gridY,
          targetIdx: t,
          trail: [],
        });
      }
    },
    [fullscreen, fsCols, fsRows],
  );

  // Fullscreen: render canvas instead of DOM spans
  if (fullscreen) {
    return (
      // biome-ignore lint/a11y/useKeyWithClickEvents: decorative background, no keyboard interaction needed
      // biome-ignore lint/a11y/noStaticElementInteractions: decorative background click
      <div
        onClick={handleBgClick}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
          opacity: 0.22,
          cursor: "default",
        }}
      >
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0 }} />
      </div>
    );
  }

  return (
    <>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: decorative animation, no keyboard interaction needed */}
      <div
        onMouseEnter={forceNetwork ? undefined : () => startMorph(1)}
        onMouseLeave={forceNetwork ? undefined : () => startMorph(0)}
        onContextMenu={forceNetwork ? undefined : handleContextMenu}
        className={fullscreen ? undefined : "max-w-full"}
        style={
          fullscreen
            ? {
                fontFamily: "monospace",
                whiteSpace: "pre",
                color: "var(--vocs-text-color-heading)",
                opacity: 0.22,
                position: "fixed" as const,
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                overflow: "hidden",
                zIndex: 0,
                pointerEvents: "none" as const,
              }
            : {
                fontFamily: "monospace",
                lineHeight: 2,
                whiteSpace: "pre",
                letterSpacing: "1px",
                color: "var(--vocs-text-color-heading)",
                opacity: 0.85,
                textShadow: forceNetwork
                  ? "none"
                  : "0 0 20px rgba(0, 0, 0, 0.15)",
                cursor: forceNetwork ? "default" : "pointer",
                margin: "0 auto",
                overflow: "visible",
              }
        }
      >
        <div
          className={
            fullscreen || fillHeight
              ? undefined
              : "text-[3.5px] sm:text-[4px] md:text-[5px]"
          }
          style={
            fullscreen
              ? { fontSize: 10, lineHeight: 1, letterSpacing: 0 }
              : fillHeight
                ? { fontSize: "7px" }
                : undefined
          }
        >
          {mppLines.map((mppLine, lineIdx) => {
            const lineLen = Math.max(mppLine.length, maxWidth);
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: static ASCII art lines don't reorder
              <div key={lineIdx}>
                {Array.from({ length: lineLen }, (_, charIdx) => {
                  const baseChar = getCharAt(lineIdx, charIdx);
                  // Keep spaces as spaces
                  if (baseChar === " ") {
                    // biome-ignore lint/suspicious/noArrayIndexKey: static chars don't reorder
                    return <span key={charIdx}>{baseChar}</span>;
                  }
                  const state = charStates[lineIdx]?.[charIdx];
                  const displayChar = state
                    ? FILL_CHARS[state.charIndex]
                    : baseChar;
                  // biome-ignore lint/suspicious/noArrayIndexKey: static chars don't reorder
                  return <span key={charIdx}>{displayChar}</span>;
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Context Menu */}
      {!forceNetwork && contextMenu && (
        <div
          ref={menuRef}
          className="fixed rounded-lg p-1 shadow-lg z-[9999] min-w-[180px]"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: "var(--vocs-background-color-surface)",
            border: "1px solid var(--vocs-border-color-secondary)",
          }}
        >
          <a
            href="/mpp-brand-assets.zip"
            download
            onClick={closeMenu}
            className="block px-3 py-2 no-underline text-[13px] rounded hover:bg-[var(--vocs-color-background-2)] cursor-pointer"
            style={{ color: "var(--vocs-text-color-primary)" }}
          >
            Download assets (.zip)
          </a>
          <a
            href="/brand"
            onClick={closeMenu}
            className="block px-3 py-2 no-underline text-[13px] rounded hover:bg-[var(--vocs-color-background-2)] cursor-pointer"
            style={{ color: "var(--vocs-text-color-primary)" }}
          >
            Go to brand page
          </a>
        </div>
      )}
    </>
  );
}
