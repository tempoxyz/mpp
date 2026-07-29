import { randomBytes } from "node:crypto";

export const mppxSecretKey =
  process.env.MPP_SECRET_KEY ??
  (import.meta.env.DEV ? randomBytes(32).toString("base64") : undefined);
