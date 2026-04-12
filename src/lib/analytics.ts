export function trackEvent(
  name: string,
  metadata: Record<string, unknown> = {},
) {
  console.info(
    JSON.stringify({
      level: "info",
      kind: "analytics",
      name,
      metadata,
      at: new Date().toISOString(),
    }),
  );
}
