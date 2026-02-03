# Implementation Plan: Create latency-plugin-issue-tracker (abstract)

**Feature**: Abstract issue tracker plugin with common caching, validation, and error handling
**Branch**: `006-create-latency-plugin-issue`
**Status**: Complete

## Summary

Create the `@generacy-ai/latency-plugin-issue-tracker` package containing `AbstractIssueTrackerPlugin` — an abstract base class implementing the `IssueTracker` facet interface. Concrete implementations (GitHub, Jira, Linear) will extend this class and only implement the `do*` template methods. The abstract class provides:

- TTL-based caching with wrapped Map entries (`{value, cachedAt}`)
- Input validation using `ValidationError` (subclass of `FacetError`)
- Consistent error handling aligned with the ecosystem's `FacetError` pattern
- Template method pattern for subclass extension

## Technical Context

- **Language**: TypeScript (ES2022 target, NodeNext modules)
- **Runtime**: Node.js ≥ 20
- **Monorepo**: pnpm workspaces
- **Testing**: Vitest
- **Core dependency**: `@generacy-ai/latency` (workspace dependency)
- **No external dependencies** — abstract plugins depend only on Latency core

## Key Design Decisions

1. **Cache implementation** (Q1 → Option A): Single `Map<string, CacheEntry<T>>` with wrapped entries containing `value` and `cachedAt` timestamp. No external cache library.

2. **Testing framework** (Q2 → Option A): Vitest with native ESM/TypeScript support. Matches monorepo convention.

3. **No plugin manifest** (Q3 → Option B): Abstract class does not include a `PluginManifest`. Concrete subclasses handle registration with qualifiers (e.g., `"github"`, `"jira"`).

4. **Error hierarchy** (Q4 → Option C): `ValidationError extends FacetError` with `code='VALIDATION'`. Supports both `instanceof ValidationError` and `error.code === 'VALIDATION'` checks.

5. **Signature alignment**: The `IssueTracker.listIssues` interface returns `PaginatedResult<Issue>`, not `Issue[]`. The abstract class must match this signature.

## Project Structure

```
packages/latency-plugin-issue-tracker/
├── src/
│   ├── abstract-plugin.ts    # AbstractIssueTrackerPlugin class
│   ├── caching.ts            # CacheEntry<T> type, TTL cache utility
│   ├── validation.ts         # ValidationError class (extends FacetError)
│   └── index.ts              # Re-exports all public API
├── __tests__/
│   ├── abstract-plugin.test.ts  # Tests via concrete test subclass
│   ├── caching.test.ts          # Cache TTL and invalidation tests
│   └── validation.test.ts       # ValidationError behavior tests
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Implementation Details

### 1. Caching (`src/caching.ts`)

```typescript
interface CacheEntry<T> {
  value: T;
  cachedAt: number;  // Date.now() timestamp
}
```

- `Map<string, CacheEntry<T>>` stores entries with timestamps
- `isCacheExpired(id)` compares `Date.now() - entry.cachedAt > cacheTimeout`
- `invalidateCache(id?)` clears one or all entries
- Default TTL: 60,000ms (1 minute)

### 2. Validation (`src/validation.ts`)

```typescript
class ValidationError extends FacetError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, 'VALIDATION', options);
    this.name = 'ValidationError';
  }
}
```

- Extends `FacetError` from `@generacy-ai/latency`
- Sets `code = 'VALIDATION'` automatically
- Supports error chaining via `cause`

### 3. Abstract Plugin (`src/abstract-plugin.ts`)

Template method pattern:
- **Public methods**: `getIssue`, `createIssue`, `updateIssue`, `listIssues`, `addComment` — handle caching and validation
- **Abstract methods**: `fetchIssue`, `doCreateIssue`, `doUpdateIssue`, `doListIssues`, `doAddComment` — implemented by subclasses
- **Validation helpers**: `validateIssueSpec`, `validateIssueUpdate` — overridable for additional validation

Key signature note: `listIssues` must return `Promise<PaginatedResult<Issue>>` to match the `IssueTracker` interface, not `Promise<Issue[]>` as shown in the issue spec.

### 4. Package Configuration

```json
{
  "name": "@generacy-ai/latency-plugin-issue-tracker",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
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

### 5. TypeScript Configuration

Extends `tsconfig.base.json` from workspace root. Compiles to `dist/` with declarations.

## Testing Strategy

Tests create a concrete `TestIssueTrackerPlugin` subclass that implements all abstract methods with in-memory stubs. This allows testing:

- Cache hit/miss behavior and TTL expiry
- Cache invalidation (single entry and full clear)
- Validation of `IssueSpec` (missing title throws)
- Validation of `IssueUpdate` (empty title throws)
- Empty comment validation
- Error type hierarchy (`instanceof ValidationError`, `instanceof FacetError`, `error.code`)
- `listIssues` delegates correctly and returns `PaginatedResult<Issue>`

Target: 90%+ code coverage on the abstract class and utilities.

## Dependencies

| Package | Type | Source |
|---------|------|--------|
| `@generacy-ai/latency` | runtime | workspace |
| `typescript` | dev | npm |
| `@types/node` | dev | npm |
| `vitest` | dev | npm |

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| `IssueTracker` interface may evolve | Abstract class mirrors interface exactly; changes propagate via type errors |
| Cache memory growth | `invalidateCache()` provides manual control; concrete classes can add LRU on top |
| Vitest not yet configured in monorepo | This package adds its own `vitest.config.ts`; root `pnpm test` already delegates |
