import { describe, expect, it } from "vitest";
import { createCooldown } from "./cooldown";

describe("createCooldown", () => {
  it("lets a key through once per window", () => {
    const cooldown = createCooldown({ windowMs: 1_000 });
    expect(cooldown.claim("a", 0)).toBe(true);
    expect(cooldown.claim("a", 999)).toBe(false);
    expect(cooldown.claim("b", 999)).toBe(true);
    expect(cooldown.claim("a", 1_000)).toBe(true);
  });

  it("releases a claim", () => {
    const cooldown = createCooldown({ windowMs: 1_000 });
    cooldown.claim("a", 0);
    cooldown.release("a");
    expect(cooldown.claim("a", 1)).toBe(true);
  });

  it("caps the number of tracked keys", () => {
    const cooldown = createCooldown({ maxKeys: 2, windowMs: 1_000 });
    cooldown.claim("a", 0);
    cooldown.claim("b", 0);
    cooldown.claim("c", 0);
    expect(cooldown.claim("a", 1)).toBe(true);
  });
});
