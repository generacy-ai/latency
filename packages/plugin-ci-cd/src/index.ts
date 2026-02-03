/**
 * Abstract CI/CD plugin for the Latency ecosystem.
 *
 * Provides the {@link AbstractCICDPlugin} base class that concrete
 * CI/CD implementations extend, along with polling and log streaming
 * utilities.
 *
 * @packageDocumentation
 */

export { AbstractCICDPlugin } from './abstract-ci-cd-plugin.js';
export { pollUntilComplete } from './polling.js';
export type { PollOptions } from './polling.js';
export { LogStream } from './log-stream.js';
export type { LogLine } from './log-stream.js';
