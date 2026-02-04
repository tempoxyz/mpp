"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const ASCII_MPP = `@@@@@@@@%                                $@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%%$$$=       
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

const ASCII_402 = `                        .+&&&&&&&&&&&*             :=*$&%8#@@@@@@@##8%&*+-.         .:=+*$&%%8###@@@@@@@@##88%&*+-.     
                      :$@@@@@@@@@@@@@8         :*%#@@@@@@@@@@@@@@@@@@@@@@@@8&=.   +#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@8*:  
                      :$@@@@@@@@@@@@@8         :*%#@@@@@@@@@@@@@@@@@@@@@@@@8&=.   +#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@8*:  
                    -&@@@@@@@&%@@@@@@8      .*8@@@@@@@@@@@@#888888#@@@@@@@@@@@@%- $@@@@@@@@@@@@###8888###@@@@@@@@@@@@@$.
                 .+8@@@@@@#*: $@@@@@@8    .*@@@@@@@@@%*=:.          .-+$8@@@@@@@@8&@#%&*+=-:..            .:=*8@@@@@@@@&
               :*#@@@@@@8+.   $@@@@@@8   :8@@@@@@@%=.                    :*#@@@@@@@$.                          -@@@@@@@@
             -&@@@@@@@&-      $@@@@@@8  .#@@@@@@#-                         .$@@@@@@@*                          :#@@@@@@8
          .=%@@@@@@@$:        $@@@@@@8  $@@@@@@@:                            *@@@@@@@-                      .-*#@@@@@@@:
          .=%@@@@@@@$:        $@@@@@@8  $@@@@@@@:                            *@@@@@@@-                      .-*#@@@@@@@:
        .*#@@@@@@8+.          $@@@@@@8  #@@@@@@*                             .#@@@@@@$                 .-+$%@@@@@@@@@&: 
      :$@@@@@@@%=.            $@@@@@@8 .@@@@@@@=                              %@@@@@@%          .:=*&%#@@@@@@@@@@@%*:   
   .=%@@@@@@@$:               $@@@@@@8  #@@@@@@*                             .#@@@@@@$    .:+$%#@@@@@@@@@@@@@#%*=.      
	.+#@@@@@@#*:.................&@@@@@@8..&@@@@@@@:                            *@@@@@@@-.-*%@@@@@@@@@@@@@8&$+-.           
$@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#-                         .$@@@@@@@&&@@@@@@@@@#%&*=-.                  
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%=.                    :*#@@@@@@@#@@@@@@@%*=.                         
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%#@@@@@@@%%%%8$@@@@@@@@@%$=:.         .:-+$8@@@@@@@@8@@@@@@@%-::::::::::::::::::::::::::::.
                              $@@@@@@8      .*8@@@@@@@@@@@@##8888##@@@@@@@@@@@@%-$@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
                              $@@@@@@8      .*8@@@@@@@@@@@@##8888##@@@@@@@@@@@@%-$@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
                              $@@@@@@8         :*%#@@@@@@@@@@@@@@@@@@@@@@@@8&=.  &@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
                              +&&&&&&*             :=*$&%8#@@@@@@@##8%&*+-.      +&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&:`;

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
	const lines402 = useMemo(() => ASCII_402.split("\n"), []);

	// Initialize each character with its own state - use max dimensions
	const maxLines = Math.max(mppLines.length, lines402.length);
	const maxWidth = Math.max(
		...mppLines.map((l) => l.length),
		...lines402.map((l) => l.length),
	);

	// Pre-compute random transition order for each character (stable across renders)
	// Each value is 0-1, determining when that character transitions during the morph
	const charTransitionOrder = useMemo(() => {
		return Array.from({ length: maxLines }, () =>
			Array.from({ length: maxWidth }, () => Math.random()),
		);
	}, [maxLines, maxWidth]);

	// Compute which character to show at a given position
	const getCharAt = (lineIdx: number, charIdx: number): string => {
		const mppChar = mppLines[lineIdx]?.[charIdx] || " ";
		const char402 = lines402[lineIdx]?.[charIdx] || " ";

		if (morphProgress === 0) return mppChar;
		if (morphProgress === 1) return char402;

		// Each character has a random threshold determining when it flips
		const threshold = charTransitionOrder[lineIdx]?.[charIdx] ?? 0.5;
		return morphProgress > threshold ? char402 : mppChar;
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

	// Auto-oscillate on mobile (no hover available)
	useEffect(() => {
		const isMobile = window.matchMedia("(max-width: 1023px)").matches;
		if (!isMobile) return;

		let isShowingAlt = false;
		const interval = setInterval(() => {
			isShowingAlt = !isShowingAlt;
			// Directly manipulate refs to avoid stale closure
			const target = isShowingAlt ? 1 : 0;
			if (morphTarget.current !== target) {
				morphTarget.current = target;
				morphStartProgress.current = morphProgress;
				morphStartTime.current = Date.now();
			}
		}, 3500);

		return () => clearInterval(interval);
	}, [morphProgress]);

	useEffect(() => {
		let animationId: number;
		const MORPH_DURATION = 600; // ms

		const animate = () => {
			const now = Date.now();

			// Handle morph animation
			if (morphStartTime.current !== null) {
				const elapsed = now - morphStartTime.current;
				const t = Math.min(elapsed / MORPH_DURATION, 1);

				// Interpolate from start progress to target
				const start = morphStartProgress.current;
				const target = morphTarget.current;
				const newProgress = start + (target - start) * t;

				setMorphProgress(newProgress);

				if (t >= 1) {
					morphStartTime.current = null;
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
	}, []);

	return (
		<>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: decorative animation, no keyboard interaction needed */}
			<div
				onMouseEnter={() => startMorph(1)}
				onMouseLeave={() => startMorph(0)}
				onContextMenu={handleContextMenu}
				className="ascii-logo-wrapper"
				style={{
					fontFamily: "monospace",
					lineHeight: 1.15,
					whiteSpace: "pre",
					letterSpacing: "1px",
					color: "#0166FF",
					opacity: 0.85,
					textShadow: "0 0 20px rgba(1, 102, 255, 0.3)",
					cursor: "pointer",
					overflow: "hidden",
					width: "100%",
				}}
			>
				<style>{`
					.ascii-logo-inner { font-size: 2.8px; transform-origin: left top; }
					@media (min-width: 360px) { .ascii-logo-inner { font-size: 3.2px; } }
					@media (min-width: 400px) { .ascii-logo-inner { font-size: 3.6px; } }
					@media (min-width: 500px) { .ascii-logo-inner { font-size: 4.2px; } }
					@media (min-width: 640px) { .ascii-logo-inner { font-size: 5px; } }
					@media (min-width: 768px) { .ascii-logo-inner { font-size: 6px; } }
				`}</style>
				<div className="ascii-logo-inner" style={{ minWidth: "fit-content" }}>
					{mppLines.map((mppLine, lineIdx) => {
						const line402 = lines402[lineIdx] || "";
						const lineLen = Math.max(mppLine.length, line402.length);
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
						backgroundColor: "var(--vocs-color-background, #1a1a1a)",
						border: "1px solid var(--vocs-color-border, #333)",
					}}
				>
					<a
						href="/mpp-brand-assets.zip"
						download
						onClick={closeMenu}
						className="block px-3 py-2 no-underline text-[13px] rounded hover:bg-[var(--vocs-color-background-2)] cursor-pointer"
						style={{ color: "var(--vocs-color-text, #fff)" }}
					>
						Download assets (.zip)
					</a>
					<a
						href="/brand"
						onClick={closeMenu}
						className="block px-3 py-2 no-underline text-[13px] rounded hover:bg-[var(--vocs-color-background-2)] cursor-pointer"
						style={{ color: "var(--vocs-color-text, #fff)" }}
					>
						Go to brand page
					</a>
				</div>
			)}
		</>
	);
}
