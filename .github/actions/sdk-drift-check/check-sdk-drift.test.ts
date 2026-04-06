import { describe, expect, it } from "vitest";
import {
  extractSidebarLinksFromContent,
  parseLink,
  type SidebarReference,
} from "./check-sdk-drift.js";

describe("extractSidebarLinksFromContent", () => {
  const prefix = "/sdk/typescript";

  it("extracts links with double quotes", () => {
    const content = `
			{ text: "Challenge", link: "/sdk/typescript/core/Challenge.from" },
			{ text: "Credential", link: "/sdk/typescript/core/Credential.serialize" },
		`;
    const links = extractSidebarLinksFromContent(content, prefix);
    expect(links).toEqual([
      "/sdk/typescript/core/Challenge.from",
      "/sdk/typescript/core/Credential.serialize",
    ]);
  });

  it("extracts links with single quotes", () => {
    const content = `
			{ text: 'Mpay', link: '/sdk/typescript/client/Mpay.create' },
		`;
    const links = extractSidebarLinksFromContent(content, prefix);
    expect(links).toEqual(["/sdk/typescript/client/Mpay.create"]);
  });

  it("handles mixed quotes", () => {
    const content = `
			{ text: "A", link: "/sdk/typescript/core/A" },
			{ text: 'B', link: '/sdk/typescript/client/B' },
		`;
    const links = extractSidebarLinksFromContent(content, prefix);
    expect(links).toEqual([
      "/sdk/typescript/core/A",
      "/sdk/typescript/client/B",
    ]);
  });

  it("ignores links with different prefix", () => {
    const content = `
			{ text: "Home", link: "/" },
			{ text: "Docs", link: "/docs/intro" },
			{ text: "SDK", link: "/sdk/typescript/core/Challenge" },
		`;
    const links = extractSidebarLinksFromContent(content, prefix);
    expect(links).toEqual(["/sdk/typescript/core/Challenge"]);
  });

  it("returns empty array when no matches", () => {
    const content = `{ text: "Home", link: "/" }`;
    const links = extractSidebarLinksFromContent(content, prefix);
    expect(links).toEqual([]);
  });

  it("handles special characters in prefix", () => {
    const content = `{ link: "/api/v1.0/test" }`;
    const links = extractSidebarLinksFromContent(content, "/api/v1.0");
    expect(links).toEqual(["/api/v1.0/test"]);
  });
});

describe("parseLink", () => {
  const prefix = "/sdk/typescript";

  describe("core area links", () => {
    it("parses namespace with member", () => {
      const result = parseLink("/sdk/typescript/core/Challenge.from", prefix);
      expect(result).toEqual<SidebarReference>({
        link: "/sdk/typescript/core/Challenge.from",
        area: "core",
        namespace: "Challenge",
        member: "from",
      });
    });

    it("parses namespace without member", () => {
      const result = parseLink("/sdk/typescript/core/Expires", prefix);
      expect(result).toEqual<SidebarReference>({
        link: "/sdk/typescript/core/Expires",
        area: "core",
        namespace: "Expires",
      });
    });

    it("handles members with multiple dots", () => {
      const result = parseLink(
        "/sdk/typescript/core/Challenge.fromResponse",
        prefix,
      );
      expect(result).toEqual<SidebarReference>({
        link: "/sdk/typescript/core/Challenge.fromResponse",
        area: "core",
        namespace: "Challenge",
        member: "fromResponse",
      });
    });
  });

  describe("client area links", () => {
    it("parses client namespace with member", () => {
      const result = parseLink("/sdk/typescript/client/Mpay.create", prefix);
      expect(result).toEqual<SidebarReference>({
        link: "/sdk/typescript/client/Mpay.create",
        area: "client",
        namespace: "Mpay",
        member: "create",
      });
    });

    it("parses client transport methods", () => {
      const result = parseLink("/sdk/typescript/client/Transport.http", prefix);
      expect(result).toEqual<SidebarReference>({
        link: "/sdk/typescript/client/Transport.http",
        area: "client",
        namespace: "Transport",
        member: "http",
      });
    });

    it("maps method docs to the actual client export", () => {
      const result = parseLink(
        "/sdk/typescript/client/Method.tempo.charge",
        prefix,
      );
      expect(result).toEqual<SidebarReference>({
        link: "/sdk/typescript/client/Method.tempo.charge",
        area: "client",
        namespace: "tempo",
        member: "charge",
      });
    });

    it("maps session manager docs to tempo.session", () => {
      const result = parseLink(
        "/sdk/typescript/client/Method.tempo.session-manager",
        prefix,
      );
      expect(result).toEqual<SidebarReference>({
        link: "/sdk/typescript/client/Method.tempo.session-manager",
        area: "client",
        namespace: "tempo",
        member: "session",
      });
    });

    it("maps MCP client docs to the MCP SDK entrypoint", () => {
      const result = parseLink("/sdk/typescript/client/McpClient.wrap", prefix);
      expect(result).toEqual<SidebarReference>({
        link: "/sdk/typescript/client/McpClient.wrap",
        area: "client",
        namespace: "McpClient",
        member: "wrap",
        entrypoint: "mcp-sdk/client",
      });
    });

    it("maps Html docs to the html entrypoint", () => {
      const result = parseLink("/sdk/typescript/Html.init", prefix);
      expect(result).toEqual<SidebarReference>({
        link: "/sdk/typescript/Html.init",
        area: "core",
        namespace: "Html",
        member: "init",
        entrypoint: "html",
      });
    });
  });

  describe("server area links", () => {
    it("parses server namespace with member", () => {
      const result = parseLink(
        "/sdk/typescript/server/Mpay.toNodeListener",
        prefix,
      );
      expect(result).toEqual<SidebarReference>({
        link: "/sdk/typescript/server/Mpay.toNodeListener",
        area: "server",
        namespace: "Mpay",
        member: "toNodeListener",
      });
    });

    it("maps method docs to the actual server export", () => {
      const result = parseLink(
        "/sdk/typescript/server/Method.stripe.charge",
        prefix,
      );
      expect(result).toEqual<SidebarReference>({
        link: "/sdk/typescript/server/Method.stripe.charge",
        area: "server",
        namespace: "stripe",
        member: "charge",
      });
    });
  });

  describe("special entrypoints", () => {
    it("parses middleware entrypoints", () => {
      const result = parseLink("/sdk/typescript/middlewares/hono", prefix);
      expect(result).toEqual<SidebarReference>({
        link: "/sdk/typescript/middlewares/hono",
        area: "middlewares",
        namespace: "hono",
        entrypoint: "hono",
      });
    });

    it("parses proxy entrypoint", () => {
      const result = parseLink("/sdk/typescript/proxy", prefix);
      expect(result).toEqual<SidebarReference>({
        link: "/sdk/typescript/proxy",
        area: "proxy",
        namespace: "proxy",
        entrypoint: "proxy",
      });
    });

    it("parses cli entrypoint", () => {
      const result = parseLink("/sdk/typescript/cli", prefix);
      expect(result).toEqual<SidebarReference>({
        link: "/sdk/typescript/cli",
        area: "cli",
        namespace: "cli",
        entrypoint: "cli",
      });
    });

    it("parses html custom docs page as docs-only", () => {
      const result = parseLink("/sdk/typescript/html/custom", prefix);
      expect(result).toEqual<SidebarReference>({
        link: "/sdk/typescript/html/custom",
        area: "html",
        namespace: "custom",
        entrypoint: "html",
        docsOnly: true,
      });
    });
  });

  describe("top-level links (default to core)", () => {
    it("treats top-level as core area", () => {
      const result = parseLink("/sdk/typescript/Challenge.from", prefix);
      expect(result).toEqual<SidebarReference>({
        link: "/sdk/typescript/Challenge.from",
        area: "core",
        namespace: "Challenge",
        member: "from",
      });
    });

    it("handles top-level namespace without member", () => {
      const result = parseLink("/sdk/typescript/Expires", prefix);
      expect(result).toEqual<SidebarReference>({
        link: "/sdk/typescript/Expires",
        area: "core",
        namespace: "Expires",
      });
    });
  });

  describe("edge cases", () => {
    it("returns null for empty relative path", () => {
      const result = parseLink("/sdk/typescript/", prefix);
      expect(result).toBeNull();
    });

    it("returns null for exact prefix match", () => {
      const result = parseLink("/sdk/typescript", prefix);
      expect(result).toBeNull();
    });
  });
});

describe("integration: extract and parse", () => {
  const prefix = "/sdk/typescript";

  it("extracts and parses real vocs config snippet", () => {
    const vocsConfigSnippet = `
			sidebar: {
				"/": [
					{
						text: "Client Reference",
						items: [
							{
								text: "Fetch",
								collapsed: true,
								items: [
									{ text: ".from", link: "/sdk/typescript/client/Fetch.from" },
									{ text: ".polyfill", link: "/sdk/typescript/client/Fetch.polyfill" },
								],
							},
						],
					},
					{
						text: "Core Reference",
						items: [
							{
								text: "Challenge",
								collapsed: true,
								items: [
									{ text: ".deserialize", link: "/sdk/typescript/core/Challenge.deserialize" },
									{ text: ".from", link: "/sdk/typescript/core/Challenge.from" },
								],
							},
							{ text: "Expires", link: "/sdk/typescript/core/Expires" },
						],
					},
				],
			}
		`;

    const links = extractSidebarLinksFromContent(vocsConfigSnippet, prefix);
    expect(links).toHaveLength(5);

    const parsed = links
      .map((link) => parseLink(link, prefix))
      .filter((r): r is SidebarReference => r !== null);

    expect(parsed).toHaveLength(5);

    expect(parsed[0]).toMatchObject({
      area: "client",
      namespace: "Fetch",
      member: "from",
    });
    expect(parsed[1]).toMatchObject({
      area: "client",
      namespace: "Fetch",
      member: "polyfill",
    });
    expect(parsed[2]).toMatchObject({
      area: "core",
      namespace: "Challenge",
      member: "deserialize",
    });
    expect(parsed[3]).toMatchObject({
      area: "core",
      namespace: "Challenge",
      member: "from",
    });
    expect(parsed[4]).toMatchObject({
      area: "core",
      namespace: "Expires",
    });
    expect(parsed[4].member).toBeUndefined();
  });
});
