# Clarifications

Questions and answers to clarify the feature specification.

## Batch 1 - 2026-02-03 04:40

### Q1: File Path Structure
**Context**: The issue references `src/facets/` but the architecture doc shows `packages/latency/src/facets/`. Since this repo currently has no `src/` directory at all, clarifying the actual file path determines the package structure.
**Question**: Should the facet files be created at `src/facets/` (root-level, flat package) or `packages/latency/src/facets/` (monorepo structure for future Tier 2/3 packages)?
**Options**:
- A: `src/facets/` - Simple flat structure at repo root, can restructure into monorepo later
- B: `packages/latency/src/facets/` - Monorepo structure from the start, matching the architecture doc

**Answer**: *Pending*

### Q2: Error Handling Convention
**Context**: The design principles specify 'async-first' with all operations returning Promises, but don't specify how errors should be communicated. This affects every interface method signature.
**Question**: Should facet methods throw errors directly (standard try/catch), or use a Result type pattern (e.g., `Promise<Result<Issue, FacetError>>`) for explicit error handling?
**Options**:
- A: Throw errors directly - simpler, standard TypeScript/JS convention, implementations decide error types
- B: Result type pattern - explicit error handling, but adds complexity to every method signature
- C: Throw errors with a shared base `FacetError` class - standard throws but with consistent error typing

**Answer**: *Pending*

### Q3: Pagination Pattern
**Context**: The IssueTracker example uses `limit`/`offset` for pagination in `IssueQuery`. Other facets with list operations (SourceControl branches/commits, WorkflowEngine workflows) need a consistent pagination approach.
**Question**: Should all list/query operations across facets use the same pagination pattern (`limit`/`offset`), or should each facet define its own query pattern?
**Options**:
- A: Shared `PaginatedQuery` and `PaginatedResult<T>` types used across all facets
- B: Each facet defines its own query types - more flexibility, less coupling between facets
- C: Shared pagination types as optional mixin - facets can adopt them but aren't required to

**Answer**: *Pending*

### Q4: Generic Type Parameters
**Context**: The StateStore example in the architecture doc uses `get<T>(key: string): Promise<T | undefined>`. The EventBus uses `unknown` for payload types. Type safety varies across facets.
**Question**: Should EventBus use generic type parameters for type-safe events (e.g., `emit<E extends Event>(event: E): void`), or keep `unknown` payloads as shown in the architecture doc?
**Options**:
- A: Keep `unknown` payloads - simpler, implementations add type safety via their own wrappers
- B: Generic event map pattern - `EventBus<Events extends Record<string, unknown>>` for compile-time type checking
- C: String-based events with `unknown` payload but provide a typed wrapper utility alongside

**Answer**: *Pending*

