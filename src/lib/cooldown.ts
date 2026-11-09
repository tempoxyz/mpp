/**
 * In-memory cooldown tracker. State lives in one server instance, so it is a
 * best-effort limit: serverless deployments run several instances and restart
 * them at any time.
 */
export type Cooldown = {
  /** Claims `key`; returns false while it has used its claims for the window. */
  claim: (key: string, now?: number) => boolean;
  /** Releases one claim, such as after the guarded work failed. */
  release: (key: string) => void;
};

/**
 * Creates a cooldown that lets each key through `limit` times per `windowMs`
 * (once by default). Holds at most `maxKeys` keys; expired keys are pruned
 * before that cap drops the oldest one.
 */
export function createCooldown(options: {
  limit?: number;
  maxKeys?: number;
  windowMs: number;
}): Cooldown {
  const { limit = 1, maxKeys = 10_000, windowMs } = options;
  const windows = new Map<string, { count: number; resetAt: number }>();

  function prune(now: number) {
    for (const [key, { resetAt }] of windows)
      if (resetAt <= now) windows.delete(key);
    while (windows.size >= maxKeys) {
      const oldest = windows.keys().next().value;
      if (oldest === undefined) break;
      windows.delete(oldest);
    }
  }

  return {
    claim(key, now = Date.now()) {
      const current = windows.get(key);
      if (current && current.resetAt > now) {
        if (current.count >= limit) return false;
        current.count++;
        return true;
      }
      windows.delete(key);
      if (windows.size >= maxKeys) prune(now);
      windows.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    },
    release(key) {
      const current = windows.get(key);
      if (!current) return;
      current.count--;
      if (current.count <= 0) windows.delete(key);
    },
  };
}
