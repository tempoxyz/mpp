# Maintaining generated Markdown

This site tests Pierre Highlights with the commit-pinned preview
`https://pkg.pr.new/vocs@1c023ba` from [Vocs #670](https://github.com/wevm/vocs/pull/670).
`codeHighlight.engine` is set to `highlights` for MDX code blocks, client-side
samples, and Twoslash hover popups. Set it to `shiki` to compare the engines.
To test a new upstream commit, update the commit pin and lockfile, then rerun
the audit, tests, and build. Use a release version when leaving the preview channel.

## Generation and enforcement

Vocs generates page Markdown, `llms.txt`, `llms-full.txt`, and
`markdown-manifest.json` from the same content inventory during every build.
Do not maintain copies by hand in `public/`. Sidebar entries order content;
they do not determine which authored pages are exported.

`markdown.output.validation` is `fail` in this repository. Both modes run the
same checks: `warn` prints findings and continues; `fail` rejects the build.
There are no separate warning/error issue categories.

```sh
pnpm check:markdown
pnpm exec vocs markdown-audit --validation warn
pnpm exec vocs markdown-audit --validation fail --json
```

For a deliberate temporary bypass:

```sh
VOCS_MARKDOWN_VALIDATION=warn pnpm build
VOCS_MARKDOWN_VALIDATION=warn pnpm check:markdown
```

The override does not hide findings or disable generation. It does not suppress
renderer exceptions, invalid configuration, or unrelated build/test failures.
CLI `--validation` takes precedence over the environment, then repository config.
Do not persist the override in CI; fix the content before returning to normal builds.

## Component contracts

Prefer Markdown AST nodes so escaping, links, and code fences are serialized by
Vocs. A component module exports a `markdown` map keyed by its actual export
name (use `default` for a default export). MDX import aliases still resolve the
original name. `context.renderChildren()` returns transformed children;
`context.inline` requires phrasing nodes instead of paragraphs/headings.

Render only static props. Identifiers, function calls, and spreads in MDX are
not executed. Invalid inputs should throw instead of silently losing content.
For a purely decorative component, an explicit `() => []` renderer is valid;
explain why it carries no information. Never use that to hide interactive
instructions that need a text equivalent.

A component module must be importable in Node. If it loads browser-only globals,
CSS, virtual icons, or Vite-only modules, register a config override by module
path and export name; the exporter then does not import the UI module.

Existing `toMarkdown()` hooks and `outputRemarkPlugins` continue to work. Move
renderers incrementally; keep site-wide transforms for content requiring page
context. Validate the complete output after every migration.

## Deployment freshness

Deploy the Markdown files and `markdown-manifest.json` from the same build as
the site. In release verification, read the manifest from the local build and
call `MarkdownOutput.verifyDeployment({ url, manifest })` from `vocs/server/markdown`.
It checks public responses against the build hashes, status, and content types.
Use the local manifest as the expected value: downloading both manifest and
content from a stale deployment cannot prove that the latest build shipped.

## MPP migration example

`src/components/SpecCard.tsx` declares `markdown.SpecCard`, preserving its link,
title, and description. Its Vocs UI dependency is lazy so Node can import the
module without resolving virtual icons. Its old name-based remark handler is removed. Renderer tests cover defaults,
custom props, inline output, and invalid inputs.

`scripts/remark-mpp-markdown.ts` still handles blog catalogs, prompts, and other
existing components. It explicitly removes `style` and `className` from native
HTML in text exports while preserving images, links, and content.

The `llms.txt` grouping logic now runs in `markdown.output.transform`, before
validation and hashing. Vocs owns the final files in development and production.
The middleware serving old build artifacts and the post-build rewrite are gone;
sections and concise descriptions are preserved without stale content or hashes.

`check:markdown` now invokes Vocs directly. The previous component allowlist
wrapper is removed. CI still runs the audit, and production builds also enforce
it. Tests cover both modes and the environment override.

The preview requires React 19.3 and Waku rc.3. The dependency bump includes the
matching React server package; the scroll-position listener replaces Waku's
removed navigation event API.
