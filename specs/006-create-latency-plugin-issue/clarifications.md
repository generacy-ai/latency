# Clarifications

Questions and answers to clarify the feature specification.

## Batch 1 - 2026-02-03 19:21

### Q1: Cache Expiry Tracking
**Context**: The spec references this.isCacheExpired(id) but the cache is Map<string, Issue> which doesn't store timestamps. The caching.ts module needs a design decision on how to track entry age.
**Question**: Should cache entries store insertion timestamps alongside values (e.g., Map<string, {value: Issue, cachedAt: number}>), or should a separate Map track timestamps?
**Options**:
- A: Single Map with wrapped entries containing value and timestamp
- B: Separate timestamps Map alongside the values Map
- C: Use a TTL cache library (e.g., lru-cache) instead of plain Map

**Answer**: **Option A** (Single Map with wrapped entries). The abstract plugins in Tier 2 should depend only on @generacy-ai/latency core with no external dependencies. A wrapped entry like { value: Issue, cachedAt: number } is simple, self-contained, and avoids the overhead of managing two maps in sync.

### Q2: Testing Framework
**Context**: The acceptance criteria require 90%+ test coverage, but no testing framework is configured in the monorepo. The choice affects package.json setup and test file conventions.
**Question**: Which testing framework should be used for unit tests?
**Options**:
- A: Vitest (fast, native ESM/TypeScript support, compatible with ES2022 target)
- B: Jest with ts-jest or @swc/jest for TypeScript support
- C: Node.js built-in test runner (node:test) for zero dependencies

**Answer**: **Option A** (Vitest). The execution plan explicitly lists "Set up Vitest for testing" as a deliverable for Issue #2 (repo structure), and the architecture docs reference Vitest. It's the natural fit for the ES2022/NodeNext/TypeScript setup.

### Q3: Plugin Manifest Integration
**Context**: The existing codebase uses a PluginManifest + PluginContext pattern where plugins declare what facets they provide/require. The spec doesn't mention this integration, but concrete subclasses would need it.
**Question**: Should AbstractIssueTrackerPlugin include a default PluginManifest declaring it provides the IssueTracker facet, or should manifest declaration be left entirely to concrete subclasses?
**Options**:
- A: Abstract class includes a base manifest with IssueTracker facet; subclasses extend it with qualifier
- B: Leave manifest entirely to concrete subclasses; abstract class only handles caching/validation

**Answer**: **Option B** (Leave manifest to concrete subclasses). The abstract class is Tier 2 and never gets instantiated or registered directly — only concrete subclasses register with the composition system. The abstract class's job is caching/validation.

### Q4: Error Handling Strategy
**Context**: The codebase defines FacetError with codes (NOT_FOUND, VALIDATION, AUTH, CONFLICT). The spec introduces a separate ValidationError class. Using both could lead to inconsistent error handling across the ecosystem.
**Question**: Should validation errors use the existing FacetError with code='VALIDATION', or keep the separate ValidationError class as specified?
**Options**:
- A: Use FacetError with code='VALIDATION' for consistency with the rest of the ecosystem
- B: Keep separate ValidationError class as specified, extending FacetError instead of Error
- C: Keep ValidationError as a subclass of FacetError (best of both: specific type + ecosystem compatibility)

**Answer**: **Option C** (ValidationError as subclass of FacetError). Making ValidationError extend FacetError with code='VALIDATION' gives both ecosystem consistency and specific type checking via instanceof.

