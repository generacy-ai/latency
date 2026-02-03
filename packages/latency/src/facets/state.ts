/**
 * Abstract interface for key-value state persistence.
 *
 * The {@link StateStore} interface defines a generic, async-first key-value
 * store that adapters can implement against any backing storage technology.
 *
 * Example implementations:
 * - **In-memory** (`Map`-backed) for tests and short-lived processes
 * - **Redis / Valkey** for shared, high-throughput state
 * - **File system** (JSON files) for local development
 * - **Database-backed** (SQLite, PostgreSQL `jsonb` column) for durable state
 * - **Cloud storage** (S3, GCS) for large or infrequently accessed values
 *
 * All operations are asynchronous to accommodate network-backed stores.
 * Implementations that are inherently synchronous (e.g., in-memory) should
 * still return resolved Promises for interface compatibility.
 *
 * @module state
 */

/**
 * Generic key-value state persistence interface.
 *
 * Provides CRUD operations and key enumeration over an arbitrary key-value
 * store. Values are stored and retrieved with generic type parameters,
 * giving callers type-safe access without requiring the store itself to
 * enforce value schemas.
 *
 * @example
 * ```typescript
 * // Retrieve a typed value
 * const count = await store.get<number>('request-count');
 *
 * // Store a value
 * await store.set('request-count', (count ?? 0) + 1);
 *
 * // Check existence before expensive work
 * if (await store.has('cache:user:42')) {
 *   return store.get<User>('cache:user:42');
 * }
 *
 * // List keys by prefix
 * const cacheKeys = await store.keys('cache:');
 * ```
 */
export interface StateStore {
  /**
   * Retrieve a value by key.
   *
   * Returns `undefined` when the key does not exist in the store,
   * allowing callers to distinguish a missing key from a stored
   * `null` value.
   *
   * @typeParam T - Expected type of the stored value. The caller is
   *   responsible for ensuring the type matches what was previously stored.
   * @param key - The unique key identifying the value.
   * @returns The stored value cast to `T`, or `undefined` if the key
   *   does not exist.
   */
  get<T = unknown>(key: string): Promise<T | undefined>;

  /**
   * Store a value under the given key.
   *
   * If the key already exists, its value is overwritten. Implementations
   * should serialize the value in a way that preserves round-trip fidelity
   * (e.g., JSON-serializable values).
   *
   * @typeParam T - Type of the value being stored.
   * @param key - The unique key to store the value under.
   * @param value - The value to store.
   */
  set<T = unknown>(key: string, value: T): Promise<void>;

  /**
   * Delete a value by key.
   *
   * Removes the key and its associated value from the store.
   *
   * @param key - The unique key to delete.
   * @returns `true` if the key existed and was deleted, `false` if the
   *   key was not present in the store.
   */
  delete(key: string): Promise<boolean>;

  /**
   * Check whether a key exists in the store.
   *
   * This is useful for existence checks that avoid deserializing the
   * value, which may be more efficient for some backing stores.
   *
   * @param key - The unique key to check.
   * @returns `true` if the key exists, `false` otherwise.
   */
  has(key: string): Promise<boolean>;

  /**
   * List all keys in the store, optionally filtered by a prefix.
   *
   * When a `prefix` is provided, only keys that start with the given
   * string are returned. This enables namespace-style key organization
   * (e.g., `"cache:"`, `"session:"`, `"user:42:"`).
   *
   * The order of returned keys is implementation-defined.
   *
   * @param prefix - Optional prefix to filter keys by. When omitted,
   *   all keys in the store are returned.
   * @returns An array of matching key strings.
   */
  keys(prefix?: string): Promise<string[]>;
}
