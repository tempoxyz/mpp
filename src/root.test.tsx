import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Root from "./pages/_root";

vi.mock("virtual:vocs/group-icons.css?url", () => ({ default: "/icons.css" }));
vi.mock("virtual:vocs/user-styles", () => ({ default: "/user.css" }));
vi.mock("./components/SiteRootClient", () => ({
  SiteRootClient: ({ children }: { children: React.ReactNode }) => children,
}));

describe("document font preloads", () => {
  it("renders the body and code fonts before styles without a Vite HTML hook", () => {
    const html = renderToStaticMarkup(<Root>Documentation</Root>);
    const links = html.match(/<link\b[^>]*>/g) ?? [];
    const fonts = links.filter((link) => link.includes('as="font"'));

    expect(fonts).toHaveLength(2);
    for (const [index, name] of [
      "Geist-Variable",
      "GeistMono-Variable",
    ].entries()) {
      expect(fonts[index]).toContain(`href="/fonts/${name}.woff2"`);
      expect(fonts[index]).toContain('rel="preload"');
      expect(fonts[index]).toContain('type="font/woff2"');
      expect(fonts[index]).toContain('crossorigin="anonymous"');
      expect(html.indexOf(fonts[index])).toBeLessThan(
        html.indexOf('rel="stylesheet"'),
      );
    }
    expect(html).not.toContain("/fonts/Geist-Regular.woff2");
    expect(html).not.toContain("/fonts/Geist-Medium.woff2");
  });
});
