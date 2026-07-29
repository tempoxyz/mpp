"use client";

import { Tabs } from "@base-ui/react/tabs";
import {
  type ComponentType,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useState,
} from "react";

type IconProps = { className?: string };

const LucideCheck = lazy(async () => {
  const { default: Icon } = await import("~icons/lucide/check");
  return { default: Icon };
}) as ComponentType<IconProps>;

const LucideClipboard = lazy(async () => {
  const { default: Icon } = await import("~icons/lucide/clipboard");
  return { default: Icon };
}) as ComponentType<IconProps>;

type Example = {
  html: string;
  value: string;
};

type Props = {
  installHtml: string;
  privateKeyExample: Example;
  privyExample: Example;
};

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 1000);
    return () => clearTimeout(timeout);
  }, [copied]);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(value);
    setCopied(true);
  }, [value]);

  return (
    <button
      aria-label={copied ? "Copied" : "Copy code"}
      className="vocs:absolute vocs:top-2.5 vocs:right-2.5 vocs:p-1.5 vocs:rounded-md vocs:opacity-0 vocs:transition-opacity vocs:duration-150 vocs:text-secondary vocs:hover:text-heading vocs:cursor-pointer vocs:focus-visible:opacity-100 vocs:group-hover/code:opacity-100 vocs:[@media(hover:none)]:opacity-100 vocs:data-[copied=true]:opacity-100 vocs:data-[copied=true]:text-success"
      data-copied={copied}
      onClick={copy}
      type="button"
    >
      <Suspense fallback={<span className="vocs:block vocs:size-4" />}>
        {copied ? (
          <LucideCheck className="vocs:size-4" />
        ) : (
          <LucideClipboard className="vocs:size-4" />
        )}
      </Suspense>
    </button>
  );
}

function CodeExample({ example, title }: { example: Example; title?: string }) {
  return (
    <div className="vocs:mt-4" data-v-code-container>
      {title && (
        <div data-v-code-header>
          <span data-title={title} data-v-code-title>
            {title}
          </span>
        </div>
      )}
      <div className="vocs:relative vocs:group/code">
        <div
          // biome-ignore lint/security/noDangerouslySetInnerHtml: rendered by Shiki
          dangerouslySetInnerHTML={{ __html: example.html }}
        />
        <CopyButton value={example.value} />
      </div>
    </div>
  );
}

export function SigningAccountTabsClient({
  installHtml,
  privateKeyExample,
  privyExample,
}: Props) {
  return (
    <Tabs.Root defaultValue="private-key">
      <Tabs.List className="vocs:flex vocs:border-b vocs:border-primary">
        <Tabs.Tab
          className="vocs:flex vocs:-mb-px vocs:h-10 vocs:cursor-pointer vocs:items-center vocs:border-b-[1.5px] vocs:border-transparent vocs:px-2 vocs:text-[15px] vocs:font-[350] vocs:text-secondary vocs:data-active:border-accent7 vocs:data-active:text-heading vocs:data-active:font-medium vocs:transition-colors vocs:duration-100"
          value="private-key"
        >
          Direct
        </Tabs.Tab>
        <Tabs.Tab
          className="vocs:flex vocs:-mb-px vocs:h-10 vocs:cursor-pointer vocs:items-center vocs:border-b-[1.5px] vocs:border-transparent vocs:px-2 vocs:text-[15px] vocs:font-[350] vocs:text-secondary vocs:data-active:border-accent7 vocs:data-active:text-heading vocs:data-active:font-medium vocs:transition-colors vocs:duration-100"
          value="privy"
        >
          Privy
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel className="vocs:pt-4" value="private-key">
        <p>
          Create a server-only <code>wallet.ts</code> module, then import{" "}
          <code>account</code> wherever an example creates a local signing
          account.
        </p>
        <CodeExample example={privateKeyExample} title="wallet.ts" />
      </Tabs.Panel>
      <Tabs.Panel className="vocs:pt-4" value="privy">
        <p>
          Create an EVM wallet in <a href="https://dashboard.privy.io">Privy</a>
          {
            ", fund it with the required currency on this page's network, and install "
          }
          <code>@privy-io/node</code> version <code>0.20.0</code> or later. Keep{" "}
          <code>PRIVY_APP_SECRET</code> server-side.
        </p>
        <CodeExample
          example={{ html: installHtml, value: "pnpm add @privy-io/node" }}
        />
        <p>
          Create a server-only <code>privy.ts</code> module, then import its{" "}
          <code>account</code> wherever an example configures{" "}
          <code>account</code> or <code>feePayer</code>.
        </p>
        <CodeExample example={privyExample} title="privy.ts" />
        <p>
          <code>createViemAccount</code> delegates signatures to the Privy
          wallet, so it replaces any local viem account in the examples on this
          page.
        </p>
      </Tabs.Panel>
    </Tabs.Root>
  );
}
