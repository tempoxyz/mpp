// The story topic, as both the page and the Worker read it: shared so they never disagree.

/**
 * Normalises what a visitor typed into a topic: letters, digits and common punctuation stay, other characters become spaces, runs of
 * spaces collapse, and it is cut to 40 characters. Undefined when nothing is left.
 */
export function topic(raw: string | null | undefined): string | undefined {
  const value = raw
    ?.replace(/[^\p{L}\p{N}'’,.!?\- ]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40)
    .trim();
  return value || undefined;
}
