# Implementation Plan: Create latency-plugin-dev-agent (abstract)

**Feature**: Abstract dev agent plugin providing common logic for AI agent implementations
**Branch**: `008-create-latency-plugin-dev`
**Status**: Complete

## Summary

Create a new package `@generacy-ai/latency-plugin-dev-agent` containing the `AbstractDevAgentPlugin` abstract class. This class provides common invocation management, cancellation, timeout handling, and streaming utilities that all concrete agent implementations (Claude Code, Copilot, etc.) will extend.

Since the core types (`DevAgent`, `AgentResult`, `InvokeOptions`, `AgentCapabilities`) do not yet exist in `@generacy-ai/latency`, they must be added as a new facet in the core package first (consistent with the existing architecture pattern for IssueTracker, SourceControl, etc.).

## Technical Context

- **Language**: TypeScript 5.x (strict mode)
- **Module System**: ESM (`"type": "module"`, NodeNext resolution)
- **Build**: `tsc` (no bundler)
- **Monorepo**: pnpm workspaces (`packages/*`)
- **Testing**: Vitest (to be added — no test framework exists yet)
- **Runtime**: Node.js ≥ 20

## Design Decisions

### D1: Core Types Location → New facet in `@generacy-ai/latency`

The `DevAgent`, `AgentResult`, `InvokeOptions`, and `AgentCapabilities` interfaces belong in the core package as `src/facets/dev-agent.ts`. This is consistent with how all other facets (IssueTracker, SourceControl, etc.) are defined and allows any consumer to depend only on the core package for type definitions.

### D2: Timeout Handling → Constructor default + per-invocation override, aborts via AbortController

A default timeout is set on the class constructor (e.g., 30s) and can be overridden per-invocation via `InvokeOptions.timeoutMs`. Timeout triggers `AbortController.abort()` on the underlying operation, providing clean cancellation semantics consistent with the existing abort-based cancellation pattern.

### D3: Streaming → AsyncIterator-based token streaming

The abstract class provides a `doInvokeStream` abstract method returning `AsyncIterableIterator<StreamChunk>` and a public `invokeStream` method that wraps it with invocation tracking and timeout. This aligns with modern TypeScript async patterns and LLM response streaming.

### D4: Plugin Manifest Integration → Deferred (standalone abstract class)

The abstract class does not integrate with `PluginManifest`/`PluginContext` in this issue. Composition integration will be added in a later issue when the runtime plugin loader is implemented. The class focuses purely on invocation lifecycle management.

### D5: Error Handling → Use FacetError directly with error codes

No new `ValidationError` subclass. Use `FacetError` from `@generacy-ai/latency` with code `'VALIDATION'` for input validation errors and `'TIMEOUT'` for timeout errors. This keeps the error hierarchy flat and consistent with existing conventions (see `issue-tracker.ts` JSDoc referencing `'VALIDATION'` code).

## Project Structure

### Changes to existing package: `@generacy-ai/latency`

```
packages/latency/src/
└── facets/
    ├── dev-agent.ts          # NEW: DevAgent interface + related types
    └── index.ts              # MODIFIED: add re-export for dev-agent.ts
```

### New package: `@generacy-ai/latency-plugin-dev-agent`

```
packages/latency-plugin-dev-agent/
├── package.json
├── tsconfig.json
├── src/
│   ├── abstract-dev-agent-plugin.ts   # AbstractDevAgentPlugin class
│   └── index.ts                       # Package entry point (re-exports)
└── __tests__/
    └── abstract-dev-agent-plugin.test.ts  # Unit tests
```

## File Details

### 1. `packages/latency/src/facets/dev-agent.ts` (NEW)

Defines the core dev-agent facet interfaces:

- **`InvokeOptions`**: Options for agent invocations (timeoutMs, signal, metadata)
- **`AgentResult`**: Result of an invocation (output text, usage stats, invocationId)
- **`StreamChunk`**: A chunk of streaming output (text delta, metadata)
- **`AgentCapabilities`**: Describes what an agent supports (streaming, cancellation, models)
- **`DevAgent`**: The facet interface with `invoke`, `invokeStream`, `cancel`, and `getCapabilities` methods

### 2. `packages/latency/src/facets/index.ts` (MODIFIED)

Add `export * from './dev-agent.js';` line.

### 3. `packages/latency-plugin-dev-agent/package.json` (NEW)

```json
{
  "name": "@generacy-ai/latency-plugin-dev-agent",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "lint": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@generacy-ai/latency": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.4.5",
    "@types/node": "^20.14.0",
    "vitest": "^3.0.0"
  }
}
```

### 4. `packages/latency-plugin-dev-agent/tsconfig.json` (NEW)

Extends `../../tsconfig.base.json`, rootDir `./src`, outDir `./dist`.

### 5. `packages/latency-plugin-dev-agent/src/abstract-dev-agent-plugin.ts` (NEW)

The core abstract class implementing `DevAgent`:

- **Constructor**: Accepts `AbstractDevAgentOptions` with optional `defaultTimeoutMs`
- **`invoke(prompt, options?)`**: Validates input, creates invocation tracking entry, applies timeout, delegates to abstract `doInvoke`, cleans up tracking on completion
- **`invokeStream(prompt, options?)`**: Same pattern but delegates to abstract `doInvokeStream`, wraps the returned AsyncIterableIterator with timeout and tracking
- **`cancel(invocationId)`**: Aborts via stored AbortController, cleans up tracking
- **`getCapabilities()`**: Delegates to abstract `doGetCapabilities`
- **Protected abstract methods**: `doInvoke`, `doInvokeStream`, `doGetCapabilities`
- **Private helpers**: `generateInvocationId`, `createTimeoutSignal`, `mergeSignals`

### 6. `packages/latency-plugin-dev-agent/src/index.ts` (NEW)

Re-exports `AbstractDevAgentPlugin`, `AbstractDevAgentOptions`, and `InternalInvokeOptions` from the implementation file.

### 7. `packages/latency-plugin-dev-agent/__tests__/abstract-dev-agent-plugin.test.ts` (NEW)

Tests using a concrete test subclass:

- Invocation succeeds and returns result with invocationId
- Empty/whitespace prompt throws FacetError with VALIDATION code
- Cancellation aborts in-flight invocation
- Timeout aborts after configured duration
- Per-invocation timeout overrides default
- Concurrent invocations tracked independently
- Streaming returns chunks and completes
- Streaming respects timeout and cancellation

## Dependencies

- `@generacy-ai/latency` (workspace dependency — for `DevAgent` facet types and `FacetError`)
- `vitest` (dev dependency — test framework)

## Constitution Check

No `.specify/memory/constitution.md` file exists. No governance constraints to validate against.
