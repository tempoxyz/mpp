"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

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

const ASCII_404 = `                        .+&&&&&&&&&&&*             :=*$&%8#@@@@@@@##8%&*+-.                        .+&&&&&&&&&&&*        
                      :$@@@@@@@@@@@@@8         :*%#@@@@@@@@@@@@@@@@@@@@@@@@8&=.                   :$@@@@@@@@@@@@@8       
                      :$@@@@@@@@@@@@@8         :*%#@@@@@@@@@@@@@@@@@@@@@@@@8&=.                   :$@@@@@@@@@@@@@8       
                    -&@@@@@@@&%@@@@@@8      .*8@@@@@@@@@@@@#888888#@@@@@@@@@@@@%-               -&@@@@@@@&%@@@@@@8       
                 .+8@@@@@@#*: $@@@@@@8    .*@@@@@@@@@%*=:.          .-+$8@@@@@@@@8           .+8@@@@@@#*: $@@@@@@8       
               :*#@@@@@@8+.   $@@@@@@8   :8@@@@@@@%=.                    :*#@@@@@@@$.      :*#@@@@@@8+.   $@@@@@@8       
             -&@@@@@@@&-      $@@@@@@8  .#@@@@@@#-                         .$@@@@@@@*    -&@@@@@@@&-      $@@@@@@8       
          .=%@@@@@@@$:        $@@@@@@8  $@@@@@@@:                            *@@@@@@@-.=%@@@@@@@$:        $@@@@@@8       
          .=%@@@@@@@$:        $@@@@@@8  $@@@@@@@:                            *@@@@@@@-.=%@@@@@@@$:        $@@@@@@8       
        .*#@@@@@@8+.          $@@@@@@8  #@@@@@@*                             .#@@@@@@$*#@@@@@@8+.         $@@@@@@8       
      :$@@@@@@@%=.            $@@@@@@8 .@@@@@@@=                              %@@@@@@@@@@@@%=.            $@@@@@@8       
   .=%@@@@@@@$:               $@@@@@@8  #@@@@@@*                             .#@@@@@@@@@$:                $@@@@@@8       
   .+#@@@@@@#*:.................&@@@@@@8..&@@@@@@@:                            *@@@@@@@@#*:................&@@@@@@8       
$@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#-                         .$@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@     
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%=.                    :*#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@    
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%#@@@@@@@%%%%8$@@@@@@@@@%$=:.         .:-+$8@@@@@@@@@%%%%%%%%%%%%%%%%%%%%%%#@@@@@@@%%%%8   
                              $@@@@@@8      .*8@@@@@@@@@@@@##8888##@@@@@@@@@@@@%-                       $@@@@@@8        
                              $@@@@@@8      .*8@@@@@@@@@@@@##8888##@@@@@@@@@@@@%-                       $@@@@@@8        
                              $@@@@@@8         :*%#@@@@@@@@@@@@@@@@@@@@@@@@8&=.                         $@@@@@@8        
                              +&&&&&&*             :=*$&%8#@@@@@@@##8%&*+-.                             +&&&&&&*        `;

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

export function NotFoundPage() {
  const [morphProgress, setMorphProgress] = useState(0);
  const morphStartTime = useRef<number | null>(null);
  const morphStartProgress = useRef(0);
  const morphTarget = useRef<0 | 1>(0);

  const mppLines = useMemo(() => ASCII_MPP.split("\n"), []);
  const lines404 = useMemo(() => ASCII_404.split("\n"), []);

  const maxLines = Math.max(mppLines.length, lines404.length);
  const maxWidth = Math.max(
    ...mppLines.map((l) => l.length),
    ...lines404.map((l) => l.length),
  );

  const charTransitionOrder = useMemo(
    () =>
      Array.from({ length: maxLines }, () =>
        Array.from({ length: maxWidth }, () => Math.random()),
      ),
    [maxLines, maxWidth],
  );

  const getCharAt = (lineIdx: number, charIdx: number): string => {
    const mppChar = mppLines[lineIdx]?.[charIdx] || " ";
    const char404 = lines404[lineIdx]?.[charIdx] || " ";
    if (morphProgress === 0) return mppChar;
    if (morphProgress === 1) return char404;
    const threshold = charTransitionOrder[lineIdx]?.[charIdx] ?? 0.5;
    return morphProgress > threshold ? char404 : mppChar;
  };

  const [charStates, setCharStates] = useState<CharState[][]>(() =>
    Array.from({ length: maxLines }, () =>
      Array.from({ length: maxWidth }, () => ({
        charIndex: Math.floor(Math.random() * FILL_CHARS.length),
        nextChangeTime: Date.now() + Math.random() * 1000,
        cycleDuration: 300 + Math.random() * 700,
      })),
    ),
  );

  const startMorph = useCallback(
    (target: 0 | 1) => {
      if (morphTarget.current === target) return;
      morphTarget.current = target;
      morphStartProgress.current = morphProgress;
      morphStartTime.current = Date.now();
    },
    [morphProgress],
  );

  useEffect(() => {
    startMorph(1);
  }, [startMorph]);

  useEffect(() => {
    let animationId: number;
    const MORPH_DURATION = 3000;
    const animate = () => {
      const now = Date.now();
      if (morphStartTime.current !== null) {
        const elapsed = now - morphStartTime.current;
        const t = Math.min(elapsed / MORPH_DURATION, 1);
        const start = morphStartProgress.current;
        const target = morphTarget.current;
        setMorphProgress(start + (target - start) * t);
        if (t >= 1) morphStartTime.current = null;
      }
      setCharStates((prev) => {
        let changed = false;
        const next = prev.map((line) =>
          line.map((s) => {
            if (now >= s.nextChangeTime) {
              changed = true;
              return {
                charIndex: (s.charIndex + 1) % FILL_CHARS.length,
                nextChangeTime:
                  now + s.cycleDuration + (Math.random() - 0.5) * 200,
                cycleDuration: s.cycleDuration,
              };
            }
            return s;
          }),
        );
        return changed ? next : prev;
      });
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div
      className="not-prose"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "calc(100dvh - var(--vocs-spacing-topNav, 64px))",
        overflow: "hidden",
        fontFamily: "var(--font-sans)",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      <style>{`
				[data-v-logo] { visibility: hidden !important; width: 0 !important; overflow: hidden !important; }
				[data-v-main] article[data-v-content] { padding-top: 0 !important; padding-bottom: 0 !important; }
				[data-v-main] article[data-v-content] > * { margin-top: 0 !important; }
			`}</style>
      <NotFoundHeaderLogo />

      {/* biome-ignore lint/a11y/noStaticElementInteractions: decorative animation */}
      <div
        onMouseEnter={() => startMorph(1)}
        onMouseLeave={() => startMorph(0)}
        className="overflow-x-auto max-w-full mb-8"
        style={{
          fontFamily: "monospace",
          lineHeight: 1.15,
          whiteSpace: "pre",
          letterSpacing: "1px",
          color: "var(--vocs-text-color-heading)",
          opacity: 0.85,
          cursor: "pointer",
        }}
      >
        <div
          className="text-[4px] sm:text-[5px] md:text-[6px]"
          style={{ minWidth: "fit-content" }}
        >
          {mppLines.map((mppLine, lineIdx) => {
            const line404 = lines404[lineIdx] || "";
            const lineLen = Math.max(mppLine.length, line404.length);
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: static ASCII art
              <div key={lineIdx}>
                {Array.from({ length: lineLen }, (_, charIdx) => {
                  const baseChar = getCharAt(lineIdx, charIdx);
                  if (baseChar === " ")
                    // biome-ignore lint/suspicious/noArrayIndexKey: static chars
                    return <span key={charIdx}>{baseChar}</span>;
                  const state = charStates[lineIdx]?.[charIdx];
                  const displayChar = state
                    ? FILL_CHARS[state.charIndex]
                    : baseChar;
                  // biome-ignore lint/suspicious/noArrayIndexKey: static chars
                  return <span key={charIdx}>{displayChar}</span>;
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center">
        <h1
          className="text-2xl font-medium mb-4"
          style={{ color: "var(--vocs-text-color-heading)" }}
        >
          Page not found
        </h1>
        <p
          className="text-base mb-6"
          style={{ color: "var(--vocs-text-color-secondary)" }}
        >
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button
          type="button"
          onClick={handleGoBack}
          className="inline-flex items-center gap-2 px-6 py-3 font-medium rounded-lg transition-all no-underline cursor-pointer"
          style={{
            backgroundColor: "var(--vocs-text-color-heading)",
            color: "var(--vocs-background-color-primary)",
            border: "none",
          }}
        >
          ← Go back
        </button>
      </div>
    </div>
  );
}

function NotFoundHeaderLogo() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const el = document.querySelector<HTMLElement>("[data-v-gutter-top]");
    if (el) setTarget(el);
  }, []);
  if (!target) return null;

  return createPortal(
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 16,
        height: "100%",
        display: "flex",
        alignItems: "center",
        pointerEvents: "none",
        zIndex: 1,
      }}
    >
      <picture>
        <source srcSet="/logo-dark.svg" media="(prefers-color-scheme: dark)" />
        <img
          src="/logo-light.svg"
          alt="MPP"
          style={{ height: 20, width: "auto" }}
        />
      </picture>
    </div>,
    target,
  );
}
