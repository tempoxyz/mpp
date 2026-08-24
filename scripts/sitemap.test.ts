import { describe, expect, it } from "vitest";
import { assertSitemapXml, pruneSitemapXml } from "./sitemap";

const entry = (location: string) => `
  <url>
    <loc>${location}</loc>
    <lastmod>2026-08-24</lastmod>
  </url>`;

describe("pruneSitemapXml", () => {
  it("removes duplicate and 404 routes", () => {
    const sitemap = `<urlset>${entry("https://mpp.dev/")}${entry(
      "https://mpp.dev/blog",
    )}${entry("https://mpp.dev/")}${entry(
      "https://mpp.dev/blog/",
    )}${entry("https://mpp.dev/404")}</urlset>`;

    const result = pruneSitemapXml(sitemap);

    expect(result.match(/<loc>https:\/\/mpp\.dev\/<\/loc>/g)).toHaveLength(1);
    expect(result.match(/<loc>https:\/\/mpp\.dev\/blog<\/loc>/g)).toHaveLength(
      1,
    );
    expect(result).not.toContain("https://mpp.dev/blog/");
    expect(result).not.toContain("https://mpp.dev/404");
  });

  it("keeps the first complete entry for each location", () => {
    const sitemap = `<urlset>${entry("https://mpp.dev/overview")}${entry(
      "https://mpp.dev/overview",
    )}</urlset>`;

    expect(pruneSitemapXml(sitemap)).toBe(
      `<urlset>${entry("https://mpp.dev/overview")}</urlset>`,
    );
  });

  it("rejects duplicate and 404 routes before publication", () => {
    expect(() =>
      assertSitemapXml(
        `<urlset>${entry("https://mpp.dev/blog")}${entry(
          "https://mpp.dev/blog/",
        )}</urlset>`,
      ),
    ).toThrow("Duplicate sitemap locations");
    expect(() =>
      assertSitemapXml(`<urlset>${entry("https://mpp.dev/404")}</urlset>`),
    ).toThrow("Sitemap must not contain /404");
  });

  it("accepts the pruned sitemap", () => {
    const sitemap = `<urlset>${entry("https://mpp.dev/")}${entry(
      "https://mpp.dev/blog",
    )}${entry("https://mpp.dev/blog/")}</urlset>`;

    expect(() => assertSitemapXml(pruneSitemapXml(sitemap))).not.toThrow();
  });
});
