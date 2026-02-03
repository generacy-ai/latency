/**
 * Abstract interface for secure credential and secret storage.
 *
 * SecretStore provides a uniform API for storing, retrieving, and managing
 * secrets (API keys, tokens, passwords, connection strings, etc.) regardless
 * of the underlying storage backend.
 *
 * All values are opaque strings -- serialization and deserialization of
 * structured data is the caller's responsibility.
 *
 * Example implementations:
 * - AWS Secrets Manager
 * - HashiCorp Vault
 * - Azure Key Vault
 * - Environment variables
 * - Encrypted file store
 * - OS keychain (macOS Keychain, Windows Credential Manager)
 *
 * @module secrets
 */

/**
 * Secure credential storage facet.
 *
 * Provides async CRUD operations for secret values keyed by string
 * identifiers. Implementations must ensure that secret material is
 * handled securely (encrypted at rest, audited, access-controlled, etc.).
 *
 * All operations are async-first to accommodate network-backed stores.
 * On failure, implementations should throw {@link FacetError} with an
 * appropriate error code.
 *
 * @example
 * ```typescript
 * // Retrieve a database password
 * const password = await secrets.getSecret('db/prod/password');
 * if (password === undefined) {
 *   throw new Error('Database password not configured');
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Rotate an API key
 * const newKey = generateApiKey();
 * await secrets.setSecret('service/api-key', newKey);
 * ```
 */
export interface SecretStore {
  /**
   * Retrieve a secret by key.
   *
   * Returns the secret value if it exists, or `undefined` if no secret is
   * stored under the given key.
   *
   * @param key - The unique identifier for the secret.
   * @returns The secret value, or `undefined` if not found.
   *
   * @example
   * ```typescript
   * const token = await secrets.getSecret('github/token');
   * if (token !== undefined) {
   *   headers.set('Authorization', `Bearer ${token}`);
   * }
   * ```
   */
  getSecret(key: string): Promise<string | undefined>;

  /**
   * Store a secret under the given key.
   *
   * If a secret already exists for the key, it is overwritten. The value
   * is an opaque string -- callers are responsible for any serialization.
   *
   * @param key - The unique identifier for the secret.
   * @param value - The secret value to store.
   *
   * @example
   * ```typescript
   * await secrets.setSecret('smtp/password', newPassword);
   * ```
   */
  setSecret(key: string, value: string): Promise<void>;

  /**
   * Delete a secret by key.
   *
   * Removes the secret from the store. Returns `true` if a secret existed
   * and was deleted, or `false` if no secret was found for the given key.
   *
   * @param key - The unique identifier for the secret to delete.
   * @returns `true` if the secret existed and was removed; `false` otherwise.
   *
   * @example
   * ```typescript
   * const existed = await secrets.deleteSecret('old/api-key');
   * if (!existed) {
   *   console.warn('Secret was already absent');
   * }
   * ```
   */
  deleteSecret(key: string): Promise<boolean>;

  /**
   * Check whether a secret exists for the given key.
   *
   * This does not retrieve the secret value, making it suitable for
   * existence checks without exposing sensitive material.
   *
   * @param key - The unique identifier to check.
   * @returns `true` if a secret is stored under the key; `false` otherwise.
   *
   * @example
   * ```typescript
   * if (await secrets.hasSecret('encryption/master-key')) {
   *   // proceed with decryption
   * }
   * ```
   */
  hasSecret(key: string): Promise<boolean>;
}
