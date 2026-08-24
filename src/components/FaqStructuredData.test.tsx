// @vitest-environment happy-dom

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FAQ_ENTRIES, FaqStructuredData } from "./FaqStructuredData";

afterEach(cleanup);

describe("FaqStructuredData", () => {
  it("matches every visible FAQ heading", () => {
    const source = readFileSync(resolve("src/pages/faq.mdx"), "utf8");
    const questions = Array.from(source.matchAll(/^## (.+)$/gm), (match) =>
      match[1].replaceAll("`", ""),
    );

    expect(FAQ_ENTRIES.map(({ question }) => question)).toEqual(questions);
  });

  it("renders valid FAQPage JSON-LD", () => {
    const { container } = render(<FaqStructuredData />);
    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    const data = JSON.parse(script?.textContent ?? "") as {
      "@type": string;
      mainEntity: unknown[];
    };

    expect(data["@type"]).toBe("FAQPage");
    expect(data.mainEntity).toHaveLength(FAQ_ENTRIES.length);
  });
});
