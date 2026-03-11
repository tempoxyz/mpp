import { describe, expect, it } from "vitest";
import {
  ASCII_MPP,
  FILL_CHARS,
  NUM_PACKETS,
  PACKET_SPEED,
  TRAIL_CHARS,
  TRAIL_LENGTH,
} from "./AsciiLogo";

// ---------------------------------------------------------------------------
// ASCII_MPP
// ---------------------------------------------------------------------------

describe("ASCII_MPP", () => {
  const lines = ASCII_MPP.split("\n").filter((l) => l.length > 0);

  it("is a non-empty string", () => {
    expect(ASCII_MPP.length).toBeGreaterThan(0);
  });

  it("contains multiple lines", () => {
    expect(lines.length).toBeGreaterThan(10);
  });

  it("contains @ characters (primary fill)", () => {
    expect(ASCII_MPP).toContain("@");
  });

  it("contains % characters (secondary fill)", () => {
    expect(ASCII_MPP).toContain("%");
  });

  it("contains $ characters (accent fill)", () => {
    expect(ASCII_MPP).toContain("$");
  });

  it("all content lines have positive width", () => {
    for (const line of lines) {
      expect(line.length).toBeGreaterThan(0);
    }
  });

  it("has exactly 20 content lines", () => {
    expect(lines).toHaveLength(20);
  });

  it("uses only expected characters", () => {
    const allowed = new Set(" @#%&$=+.-:*8");
    for (const line of lines) {
      for (const ch of line) {
        expect(allowed.has(ch)).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// FILL_CHARS
// ---------------------------------------------------------------------------

describe("FILL_CHARS", () => {
  it("is a non-empty array", () => {
    expect(FILL_CHARS.length).toBeGreaterThan(0);
  });

  it("contains only single characters", () => {
    for (const ch of FILL_CHARS) {
      expect(ch).toHaveLength(1);
    }
  });

  it("contains @ as a fill character", () => {
    expect(FILL_CHARS).toContain("@");
  });

  it("contains block character █", () => {
    expect(FILL_CHARS).toContain("█");
  });

  it("has no duplicate entries", () => {
    const unique = new Set(FILL_CHARS);
    expect(unique.size).toBe(FILL_CHARS.length);
  });
});

// ---------------------------------------------------------------------------
// TRAIL_CHARS
// ---------------------------------------------------------------------------

describe("TRAIL_CHARS", () => {
  it("is a non-empty array", () => {
    expect(TRAIL_CHARS.length).toBeGreaterThan(0);
  });

  it("has 15 entries", () => {
    expect(TRAIL_CHARS).toHaveLength(15);
  });

  it("starts with bold characters and fades to lighter ones", () => {
    expect(TRAIL_CHARS[0]).toBe("●");
    expect(TRAIL_CHARS[TRAIL_CHARS.length - 1]).toBe(".");
  });

  it("contains only single characters", () => {
    for (const ch of TRAIL_CHARS) {
      expect(ch).toHaveLength(1);
    }
  });
});

// ---------------------------------------------------------------------------
// Network simulation constants
// ---------------------------------------------------------------------------

describe("network simulation constants", () => {
  it("PACKET_SPEED is a positive number", () => {
    expect(PACKET_SPEED).toBeGreaterThan(0);
    expect(PACKET_SPEED).toBeLessThan(5);
  });

  it("TRAIL_LENGTH is a positive integer", () => {
    expect(TRAIL_LENGTH).toBeGreaterThan(0);
    expect(Number.isInteger(TRAIL_LENGTH)).toBe(true);
  });

  it("NUM_PACKETS is a positive integer", () => {
    expect(NUM_PACKETS).toBeGreaterThan(0);
    expect(Number.isInteger(NUM_PACKETS)).toBe(true);
  });

  it("TRAIL_LENGTH matches TRAIL_CHARS length", () => {
    expect(TRAIL_LENGTH).toBe(TRAIL_CHARS.length);
  });
});
