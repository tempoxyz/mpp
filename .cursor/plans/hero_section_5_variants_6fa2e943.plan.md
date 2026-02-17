---
name: Redesigned landing page and theming
overview: Redesign the MPP documentation site landing page with a new hero section, orange accent theming, dark mode support, updated navigation, and new "For Humans" content section.
todos:
  - id: landing-page
    content: Redesigned single-viewport landing page with ASCII logo hero, agent CLI tabs, CTA buttons, and service logos
    status: completed
  - id: theming
    content: Orange accent (#FF7D3C), light+dark color scheme, Berkeley Mono font, comprehensive dark mode CSS
    status: completed
  - id: navigation
    content: Simplified top nav (Docs, SDKs dropdown, X link), restructured sidebar with "Setup & use" and "Integrate now" sections
    status: completed
  - id: for-humans
    content: New /setup section with agents, integrate, and FAQ pages
    status: completed
  - id: logo-svg
    content: Updated site logos to SVG format with proper light/dark variants
    status: completed
  - id: styling
    content: Card hover effects, callout link styling, sidebar active state, heading spacing, service logo row
    status: completed
isProject: false
---

# Redesigned landing page and theming

## Summary

Single-variant landing page redesign for the MPP documentation site. The hero fills the viewport (100vh) with a vertically centered layout: ASCII animation, subtitle, agent CLI tabs (Claude / Codex / Amp), CTA buttons, and a row of service logos at the bottom.

## What changed

### Landing page (`src/components/LandingPage.tsx`)

- **Hero**: Full-viewport section with `AsciiLogo`, subtitle copy, agent CLI tabs, and two CTA buttons ("Setup & use" → `/setup/agents`, "Integrate now" → `/specs`)
- **Agent tabs**: Tabbed component showing copy-pasteable CLI commands for Claude, Codex, and Amp with a click-to-copy button
- **Service logos**: fal.ai, Codex, Cloudflare, OpenRouter, ElevenLabs—icon + name, linking to the services list
- **Scroll lock**: Page locks to 100vh on the landing route so the hero fills the screen

### Theming and styling (`_root.css`, `vocs.config.ts`)

- Accent color changed from blue (`#0166FF`) to orange (`#FF7D3C`)
- Color scheme set to `"light dark"` for system-preference dark mode
- Berkeley Mono and Commit Mono font imports
- Comprehensive dark mode overrides for cards, callouts, sidebar, headings, code blocks
- Card hover effects, callout link styling, sidebar active state white text, heading padding

### Navigation (`vocs.config.ts`)

- Top nav simplified to: Docs, SDKs (dropdown with TypeScript/Python/Rust), X (Twitter)
- Sidebar restructured into "Setup & use" (agents, integrate, FAQ) and "Integrate now" (collapsed groups for Introduction, Quick Start, Protocol, Payment Methods, SDKs)

### New content pages

- `/setup` — landing index for non-developer audience
- `/setup/agents` — guide for using MPP with AI agents
- `/setup/integrate` — integration guide for app developers
- `/setup/faq` — frequently asked questions

### Logo updates

- Site logos converted from PNG to SVG (`mpp-logo-light.svg`, `mpp-logo-dark.svg`)
- Codex logo updated to official monochrome brand asset

## Files changed


| File                                     | Change                                                            |
| ---------------------------------------- | ----------------------------------------------------------------- |
| `src/components/LandingPage.tsx`         | Redesigned single-viewport hero with agent tabs and service logos |
| `src/components/AsciiLogo.tsx`           | Updated ASCII animation component                                 |
| `src/components/LandingPageVariants.tsx` | Added during iteration (variant exploration)                      |
| `src/pages/_root.css`                    | Orange accent, dark mode, card/callout/sidebar styling            |
| `vocs.config.ts`                         | Accent color, color scheme, nav, sidebar restructure              |
| `public/mpp-logo-*.svg`                  | SVG logo variants                                                 |
| `src/pages/setup/*.mdx`                  | New "For Humans" content section                                  |
| `src/pages/overview.mdx`                 | Minor updates                                                     |
| `src/pages/protocol/index.mdx`           | Minor updates                                                     |


