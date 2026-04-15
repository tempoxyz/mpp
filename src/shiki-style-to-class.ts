const COLOR_PROPS = new Set([
  "color",
  "background-color",
  "--shiki-light",
  "--shiki-dark",
  "--shiki-light-bg",
  "--shiki-dark-bg",
]);

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

// biome-ignore lint/suspicious/noExplicitAny: HAST node types
type HastNode = any;

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
 * Global color→class registry shared across all code blocks.
 * Since the same Shiki themes produce the same color strings site-wide,
 * a single global map deduplicates them into one set of class names.
 * Only the first code block that encounters a new color emits a CSS rule.
 */
const colorToClass = new Map<string, string>();
let classIndex = 0;

/**
 * Shiki transformer that replaces repeated inline color styles with CSS classes.
 *
 * Shiki's dual-theme output puts a ~77-char `style` attribute on every token span
 * (e.g. `color:light-dark(#D73A49,#F47067);--shiki-light:#D73A49;--shiki-dark:#F47067`).
 * With only ~8 unique color combinations repeated 20K–40K times, this bloats
 * uncompressed page size by 1.6–3.2 MB — especially in the RSC flight payload.
 *
 * This transformer deduplicates those styles into global CSS classes. New CSS
 * rules are stored on the `<pre>` element via a `data-shiki-css` attribute,
 * then injected into a shared `<style>` tag at runtime by
 * {@link injectShikiColors}.
 */
export function shikiStyleToClass() {
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

      const newRules: [string, string][] = [];

      walkSpans(code, (span: HastNode) => {
        const style =
          typeof span.properties.style === "string"
            ? span.properties.style
            : "";
        if (!style) return;

        const { color, rest } = splitStyle(style);
        if (!color) return;

        let cls = colorToClass.get(color);
        if (!cls) {
          cls = `sc${classIndex++}`;
          colorToClass.set(color, cls);
          newRules.push([color, cls]);
        }

        const spanClasses = span.properties.class
          ? `${span.properties.class} ${cls}`
          : cls;
        span.properties.class = spanClasses;

        if (rest) {
          span.properties.style = rest;
        } else {
          delete span.properties.style;
        }
      });

      if (newRules.length === 0) return;

      const css = newRules.map(([style, cls]) => `.${cls}{${style}}`).join("");

      // Store CSS on the <pre> element as a data attribute.
      // A <style> HAST element would be stripped by the MDX/RSC pipeline,
      // but data attributes survive through React rendering.
      const existing = pre.properties["data-shiki-css"];
      pre.properties["data-shiki-css"] = existing ? `${existing}${css}` : css;
    },
  };
}

/**
 * Inline script that reads `data-shiki-css` attributes from `<pre>` elements
 * and injects the rules into a shared `<style>` tag. Call this once in the
 * page layout. It handles both initial load and client-side navigation via
 * MutationObserver.
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
