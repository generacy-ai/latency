/**
 * Abstract interface for structured logging.
 *
 * The {@link Logger} facet provides a level-based logging contract that
 * implementations can fulfill using any structured logging library (Winston,
 * Pino, Bunyan, console, etc.).
 *
 * All logging methods are intentionally **synchronous**. This is the only
 * facet in the system that does not return Promises. Logging should never
 * block application code; the underlying transport is responsible for
 * buffering or async I/O as needed.
 *
 * @example
 * ```typescript
 * // Winston implementation
 * const logger: Logger = createWinstonLogger({ level: 'info' });
 * logger.info('Server started', { port: 3000 });
 *
 * // Pino implementation
 * const logger: Logger = createPinoLogger({ level: 'debug' });
 * const reqLogger = logger.child({ requestId: 'abc-123' });
 * reqLogger.debug('Processing request');
 *
 * // Console implementation (simplest)
 * const logger: Logger = createConsoleLogger();
 * logger.error('Unexpected failure', { code: 'ETIMEOUT' });
 * ```
 *
 * @module logging
 */

/**
 * Severity level for a log entry.
 *
 * Levels are ordered from least to most severe:
 * `'debug'` < `'info'` < `'warn'` < `'error'`
 *
 * Implementations should respect level filtering so that, for example, a
 * logger configured at `'warn'` suppresses `'debug'` and `'info'` entries.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Structured logging interface with level-based methods.
 *
 * Every method accepts an optional `context` bag of key-value pairs that
 * implementations should merge into the structured log output. The
 * {@link child} method creates a derived logger whose context is
 * automatically included in every subsequent log entry.
 *
 * All methods are synchronous. Logging must never block the caller;
 * asynchronous transports (file, network) should buffer internally.
 */
export interface Logger {
  /**
   * Log a message at the `debug` level.
   *
   * Use for detailed diagnostic information useful during development
   * or troubleshooting. Typically suppressed in production.
   *
   * @param message - Human-readable log message.
   * @param context - Optional structured data to include with the entry.
   */
  debug(message: string, context?: Record<string, unknown>): void;

  /**
   * Log a message at the `info` level.
   *
   * Use for routine operational events such as service startup,
   * configuration changes, or request completion.
   *
   * @param message - Human-readable log message.
   * @param context - Optional structured data to include with the entry.
   */
  info(message: string, context?: Record<string, unknown>): void;

  /**
   * Log a message at the `warn` level.
   *
   * Use for potentially harmful situations that do not prevent the
   * current operation from completing but may require attention.
   *
   * @param message - Human-readable log message.
   * @param context - Optional structured data to include with the entry.
   */
  warn(message: string, context?: Record<string, unknown>): void;

  /**
   * Log a message at the `error` level.
   *
   * Use for error events that might still allow the application to
   * continue running but indicate a failure that should be investigated.
   *
   * @param message - Human-readable log message.
   * @param context - Optional structured data to include with the entry.
   */
  error(message: string, context?: Record<string, unknown>): void;

  /**
   * Create a child logger with additional context.
   *
   * The returned logger inherits the parent's configuration and merges
   * the supplied `context` into every log entry it produces. This is
   * useful for attaching request-scoped or operation-scoped metadata
   * without repeating it in every call.
   *
   * @param context - Key-value pairs to include in all child log entries.
   * @returns A new {@link Logger} instance with the merged context.
   *
   * @example
   * ```typescript
   * const reqLogger = logger.child({ requestId: 'abc-123', userId: 42 });
   * reqLogger.info('Fetching profile');
   * // Output includes requestId and userId automatically
   * ```
   */
  child(context: Record<string, unknown>): Logger;
}
