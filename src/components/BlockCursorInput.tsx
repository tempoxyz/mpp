"use client";

import { forwardRef, useCallback, useRef, useState } from "react";

const supportsCaretShape =
  typeof CSS !== "undefined" && CSS.supports("caret-shape", "block");

type BlockCursorInputProps = React.ComponentProps<"input">;

export const BlockCursorInput = forwardRef<
  HTMLInputElement,
  BlockCursorInputProps
>(function BlockCursorInput(
  {
    className,
    style,
    onFocus,
    onBlur,
    onChange,
    onKeyDown,
    onSelect,
    onClick,
    ...props
  },
  forwardedRef,
) {
  const innerRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);

  const setRef = useCallback(
    (el: HTMLInputElement | null) => {
      (innerRef as React.MutableRefObject<HTMLInputElement | null>).current =
        el;
      if (typeof forwardedRef === "function") forwardedRef(el);
      else if (forwardedRef)
        (
          forwardedRef as React.MutableRefObject<HTMLInputElement | null>
        ).current = el;
    },
    [forwardedRef],
  );

  const [paddingLeft, setPaddingLeft] = useState(0);

  const syncCursor = useCallback(() => {
    const el = innerRef.current;
    if (!el) return;
    setCursorPos(el.selectionStart ?? el.value.length);
    setPaddingLeft(Number.parseFloat(getComputedStyle(el).paddingLeft) || 0);
  }, []);

  if (supportsCaretShape) {
    return (
      <input
        ref={forwardedRef}
        className={className}
        style={style}
        onFocus={onFocus}
        onBlur={onBlur}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onSelect={onSelect}
        onClick={onClick}
        {...props}
      />
    );
  }

  return (
    <span className="relative inline-block min-w-0 flex-1">
      <input
        ref={setRef}
        className={`${className ?? ""} w-full`}
        style={{ ...style, caretColor: "transparent" }}
        onFocus={(e) => {
          setFocused(true);
          syncCursor();
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        onChange={(e) => {
          onChange?.(e);
          syncCursor();
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          requestAnimationFrame(syncCursor);
        }}
        onSelect={(e) => {
          syncCursor();
          onSelect?.(e);
        }}
        onClick={(e) => {
          syncCursor();
          onClick?.(e);
        }}
        {...props}
      />
      {focused && (
        <span
          className="pointer-events-none absolute top-[0.15em]"
          style={{
            left: `calc(${cursorPos}ch + ${paddingLeft}px)`,
            width: "1ch",
            height: "1.2em",
            backgroundColor: "var(--term-pink9)",
            animation: "blink 1s step-end infinite",
          }}
        />
      )}
    </span>
  );
});
