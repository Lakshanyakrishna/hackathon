function isPaginated(d: unknown): d is { data: unknown; meta?: unknown } {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return false;
  const keys = Object.keys(d);
  return keys.length <= 2 && 'data' in d;
}

export function unwrapData<T>(response: { data: T | { data: T; meta?: unknown } }): T {
  const d = response.data;
  if (isPaginated(d)) return d.data as T;
  return d as T;
}
