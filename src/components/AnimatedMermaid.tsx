"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface AnimationStep {
  selector?: string;
  index?: Record<string, number[]>;
  description: string;
}

interface AnimatedMermaidProps {
  src: string;
  steps: AnimationStep[];
  autoPlayInterval?: number;
}

export function AnimatedMermaid({
  src,
  steps,
  autoPlayInterval = 0,
}: AnimatedMermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  // Detect dark mode using media query
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const checkDark = () => setIsDark(mediaQuery.matches);
    checkDark();
    mediaQuery.addEventListener("change", checkDark);
    return () => mediaQuery.removeEventListener("change", checkDark);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(src, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch ${src}`);
        return res.text();
      })
      .then((svg) => setSvgContent(svg))
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Failed to load diagram:", err);
        }
      });
    return () => controller.abort();
  }, [src]);

  // Apply custom colors to specific message text elements
  useEffect(() => {
    if (!containerRef.current || !svgContent) return;
    const svg = containerRef.current.querySelector("svg");
    if (!svg) return;

    const messageTexts = svg.querySelectorAll("text.messageText");
    const styles = getComputedStyle(document.documentElement);
    const destructiveColor =
      styles.getPropertyValue("--vocs-color-destructive").trim() ||
      (isDark ? "#e39a9a" : "#b97676");
    const successColor =
      styles.getPropertyValue("--vocs-color-success").trim() ||
      (isDark ? "#7bcf9a" : "#5b9a76");
    messageTexts.forEach((el, i) => {
      if (i === 1 || i === 2) {
        (el as HTMLElement).style.fill = destructiveColor;
      } else if (i === 5 || i === 6) {
        (el as HTMLElement).style.fill = successColor;
      }
    });
  }, [svgContent, isDark]);

  const getStepElements = useCallback(
    (svg: SVGElement, step: AnimationStep): Element[] => {
      const elements: Element[] = [];
      if (step.selector) {
        elements.push(...Array.from(svg.querySelectorAll(step.selector)));
      }
      if (step.index) {
        for (const [className, indices] of Object.entries(step.index)) {
          const allOfClass = Array.from(svg.querySelectorAll(`.${className}`));
          for (const idx of indices) {
            if (allOfClass[idx]) {
              elements.push(allOfClass[idx]);
            }
          }
        }
      }
      return elements;
    },
    [],
  );

  useEffect(() => {
    if (!containerRef.current || !svgContent) return;
    const svg = containerRef.current.querySelector("svg");
    if (!svg) return;

    const animatableElements = svg.querySelectorAll(
      ".messageLine0, .messageLine1, .messageText, .note, .noteText",
    );

    const actorElements = svg.querySelectorAll(
      ".actor, .actor-box, .actor-line, g[id^='root-'] rect, g[id^='root-'] text",
    );

    for (const el of actorElements) {
      (el as HTMLElement).style.opacity = "1";
      (el as HTMLElement).style.transition = "opacity 0.3s ease";
    }

    if (currentStep === -1) {
      for (const el of animatableElements) {
        (el as HTMLElement).style.opacity = "1";
        (el as HTMLElement).style.transition = "opacity 0.3s ease";
      }
      return;
    }

    for (const el of animatableElements) {
      (el as HTMLElement).style.opacity = "0.15";
      (el as HTMLElement).style.transition = "opacity 0.3s ease";
    }

    for (let i = 0; i <= currentStep; i++) {
      const step = steps[i];
      const elements = getStepElements(svg, step);
      const opacity = i === currentStep ? "1" : "0.4";
      for (const el of elements) {
        (el as HTMLElement).style.opacity = opacity;
      }
    }
  }, [currentStep, svgContent, steps, getStepElements]);

  useEffect(() => {
    if (!isPlaying || autoPlayInterval === 0) return;
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, autoPlayInterval);
    return () => clearInterval(interval);
  }, [isPlaying, autoPlayInterval, steps.length]);

  const handlePlay = useCallback(() => {
    if (currentStep >= steps.length - 1 || currentStep === -1) {
      setCurrentStep(0);
    }
    setIsPlaying(true);
  }, [currentStep, steps.length]);

  const handlePrev = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep((prev) => {
      if (prev === -1) return 0;
      return Math.min(steps.length - 1, prev + 1);
    });
  }, [steps.length]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(-1);
  }, []);

  if (!svgContent) {
    return (
      <div
        style={{
          minHeight: "200px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--vocs-text-color-muted)",
        }}
      >
        Loading diagram...
      </div>
    );
  }

  const isAnimating = currentStep >= 0;

  return (
    <div style={{ position: "relative", margin: "1.5rem 0", width: "100%" }}>
      {isAnimating && (
        <button
          type="button"
          onClick={handleReset}
          aria-label="Show full diagram"
          style={{
            position: "absolute",
            top: "0.5rem",
            right: "0.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "28px",
            height: "28px",
            border: "1px solid var(--vocs-color_border)",
            borderRadius: "6px",
            background: "var(--vocs-color_background)",
            color: "var(--vocs-color_text3)",
            cursor: "pointer",
            padding: 0,
            zIndex: 10,
          }}
        >
          <svg
            aria-hidden="true"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      )}
      <div
        ref={containerRef}
        style={{
          display: "flex",
          justifyContent: "center",
          overflow: "hidden",
        }}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG from trusted build
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />

      {isAnimating && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "1rem",
          }}
        >
          <div
            className="mpp-description-box"
            style={{
              textAlign: "center",
              padding: "0.75rem 1.5rem",
              fontSize: "0.875rem",
              borderRadius: "8px",
              maxWidth: "480px",
            }}
            aria-live="polite"
          >
            {steps[currentStep]?.description}
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "0.75rem",
          marginTop: "1rem",
        }}
      >
        {isAnimating && (
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep <= 0}
            aria-label="Previous step"
            className="mpp-nav-btn"
            style={{
              ...btnStyle,
              opacity: currentStep <= 0 ? 0.4 : 1,
            }}
          >
            <svg
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}
        <button
          type="button"
          onClick={
            isAnimating
              ? isPlaying
                ? () => setIsPlaying(false)
                : handlePlay
              : handlePlay
          }
          aria-label={
            isAnimating
              ? isPlaying
                ? "Pause animation"
                : "Resume animation"
              : "Play step-by-step animation"
          }
          style={primaryBtnStyle}
        >
          {isPlaying ? (
            <svg
              aria-hidden="true"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>
        {isAnimating && (
          <button
            type="button"
            onClick={handleNext}
            disabled={currentStep >= steps.length - 1}
            aria-label="Next step"
            className="mpp-nav-btn"
            style={{
              ...btnStyle,
              opacity: currentStep >= steps.length - 1 ? 0.4 : 1,
            }}
          >
            <svg
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        )}
      </div>

      {isAnimating && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "6px",
            marginTop: "0.75rem",
          }}
        >
          {steps.map((step, i) => (
            <button
              type="button"
              // biome-ignore lint/suspicious/noArrayIndexKey: steps are static animation frames
              key={`dot-${i}`}
              onClick={() => {
                setIsPlaying(false);
                setCurrentStep(i);
              }}
              aria-label={`Go to step ${i + 1}: ${step.description}`}
              aria-current={i === currentStep ? "step" : undefined}
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                border: "none",
                background:
                  i === currentStep
                    ? "var(--vocs-color-accent)"
                    : i < currentStep
                      ? "var(--vocs-color-accent3)"
                      : "var(--vocs-border-color-primary)",
                cursor: "pointer",
                padding: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "36px",
  height: "36px",
  border: "1px solid",
  borderRadius: "50%",
  cursor: "pointer",
  padding: 0,
};

const primaryBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "44px",
  height: "44px",
  border: "none",
  borderRadius: "50%",
  background: "var(--vocs-color-accent)",
  color: "var(--vocs-color-accentInvert, #fff)",
  cursor: "pointer",
  padding: 0,
};
