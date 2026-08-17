const localExampleSecretKey = "local-development-only-example-key";

export function resolveMppxSecretKey({
  isDevelopment,
  secretKey,
}: {
  isDevelopment: boolean;
  secretKey?: string;
}) {
  if (!secretKey && !isDevelopment) {
    throw new Error("MPP_SECRET_KEY is required outside development/test");
  }
  
  return secretKey ?? localExampleSecretKey;
}

export const mppxSecretKey = resolveMppxSecretKey({
  isDevelopment: import.meta.env.DEV,
  secretKey: process.env.MPP_SECRET_KEY,
});