/**
 * Shiki Style-to-Class Transformer
 *
 * Problem:
 * Shiki's dual-theme output puts a ~77-char inline `style` attribute on every
 * token <span>. There are only ~8 unique color combinations, but they repeat
 * 20K–40K times per page. This bloats uncompressed page size by 1.6–3.2 MB,
 * especially in the RSC flight payload where every span is serialized twice.
 *
 * Solution:
 * A two-phase approach:
 *
 * 1. BUILD TIME (Shiki transformer — `shikiStyleToClass`):
 *    Runs during MDX compilation. Walks every token <span>, extracts color
 *    styles into a shared class registry, replaces `style` with `class`, and
 *    stores the CSS rules needed by that code block as a `data-shiki-css`
 *    attribute on the <pre> element. Data attributes survive RSC
 *    serialization (raw <style> HAST elements get stripped by the MDX/RSC
 *    pipeline).
 *
 * 2. RUNTIME (inline script — `injectShikiColors`):
 *    A tiny self-executing script injected via `_layout.tsx`. Creates a single
 *    shared <style> tag, reads `data-shiki-css` from every <pre>, appends the
 *    rules, and removes the attribute. A MutationObserver handles code blocks
 *    that appear after client-side navigation.
 *
 * Why not simpler approaches?
 * - Vite `transformIndexHtml`: Vocs uses RSC/Waku — no traditional index.html
 *   to transform. The hook never fires for rendered pages.
 * - HAST <style> sibling: MDX component overrides in Vocs don't map <style>
 *   elements, so they get stripped during React rendering.
 * - Per-block scoped styles: Works but creates N <style> tags. This approach
 *   keeps shared class names across the build, but each block still carries
 *   the rules it needs so a page never depends on another page's code block.
 *
 * @see https://github.com/shikijs/shiki/issues/671#issuecomment-3605208867
 */

// CSS properties that represent token colors in Shiki's dual-theme output.
// These get extracted into classes; everything else stays inline.
const COLOR_PROPS = new Set([
  "color",
  "background-color",
  "--shiki-light",
  "--shiki-dark",
  "--shiki-light-bg",
  "--shiki-dark-bg",
]);

/**
 * Splits a CSS style string into color-related declarations (to be classified)
 * and non-color declarations (to remain inline on the element).
 *
 * Example:
 *   "color:#D73A49;--shiki-dark:#F47067;font-style:italic"
 *   → color: "color:#D73A49;--shiki-dark:#F47067"
 *   → rest:  "font-style:italic"
 */
function splitStyle(style: string): {
  color: string;
  rest: string;
} {
  const colorParts: string[] = [];
  const restParts: string[] = [];

  for (const raw of style.split(";")) {
    const decl = raw.trim();
    if (!decl) continue;
    const i = decl.indexOf(":");
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    if (COLOR_PROPS.has(prop)) {
      colorParts.push(decl);
    } else {
      restParts.push(decl);
    }
  }

  return {
    color: colorParts.join(";"),
    rest: restParts.join(";"),
  };
}

// biome-ignore lint/suspicious/noExplicitAny: HAST node types are untyped
type HastNode = any;

/** Recursively walk all <span> elements with a style attribute. */
function walkSpans(node: HastNode, cb: (span: HastNode) => void) {
  if (!node.children) return;
  for (const child of node.children) {
    if (child.type !== "element") continue;
    if (child.tagName === "span" && child.properties?.style) {
      cb(child);
    }
    walkSpans(child, cb);
  }
}

/**
 * Shiki transformer (build time).
 *
 * Registered in `vocs.config.ts` via `codeHighlight.transformers`. Runs after
 * all other transformers (`enforce: "post"`) so it sees the final HAST output.
 *
 * For each code block:
 * 1. Find the <pre> → <code> structure
 * 2. Walk every <span> with an inline style
 * 3. Split the style into color vs. non-color parts
 * 4. Replace color styles with a class name (from the global map)
 * 5. Store the CSS rules used by this block as `data-shiki-css` on the <pre>
 */
export function shikiStyleToClass() {
  const colorToClass = new Map<string, string>();
  let classIndex = 0;

  return {
    name: "mpp:style-to-class",
    enforce: "post" as const,
    root(root: HastNode) {
      const pre = root.children?.find(
        (n: HastNode) => n.type === "element" && n.tagName === "pre",
      );
      if (!pre) return;

      const code = pre.children?.find(
        (n: HastNode) => n.type === "element" && n.tagName === "code",
      );
      if (!code) return;

      // Collect CSS rules needed by this block.
      const blockRules = new Map<string, string>();

      walkSpans(code, (span: HastNode) => {
        const style =
          typeof span.properties.style === "string"
            ? span.properties.style
            : "";
        if (!style) return;

        const { color, rest } = splitStyle(style);
        if (!color) return;

        // Reuse existing class or create a new one
        let cls = colorToClass.get(color);
        if (!cls) {
          cls = `sc${classIndex++}`;
          colorToClass.set(color, cls);
        }
        blockRules.set(cls, color);

        // Replace inline style with class reference
        const spanClasses = span.properties.class
          ? `${span.properties.class} ${cls}`
          : cls;
        span.properties.class = spanClasses;

        // Keep non-color styles (e.g. font-style:italic) inline
        if (rest) {
          span.properties.style = rest;
        } else {
          delete span.properties.style;
        }
      });

      if (blockRules.size === 0) return;

      const css = Array.from(
        Array.from(blockRules.entries()).sort(([a], [b]) => a.localeCompare(b)),
        ([cls, style]) => `.${cls}{${style}}`,
      ).join("");

      // Attach CSS rules to the <pre> as a data attribute.
      //
      // We can't inject a <style> HAST element here because Vocs's MDX pipeline
      // maps <pre>, <code>, <span>, <div>, etc. to React components but has no
      // mapping for <style> — so it gets silently dropped during RSC rendering.
      // Data attributes on <pre> survive because CodeBlock spreads all props.
      const existing = pre.properties["data-shiki-css"];
      pre.properties["data-shiki-css"] = existing ? `${existing}${css}` : css;
    },
  };
}

/**
 * Client-side script that activates the CSS classes (runtime).
 *
 * Injected via `_layout.tsx` using dangerouslySetInnerHTML. This runs once
 * per page load and:
 *
 * 1. Creates a single shared <style data-shiki-colors> in <head>
 * 2. Finds all <pre data-shiki-css="..."> elements
 * 3. Appends their CSS rules to the shared <style> (deduplicating by content)
 * 4. Removes the data-shiki-css attribute (cleanup)
 * 5. Sets up a MutationObserver to handle code blocks added during
 *    client-side navigation (Vocs uses RSC streaming, so new <pre>
 *    elements can appear after the initial render)
 */
export const injectShikiColors = `
(function(){
  var s=document.createElement('style');
  s.dataset.shikiColors='';
  document.head.appendChild(s);
  var seen=new Set();
  function flush(){
    document.querySelectorAll('pre[data-shiki-css]').forEach(function(pre){
      var css=pre.getAttribute('data-shiki-css');
      if(css&&!seen.has(css)){seen.add(css);s.textContent+=css}
      pre.removeAttribute('data-shiki-css');
    });
  }
  flush();
  new MutationObserver(flush).observe(document.body,{childList:true,subtree:true});
})();
`;
