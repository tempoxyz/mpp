const localExampleSecretKey = "local-development-only-example-key";

export function resolveMppxSecretKey({
  isDevelopment,
  lifecycleEvent,
  secretKey,
}: {
  isDevelopment: boolean;
  lifecycleEvent?: string;
  secretKey?: string;
}) {
  return (
    secretKey ??
    (isDevelopment || lifecycleEvent === "build"
      ? localExampleSecretKey
      : undefined)
  );
}

export const mppxSecretKey = resolveMppxSecretKey({
  isDevelopment: import.meta.env.DEV,
  lifecycleEvent: process.env.npm_lifecycle_event,
  secretKey: process.env.MPP_SECRET_KEY,
});
