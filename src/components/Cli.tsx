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
  useRef,
  useState,
} from "react";
import type { Address } from "viem";
import { formatUnits } from "viem";
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

export namespace Store {
  export type InteractionType = "select" | "toggle" | null;
  export type ViewType = "main" | "network";

  export type State = {
    initialBalance: bigint | undefined;
    interaction: InteractionType;
    restartStep: number;
    stepIndex: number;
    token: Address | undefined;
    view: ViewType;
  };
}

export const store = new ts_Store<Store.State>({
  initialBalance: undefined,
  interaction: null,
  restartStep: 0,
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
        "bg-gray2 rounded-xl overflow-hidden font-mono text-sm border border-primary",
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
          <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
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
            info: "text-gray8",
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
                info: "text-gray8",
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

  const formatted = formatUnits(balance, 6);
  const display = Number(formatted).toLocaleString("en-US", {
    maximumFractionDigits: 4,
    minimumFractionDigits: 2,
  });

  return (
    <span className={cx("text-secondary", className)}>
      {label}: <span className="text-success">${display}</span>
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
  const { address } = useConnection();

  const { data: balance } = Hooks.token.useGetBalance({
    account: address,
    token,
  });

  if (!address) return null;

  const spent =
    initial !== undefined && balance !== undefined && initial > balance
      ? initial - balance
      : 0n;

  const formatted = formatUnits(spent, 6);
  const display = Number(formatted).toLocaleString("en-US", {
    maximumFractionDigits: 4,
    minimumFractionDigits: 2,
  });

  return (
    <span className={cx("text-secondary hidden sm:inline", className)}>
      {label}: <span className="text-warning">${display}</span>
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
              idle: "bg-gray8/20 text-gray8",
              ready: "bg-gray8/20 text-gray8",
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
              offline: "bg-gray8",
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
        <span className="text-gray8 w-5 before:content-[counter(option)'.']" />
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
          "flex items-center px-3 py-1 rounded cursor-pointer transition-colors",
          "text-secondary",
          "has-[[data-checked]]:bg-[light-dark(var(--vocs-color-accent),var(--vocs-color-accent8))]/10",
          "has-[[data-checked]]:text-[light-dark(var(--vocs-color-accent),var(--vocs-color-accent8))]",
          "has-[:focus-visible]:bg-[light-dark(var(--vocs-color-accent),var(--vocs-color-accent8))]/10",
          "has-[:focus-visible]:text-[light-dark(var(--vocs-color-accent),var(--vocs-color-accent8))]",
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
    <span className={cx("text-gray8", className)}>
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
          <span className="bg-[var(--text-color-muted)] text-primary rounded-full px-1.5 py-px text-[10px] leading-tight tabular-nums">
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
      <div className="flex items-center border-b border-primary px-3 py-1.5 text-gray8 shrink-0">
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
          <div className="px-2 py-3 text-gray8">No network activity</div>
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
                className="flex items-center border-b border-primary/50 px-3 py-1.5 hover:bg-surfaceTint transition-colors"
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
                <div className="min-w-0 basis-0 grow-10 text-gray8 truncate">
                  {request.description ?? "—"}
                </div>
                <div
                  className={cx(
                    "min-w-0 basis-0 grow-3 text-right tabular-nums",
                    request.status === "pending"
                      ? "text-gray8"
                      : request.statusCode && request.statusCode >= 400
                        ? "text-destructive"
                        : "text-success",
                  )}
                >
                  {request.status === "pending"
                    ? "..."
                    : (request.statusCode ?? "—")}
                </div>
                <div className="min-w-0 basis-0 grow-3 text-right tabular-nums text-gray8">
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
        <AsciiLogo morph={false} color="var(--vocs-color-gray10)" />
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

  return (
    <Block>
      <Line variant="info">
        Use <span className="text-accent">Tempo Wallet</span> and{" "}
        <span className="text-accent">authorize $5</span> to get started:
      </Line>
      {address ? (
        <Line variant="success" prefix="✓">
          Connected: {address.slice(0, 10)}…{address.slice(-8)}
        </Line>
      ) : isPending ? (
        <Line variant="loading">Connecting...</Line>
      ) : (
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
          <Toggle.Option value="sign-up">Sign Up</Toggle.Option>
          <Toggle.Option value="sign-in">Sign In</Toggle.Option>
        </Toggle>
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

  return (
    <Block>
      {isPending && <Line variant="loading">Funding wallet...</Line>}
      {funded && (
        <Line variant="success" prefix="✓">
          Wallet funded
        </Line>
      )}
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
