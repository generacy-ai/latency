# Implementation Plan: Define core facet interfaces

**Feature**: Create 8 core facet interfaces plus shared types for `@generacy-ai/latency`
**Branch**: `003-define-core-facet-interfaces`
**Status**: Complete

## Summary

Define the foundational capability interfaces (facets) for the Latency package. These are pure TypeScript interfaces and types that describe abstract capabilities — no implementations, no runtime code (except `FacetError`). Each facet follows async-first, minimal-but-complete design principles. A shared `common.ts` provides `FacetError`, `PaginatedQuery`, and `PaginatedResult<T>` used across facets.

## Technical Context

### Technology Stack
- **Language**: TypeScript 5.4+ (strict mode)
- **Module System**: ESM (`"type": "module"`, NodeNext module resolution)
- **Build**: `tsc` only — no bundler needed for type-only package
- **Target**: ES2022
- **Runtime Dependencies**: None — all exports are interfaces, types, and one error class

### Prerequisites
- Issue #2 must be merged first, providing:
  - `packages/latency/` directory with `package.json`, `tsconfig.json`
  - `packages/latency/src/index.ts` (empty barrel export)
  - Build toolchain (`pnpm build` working)

### Design Decisions (from clarifications)
1. **File paths**: `packages/latency/src/facets/` (monorepo structure)
2. **Error handling**: Shared `FacetError` base class, standard `throw` patterns
3. **Pagination**: Shared `PaginatedQuery` / `PaginatedResult<T>` as optional mixin for list operations
4. **EventBus payloads**: `unknown` type — type-safe wrappers belong in Tier 3 interface packages

## Project Structure

### Files to Create

```
packages/latency/src/
├── facets/
│   ├── common.ts              # FacetError, PaginatedQuery, PaginatedResult<T>
│   ├── issue-tracker.ts       # IssueTracker + supporting types
│   ├── source-control.ts      # SourceControl + supporting types
│   ├── decision.ts            # DecisionHandler + supporting types
│   ├── workflow.ts            # WorkflowEngine + supporting types
│   ├── logging.ts             # Logger + LogLevel
│   ├── state.ts               # StateStore
│   ├── events.ts              # EventBus + Unsubscribe
│   ├── secrets.ts             # SecretStore
│   └── index.ts               # Re-exports all facets
└── index.ts                   # Update: add facet re-exports
```

### Files to Modify

- `packages/latency/src/index.ts` — Add `export * from './facets/index.js';`

## Implementation Approach

### Order of Implementation

1. **`common.ts`** — Shared types first since other facets import from here
2. **`issue-tracker.ts`** — Most detailed example in spec, serves as pattern template
3. **Remaining facets** in parallel — Each is independent:
   - `source-control.ts`
   - `decision.ts`
   - `workflow.ts`
   - `logging.ts`
   - `state.ts`
   - `events.ts`
   - `secrets.ts`
4. **`facets/index.ts`** — Barrel re-export
5. **`src/index.ts`** — Update package entry point

### Interface Design Patterns

Each facet file follows this structure:
1. JSDoc module comment describing the facet's purpose and example implementations
2. Main interface with JSDoc on every method
3. Supporting data types (input specs, query types, result types)
4. Use `PaginatedQuery`/`PaginatedResult<T>` from common for list operations where appropriate

### Facet-by-Facet Design

#### common.ts
- `FacetError` — Base error class extending `Error`, with `code` and optional `cause` properties
- `PaginatedQuery` — `{ limit?: number; offset?: number }` mixin
- `PaginatedResult<T>` — `{ items: T[]; total: number; hasMore: boolean }`

#### issue-tracker.ts
- `IssueTracker` — CRUD + comment operations
- Types: `Issue`, `IssueSpec`, `IssueUpdate`, `IssueQuery`, `Comment`
- `IssueQuery` extends `PaginatedQuery`
- `listIssues` returns `PaginatedResult<Issue>`

#### source-control.ts
- `SourceControl` — Branch, commit, diff operations
- Types: `Commit`, `Branch`, `DiffEntry`, `CommitSpec`
- References architecture doc patterns

#### decision.ts
- `DecisionHandler` — Present decisions to humans, get results
- Types: `Decision`, `DecisionSpec`, `DecisionResult`, `DecisionOption`, `Urgency`

#### workflow.ts
- `WorkflowEngine` — Execute and manage workflows
- Types: `Workflow`, `WorkflowSpec`, `WorkflowStep`, `WorkflowStatus`, `StepResult`

#### logging.ts
- `Logger` — Structured logging with levels
- Types: `LogLevel` (union type: `'debug' | 'info' | 'warn' | 'error'`)
- Synchronous — only facet that does NOT return Promises (logging should not block)

#### state.ts
- `StateStore` — Generic key-value persistence
- Methods: `get<T>`, `set<T>`, `delete`, `has`, `keys`

#### events.ts
- `EventBus` — Pub/sub with `unknown` payloads (per clarification #4)
- Types: `Unsubscribe` (function type `() => void`)
- Methods: `emit`, `on`, `off`

#### secrets.ts
- `SecretStore` — Secure credential storage
- Methods: `get`, `set`, `delete`, `has`
- Values are always `string` (secrets are opaque)

## Validation

### Compile Check
```bash
pnpm build
```
- All files compile with zero errors
- `dist/` contains `.js` and `.d.ts` for all facets

### Import Check
```typescript
import {
  FacetError, PaginatedResult,
  IssueTracker, Issue,
  SourceControl, Commit,
  DecisionHandler, Decision,
  WorkflowEngine, Workflow,
  Logger, LogLevel,
  StateStore,
  EventBus, Unsubscribe,
  SecretStore,
} from '@generacy-ai/latency';
```
All exports should resolve without errors.

## Out of Scope

- Concrete implementations of any interface
- Runtime utilities or helpers (except `FacetError`)
- Tests (interfaces are type-only; testing comes with implementations)
- `DevAgent`, `CICDPipeline`, `ContainerRuntime` facets (future issues)
- Composition primitives (Issue #4)
- Runtime binding types (Issue #5)

## Constitution Check

No `.specify/memory/constitution.md` exists. Plan adheres to:
- Cross-repo consistency with Generacy/Agency TypeScript patterns
- Minimal scope — interfaces and types only
- Full JSDoc documentation on all public exports

---

*Generated by speckit*
