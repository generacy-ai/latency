# Research: latency-plugin-dev-agent

## Technology Decisions

### Abstract Class vs Mixin/Composition Pattern

**Decision**: Abstract class (`AbstractDevAgentPlugin`)

**Rationale**: The spec explicitly calls for an abstract class, and TypeScript abstract classes are the natural fit for the template method pattern used here (public `invoke` orchestrates, protected abstract `doInvoke` implements agent-specific logic). Mixins would add complexity without benefit since the inheritance hierarchy is shallow (one abstract base, multiple concrete implementations).

### Timeout Implementation

**Decision**: `AbortSignal.timeout()` + `AbortSignal.any()` for signal merging

**Rationale**: Node.js 20+ and modern browsers support `AbortSignal.timeout()` and `AbortSignal.any()` natively. This avoids manual `setTimeout`/`clearTimeout` management and integrates cleanly with the existing `AbortController` cancellation pattern. The `AbortSignal.any()` method combines a user-provided signal (for manual cancellation) with a timeout signal into a single signal passed to `doInvoke`.

**References**:
- `AbortSignal.timeout()`: Available in Node.js 17.3+
- `AbortSignal.any()`: Available in Node.js 20.3+

### Streaming Pattern

**Decision**: `AsyncIterableIterator<StreamChunk>` with `AsyncGenerator` internally

**Rationale**: `AsyncIterableIterator` is the standard TypeScript pattern for async streaming. Using `async function*` (AsyncGenerator) in subclass implementations provides natural `yield`-based streaming with automatic cleanup via `return()`. This is more ergonomic than ReadableStream for TypeScript consumers and supports `for await...of` loops.

### Test Framework

**Decision**: Vitest

**Rationale**: Vitest provides native ESM support, TypeScript integration without transpilation config, and fast execution. The monorepo currently has no test framework; Vitest is the standard choice for modern TypeScript projects and integrates well with pnpm workspaces.

### Invocation ID Generation

**Decision**: `inv_${Date.now()}_${random}` string format

**Rationale**: Simple, readable format from the spec. No need for UUID or crypto-based generation since invocation IDs are internal tracking identifiers with no security requirements. The timestamp prefix provides natural sortability for debugging.

## Alternatives Considered

### Token Streaming via ReadableStream/TransformStream

Rejected in favor of `AsyncIterableIterator`. While `ReadableStream` is the web platform standard, `AsyncIterableIterator` integrates better with TypeScript's type system and `for await...of` syntax. The abstract class could expose a `toReadableStream()` utility later if needed.

### Separate ValidationError class

Rejected. Adding a `ValidationError` subclass of `FacetError` adds a class to the API surface for no practical benefit. Using `FacetError` with code `'VALIDATION'` is consistent with how the codebase documents error handling (see `IssueTracker` JSDoc examples).

### Per-agent timeout strategies

Rejected complex per-model timeout configuration. A simple `defaultTimeoutMs` on the constructor with per-invocation override covers all practical use cases without over-engineering.

## Implementation Patterns

### Template Method Pattern

The core pattern: public methods (`invoke`, `invokeStream`) handle cross-cutting concerns (validation, tracking, timeout, cleanup), then delegate to protected abstract methods (`doInvoke`, `doInvokeStream`) for agent-specific logic.

```
invoke() → validate → track → timeout → doInvoke() → cleanup → return
```

### Signal Merging

When both a user-provided `AbortSignal` and a timeout exist, merge them with `AbortSignal.any([userSignal, timeoutSignal])` so either source triggers cancellation.
