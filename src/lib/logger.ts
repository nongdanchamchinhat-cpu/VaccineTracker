export function logInfo(message: string, metadata: Record<string, unknown> = {}) {
  console.info(
    JSON.stringify({
      level: "info",
      message,
      metadata,
      at: new Date().toISOString(),
    }),
  );
}

export function logError(
  message: string,
  error: unknown,
  metadata: Record<string, unknown> = {},
) {
  const normalized =
    error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : { raw: error };

  console.error(
    JSON.stringify({
      level: "error",
      message,
      error: normalized,
      metadata,
      at: new Date().toISOString(),
    }),
  );
}
