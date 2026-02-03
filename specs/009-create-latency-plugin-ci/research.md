# Research: latency-plugin-ci-cd

## Technology Decisions

### 1. Error Handling: FacetError with Codes

**Decision**: Use `FacetError` with descriptive error codes instead of creating a separate `ValidationError` class.

**Rationale**: The spec references `ValidationError`, but the codebase defines `FacetError` in `packages/latency/src/facets/common.ts` as the single error base class for all facet operations. It already supports a `code` field for programmatic handling. Using `new FacetError('Pipeline ID is required', 'VALIDATION_ERROR')` is consistent and avoids proliferating error classes.

**Error Codes**:
- `VALIDATION_ERROR` — Invalid input (empty pipeline ID, invalid options)
- `NOT_FOUND` — Pipeline or run not found
- `TIMEOUT` — Polling or operation timeout
- `CANCELLED` — Operation was cancelled

### 2. Testing Framework: vitest

**Decision**: Use vitest for unit testing.

**Rationale**: The project has no test framework yet (`"test": "echo 'No tests yet'"`). vitest is a strong fit because:
- Native ESM support (the project uses `"type": "module"` with `NodeNext`)
- Built-in TypeScript support without additional configuration
- Fast startup and execution
- Compatible with the existing build toolchain (no Babel/bundler needed)
- Fake timer support for polling tests

**Alternatives Considered**:
- **Jest**: Requires `ts-jest` or `@swc/jest` for TypeScript, ESM support is experimental
- **Node.js test runner**: Lacks fake timers and snapshot testing; less ecosystem support

### 3. Plugin Package as Peer Dependency Consumer

**Decision**: `@generacy-ai/latency` is a peer dependency of `@generacy-ai/latency-plugin-ci-cd`.

**Rationale**: The plugin implements interfaces from the core package but shouldn't bundle them. Consumers must install the core package independently. This prevents version conflicts and ensures a single source of truth for type definitions.

### 4. Polling Utility Design

**Decision**: Implement polling as a standalone async function with configurable options.

**Pattern**:
```typescript
interface PollOptions {
  intervalMs: number;
  timeoutMs: number;
  backoffMultiplier?: number;
  maxIntervalMs?: number;
  signal?: AbortSignal;
}

async function pollUntilComplete<T>(
  fn: () => Promise<T>,
  isComplete: (result: T) => boolean,
  options: PollOptions,
): Promise<T>;
```

**Rationale**: Separating polling from the abstract class makes it:
- Testable in isolation with fake timers
- Reusable for any async status-checking pattern
- Configurable per use case (different providers may need different intervals)

### 5. Log Streaming Design

**Decision**: Abstract `LogStream` class implementing `AsyncIterable<LogLine>`.

**Pattern**:
```typescript
interface LogLine {
  timestamp: Date;
  message: string;
  level?: 'info' | 'warn' | 'error' | 'debug';
  stream?: 'stdout' | 'stderr';
}

abstract class LogStream implements AsyncIterable<LogLine> {
  abstract [Symbol.asyncIterator](): AsyncIterator<LogLine>;
  abstract close(): Promise<void>;
}
```

**Rationale**: CI/CD log streaming varies significantly across providers (WebSocket, SSE, polling log endpoints). An abstract async iterable gives consumers a uniform `for await` loop while subclasses handle provider-specific transport.

## Implementation Patterns

### Template Method Pattern

The `AbstractCICDPlugin` uses the Template Method pattern:
- Public methods handle cross-cutting concerns (validation, logging, error wrapping)
- Protected abstract `do*` methods are implemented by subclasses for provider-specific logic
- This matches the pattern described in the issue specification

### Monorepo Package Pattern

New packages follow the existing structure:
- `packages/<name>/package.json` with `@generacy-ai/latency-` prefix
- `tsconfig.json` extending `../../tsconfig.base.json`
- `src/index.ts` re-exporting public API
- ES module with `"type": "module"`
- `dist/` output directory

## References

- Existing facet pattern: `packages/latency/src/facets/workflow.ts`
- Error handling: `packages/latency/src/facets/common.ts`
- Composition system: `packages/latency/src/composition/`
- TypeScript config: `tsconfig.base.json`
