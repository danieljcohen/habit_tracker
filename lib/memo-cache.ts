type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();

export async function memoizeAsync<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const existing = store.get(key) as CacheEntry<T> | undefined;
  if (existing && existing.expiresAt > now) {
    return existing.value;
  }

  const value = await fetcher();
  store.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

export function invalidateCacheKey(key: string) {
  store.delete(key);
}

export function invalidateCachePrefix(prefix: string) {
  store.forEach((_value, key) => {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  });
}


