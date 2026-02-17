---
name: Monochrome redesign + polish
overview: Switch from orange accent to monochrome (black/white), add HB Set font, restore co-authored section, restyle the services bar and prompt layout, and slow down the ASCII animation.
isProject: false
---

# Monochrome redesign and landing page polish

## 1. Accent color: monochrome

**[vocs.config.ts](vocs.config.ts)** - Change `accentColor` from `"#D66331"` to `"#171717"` (near-black). This makes buttons, active states, links all use black in light mode. Vocs auto-generates a lighter variant for dark mode.

**[src/components/AsciiLogo.tsx](src/components/AsciiLogo.tsx)** - Update the text shadow color from `rgba(255, 125, 60, 0.3)` to `rgba(0, 0, 0, 0.15)`. The ASCII `color` already uses `var(--vocs-color-accent)` which will now be black.

**[src/pages/_root.css](src/pages/_root.css)** - Update any hardcoded orange references:

- TOC active state `oklch(from var(--vocs-color-accent) ...)` should work automatically
- Callout CSS references to `var(--vocs-color-accent)` will auto-update
- Service logo hover `.service-logo-icon` uses `var(--vocs-color-accent)` - works automatically

## 2. Pilat font

**[src/pages/_root.css](src/pages/_root.css)** - Add `@font-face` declarations for Pilat Regular, Medium, Light weights from `/fonts/Pilat-*`.

**[src/components/LandingPage.tsx](src/components/LandingPage.tsx)** - Use Pilat as the font-family for the landing page wrapper div (replacing Berkeley Mono for the landing page hero). use on docs too  

## 3. Replace MPP logo with "Machine Payments Protocol" text in header

**[src/components/LandingPage.tsx](src/components/LandingPage.tsx)** - In the landing page `<style>` tag, hide the logo image and add text via CSS `::after` pseudo-element on `[data-v-logo]`:

```css
[data-v-logo] img { display: none !important; }
[data-v-logo]::after {
  content: "Machine Payments Protocol";
  font-size: 14px;
  font-weight: 400;
  white-space: nowrap;
}
```

## 4. Slow down ASCII animation in variant B

**[src/components/AsciiLogo.tsx](src/components/AsciiLogo.tsx)** - Increase `cycleDuration` base from `300 + random*700` to `600 + random*1200` (characters change ~2x slower). This affects the shimmer/cycling of characters.

## 5. Increase vertical padding in middle section

**[src/components/LandingPage.tsx](src/components/LandingPage.tsx)** - In `HeroVariantF`, increase the content gap from `2rem` to `2.5rem` and padding from `1rem` to `2rem`.

## 6. Add "Co-designed by Tempo and Stripe" section

**[src/components/LandingPage.tsx](src/components/LandingPage.tsx)** - Copy `TempoLogo` and `StripeLogo` SVG components from `LandingPageVariants.tsx`. Add a `CoAuthoredBy` component below the CTA buttons:

```tsx
<div className="flex items-center gap-5">
  <span className="text-xs font-medium tracking
```

## 7. Miscellaneous changes 

The codex logo in the LLM carousel is wrong -- should be OpenAI logoThe codex logo in the LLM carousel is wrong -- should be OpenAI logo
also make B the defaullt variant A and mmake B C D E forks of it with pink purplle green and teal as the color optoins (where A is white/black monochromatic) "
change the hover tooltip agent basedf on the one selected in askaagent above e.g. if claude above then claude in tooltiups buit etc.