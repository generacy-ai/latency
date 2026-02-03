/**
 * A cache entry wrapping a value with its insertion timestamp.
 *
 * Used by {@link AbstractIssueTrackerPlugin} to implement TTL-based caching.
 *
 * @typeParam T - The type of the cached value.
 */
export interface CacheEntry<T> {
  /** The cached value. */
  value: T;
  /** Timestamp (from `Date.now()`) when the entry was cached. */
  cachedAt: number;
}

/**
 * Create a new cache entry for the given value using the current timestamp.
 *
 * @param value - The value to cache.
 * @returns A {@link CacheEntry} wrapping the value with the current time.
 */
export function createCacheEntry<T>(value: T): CacheEntry<T> {
  return { value, cachedAt: Date.now() };
}

/**
 * Check whether a cache entry has exceeded the given TTL.
 *
 * @param entry - The cache entry to check.
 * @param timeout - The TTL in milliseconds.
 * @returns `true` if the entry is expired, `false` otherwise.
 */
export function isCacheExpired<T>(entry: CacheEntry<T>, timeout: number): boolean {
  return Date.now() - entry.cachedAt > timeout;
}
