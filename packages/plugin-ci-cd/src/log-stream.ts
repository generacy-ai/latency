/**
 * Log streaming utilities for CI/CD pipeline output.
 *
 * Provides a {@link LogLine} interface for individual log entries and an
 * abstract {@link LogStream} base class that implements `AsyncIterable`
 * for uniform consumption of pipeline logs across different providers.
 *
 * @module log-stream
 */

/**
 * A single line of output from a pipeline log.
 *
 * @example
 * ```typescript
 * const line: LogLine = {
 *   timestamp: new Date(),
 *   message: 'Building project...',
 *   level: 'info',
 *   step: 'build',
 * };
 * ```
 */
export interface LogLine {
  /** Timestamp when the log line was produced. */
  timestamp: Date;

  /** The log message content. */
  message: string;

  /** Optional severity level of the log entry. */
  level?: 'debug' | 'info' | 'warn' | 'error';

  /** Optional identifier of the pipeline step that produced this line. */
  step?: string;
}

/**
 * Abstract base class for streaming pipeline logs.
 *
 * Implements `AsyncIterable<LogLine>` so consumers can iterate over log
 * output using `for await...of`. Subclasses implement
 * {@link fetchNextLines} to retrieve log data from the specific CI/CD
 * provider.
 *
 * @example
 * ```typescript
 * class GitHubLogStream extends LogStream {
 *   protected async fetchNextLines(): Promise<LogLine[]> {
 *     // Fetch from GitHub Actions API
 *   }
 * }
 *
 * const stream = new GitHubLogStream(runId);
 * for await (const line of stream) {
 *   console.log(`[${line.timestamp.toISOString()}] ${line.message}`);
 * }
 * stream.close();
 * ```
 */
export abstract class LogStream implements AsyncIterable<LogLine> {
  private closed = false;

  /**
   * Whether the stream has been closed.
   */
  get isClosed(): boolean {
    return this.closed;
  }

  /**
   * Close the log stream.
   *
   * After calling this method, the async iterator will stop yielding
   * new lines. Subclasses can override to release provider-specific
   * resources.
   */
  close(): void {
    this.closed = true;
  }

  /**
   * Fetch the next batch of log lines from the provider.
   *
   * Subclasses implement this to retrieve log data from the specific
   * CI/CD backend. Return an empty array when no new lines are
   * available yet (the iterator will poll again). Return an empty
   * array after the pipeline completes to signal the end of output.
   *
   * @returns An array of log lines, or empty if no new lines are available.
   */
  protected abstract fetchNextLines(): Promise<LogLine[]>;

  /**
   * Returns an async iterator over the log lines.
   *
   * Yields lines as they become available by repeatedly calling
   * {@link fetchNextLines}. Stops when the stream is closed or
   * the subclass signals completion by returning an empty array
   * after previous non-empty results.
   */
  async *[Symbol.asyncIterator](): AsyncIterator<LogLine> {
    let hadLines = false;

    while (!this.closed) {
      const lines = await this.fetchNextLines();

      if (lines.length === 0) {
        // If we previously had lines and now get none, the stream is done
        if (hadLines) {
          break;
        }
        // Otherwise, wait briefly before trying again
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }

      hadLines = true;
      for (const line of lines) {
        yield line;
      }
    }
  }
}
