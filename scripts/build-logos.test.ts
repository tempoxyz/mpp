import sharp from "sharp";
import { describe, expect, test } from "vitest";
import { serviceIconUrl, withLogos } from "../src/data/registry";
import { LOGO_SIZE, rasterize } from "./build-logos";

describe("rasterize", () => {
  test("fits a wide SVG into a transparent square WebP", async () => {
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100"><rect width="400" height="100" fill="#f00"/></svg>',
    );
    const webp = await rasterize(svg);
    const meta = await sharp(webp).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(LOGO_SIZE);
    expect(meta.height).toBe(LOGO_SIZE);
    expect(meta.hasAlpha).toBe(true);
    expect(webp.length).toBeLessThan(4096);
  });

  test("shrinks a large PNG", async () => {
    const png = await sharp({
      create: {
        background: { b: 200, g: 100, r: 20 },
        channels: 3,
        height: 1024,
        width: 1024,
      },
    })
      .png()
      .toBuffer();
    const webp = await rasterize(png);
    expect((await sharp(webp).metadata()).width).toBe(LOGO_SIZE);
    expect(webp.length).toBeLessThan(png.length);
  });
});

describe("service logos", () => {
  test("serviceIconUrl prefers the static logo", () => {
    expect(
      serviceIconUrl({ id: "openai", logo: "/services/logos/openai.abc.webp" }),
    ).toBe("/services/logos/openai.abc.webp");
    expect(serviceIconUrl({ id: "openai" })).toBe("/api/icon?id=openai");
  });

  test("withLogos fills in missing logos only", () => {
    const services = [
      { id: "a" },
      { id: "b", logo: "/kept.webp" },
      { id: "c" },
    ];
    expect(
      withLogos(services, { a: "/a.webp", b: "/b.webp" }).map((s) => s.logo),
    ).toEqual(["/a.webp", "/kept.webp", undefined]);
  });
});
