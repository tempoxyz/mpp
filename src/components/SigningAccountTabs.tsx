import { code, withMarkdown } from "./markdown";
import { SigningAccountTabsClient } from "./SigningAccountTabsClient";

const privateKeyExample = `import { privateKeyToAccount } from 'viem/accounts'

export const account = privateKeyToAccount(process.env.PRIVATE_KEY as \`0x\${string}\`)`;

const privyExample = `import { PrivyClient } from '@privy-io/node'
import { createViemAccount } from '@privy-io/node/viem'

const privy = new PrivyClient({
  appId: process.env.PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
})

export const account = createViemAccount(privy, {
  address: process.env.PRIVY_WALLET_ADDRESS as \`0x\${string}\`,
  walletId: process.env.PRIVY_WALLET_ID!,
})`;

const themes = {
  dark: "github-dark-dimmed",
  light: "github-light",
} as const;

let highlighter: Promise<
  Awaited<ReturnType<typeof import("shiki").createHighlighter>>
>;

async function highlight(
  value: string,
  lang: "bash" | "ts",
  { hasTitle = false }: { hasTitle?: boolean } = {},
) {
  const { bundledLanguages, createHighlighter, hastToHtml } = await import(
    "shiki"
  );
  highlighter ??= createHighlighter({
    langs: [],
    themes: Object.values(themes),
  });
  const instance = await highlighter;
  if (!instance.getLoadedLanguages().includes(lang))
    await instance.loadLanguage(bundledLanguages[lang]);

  const html = hastToHtml(
    instance.codeToHast(value, {
      defaultColor: "light-dark()",
      lang,
      rootStyle: false,
      themes,
    }),
  );

  return html.replace(
    '<pre class="',
    `<pre data-v class="${hasTitle ? "vocs:rounded-t-none vocs:border-t-0 " : ""}`,
  );
}

export const SigningAccountTabs = withMarkdown(
  function SigningAccountTabs() {
    return <SigningAccountTabsContent />;
  },
  () => [
    heading("Direct"),
    paragraph(
      "Create a server-only wallet.ts module, then import account wherever an example creates a local signing account.",
    ),
    code(privateKeyExample, "ts"),
    heading("Privy"),
    paragraph(
      "Create an EVM wallet in Privy, fund it with the required currency on this page's network, and keep PRIVY_APP_SECRET server-side.",
    ),
    code("pnpm add @privy-io/node", "bash"),
    paragraph(
      "Create a server-only privy.ts module, then import its account wherever an example configures account or feePayer.",
    ),
    code(privyExample, "ts"),
    paragraph(
      "createViemAccount delegates signatures to the Privy wallet, so it replaces any local viem account in the examples on this page.",
    ),
  ],
);

async function SigningAccountTabsContent() {
  const [privateKeyHtml, privyHtml, installHtml] = await Promise.all([
    highlight(privateKeyExample, "ts", { hasTitle: true }),
    highlight(privyExample, "ts", { hasTitle: true }),
    highlight("pnpm add @privy-io/node", "bash"),
  ]);

  return (
    <SigningAccountTabsClient
      installHtml={installHtml}
      privateKeyExample={{ html: privateKeyHtml, value: privateKeyExample }}
      privyExample={{ html: privyHtml, value: privyExample }}
    />
  );
}

const heading = (value: string) => ({
  children: [{ type: "text" as const, value }],
  depth: 3,
  type: "heading" as const,
});

const paragraph = (value: string) => ({
  children: [{ type: "text" as const, value }],
  type: "paragraph" as const,
});
