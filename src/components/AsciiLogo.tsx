"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

  const mppLines = useMemo(() => ASCII_MPP.split("\n"), []);
  const lines402 = useMemo(() => ASCII_402.split("\n"), []);

  // Get the current art based on morph progress
  const currentLines = useMemo(() => {
    if (morphProgress === 0) return mppLines;
    if (morphProgress === 1) return lines402;

    // During morph, blend the two
    return mppLines.map((mppLine, lineIdx) => {
      const line402 = lines402[lineIdx] || "";
      const maxLen = Math.max(mppLine.length, line402.length);
      let result = "";
      for (let i = 0; i < maxLen; i++) {
        const mppChar = mppLine[i] || " ";
        const char402 = line402[i] || " ";
        // Use morph progress to determine which char to show
        // Add some randomness for a scramble effect
        const threshold = morphProgress + (Math.random() - 0.5) * 0.3;
        result += threshold > 0.5 ? char402 : mppChar;
      }
      return result;
    });
  }, [morphProgress, mppLines, lines402]);

  // Initialize each character with its own state - use max dimensions
  const maxLines = Math.max(mppLines.length, lines402.length);
  const maxWidth = Math.max(
    ...mppLines.map((l) => l.length),
    ...lines402.map((l) => l.length),
  );

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

  useEffect(() => {
    let animationId: number;
    const MORPH_DURATION = 400; // ms

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
    // biome-ignore lint/a11y/noStaticElementInteractions: decorative animation, no keyboard interaction needed
    <div
      onMouseEnter={() => startMorph(1)}
      onMouseLeave={() => startMorph(0)}
      style={{
        fontFamily: "monospace",
        fontSize: "6px",
        lineHeight: 1.15,
        whiteSpace: "pre",
        letterSpacing: "1px",
        color: "#0166FF",
        opacity: 0.85,
        overflow: "hidden",
        textShadow: "0 0 20px rgba(1, 102, 255, 0.3)",
        cursor: "pointer",
      }}
    >
      {currentLines.map((line, lineIdx) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static ASCII art lines don't reorder
        <div key={lineIdx}>
          {line.split("").map((char, charIdx) => {
            // Keep spaces as spaces
            if (char === " " || char === ";") {
              // biome-ignore lint/suspicious/noArrayIndexKey: static chars don't reorder
              return <span key={charIdx}>{char}</span>;
            }
            const state = charStates[lineIdx]?.[charIdx];
            const displayChar = state ? FILL_CHARS[state.charIndex] : char;
            // biome-ignore lint/suspicious/noArrayIndexKey: static chars don't reorder
            return <span key={charIdx}>{displayChar}</span>;
          })}
        </div>
      ))}
    </div>
  );
}
