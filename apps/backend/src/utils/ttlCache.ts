export interface TtlCache<V> {
  get(key: string): V | undefined;
  set(key: string, value: V): void;
  clear(): void;
}

export function createTtlCache<V>(ttlMs: number): TtlCache<V> {
  const store = new Map<string, { value: V; expiresAt: number }>();

  return {
    get(key: string): V | undefined {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key: string, value: V): void {
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
    },
    clear(): void {
      store.clear();
    },
  };
}
