"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const ASCII_MPP = `
@@@@@@@@%                                $@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%%$$$=       
@@@@@@@@@@$                             $@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@$=    
@@@@@@@@@@@$                           %@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@$   
@@@@@@@@@@@@$                        =%@@@@@@@@@@@%===================$$$%@@@@@@@@@@@$===================$$$%@@@@@@@@@= 
@@@@@@@@@@@@@%                      =@@@@@@@@@@@@@%                        $@@@@@@@@@=                        $@@@@@@@% 
@@@@@@@@@@@@@@@=                   $@@@@@@@@@@@@@@%                         @@@@@@@@@=                         @@@@@@@@=
@@@@@@@@%@@@@@@@$                 $@@@@@@@@@@@@@@@%                         @@@@@@@@@=                         @@@@@@@@=
@@@@@@@@=$@@@@@@@$               %@@@@@@@=%@@@@@@@%                        $@@@@@@@@@=                        $@@@@@@@@ 
@@@@@@@@= $@@@@@@@$            =%@@@@@@%  %@@@@@@@%======================%%@@@@@@@@@@$======================%%@@@@@@@@$ 
@@@@@@@@=  =@@@@@@@@=         =@@@@@@@$   %@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@$  
@@@@@@@@=    $@@@@@@@$       $@@@@@@@$    %@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%=   
@@@@@@@@=     $@@@@@@@$     $@@@@@@@=     %@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%%$=      
@@@@@@@@=      $@@@@@@@$   %@@@@@@%=      %@@@@@@@%                          %@@@@@@@$                                  
@@@@@@@@=       =@@@@@@@%$@@@@@@@%        %@@@@@@@%                          %@@@@@@@$                                  
@@@@@@@@=         $@@@@@@@@@@@@@$         %@@@@@@@%                          %@@@@@@@$                                  
@@@@@@@@=          $@@@@@@@@@@@$          %@@@@@@@%                          %@@@@@@@$                                  
@@@@@@@@=           $@@@@@@@@@=           %@@@@@@@%                          %@@@@@@@$                                  
@@@@@@@@=            =@@@@@@%             %@@@@@@@%                          %@@@@@@@$                                  
@@@@@@@@=              %@@@$              %@@@@@@@%                          %@@@@@@@$                                  
%%%%%%%%=               $%$               $%%%%%%%$                          $%%%%%%%$`;

// Characters to cycle through for "filled" positions
const FILL_CHARS = [
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
}

interface Packet {
	x: number;
	y: number;
	targetIdx: number;
	trail: { x: number; y: number }[];
}

const PACKET_SPEED = 0.8;
const TRAIL_LENGTH = 15;
const NUM_PACKETS = 8;

// Node characters (rendered as small 3×3 clusters)
const NODE_CHAR = "█";
// Trail characters by recency: head → tail
const TRAIL_CHARS = [
	"●",
	"●",
	"•",
	"•",
	"·",
	"·",
	"·",
	"·",
	":",
	":",
	".",
	".",
	".",
	" ",
	" ",
];

interface CharState {
	charIndex: number;
	nextChangeTime: number;
	cycleDuration: number;
}

export function AsciiLogo() {
	const [morphProgress, setMorphProgress] = useState(0);
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

	const mppLines = useMemo(() => ASCII_MPP.split("\n"), []);

	const maxLines = mppLines.length;
	const maxWidth = useMemo(
		() => Math.max(...mppLines.map((l) => l.length)),
		[mppLines],
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

	// Node positions at the vertices/endpoints of the M, P, P letterforms
	const nodesRef = useRef<NetNode[]>([
		// M — outer strokes and diagonals
		{ x: 0, y: 0 },
		{ x: 0, y: 20 },
		{ x: 8, y: 10 },
		{ x: 16, y: 20 },
		{ x: 24, y: 0 },
		{ x: 24, y: 9 },
		// First P — stem + bowl outline
		{ x: 41, y: 0 },
		{ x: 41, y: 9 },
		{ x: 41, y: 20 },
		{ x: 55, y: 0 },
		{ x: 55, y: 5 },
		{ x: 55, y: 9 },
		{ x: 48, y: 9 },
		// Second P — stem + bowl outline
		{ x: 77, y: 0 },
		{ x: 77, y: 9 },
		{ x: 77, y: 20 },
		{ x: 112, y: 0 },
		{ x: 112, y: 5 },
		{ x: 112, y: 9 },
		{ x: 95, y: 9 },
	]);

	// Dynamic network grid — updated each frame
	const networkGridRef = useRef<string[][]>(
		Array.from({ length: maxLines }, () =>
			Array.from({ length: maxWidth }, () => " "),
		),
	);

	// Active packets
	const nodeCount = nodesRef.current.length;
	const packetsRef = useRef<Packet[]>(
		Array.from({ length: NUM_PACKETS }, () => {
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
				charIndex: Math.floor(Math.random() * FILL_CHARS.length),
				nextChangeTime: Date.now() + Math.random() * 1000,
				cycleDuration: 300 + Math.random() * 700,
			})),
		);
	});

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

			// Stamp node clusters (3×3 blocks)
			for (const node of nodes) {
				for (let dy = -1; dy <= 1; dy++) {
					for (let dx = -1; dx <= 1; dx++) {
						const ny = node.y + dy;
						const nx = node.x + dx;
						if (ny >= 0 && ny < maxLines && nx >= 0 && nx < maxWidth) {
							grid[ny][nx] = NODE_CHAR;
						}
					}
				}
			}

			// Move packets and stamp trails (Manhattan movement: horizontal then vertical)
			for (const pkt of packets) {
				const target = nodes[pkt.targetIdx];
				const dx = target.x - pkt.x;
				const dy = target.y - pkt.y;
				const adx = Math.abs(dx);
				const ady = Math.abs(dy);

				if (adx < 1 && ady < 1) {
					// Arrived — pick a new random target
					let newTarget = Math.floor(Math.random() * nodes.length);
					while (newTarget === pkt.targetIdx)
						newTarget = Math.floor(Math.random() * nodes.length);
					pkt.targetIdx = newTarget;
				} else {
					// Record trail
					pkt.trail.unshift({ x: Math.round(pkt.x), y: Math.round(pkt.y) });
					if (pkt.trail.length > TRAIL_LENGTH) pkt.trail.length = TRAIL_LENGTH;
					// Move horizontally first, then vertically
					if (adx > 0.5) {
						pkt.x += Math.sign(dx) * Math.min(PACKET_SPEED, adx);
					} else {
						pkt.y += Math.sign(dy) * Math.min(PACKET_SPEED, ady);
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
	}, [maxLines, maxWidth]);

	return (
		<>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: decorative animation, no keyboard interaction needed */}
			<div
				onMouseEnter={() => startMorph(1)}
				onMouseLeave={() => startMorph(0)}
				onContextMenu={handleContextMenu}
				className="max-w-full"
				style={{
					fontFamily: "monospace",
					lineHeight: 1,
					whiteSpace: "pre",
					letterSpacing: "1px",
					color: "var(--vocs-color-accent)",
					opacity: 0.85,
					textShadow: "0 0 20px rgba(249, 115, 22, 0.3)",
					cursor: "pointer",
					margin: "0 auto",
					overflow: "visible",
				}}
			>
				<div className="text-[3.5px] sm:text-[4px] md:text-[5px]">
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
			{contextMenu && (
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
