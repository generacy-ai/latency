/**
 * Abstract interface for event-driven pub/sub communication.
 *
 * The {@link EventBus} facet defines a minimal publish/subscribe contract
 * that decouples event producers from consumers. Implementations can wrap
 * any underlying transport:
 *
 * - Node.js `EventEmitter`
 * - Redis Pub/Sub
 * - Custom in-process message bus
 * - Cloud-native event services (AWS EventBridge, Google Pub/Sub, etc.)
 *
 * Payloads are typed as `unknown` intentionally. Type-safe event wrappers
 * belong in Tier 3 interface packages that build on top of the core
 * EventBus contract, not in this foundational layer.
 *
 * @module events
 */

/**
 * Function returned by {@link EventBus.on} to remove the subscription.
 *
 * Calling the returned function unsubscribes the handler that was
 * registered, preventing it from receiving future events.
 *
 * @example
 * ```typescript
 * const unsubscribe: Unsubscribe = bus.on('build:complete', handler);
 * // later, when no longer interested:
 * unsubscribe();
 * ```
 */
export type Unsubscribe = () => void;

/**
 * Minimal pub/sub event bus interface.
 *
 * Provides the three fundamental operations for event-driven communication:
 * emitting events, subscribing to events, and unsubscribing from events.
 *
 * @example
 * ```typescript
 * // Subscribe to an event
 * const unsubscribe = bus.on('build:complete', (payload) => {
 *   console.log('Build finished:', payload);
 * });
 *
 * // Emit an event
 * await bus.emit('build:complete', { duration: 1200 });
 *
 * // Unsubscribe when done
 * unsubscribe();
 * ```
 */
export interface EventBus {
  /**
   * Emit an event, notifying all registered handlers.
   *
   * The returned promise resolves once the event has been dispatched
   * to all current subscribers. For async transports (e.g. Redis Pub/Sub),
   * this means the message has been sent, not necessarily received.
   *
   * @param event - The event name to emit.
   * @param payload - Optional data associated with the event.
   * @returns A promise that resolves when the event has been dispatched.
   *
   * @example
   * ```typescript
   * await bus.emit('user:created', { id: 'u_123', name: 'Alice' });
   * ```
   *
   * @example
   * ```typescript
   * // Events without payloads
   * await bus.emit('cache:invalidated');
   * ```
   */
  emit(event: string, payload?: unknown): Promise<void>;

  /**
   * Subscribe a handler to an event.
   *
   * The handler is invoked each time the named event is emitted.
   * Returns an {@link Unsubscribe} function that removes this specific
   * subscription when called.
   *
   * @param event - The event name to listen for.
   * @param handler - Callback invoked with the event payload.
   * @returns A function that removes this subscription.
   *
   * @example
   * ```typescript
   * const unsubscribe = bus.on('deploy:started', (payload) => {
   *   console.log('Deployment started:', payload);
   * });
   *
   * // Later, stop listening:
   * unsubscribe();
   * ```
   */
  on(event: string, handler: (payload: unknown) => void): Unsubscribe;

  /**
   * Remove a specific handler from an event.
   *
   * This is an alternative to calling the {@link Unsubscribe} function
   * returned by {@link EventBus.on}. The `handler` reference must be the
   * same function instance that was originally passed to `on`.
   *
   * @param event - The event name to unsubscribe from.
   * @param handler - The handler function to remove.
   *
   * @example
   * ```typescript
   * const handler = (payload: unknown) => {
   *   console.log('Received:', payload);
   * };
   *
   * bus.on('metric:recorded', handler);
   *
   * // Later, remove using off:
   * bus.off('metric:recorded', handler);
   * ```
   */
  off(event: string, handler: (payload: unknown) => void): void;
}
