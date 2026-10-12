export type PicsumSize = 200 | 1024;

const FALLBACK_URLS: Record<PicsumSize, string> = {
  200: "https://picsum.photos/id/237/200/200",
  1024: "https://picsum.photos/id/237/1024/1024",
};

export const PICSUM_UNAVAILABLE_WARNING =
  "Using canned photo because Picsum is unavailable right now.";

/** Fetch a Picsum redirect URL, or a canned URL so paid handlers can still issue a Receipt. */
export async function resolvePicsumPhotoUrl(
  size: PicsumSize,
  logLabel: string,
): Promise<{ url: string; warning?: string }> {
  try {
    const res = await fetch(`https://picsum.photos/${size}/${size}`);
    if (!res.ok) throw new Error(`upstream responded ${res.status}`);
    return { url: res.url };
  } catch (error) {
    console.error(`[${logLabel}] upstream fetch failed:`, error);
    return {
      url: FALLBACK_URLS[size],
      warning: PICSUM_UNAVAILABLE_WARNING,
    };
  }
}
