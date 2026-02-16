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

  const charTransitionOrder = useMemo(() => {
    return Array.from({ length: maxLines }, () =>
      Array.from({ length: maxWidth }, () => Math.random()),
    );
  }, [maxLines, maxWidth]);

  const getCharAt = (lineIdx: number, charIdx: number): string => {
    const mppChar = mppLines[lineIdx]?.[charIdx] || " ";
    const char404 = lines404[lineIdx]?.[charIdx] || " ";

    if (morphProgress === 0) return mppChar;
    if (morphProgress === 1) return char404;

    const threshold = charTransitionOrder[lineIdx]?.[charIdx] ?? 0.5;
    return morphProgress > threshold ? char404 : mppChar;
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
        const newProgress = start + (target - start) * t;

        setMorphProgress(newProgress);

        if (t >= 1) {
          morphStartTime.current = null;
        }
      }

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
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[var(--vocs-color-background)]">
      {/* biome-ignore lint/a11y/noStaticElementInteractions: decorative animation, no keyboard interaction needed */}
      <div
        onMouseEnter={() => startMorph(1)}
        onMouseLeave={() => startMorph(0)}
        className="overflow-x-auto max-w-full mb-8"
        style={{
          fontFamily: "monospace",
          lineHeight: 1.15,
          whiteSpace: "pre",
          letterSpacing: "1px",
          color:
            "light-dark(var(--vocs-color-accent), var(--vocs-color-accent8))",
          opacity: 0.85,
          textShadow: "0 0 20px rgba(1, 102, 255, 0.3)",
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
              // biome-ignore lint/suspicious/noArrayIndexKey: static ASCII art lines don't reorder
              <div key={lineIdx}>
                {Array.from({ length: lineLen }, (_, charIdx) => {
                  const baseChar = getCharAt(lineIdx, charIdx);
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

      <div className="text-center">
        <h1
          className="text-2xl font-medium mb-4"
          style={{ color: "var(--vocs-color-text)" }}
        >
          Page not found
        </h1>
        <p
          className="text-base mb-6"
          style={{ color: "var(--vocs-color-text-2)" }}
        >
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 text-white font-medium rounded-lg transition-all no-underline"
          style={{
            backgroundColor:
              "light-dark(var(--vocs-color-accent), var(--vocs-color-accent8))",
          }}
        >
          ← Back to Home
        </a>
      </div>
    </div>
  );
}
