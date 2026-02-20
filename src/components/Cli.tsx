"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { useMutation } from "@tanstack/react-query";
import { Store as ts_Store, useStore } from "@tanstack/react-store";
import { cva, cx } from "class-variance-authority";
import {
  Children,
  type CSSProperties,
  createContext,
  isValidElement,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Address } from "viem";
import { formatUnits, parseUnits } from "viem";
import {
  useConnect,
  useConnection,
  useConnectorClient,
  useConnectors,
  useDisconnect,
} from "wagmi";
import { Hooks } from "wagmi/tempo";
import IconAlertHexagon from "~icons/lucide/alert-triangle";
import IconCheck from "~icons/lucide/check";
import IconLoader from "~icons/lucide/loader";
import IconLogOut from "~icons/lucide/log-out";
import IconRefresh from "~icons/lucide/refresh-cw";
import { useRequests } from "../lib/network-store";
import * as mppx from "../mppx.client";
import { AsciiLogo } from "./AsciiLogo";

type PoemResult = { title: string; author: string; text: string };

export namespace Store {
  export type InteractionType = "select" | "toggle" | null;
  export type ViewType = "main" | "network";

  export type State = {
    initialBalance: bigint | undefined;
    interaction: InteractionType;
    restartStep: number;
    sessionDeposit: bigint;
    sessionSpent: bigint;
    stepIndex: number;
    token: Address | undefined;
    view: ViewType;
  };
}

export const store = new ts_Store<Store.State>({
  initialBalance: undefined,
  interaction: null,
  restartStep: 0,
  sessionDeposit: 0n,
  sessionSpent: 0n,
  stepIndex: 0,
  token: undefined,
  view: "main",
});

export function Window({ children, className, token }: Window.Props) {
  const { address } = useConnection();
  const initialBalance = useStore(store, (s) => s.initialBalance);

  const { data: balance } = Hooks.token.useGetBalance({
    account: address,
    token,
    blockTag: "latest",
  });

  useEffect(() => {
    store.setState((s) => ({ ...s, token }));
  }, [token]);

  useEffect(() => {
    // Only reset initialBalance if there's no address AND no demo address
    if (!address) {
      store.setState((s) => ({ ...s, initialBalance: undefined }));
      return;
    }
    if (balance !== undefined && initialBalance === undefined) {
      store.setState((s) => ({ ...s, initialBalance: balance }));
    }
  }, [address, balance, initialBalance]);

  return (
    <div
      className={cx(
        "bg-surfaceMuted rounded-xl overflow-hidden font-mono text-sm border border-primary",
        className,
      )}
    >
      {children}
    </div>
  );
}

export namespace Window {
  export type Props = {
    children: ReactNode;
    className?: string;
    token?: Address;
  };
}

export function TitleBar({ title, children, className }: TitleBar.Props) {
  return (
    <div
      className={cx(
        "flex items-center justify-between px-4 h-9 border-b border-primary bg-primary text-secondary gap-3",
        className,
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex gap-1.5 shrink-0">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: "var(--vocs-border-color-secondary)" }}
          />
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: "var(--vocs-border-color-secondary)" }}
          />
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: "var(--vocs-border-color-secondary)" }}
          />
        </div>
        {title && (
          <span className="text-[13px] tracking-tight ml-2 mt-[2px] truncate">
            {title}
          </span>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3 text-xs">{children}</div>
      )}
    </div>
  );
}

export namespace TitleBar {
  export type Props = {
    title?: string;
    children?: ReactNode;
    className?: string;
  };
}

export function Panel({
  children,
  height,
  autoScroll,
  className,
}: Panel.Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  });

  useEffect(() => {
    const scrollEl = scrollRef.current;
    const contentEl = contentRef.current;
    if (!scrollEl || !contentEl) return;

    const observer = new ResizeObserver(() => {
      scrollEl.scrollTop = scrollEl.scrollHeight;
    });
    observer.observe(contentEl);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={scrollRef}
      className={cx("p-4 overflow-y-auto bg-surface flex flex-col", className)}
      style={height ? { height } : undefined}
    >
      <div ref={contentRef} className="flex flex-col gap-6">
        {children}
      </div>
    </div>
  );
}

export namespace Panel {
  export type Props = {
    autoScroll?: boolean;
    children: ReactNode;
    className?: string;
    height?: number;
  };
}

export function Line({ variant, prefix, children, className }: Line.Props) {
  return (
    <div
      className={cva("leading-normal", {
        variants: {
          variant: {
            default: "text-primary",
            info: "text-muted",
            success: "text-success",
            error: "text-destructive",
            input: "text-primary",
            warning: "text-warning",
            loading: "text-secondary",
          },
        },
        defaultVariants: {
          variant: "default",
        },
      })({ variant, className })}
    >
      {variant === "loading" && <Spinner />}
      {prefix && (
        <span
          className={cva("", {
            variants: {
              variant: {
                default: "text-primary",
                info: "text-muted",
                success: "text-success",
                error: "text-destructive",
                input: "text-accent8",
                warning: "text-warning",
                loading:
                  "text-[light-dark(var(--vocs-color-accent),var(--vocs-color-accent8))]",
              },
            },
            defaultVariants: {
              variant: "default",
            },
          })({ variant })}
        >
          {prefix}{" "}
        </span>
      )}
      {children}
    </div>
  );
}

function Spinner() {
  const [frame, setFrame] = useState(0);
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

  // biome-ignore lint/correctness/useExhaustiveDependencies: todo
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % frames.length);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="text-[light-dark(var(--vocs-color-accent),var(--vocs-color-accent8))]">
      {frames[frame]}{" "}
    </span>
  );
}

export namespace Line {
  export type Variant =
    | "default"
    | "info"
    | "success"
    | "error"
    | "input"
    | "warning"
    | "loading";

  export type Props = {
    variant?: Variant;
    prefix?: "❯" | "✓" | "✗" | "→";
    children: ReactNode;
    className?: string;
  };
}

export function Block({ children, className }: Block.Props) {
  return <div className={cx("flex flex-col gap-1", className)}>{children}</div>;
}

export namespace Block {
  export type Props = {
    children: ReactNode;
    className?: string;
  };
}

export function Link({ href, children, className }: Link.Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cx(
        "text-[light-dark(var(--vocs-color-accent),var(--vocs-color-accent8))] underline block leading-relaxed",
        className,
      )}
    >
      {children}
    </a>
  );
}

export namespace Link {
  export type Props = {
    href: string;
    children: ReactNode;
    className?: string;
  };
}

export function Blank({ className }: Blank.Props) {
  return <div className={cx("h-4", className)} />;
}

export namespace Blank {
  export type Props = {
    className?: string;
  };
}

export function FooterBar({ className, left, right }: FooterBar.Props) {
  return (
    <div
      className={cx(
        "flex items-center justify-between px-4 h-9 border-t border-primary bg-primary text-xs",
        className,
      )}
    >
      <div className="hidden sm:flex items-center gap-3">{left}</div>
      <div className="flex items-center gap-3">{right}</div>
    </div>
  );
}

export namespace FooterBar {
  export type Props = {
    className?: string;
    left?: ReactNode;
    right?: ReactNode;
  };
}

export function Balance({ className, label = "Balance" }: Balance.Props) {
  const token = useStore(store, (s) => s.token);
  const sessionSpent = useStore(store, (s) => s.sessionSpent);
  const sessionDeposit = useStore(store, (s) => s.sessionDeposit);
  const { address } = useConnection();

  const { data: balance } = Hooks.token.useGetBalance({
    account: address,
    token,
    query: {
      enabled: !!address && !!token,
      refetchInterval: 1_000,
    },
  });

  if (balance === undefined) return null;

  // Add back the unspent portion of any session deposit
  const unspent =
    sessionDeposit > sessionSpent ? sessionDeposit - sessionSpent : 0n;
  const effective = balance + unspent;

  const formatted = formatUnits(effective, 6);
  const display = Number(formatted).toLocaleString("en-US", {
    maximumFractionDigits: 4,
    minimumFractionDigits: 2,
  });

  return (
    <span className={cx("text-secondary", className)}>
      {label}: <span className="text-primary">${display}</span>
    </span>
  );
}

export namespace Balance {
  export type Props = {
    className?: string;
    label?: string;
  };
}

export function Spent({ className, label = "Spent" }: Spent.Props) {
  const initial = useStore(store, (s) => s.initialBalance);
  const token = useStore(store, (s) => s.token);
  const sessionSpent = useStore(store, (s) => s.sessionSpent);
  const sessionDeposit = useStore(store, (s) => s.sessionDeposit);
  const { address } = useConnection();

  const { data: balance } = Hooks.token.useGetBalance({
    account: address,
    token,
  });

  if (!address) return null;

  // On-chain balance drop minus unspent deposit = actual spend
  const drop =
    initial !== undefined && balance !== undefined && initial > balance
      ? initial - balance
      : 0n;
  const unspent =
    sessionDeposit > sessionSpent ? sessionDeposit - sessionSpent : 0n;
  const spent = drop > unspent ? drop - unspent : 0n;

  const formatted = formatUnits(spent, 6);
  const display = Number(formatted).toLocaleString("en-US", {
    maximumFractionDigits: 4,
    minimumFractionDigits: 2,
  });

  return (
    <span className={cx("text-secondary hidden sm:inline", className)}>
      {label}: <span className="text-primary">${display}</span>
    </span>
  );
}

export namespace Spent {
  export type Props = {
    className?: string;
    label?: string;
  };
}

export function Status({ children, className, variant }: Status.Props) {
  return (
    <span
      className={cva(
        "px-2 py-0.5 rounded text-[10px] uppercase tracking-wider",
        {
          variants: {
            variant: {
              complete: "bg-success/20 text-success",
              error: "bg-destructive/20 text-destructive",
              idle: "bg-note/20 text-muted",
              ready: "bg-note/20 text-muted",
              running: "bg-warning/20 text-warning",
            },
          },
          defaultVariants: {
            variant: "idle",
          },
        },
      )({ variant, className })}
    >
      {children}
    </span>
  );
}

export namespace Status {
  export type Variant = "complete" | "error" | "idle" | "ready" | "running";

  export type Props = {
    children: ReactNode;
    className?: string;
    variant?: Variant;
  };
}

export function StatusDot({ children, className, variant }: StatusDot.Props) {
  return (
    <span className={cx("flex items-center gap-2 text-secondary", className)}>
      <span
        className={cva("w-2 h-2 rounded-full", {
          variants: {
            variant: {
              error: "bg-destructive",
              offline: "bg-note",
              success: "bg-success",
              warning: "bg-warning",
            },
          },
          defaultVariants: {
            variant: "success",
          },
        })({ variant })}
      />
      {children}
    </span>
  );
}

export namespace StatusDot {
  export type Variant = "error" | "offline" | "success" | "warning";

  export type Props = {
    children: ReactNode;
    className?: string;
    variant?: Variant;
  };
}

const SelectContext = createContext<{
  onSubmit?: (value: string) => void;
  currentValue: string;
}>({ currentValue: "" });

function getFirstOptionValue(children: ReactNode): string {
  const childArray = Children.toArray(children);
  for (const child of childArray) {
    if (
      isValidElement<{ value?: string }>(child) &&
      typeof child.props.value === "string"
    ) {
      return child.props.value;
    }
  }
  return "";
}

export function Select({
  autoFocus,
  children,
  className,
  disabled,
  onChange,
  onSubmit,
  value,
}: Select.Props) {
  const ref = useRef<HTMLDivElement>(null);
  const firstValue = getFirstOptionValue(children);
  const [internalValue, setInternalValue] = useState(firstValue);

  const currentValue = value ?? internalValue;

  useEffect(() => {
    if (!disabled) {
      store.setState((s) => ({ ...s, interaction: "select" }));
      return () => store.setState((s) => ({ ...s, interaction: null }));
    }
    store.setState((s) => ({ ...s, interaction: null }));
  }, [disabled]);

  useEffect(() => {
    if (autoFocus && !disabled && ref.current) {
      const firstRadio =
        ref.current.querySelector<HTMLElement>('[role="radio"]');
      firstRadio?.focus({ preventScroll: true });
    }
  }, [autoFocus, disabled]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !disabled && currentValue) {
      e.preventDefault();
      onSubmit?.(currentValue);
    }
  };

  return (
    <SelectContext.Provider value={{ onSubmit, currentValue }}>
      <RadioGroup
        ref={ref}
        value={currentValue}
        onValueChange={(val) => {
          const v = val as string;
          setInternalValue(v);
          onChange?.(v);
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cx("flex flex-col [counter-reset:option]", className)}
      >
        {children}
      </RadioGroup>
    </SelectContext.Provider>
  );
}

export namespace Select {
  export type Props = {
    autoFocus?: boolean;
    children: ReactNode;
    className?: string;
    disabled?: boolean;
    onChange?: (value: string) => void;
    onSubmit?: (value: string) => void;
    value?: string;
  };

  export function Option({ children, className, value }: Option.Props) {
    const { onSubmit } = useContext(SelectContext);

    return (
      // biome-ignore lint/a11y/noLabelWithoutControl: Radio.Root renders an input
      <label
        className={cx(
          "flex items-center text-left py-0.5 px-1.5 -mx-1.5 rounded transition-colors cursor-pointer",
          "text-primary",
          "has-[[data-checked]]:bg-[light-dark(var(--vocs-color-accent),var(--vocs-color-accent8))]/10",
          "has-[[data-checked]]:text-[light-dark(var(--vocs-color-accent),var(--vocs-color-accent8))]",
          "has-[:focus-visible]:bg-[light-dark(var(--vocs-color-accent),var(--vocs-color-accent8))]/10",
          "has-[:focus-visible]:text-[light-dark(var(--vocs-color-accent),var(--vocs-color-accent8))]",
          "[counter-increment:option]",
          className,
        )}
        onPointerUp={() => onSubmit?.(value)}
      >
        <Radio.Root value={value} className="peer sr-only" />
        <span className="w-3 invisible peer-data-[checked]:visible peer-focus-visible:visible">
          ▸
        </span>
        <span className="text-muted w-5 before:content-[counter(option)'.']" />
        <span>{children}</span>
      </label>
    );
  }

  export namespace Option {
    export type Props = {
      children: ReactNode;
      className?: string;
      value: string;
    };
  }
}

const ToggleContext = createContext<{
  onSubmit?: (value: string) => void;
  currentValue: string;
}>({ currentValue: "" });

export function Toggle({
  autoFocus,
  children,
  className,
  disabled,
  onChange,
  onSubmit,
  value,
}: Toggle.Props) {
  const ref = useRef<HTMLDivElement>(null);
  const firstValue = getFirstOptionValue(children);
  const [internalValue, setInternalValue] = useState(firstValue);

  const currentValue = value ?? internalValue;

  useEffect(() => {
    if (!disabled) {
      store.setState((s) => ({ ...s, interaction: "toggle" }));
      return () => store.setState((s) => ({ ...s, interaction: null }));
    }
    store.setState((s) => ({ ...s, interaction: null }));
  }, [disabled]);

  useEffect(() => {
    if (autoFocus && !disabled && ref.current) {
      const firstRadio =
        ref.current.querySelector<HTMLElement>('[role="radio"]');
      firstRadio?.focus({ preventScroll: true });
    }
  }, [autoFocus, disabled]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !disabled && currentValue) {
      e.preventDefault();
      onSubmit?.(currentValue);
    }
  };

  return (
    <ToggleContext.Provider value={{ onSubmit, currentValue }}>
      <RadioGroup
        ref={ref}
        value={currentValue}
        onValueChange={(val) => {
          const v = val as string;
          setInternalValue(v);
          onChange?.(v);
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cx("flex flex-row gap-2", className)}
      >
        {children}
      </RadioGroup>
    </ToggleContext.Provider>
  );
}

export namespace Toggle {
  export type Props = {
    autoFocus?: boolean;
    children: ReactNode;
    className?: string;
    disabled?: boolean;
    onChange?: (value: string) => void;
    onSubmit?: (value: string) => void;
    value?: string;
  };

  export function Option({ children, className, value }: Option.Props) {
    const { onSubmit } = useContext(ToggleContext);

    return (
      // biome-ignore lint/a11y/noLabelWithoutControl: Radio.Root renders an input
      <label
        className={cx(
          "flex items-center px-4 py-2 rounded-md cursor-pointer transition-colors text-sm font-medium",
          "text-secondary border border-transparent",
          "has-[[data-checked]]:bg-neutral-100 has-[[data-checked]]:text-neutral-800",
          "has-[[data-checked]]:border-neutral-300",
          "has-[:focus-visible]:bg-neutral-100 has-[:focus-visible]:text-neutral-800",
          "has-[:focus-visible]:border-neutral-300",
          className,
        )}
        onPointerUp={() => onSubmit?.(value)}
      >
        <Radio.Root value={value} className="sr-only" />
        <span>{children}</span>
      </label>
    );
  }

  export namespace Option {
    export type Props = {
      children: ReactNode;
      className?: string;
      value: string;
    };
  }
}

export function Hint({ className }: Hint.Props) {
  const interaction = useStore(store, (s) => s.interaction);
  const { address } = useConnection();

  if (!interaction) {
    return (
      <StatusDot
        variant={address ? "success" : "offline"}
        className={className}
      >
        {address ? "Connected" : "Disconnected"}
      </StatusDot>
    );
  }

  const hints: Record<NonNullable<Store.InteractionType>, string> = {
    select: "(↑ ↓) + ⏎, or press to select",
    toggle: "(← →) + ⏎, or press to select",
  };

  const mobileHints: Record<NonNullable<Store.InteractionType>, string> = {
    select: "Tap to select",
    toggle: "Tap to select",
  };

  return (
    <span className={cx("text-muted", className)}>
      <span className="hidden sm:inline">{hints[interaction]}</span>
      <span className="sm:hidden">{mobileHints[interaction]}</span>
    </span>
  );
}

export namespace Hint {
  export type Props = {
    className?: string;
  };
}

export function Account({ className }: Account.Props) {
  const { address } = useConnection();
  const { disconnect } = useDisconnect();
  const restartStep = useStore(store, (s) => s.restartStep);

  if (!address) return null;

  return (
    <span className={cx("flex items-center gap-3", className)}>
      <span className="text-primary hidden sm:inline">
        {address.slice(0, 6)}…{address.slice(-4)}
      </span>
      <button
        type="button"
        onClick={() => {
          disconnect();
          store.setState((s) => ({ ...s, stepIndex: restartStep }));
        }}
        className="text-secondary hover:text-primary transition-colors"
        aria-label="Log out"
      >
        <IconLogOut className="w-3.5 h-3.5" />
      </button>
    </span>
  );
}

export namespace Account {
  export type Props = {
    className?: string;
  };
}

export function Refresh({ className }: Refresh.Props) {
  const restartStep = useStore(store, (s) => s.restartStep);
  return (
    <button
      type="button"
      onClick={() => store.setState((s) => ({ ...s, stepIndex: restartStep }))}
      className={cx(
        "text-secondary hover:text-primary transition-colors",
        className,
      )}
      aria-label="Refresh"
    >
      <IconRefresh className="w-3.5 h-3.5" />
    </button>
  );
}

export namespace Refresh {
  export type Props = {
    className?: string;
  };
}

export function Tabs({ className }: Tabs.Props) {
  const view = useStore(store, (s) => s.view);
  const requests = useRequests();

  return (
    <div
      className={cx(
        "flex items-center border-b border-primary bg-primary text-xs",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => store.setState((s) => ({ ...s, view: "main" }))}
        className={cx(
          "px-3 py-1.5 transition-colors",
          view === "main"
            ? "text-primary border-b border-current"
            : "text-secondary hover:text-primary",
        )}
      >
        Terminal
      </button>
      <button
        type="button"
        onClick={() => store.setState((s) => ({ ...s, view: "network" }))}
        className={cx(
          "px-3 py-1.5 transition-colors flex items-center gap-1.5",
          view === "network"
            ? "text-primary border-b border-current"
            : "text-secondary hover:text-primary",
        )}
      >
        Network
        {requests.length > 0 && (
          <span className="bg-surface text-primary rounded-full px-1.5 py-px text-[10px] leading-tight tabular-nums">
            {requests.length}
          </span>
        )}
      </button>
    </div>
  );
}

export namespace Tabs {
  export type Props = {
    className?: string;
  };
}

export function Steps({ children }: Steps.Props) {
  const stepIndex = useStore(store, (s) => s.stepIndex);
  const childArray = Children.toArray(children);

  return <>{childArray.slice(0, stepIndex + 1)}</>;
}

export namespace Steps {
  export type Props = {
    children: ReactNode;
  };
}

export function Step({ children }: Step.Props) {
  return <>{children}</>;
}

export namespace Step {
  export type Props = {
    children: ReactNode;
  };
}

export function NetworkPanel({ className, style }: NetworkPanel.Props) {
  const view = useStore(store, (s) => s.view);
  const requests = useRequests();
  const bodyRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new requests or view change
  useEffect(() => {
    if (bodyRef.current)
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [requests, view]);

  return (
    <div
      className={cx("flex flex-col text-xs bg-surface", className)}
      style={style}
    >
      <div className="flex items-center border-b border-primary px-3 py-1.5 text-muted shrink-0">
        <div className="min-w-0 basis-0 grow-4 flex items-center gap-2">
          <div className="w-3.5 shrink-0" />
          <div>URL</div>
        </div>
        <div className="min-w-0 basis-0 grow-10">Description</div>
        <div className="min-w-0 basis-0 grow-3 text-right">Status</div>
        <div className="min-w-0 basis-0 grow-3 text-right">Time</div>
      </div>
      <div ref={bodyRef} className="flex-1 overflow-y-auto min-h-0">
        {requests.length === 0 ? (
          <div className="px-2 py-3 text-muted">No network activity</div>
        ) : (
          requests.map((request) => {
            const urlPath = (() => {
              try {
                return new URL(request.url).pathname;
              } catch {
                return request.url;
              }
            })();

            return (
              <div
                key={request.id}
                className="flex items-center border-b border-primary/50 px-3 py-1.5 hover:bg-gray13 transition-colors"
              >
                <div className="min-w-0 basis-0 grow-4 flex items-center gap-2">
                  {request.status === "pending" ? (
                    <IconLoader className="w-3.5 h-3.5 shrink-0 text-warning animate-spin" />
                  ) : request.status === "success" ? (
                    <IconCheck className="w-3.5 h-3.5 shrink-0 text-success" />
                  ) : (
                    <IconAlertHexagon className="w-3.5 h-3.5 shrink-0 text-destructive" />
                  )}
                  <div className="text-primary truncate">{urlPath}</div>
                </div>
                <div className="min-w-0 basis-0 grow-10 text-muted truncate">
                  {request.description ?? "—"}
                </div>
                <div
                  className={cx(
                    "min-w-0 basis-0 grow-3 text-right tabular-nums",
                    request.status === "pending"
                      ? "text-muted"
                      : request.statusCode && request.statusCode >= 400
                        ? "text-destructive"
                        : "text-success",
                  )}
                >
                  {request.status === "pending"
                    ? "..."
                    : (request.statusCode ?? "—")}
                </div>
                <div className="min-w-0 basis-0 grow-3 text-right tabular-nums text-muted">
                  {new Date(request.timestamp).toLocaleTimeString("en-US", {
                    hour12: false,
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export namespace NetworkPanel {
  export type Props = {
    className?: string;
    style?: CSSProperties;
  };
}

/////////////////////////////////////////////////////////////////////
// Demo Components

export function Demo({
  children,
  className,
  height = 300,
  restartStep = 0,
  title,
  token,
}: Demo.Props) {
  useEffect(() => {
    store.setState((s) => ({ ...s, restartStep }));
  }, [restartStep]);

  return (
    <Window className={className} token={token}>
      <TitleBar title={title}>
        <Account />
        <Refresh />
      </TitleBar>

      <Tabs />

      <Demo.Content height={height}>{children}</Demo.Content>

      <FooterBar
        left={<Hint />}
        right={
          <>
            <Balance />
            <Spent />
          </>
        }
      />
    </Window>
  );
}

// Simplified demo without account, tabs, or hint
export function DemoSimple({
  children,
  className,
  height = 280,
  restartStep = 0,
  title,
  token,
}: Demo.Props) {
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only reset state once on first mount
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    store.setState((s) => ({
      ...s,
      restartStep,
      stepIndex: 0,
      // Don't reset demoAddress or initialBalance - let SilentDemoSetup handle those
    }));
  }, [restartStep]);

  return (
    <Window className={className} token={token}>
      <TitleBar title={title}>
        <Balance />
        <Spent />
        <Refresh />
      </TitleBar>

      <Demo.Content height={height}>{children}</Demo.Content>
    </Window>
  );
}

export namespace Demo {
  export type Props = {
    className?: string;
    height?: number;
    children: ReactNode;
    restartStep?: number;
    title?: string;
    token?: Address;
  };

  export function Content({
    children,
    height,
  }: {
    children: ReactNode;
    height: number;
  }) {
    const view = useStore(store, (s) => s.view);
    const steps = Children.toArray(children);

    return (
      <>
        <Panel
          height={height}
          className={view !== "main" ? "hidden!" : undefined}
        >
          <Steps>
            {steps.map((step, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: stable array
              <Step key={i}>{step}</Step>
            ))}
          </Steps>
        </Panel>
        <NetworkPanel
          style={{ height }}
          className={view !== "network" ? "hidden!" : undefined}
        />
      </>
    );
  }
}

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function Startup() {
  const stepIndex = useStore(store, (s) => s.stepIndex);
  const hasMounted = useRef(false);

  useEffect(() => {
    if (stepIndex !== 0) return;
    if (hasMounted.current) return;
    hasMounted.current = true;
    store.setState((s) => ({ ...s, stepIndex: s.stepIndex + 1 }));
  }, [stepIndex]);

  return (
    <Block>
      <div className="hidden sm:block">
        <AsciiLogo />
      </div>
      <Line variant="info">
        mpp.sh@{__COMMIT_SHA__} (released {timeAgo(__COMMIT_TIMESTAMP__)})
      </Line>
    </Block>
  );
}

export function ConnectWallet() {
  const { address } = useConnection();
  const connectors = useConnectors();
  const { connect, isPending } = useConnect();

  const connector = connectors[0];

  useEffect(() => {
    if (address) {
      const timer = setTimeout(
        () => store.setState((s) => ({ ...s, stepIndex: s.stepIndex + 1 })),
        500,
      );
      return () => clearTimeout(timer);
    }
  }, [address]);

  if (address) return null;

  return (
    <Block className="flex-1">
      <Line variant="info">
        Use <span className="text-accent">Tempo Wallet</span> and{" "}
        <span className="text-accent">authorize $5</span> to get started:
      </Line>
      {isPending ? (
        <Line variant="loading">Connecting...</Line>
      ) : (
        <div className="mt-auto pt-4">
          <Toggle
            autoFocus
            onSubmit={(type) => {
              if (connector) {
                connect({
                  connector,
                  capabilities: { type: type as "sign-in" | "sign-up" },
                });
              }
            }}
          >
            <Toggle.Option value="sign-up">Sign up</Toggle.Option>
            <Toggle.Option value="sign-in">Sign in</Toggle.Option>
          </Toggle>
        </div>
      )}
    </Block>
  );
}

export function Faucet() {
  const initialBalance = useStore(store, (s) => s.initialBalance);
  const { address } = useConnection();
  const [alreadyFunded, setAlreadyFunded] = useState(false);

  const token = useStore(store, (s) => s.token);
  const { data: currentBalance, refetch } = Hooks.token.useGetBalance({
    account: address,
    token,
    blockTag: "latest",
  });

  const { mutate, isPending, isSuccess } = Hooks.faucet.useFundSync({
    mutation: {
      onSuccess: async () => {
        const { data } = await refetch();
        store.setState((s) => ({
          ...s,
          initialBalance: data,
          stepIndex: s.stepIndex + 1,
        }));
      },
    },
  });

  useEffect(() => {
    if (!address) return;
    if (isPending) return;
    if (isSuccess) return;
    if (alreadyFunded) return;
    if (initialBalance === undefined) return;
    if (initialBalance > 0n) {
      setAlreadyFunded(true);
      return;
    }

    mutate({ account: address });
  }, [address, alreadyFunded, initialBalance, isPending, isSuccess, mutate]);

  useEffect(() => {
    if (alreadyFunded) {
      store.setState((s) => ({ ...s, initialBalance: currentBalance }));
      const timer = setTimeout(
        () => store.setState((s) => ({ ...s, stepIndex: s.stepIndex + 1 })),
        1000,
      );
      return () => clearTimeout(timer);
    }
  }, [alreadyFunded, currentBalance]);

  if (!address) return null;

  const funded = isSuccess || alreadyFunded;

  if (funded) return null;

  return (
    <Block>
      {isPending && <Line variant="loading">Funding wallet...</Line>}
    </Block>
  );
}

export function Ping() {
  const [history, setHistory] = useState<("success" | "error")[]>([]);
  const [showResult, setShowResult] = useState(false);
  const { data: client } = useConnectorClient();

  const { mutate, isPending, isSuccess, isError, reset } = useMutation({
    mutationFn: () =>
      mppx.fetch("/api/ping/paid", { context: { account: client?.account } }),
    onSettled: (_, error) => {
      setShowResult(true);
      setTimeout(() => {
        setHistory((h) => [...h, error ? "error" : "success"]);
        setShowResult(false);
        reset();
      }, 500);
    },
  });

  const isIdle = !isPending && !showResult;

  return (
    <>
      {history.map((result, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: _
        <Block key={i}>
          <Line variant="info">Make request to /ping/paid:</Line>
          {result === "success" ? (
            <Line variant="success" prefix="✓">
              Request complete
            </Line>
          ) : (
            <Line variant="error" prefix="✗">
              Request failed
            </Line>
          )}
        </Block>
      ))}
      <Block>
        <Line variant="info">Make request to /ping/paid:</Line>
        {isIdle && (
          <Toggle autoFocus onSubmit={() => mutate()}>
            <Toggle.Option value="request">Make request</Toggle.Option>
          </Toggle>
        )}
        {isPending && <Line variant="loading">Sending request...</Line>}
        {showResult && isSuccess && (
          <Line variant="success" prefix="✓">
            Request complete
          </Line>
        )}
        {showResult && isError && (
          <Line variant="error" prefix="✗">
            Request failed
          </Line>
        )}
      </Block>
    </>
  );
}

export function Photo() {
  const [history, setHistory] = useState<
    ({ status: "success"; url: string } | { status: "error" })[]
  >([]);
  const [showResult, setShowResult] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const { data: client } = useConnectorClient();

  const { mutate, isPending, isSuccess, isError, reset } = useMutation({
    mutationFn: async () => {
      const res = await mppx.fetch("/api/photo", {
        context: { account: client?.account },
      });
      if (!res.ok) throw new Error("Request failed");
      return res.json() as Promise<{ url: string }>;
    },
    onSuccess: (data) => {
      setResultUrl(data.url);
      setShowResult(true);
      setTimeout(() => {
        setHistory((h) => [...h, { status: "success", url: data.url }]);
        setShowResult(false);
        setResultUrl(null);
        reset();
      }, 500);
    },
    onError: () => {
      setShowResult(true);
      setTimeout(() => {
        setHistory((h) => [...h, { status: "error" }]);
        setShowResult(false);
        reset();
      }, 500);
    },
  });

  const isIdle = !isPending && !showResult;

  return (
    <>
      {history.map((result, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: _
        <Block key={i}>
          <Line variant="info">Generate photo from /api/photo:</Line>
          {result.status === "success" ? (
            <Photo.Image url={result.url} />
          ) : (
            <Line variant="error" prefix="✗">
              Request failed
            </Line>
          )}
        </Block>
      ))}
      <Block>
        <Line variant="info">Generate photo from /api/photo:</Line>
        {isIdle && (
          <Toggle autoFocus onSubmit={() => mutate()}>
            <Toggle.Option value="request">Generate ($0.01)</Toggle.Option>
          </Toggle>
        )}
        {isPending && (
          <div className="rounded border border-primary w-[140px] h-[140px] shimmer" />
        )}
        {showResult && isSuccess && resultUrl && (
          <Photo.Image url={resultUrl} />
        )}
        {showResult && isError && (
          <Line variant="error" prefix="✗">
            Request failed
          </Line>
        )}
      </Block>
    </>
  );
}

export namespace Photo {
  export function Image({ url }: { url: string }) {
    const [loaded, setLoaded] = useState(false);

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative rounded border border-primary w-[140px] h-[140px] overflow-hidden"
      >
        {!loaded && <div className="absolute inset-0 shimmer" />}
        <img
          src={url}
          alt="Random"
          onLoad={() => setLoaded(true)}
          className={cx(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      </a>
    );
  }
}

export function Gallery() {
  const [history, setHistory] = useState<
    { status: "success"; urls: string[] }[]
  >([]);
  const [current, setCurrent] = useState<string[]>([]);
  const [opening, setOpening] = useState(false);
  const { data: client } = useConnectorClient();

  const sessionDeposit = useStore(store, (s) => s.sessionDeposit);

  const { mutate: generate, isPending } = useMutation({
    async mutationFn(count: number) {
      if (sessionDeposit === 0n) setOpening(true);
      setCurrent([]);

      const urls: string[] = [];
      for (let i = 0; i < count; i++) {
        const res = await mppx.fetch("/api/sessions/photo", {
          context: { account: client?.account },
        });
        if (!res.ok) break;
        const data = (await res.json()) as { url: string };
        urls.push(data.url);
        setOpening(false);
        setCurrent([...urls]);
      }

      return urls;
    },
    onSuccess(urls) {
      setHistory((h) => [...h, { status: "success", urls }]);
      setCurrent([]);
      setOpening(false);
    },
    onError() {
      setCurrent([]);
      setOpening(false);
    },
  });

  const isIdle = !isPending;

  return (
    <>
      {history.map((result, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: _
        <Block key={i}>
          <Line variant="info">Generate gallery from /api/sessions/photo:</Line>
          <Gallery.Grid urls={result.urls} />
        </Block>
      ))}
      <Block>
        <Line variant="info">Generate gallery from /api/sessions/photo:</Line>
        {isIdle && !current.length && (
          <Toggle autoFocus onSubmit={(v) => generate(Number(v))}>
            {[3, 5, 10].map((n) => (
              <Toggle.Option key={n} value={String(n)}>
                {n} photos (${(n * 0.01).toFixed(2)})
              </Toggle.Option>
            ))}
          </Toggle>
        )}
        {opening && <Line variant="loading">Opening session...</Line>}
        {!opening && (isPending || current.length > 0) && (
          <Gallery.Grid
            urls={current}
            loading={isPending ? current.length : undefined}
          />
        )}
      </Block>
    </>
  );
}

export namespace Gallery {
  export function Grid({
    urls,
    loading,
  }: {
    urls: string[];
    loading?: number;
  }) {
    return (
      <div className="flex flex-wrap gap-2">
        {urls.map((url, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: _
          <Thumb key={i} url={url} />
        ))}
        {loading !== undefined && (
          <div className="relative rounded border border-primary w-[80px] h-[80px] shimmer" />
        )}
      </div>
    );
  }

  export function Thumb({ url }: { url: string }) {
    const [loaded, setLoaded] = useState(false);

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative rounded border border-primary w-[80px] h-[80px] overflow-hidden"
      >
        {!loaded && <div className="absolute inset-0 shimmer" />}
        <img
          src={url}
          alt="Gallery"
          onLoad={() => setLoaded(true)}
          className={cx(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      </a>
    );
  }
}

export function Poem() {
  const [history, setHistory] = useState<PoemResult[]>([]);
  const [current, setCurrent] = useState<{
    title?: string;
    author?: string;
    words: string[];
  } | null>(null);
  const [opening, setOpening] = useState(false);

  const { data: client } = useConnectorClient();

  const session = useMemo(() => {
    if (!client?.account) return undefined;
    return mppx.session({ account: client.account });
  }, [client?.account]);

  const sessionDeposit = useStore(store, (s) => s.sessionDeposit);

  const { mutate: generate, isPending } = useMutation({
    async mutationFn() {
      if (!session) throw new Error("No session available");
      if (sessionDeposit === 0n) setOpening(true);
      setCurrent({ words: [] });

      const stream = await session.sse("/api/sessions/poem");

      let title: string | undefined;
      let author: string | undefined;
      const words: string[] = [];

      for await (const chunk of stream) {
        setOpening(false);
        store.setState((s) => ({
          ...s,
          sessionDeposit: session.opened ? parseUnits(mppx.maxDeposit, 6) : 0n,
          sessionSpent: session.cumulative,
        }));
        if (!title) {
          try {
            const meta = JSON.parse(chunk) as {
              title: string;
              author: string;
            };
            title = meta.title;
            author = meta.author;
            setCurrent({ title, author, words: [] });
            continue;
          } catch {
            // not metadata, treat as word
          }
        }
        words.push(chunk);
        setCurrent({ title, author, words: [...words] });
      }

      return {
        title: title ?? "Untitled",
        author: author ?? "Unknown",
        text: Poem.joinWords(words),
      };
    },
    onSuccess(result) {
      setHistory((h) => [...h, result]);
      setCurrent(null);
      setOpening(false);
    },
    onError() {
      setCurrent(null);
      setOpening(false);
    },
  });

  const isIdle = !isPending;

  return (
    <>
      {history.map((result, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: _
        <Block key={i}>
          <Line variant="info">Stream poem from /api/sessions/poem:</Line>
          <Poem.Display
            title={result.title}
            author={result.author}
            text={result.text}
          />
        </Block>
      ))}
      <Block>
        <Line variant="info">Stream poem from /api/sessions/poem:</Line>
        {isIdle && !current && (
          <Toggle autoFocus onSubmit={() => generate()}>
            <Toggle.Option value="generate">Generate poem</Toggle.Option>
          </Toggle>
        )}
        {opening && <Line variant="loading">Opening session...</Line>}
        {!opening && current && (
          <Poem.Display
            title={current.title}
            author={current.author}
            text={Poem.joinWords(current.words)}
            streaming={isPending}
          />
        )}
      </Block>
    </>
  );
}

export namespace Poem {
  export function joinWords(words: string[]) {
    let result = "";
    for (const word of words) {
      if (word === "\\n") result += "\n";
      else result += (result && !result.endsWith("\n") ? " " : "") + word;
    }
    return result;
  }

  export function Display({
    title,
    author,
    text,
    streaming,
  }: {
    title?: string;
    author?: string;
    text: string;
    streaming?: boolean;
  }) {
    return (
      <div className="flex flex-col gap-1">
        {title && (
          <span className="text-primary font-bold">
            {title}
            {author && (
              <span className="text-secondary font-normal"> — {author}</span>
            )}
          </span>
        )}
        <div className="text-primary whitespace-pre-wrap leading-relaxed">
          {text}
          {streaming && <span className="animate-pulse">▌</span>}
        </div>
      </div>
    );
  }
}
