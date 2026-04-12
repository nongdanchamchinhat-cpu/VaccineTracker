const windows = new Map<string, number[]>();

function prune(timestamps: number[], now: number, windowMs: number) {
  return timestamps.filter((timestamp) => now - timestamp < windowMs);
}

export function getRequestKey(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(":");
}

export function assertRateLimit(
  key: string,
  limit: number,
  windowMs: number,
) {
  const now = Date.now();
  const current = prune(windows.get(key) ?? [], now, windowMs);

  if (current.length >= limit) {
    const retryAt = current[0] + windowMs;
    return {
      ok: false as const,
      retryAfterSeconds: Math.max(1, Math.ceil((retryAt - now) / 1000)),
    };
  }

  current.push(now);
  windows.set(key, current);
  return {
    ok: true as const,
    retryAfterSeconds: 0,
  };
}
