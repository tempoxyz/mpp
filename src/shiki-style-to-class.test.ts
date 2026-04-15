import { describe, it, expect } from "vitest";
import { shikiStyleToClass } from "./shiki-style-to-class.js";

// biome-ignore lint/suspicious/noExplicitAny: test helpers
function makeRoot(spans: { style: string }[]): any {
  return {
    type: "root",
    children: [
      {
        type: "element",
        tagName: "pre",
        properties: { class: "shiki shiki-themes github-light github-dark-dimmed" },
        children: [
          {
            type: "element",
            tagName: "code",
            properties: {},
            children: spans.map((s) => ({
              type: "element",
              tagName: "span",
              properties: { style: s.style },
              children: [{ type: "text", value: "token" }],
            })),
          },
        ],
      },
    ],
  };
}

describe("shikiStyleToClass", () => {
  it("replaces inline color styles with CSS classes", () => {
    const transformer = shikiStyleToClass();

    const style1 = "color:light-dark(#D73A49, #F47067);--shiki-light:#D73A49;--shiki-dark:#F47067";
    const style2 = "color:light-dark(#24292E, #ADBAC7);--shiki-light:#24292E;--shiki-dark:#ADBAC7";

    const root = makeRoot([
      { style: style1 },
      { style: style2 },
      { style: style1 }, // duplicate
      { style: style1 }, // duplicate
      { style: style2 }, // duplicate
    ]);

    // Call root hook
    transformer.root.call({} as any, root as any);

    // Should have injected a <style> element before <pre>
    expect(root.children.length).toBe(2); // <style> + <pre>
    expect(root.children[0].tagName).toBe("style");
    expect(root.children[1].tagName).toBe("pre");

    // Check CSS content
    const css = root.children[0].children[0].value;
    expect(css).toContain(".s0{");
    expect(css).toContain(".s1{");
    expect(css).toContain("color:light-dark(#D73A49, #F47067)");
    console.log("Generated CSS:", css);

    // Check spans no longer have style, but have class
    const code = root.children[1].children[0];
    for (const span of code.children) {
      expect(span.properties.style).toBeUndefined();
      expect(span.properties.class).toMatch(/s\d/);
    }

    // Check deduplication: 2 unique styles -> 2 classes
    const uniqueClasses = new Set(code.children.map((s: any) => s.properties.class));
    expect(uniqueClasses.size).toBe(2);
  });

  it("preserves non-color style properties", () => {
    const transformer = shikiStyleToClass();

    const root = makeRoot([
      { style: "color:light-dark(#D73A49, #F47067);--shiki-light:#D73A49;--shiki-dark:#F47067;font-style:italic" },
    ]);

    transformer.root.call({} as any, root as any);

    const span = root.children[1].children[0].children[0];
    // Should keep font-style inline
    expect(span.properties.style).toBe("font-style:italic");
    // Should also have a class for the color
    expect(span.properties.class).toMatch(/s\d/);
  });

  it("does nothing when no <pre> found", () => {
    const transformer = shikiStyleToClass();
    const root = { type: "root", children: [{ type: "element", tagName: "div", properties: {}, children: [] }] };
    transformer.root.call({} as any, root as any);
    expect(root.children.length).toBe(1);
  });
});
