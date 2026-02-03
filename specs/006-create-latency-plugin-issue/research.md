# Research: latency-plugin-issue-tracker

## Technology Decisions

### Cache Implementation: Wrapped Map Entries

**Decision**: Use `Map<string, CacheEntry<T>>` where `CacheEntry = { value: T, cachedAt: number }`.

**Rationale**:
- No external dependencies — abstract plugins depend only on `@generacy-ai/latency` core
- Simple and self-contained; avoids managing two maps in sync
- `Date.now()` provides sufficient precision for TTL checks
- Concrete subclasses can layer LRU or size-based eviction on top if needed

**Alternatives considered**:
- Separate timestamps Map — more error-prone to keep in sync
- `lru-cache` library — adds external dependency, violates Tier 2 architecture rule

### Testing: Vitest

**Decision**: Use Vitest for unit tests.

**Rationale**:
- Native ESM and TypeScript support without configuration
- Compatible with ES2022 target and NodeNext module resolution
- Fast execution via native transforms
- Listed as the monorepo's standard test framework in the execution plan (Issue #2)

### Error Hierarchy: ValidationError extends FacetError

**Decision**: `ValidationError` extends `FacetError` with `code = 'VALIDATION'`.

**Rationale**:
- Ecosystem consistency: all facet errors can be caught via `instanceof FacetError`
- Specific catching: consumers can also use `instanceof ValidationError`
- Machine-readable: `error.code === 'VALIDATION'` works without type narrowing
- Standard pattern for error hierarchies in TypeScript

### No Plugin Manifest in Abstract Class

**Decision**: Leave `PluginManifest` declaration to concrete subclasses.

**Rationale**:
- Abstract class is Tier 2 and is never instantiated or registered directly
- Only concrete subclasses participate in the composition system
- Each concrete class needs its own qualifier (e.g., `"github"`, `"jira"`)
- Abstract class focuses solely on caching and validation

## Implementation Patterns

### Template Method Pattern

The abstract class uses the Template Method pattern:
- Public methods handle cross-cutting concerns (caching, validation)
- Protected abstract `do*` methods are implemented by subclasses
- Validation helpers are virtual (overridable) for extended validation

### Spec/Update Validation Pattern

Following the existing codebase convention:
- `IssueSpec.title` is required and validated (non-empty)
- `IssueUpdate.title` is optional, but if provided must be non-empty
- Additional validation can be added by subclasses overriding validators

## Key Sources

- `/workspaces/latency/packages/latency/src/facets/issue-tracker.ts` — IssueTracker interface
- `/workspaces/latency/packages/latency/src/facets/common.ts` — FacetError, PaginatedQuery, PaginatedResult
- `/workspaces/latency/packages/latency/src/composition/manifest.ts` — PluginManifest
