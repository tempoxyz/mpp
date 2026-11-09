/**
 * In-memory cooldown tracker. State lives in one server instance, so it is a
 * best-effort limit: serverless deployments run several instances and restart
 * them at any time.
 */
export type Cooldown = {
  /** Claims `key` for the cooldown window; returns false while it is cooling down. */
  claim: (key: string, now?: number) => boolean;
  /** Releases a claim, such as after the guarded work failed. */
  release: (key: string) => void;
};

/**
 * Creates a cooldown that lets each key through once per `windowMs`.
 * Holds at most `maxKeys` keys; expired keys are pruned before that cap
 * drops the oldest one.
 */
export function createCooldown(options: {
  maxKeys?: number;
  windowMs: number;
}): Cooldown {
  const { maxKeys = 10_000, windowMs } = options;
  const until = new Map<string, number>();

  function prune(now: number) {
    for (const [key, expiresAt] of until)
      if (expiresAt <= now) until.delete(key);
    while (until.size >= maxKeys) {
      const oldest = until.keys().next().value;
      if (oldest === undefined) break;
      until.delete(oldest);
    }
  }

  return {
    claim(key, now = Date.now()) {
      const expiresAt = until.get(key);
      if (expiresAt !== undefined && expiresAt > now) return false;
      until.delete(key);
      if (until.size >= maxKeys) prune(now);
      until.set(key, now + windowMs);
      return true;
    },
    release(key) {
      until.delete(key);
    },
  };
}
