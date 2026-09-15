import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Challenge, Credential } from "mppx";
import { describe, expect, it } from "vitest";

const pages = resolve(import.meta.dirname, "../src/pages/protocol");
const challenges = readFileSync(resolve(pages, "challenges.mdx"), "utf8");
const credentials = readFileSync(resolve(pages, "credentials.mdx"), "utf8");
const header = challenges.match(/WWW-Authenticate: ([^\n]+)/)?.[1];
if (!header) throw new Error("Missing Challenge header example");
const challenge = Challenge.deserialize(header);

describe("protocol wire examples", () => {
  it("encodes the displayed request and opaque objects", () => {
    for (const [label, actual] of [
      ["request", challenge.request],
      [
        "opaque",
        JSON.parse(Buffer.from(challenge.opaque!, "base64url").toString()),
      ],
    ]) {
      const block = challenges.match(
        new RegExp(
          `\`\`\`json \\[Decoded ${label} object\\]\\n([\\s\\S]*?)\`\`\``,
        ),
      );
      expect(block).not.toBeNull();
      expect(actual).toEqual(JSON.parse(block![1]!));
    }
  });

  it.each([
    "Authorization",
    "Payment-Authorization",
  ])("deserializes the %s header with matching payment terms", (name) => {
    const value = credentials.match(
      new RegExp(`^${name}: (Payment .+)$`, "m"),
    )?.[1];
    expect(value).toBeDefined();
    const parsed = Credential.deserialize(value!);
    expect(parsed.challenge.request).toEqual(challenge.request);
    expect(parsed.challenge.opaque).toEqual(challenge.opaque);
    expect(parsed.challenge.header).toBe(
      name === "Authorization" ? undefined : name,
    );
  });

  it("keeps decoded Credential examples identical to the custom header", () => {
    const value = credentials.match(
      /^Payment-Authorization: Payment (.+)$/m,
    )?.[1];
    expect(value).toBeDefined();
    const wire = JSON.parse(Buffer.from(value!, "base64url").toString());
    const blocks = [...credentials.matchAll(/```json\n([\s\S]*?)```/g)];
    expect(blocks.length).toBeGreaterThan(0);
    for (const block of blocks) expect(JSON.parse(block[1]!)).toEqual(wire);
    expect(Credential.deserialize(`Payment ${value}`).challenge).toEqual(
      challenge,
    );
  });
});
