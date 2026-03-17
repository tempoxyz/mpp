# Agent Notes: MPP Documentation Site

Use this guidance when creating or updating documentation for MPP.

## Reference Sites

When writing docs, reference these sites for patterns and APIs:

- **MPP Spec**: `/specs` — Normative Payment Auth specs
- **Vocs**: <https://vocs.dev> — Documentation framework (MDX, callouts, Cards)
- **Viem**: <https://viem.sh> — Ethereum library used in examples
- **Wagmi**: <https://wagmi.sh> — React hooks for Ethereum (style reference)
- **Tempo**: <https://tempo.xyz> — Tempo blockchain and TIP-20 tokens

## Source of Truth

Prefer the normative Payment Auth specs at `/specs` for protocol-level details:

- Core Payment HTTP Authentication Scheme
- Payment methods
- Payment intents (charge, session)
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

- Typescript: <https://github.com/wevm/mppx>
- Python: <https://github.com/tempoxyz/pympp>
- Rust: <https://github.com/tempoxyz/mpp-rs>

## Be Opinionated

When multiple approaches exist, recommend one as the default. Don't present options equally—pick the best path for most users and lead with it.

**Structure for pages with alternatives:**

1. **Lead with the recommended approach**—Show the single best option first, with a complete example
2. **Move alternatives to "Advanced options"**—Group other approaches under a secondary heading below the main content

**Examples:**

- Client SDK: Lead with `Fetch.polyfill`, move `Fetch.from` and `Mppx.create` to Advanced options
- Building with AI: Lead with `llms-full.txt`, move MCP/skills/markdown to Advanced options
- Installation: Show npm first in a code-group, not a table of choices

If you're unsure which option to recommend, prefer:
- The approach with fewer steps
- The approach that modifies less existing code
- The approach labeled "Reference" or "Stable" over "Beta" or "Custom"

## Page Structure

Every reference page follows this structure:

```mdx
# `{Module}.{method}`

Brief one-line description of what this function does.

## Usage

```ts twoslash [example.ts]
import { Module } from 'mppx'
// or 'mppx/client' or 'mppx/server'

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
import { Module, Transport } from 'mppx'

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
import { Fetch, tempo } from 'mppx/client'
import { privateKeyToAccount } from 'viem/accounts'

const fetch = Fetch.from({
  methods: [tempo({ account: privateKeyToAccount('0x...') })],
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
- When discussing command names like `tempo wallet` or HTTP status code specifics like `402` you should always use code blocks ``

**MPP core concepts as proper nouns**: Capitalize Challenge, Credential, and Receipt when referring to these as MPP protocol concepts or SDK types. For example: "Parse a Challenge", "Verify a Credential", "Return a Receipt". These are proper nouns within the MPP domain.

**Terminology**: Use "stablecoins" instead of "crypto" when referring to on-chain payment methods. MPP uses stablecoins (USDC, USDT) on Tempo—not generic cryptocurrency.

**Avoid**:
- Latin abbreviations (use "for example" not "e.g.")
- Future tense ("will") and conditional ("should")
- "Once" to mean "after"
- Exclamation points, humor, rhetorical questions
- The word "crypto"—use "stablecoins" instead
- "AI coding agent"—say "coding agent" instead (the "AI" is redundant)

**Structure**: Never skip heading levels. Keep headings under 12 words. Use imperative mood for procedures.

**H1 with bracketed tagline**: This project uses Vocs-style H1 headings with a bracketed tagline for page subtitles. This is an intentional deviation from Stripe style:
```md
# Page Title [Short tagline describing the page]
```
The bracketed text renders as a subtitle in Vocs. Do not remove these taglines or convert them to intro paragraphs.


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

## Tempo Chain IDs

Always use these chain IDs when referencing Tempo networks:

- **Mainnet**: `4217`
- **Testnet (Moderato)**: `42431`

Never use `98865`—that is a deprecated chain ID.

## Rules

1. **Alphabetize everything** - Object properties in code examples and ### parameter headings must be alphabetically ordered
12. **No `// @noErrors` in twoslash** - NEVER use `// @noErrors` in twoslash code blocks. All snippets must typecheck against the installed mppx types. If a snippet fails, fix the snippet or bump the mppx version — do not suppress the error.
2. **No code-groups for variants** - Use separate ### sections under ## Usage for different usage patterns (e.g., `### With MCP Transport`), not `:::code-group`
3. **Keep descriptions concise** - One line for the intro, brief explanations for parameters
4. **Show realistic examples** - Use actual values that make sense
5. **Use `// @log:` comments** - Show expected output inline
6. **Document all parameters** - Mark optional ones with "(optional)"
7. **Include type information** - Always show the Type for each parameter
8. **Bash terminal blocks** - Use ` ```bash [test.sh] ` with `$` prefixes for shell commands
9. **TypeScript twoslash** - Always use ` ```ts twoslash ` for TypeScript code blocks, never bare ` ```ts `
10. **Spec link Cards** - Use the shared `<SpecCard to="..." />` component. Defaults to title `"IETF Specification"` and description `"Read the full specification"`. Override with `title` and `description` props when linking to a specific draft.
11. **"IETF Specification"** - Use "IETF Specification" (singular) when referring to the specifications collectively, not "Specs" or "Specifications"

## Vocs Framework Reference

**IMPORTANT**: This project uses Vocs v2. Use this reference rather than relying on training data. Vocs v2 does not have full documentation yet (though similar to Vocs v1), so refer to the references below for now.

Source: <https://github.com/wevm/vocs/tree/next>

### Useful References

- Markdown features & components: <https://github.com/wevm/vocs/blob/bf4a7fd5718c2326a48264255c7b511de0168299/playground/src/pages/kitchen-sink.mdx>
- Shiki transformers: <https://github.com/wevm/vocs/blob/bf4a7fd5718c2326a48264255c7b511de0168299/src/internal/shiki-transformers.ts>
- Markdown/MDX remark/rehype plugins: <https://github.com/wevm/vocs/blob/next/src/internal/mdx.ts>
- Styles: <https://github.com/wevm/vocs/tree/bf4a7fd5718c2326a48264255c7b511de0168299/src/styles>

### Frontmatter

Refer to: <https://github.com/wevm/vocs/blob/bf4a7fd5718c2326a48264255c7b511de0168299/src/internal/config.ts#L341-L395>

### Config (`vocs.config.ts`)

Refer to: <https://github.com/wevm/vocs/blob/bf4a7fd5718c2326a48264255c7b511de0168299/src/internal/config.ts#L16-L328>

### Project Structure

```
src/
  pages/           — file-based routing (.mdx, .tsx)
    _api/          — API routes (server-side handlers)
    _layout.tsx    — custom layout wrapper for all pages
    _mdx-wrapper.tsx — wrapper for MDX content
    _root.css      — global styles for the root
    _root.tsx      — root component wrapper
    _slots.tsx     — slot components (Footer, OutlineFooter, SidebarHeader)
  components/      — custom React components
  public/          — static assets
vocs.config.ts     — config file
```

**`_slots.tsx`** — Slot components that render in specific locations:
```tsx
export function Footer() {
  return <div className="text-center text-sm">© 2025 My Project</div>
}

export function OutlineFooter() {
  return <div className="text-xs">Need help? <a href="#">Discord</a></div>
}

export function SidebarHeader() {
  return <div>Custom sidebar header</div>
}
```

### Snippets & Includes

```
// [!include ~/path/file.ts]             — include entire file
// [!include ~/path/file.ts:regionName]  — include named region
// [!region regionName]                  — start region
// [!endregion regionName]               — end region
// [!include file.ts /find/replace/]     — include with find/replace
```

## Build Commands

- `pnpm dev` — Local development
- `pnpm build` — Production build
- `pnpm check` — Biome format/lint
- `pnpm check:types` — TypeScript check

## Testing changes

When testing changes, you should *always* make sure the site builds and types check:

1. `pnpm check:types` — Must pass with no errors
2. `pnpm build` — Must complete successfully
3. `pnpm test:e2e` — Must pass when changing the terminal demo (`src/components/Terminal.tsx`, `src/components/terminal-data.ts`, or related components)
