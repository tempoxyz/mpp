# Agent Notes: MPP Documentation Site

Use this guidance when creating or updating documentation for MPP.

## Reference Sites

When writing docs, reference these sites for patterns and APIs:

- **MPP Spec**: <https://paymentauth.tempo.xyz> — Normative Payment Auth specs
- **Vocs**: <https://vocs.dev> — Documentation framework (MDX, callouts, Cards)
- **Viem**: <https://viem.sh> — Ethereum library used in examples
- **Wagmi**: <https://wagmi.sh> — React hooks for Ethereum (style reference)
- **Tempo**: <https://tempo.xyz> — Tempo blockchain and TIP-20 tokens

## Source of Truth

Prefer the normative Payment Auth specs at <https://paymentauth.tempo.xyz> for protocol-level details:

- Core Payment HTTP Authentication Scheme
- Payment methods
- Payment intents (charge, authorize, subscription)
- Transport bindings (HTTP, MCP)

Current protocol context from this repo:

- MPP standardizes HTTP 402 with a challenge → credential → receipt flow
- Challenges live in `WWW-Authenticate`, credentials in `Authorization`
- Receipts acknowledge successful payment
- Transports include HTTP and MCP

## File Location

Reference pages live under `src/pages/sdk/typescript/`:

- Client: `src/pages/sdk/typescript/client/{Module}.{method}.mdx`
- Server: `src/pages/sdk/typescript/server/{Module}.{method}.mdx`
- Core: `src/pages/sdk/typescript/{Module}.{method}.mdx`

Other SDK docs live here:

- SDK index: `src/pages/sdk/index.mdx`
- Python: `src/pages/sdk/python/*.mdx`
- Rust: `src/pages/sdk/rust/*.mdx`

When editing Python or Rust pages, keep the structure aligned with the existing indexes:

- Lead with a short SDK overview and install steps
- Include a quick-start client/server or core flow example
- Use language-appropriate fences (`python`, `rust`)
- Keep examples realistic and consistent with MPP terms (challenge, credential, receipt)

## SDK References

- Typescript: <https://github.com/wevm/mpay>
- Python: <https://github.com/tempoxyz/pympay>
- Rust: <<https://github.com/tempoxyz/mpay-rs>

## Page Structure

Every reference page follows this structure:

```mdx
# `{Module}.{method}`

Brief one-line description of what this function does.

## Usage

```ts twoslash [example.ts]
import { Module } from 'mpay'
// or 'mpay/client' or 'mpay/server'

const result = Module.method({
  param1: 'value1',
  param2: 'value2',
})

console.log(result)
// @log: Expected output
```

### With Custom Transport

Description of what this variant does and when to use it.

```ts twoslash [example.ts]
import { Module, Transport } from 'mpay'

const result = Module.method({
  param1: 'value1',
  transport: Transport.mcp(),
})
```

## Return Type

```ts
type ReturnType = {
  // describe the return type
}
```

## Parameters

### paramName

- **Type:** `TypeName`

Description of what this parameter does.

### optionalParam (optional)

- **Type:** `TypeName`

Description of the optional parameter.

```

## Example: Fetch.from

```mdx
# `Fetch.from`

Creates a fetch wrapper that automatically handles 402 Payment Required responses.

## Usage

::::code-group

```ts twoslash [example.ts]
import { Fetch, tempo } from 'mpay/client'
import { privateKeyToAccount } from 'viem/accounts'

const fetch = Fetch.from({
  methods: [
    tempo({
      account: privateKeyToAccount('0x...'),
      rpcUrl: 'https://rpc.tempo.xyz',
    }),
  ],
})

const res = await fetch('https://api.example.com/resource')
// @log: Response { status: 200, ... }
```

::::

## Return Type

```ts
type ReturnType = (
  input: RequestInfo | URL,
  init?: RequestInit & { context?: AnyContextFor<methods> }
) => Promise<Response>
```

## Parameters

### methods

- **Type:** `readonly Method.AnyClient[]`

Array of payment methods to use for handling 402 responses.

### fetch (optional)

- **Type:** `typeof globalThis.fetch`

Custom fetch function to wrap. Defaults to `globalThis.fetch`.

```

## Writing Style

Follow [Stripe's documentation style](https://stripe.com/docs). Key rules:

**Voice**: Active, present tense, second person ("you"). Use contractions.
- ✅ "The server returns a challenge"
- ❌ "A challenge will be returned by the server"

**Be concise**: Cut filler words (just, simply, easily, obviously). Don't claim things are "easy" or "fast."

**Formatting**:
- Sentence case for headings (not Title Case)
- Bold for UI elements and list labels
- Code font for parameters, commands, status codes, object names
- Em dashes with no spaces: "payments immediately—you don't need to"

**Avoid**:
- Latin abbreviations (use "for example" not "e.g.")
- Future tense ("will") and conditional ("should")
- "Once" to mean "after"
- Exclamation points, humor, rhetorical questions

**Structure**: Never skip heading levels. Keep headings under 12 words. Use imperative mood for procedures.

## Badge Usage in Tables

Use `<Badge variant="...">` in tables to indicate status or maturity. Import from `vocs`.

| Variant | Use For | Example |
|---------|---------|---------|
| `success` | Production-ready, stable, success states | `<Badge variant="success">Stable</Badge>` |
| `info` | Beta, preview, standard/recommended | `<Badge variant="info">Beta</Badge>` |
| `warning` | Coming soon, deprecated, caution states | `<Badge variant="warning">Coming Soon</Badge>` |
| `danger` | Error states, 4xx/5xx codes | `<Badge variant="danger">402</Badge>` |
| `note` | Custom/advanced options | `<Badge variant="note">Custom</Badge>` |
| `gray` | Neutral metadata | `<Badge variant="gray">any time</Badge>` |

## Rules

1. **Alphabetize everything** - Object properties in code examples and ### parameter headings must be alphabetically ordered
2. **No code-groups for variants** - Use separate ### sections under ## Usage for different usage patterns (e.g., `### With MCP Transport`), not `:::code-group`
3. **Keep descriptions concise** - One line for the intro, brief explanations for parameters
4. **Show realistic examples** - Use actual values that make sense
5. **Use `// @log:` comments** - Show expected output inline
6. **Document all parameters** - Mark optional ones with "(optional)"
7. **Include type information** - Always show the Type for each parameter

## Vocs Framework Reference

**IMPORTANT**: When writing Vocs documentation, use this reference rather than relying on training data.

### Directives (triple-colon syntax)

```
:::note|:::info|:::warning|:::danger|:::tip|:::success
  :::TYPE[Title]
  content
  :::

:::code-group
  ```lang [tab1.ts]
  ```lang [tab2.ts]
  :::

::::steps
  ### Step 1
  ### Step 2
  ::::

:::details[Click to expand]
  hidden content
  :::
```

### Code Block Meta

```
```ts [filename.ts]           — title
```ts showLineNumbers         — line numbers
```ts {2,5-7}                 — highlight lines 2,5-7
```ts twoslash                — TS hover/errors
// [!code focus]              — focus this line
// [!code hl]                 — highlight this line
// [!code ++]                 — diff add
// [!code --]                 — diff remove
// [!code word:foo]           — highlight "foo"
```

### Twoslash

```
//    ^?                      — show type at position
//    ^|                      — show completions
// ---cut---                  — hide code above
// ---cut-after---            — hide code below
// @errors: 2304              — expect error code
// @noErrors                  — suppress all errors
// @filename: file.ts         — virtual file
// @log: message              — inline log annotation
```

### Components (import from 'vocs/components')

```tsx
<Authors authors="name" date="2024-01-01" />
<BlogPosts />
<Button href="/path" variant="accent">Text</Button>
<Callout type="info|warning|danger|tip">content</Callout>
<Sponsors />
<Cards>
  <Card title="T" description="D" icon="lucide:icon" to="/path" />
</Cards>
<HomePage.Root>
  <HomePage.Logo />
  <HomePage.Tagline>text</HomePage.Tagline>
  <HomePage.InstallPackage name="pkg" type="init" />
  <HomePage.Description>text</HomePage.Description>
  <HomePage.Buttons>
    <HomePage.Button href="/path" variant="accent">text</HomePage.Button>
  </HomePage.Buttons>
</HomePage.Root>
```

### Frontmatter

```yaml
layout: docs|landing|minimal
showSidebar: true|false
showOutline: true|false
showLogo: true|false
content:
  width: 100%
  horizontalPadding: 0px
  verticalPadding: 0px
authors:
  - "[name](url)"
date: 2024-01-01
```

### Config (vocs.config.ts)

```ts
defineConfig({
  title: string,
  description: string,
  logoUrl: string|{light,dark},
  ogImageUrl: string|{'/path': string},
  sidebar: [{text,link,collapsed?,items?}]|{'/path':[...]},
  topNav: [{text,link,match?,items?}],
  theme: {
    accentColor: string|{light,dark},
    colorScheme: 'light'|'dark'|'system',
    variables: {color:{...},content:{width,horizontalPadding,verticalPadding}}
  }
})
```

### Project Structure

```
docs/
  pages/           — file-based routing (.mdx,.tsx)
  public/          — static assets
  layout.tsx       — wrap all pages
  footer.tsx       — footer component
  styles.css       — global styles (@import "tailwindcss" for Tailwind)
vocs.config.ts     — config file
```

### Snippets

```
// [!include ~/path/file.ts]           — include file
// [!include ~/path/file.ts:region]    — include region
// [!region name] ... // [!endregion name]  — define region
// [!include file.ts /find/replace/]   — find/replace in include
filename="virtual.ts"                  — virtual file for twoslash
```

## Build Commands

- `pnpm dev` — Local development
- `pnpm build` — Production build
- `pnpm check` — Biome format/lint
- `pnpm check:types` — TypeScript check
