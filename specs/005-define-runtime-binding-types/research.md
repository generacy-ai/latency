# Research: Runtime Binding Types

## Technology Decisions

### 1. Async Binder.bind()

**Decision**: `Binder.bind()` returns `Promise<BindingResult>`

**Rationale**: The codebase is async-first — every facet interface method returns Promises. Making bind async is consistent and future-proof for lazy-loading scenarios.

**Alternatives considered**:
- Synchronous return: Simpler but would require a breaking change if async binding is ever needed
- Dual methods (bind + bindAsync): Unnecessary complexity; sync callers can just await

### 2. Separate runtime types from composition types

**Decision**: `FacetRegistration` is a standalone type, not derived from `FacetProvider`

**Rationale**: These types serve different architectural layers. `FacetProvider` is a static manifest declaration; `FacetRegistration` is a runtime record that may accumulate additional metadata over time.

**Alternatives considered**:
- Extend FacetProvider: Creates coupling between layers
- Shared base type: Over-engineering for 3 overlapping fields

### 3. Concrete error classes

**Decision**: Error classes are concrete implementations shared by all cores

**Rationale**: Follows the `FacetError` pattern in `facets/common.ts`. Concrete classes enable `instanceof` checks, which is the standard pattern for typed error handling in TypeScript.

**Alternatives considered**:
- Error interfaces: Would require each core to implement its own error classes, losing consistency

## Implementation Patterns

### Registry Pattern
The FacetRegistry follows the service locator pattern — a well-understood DI approach where services are registered and resolved by key. The qualifier system adds a second dimension for disambiguation (e.g., `"IssueTracker:github"` vs `"IssueTracker:jira"`).

### Binder as Orchestrator
The Binder takes plugin manifests and a registry, then produces bound PluginContext instances. This is the "composition root" pattern — binding happens once at startup, not lazily throughout the application lifecycle.

### Error Hierarchy
Three error classes cover the three failure modes of dependency resolution:
1. **Not found** — no provider registered for a required facet
2. **Ambiguous** — multiple providers without a resolution strategy
3. **Circular** — plugin A requires plugin B which requires plugin A

## References

- Service Locator pattern: Martin Fowler's "Inversion of Control Containers and the Dependency Injection pattern"
- Existing `FacetError` pattern: `packages/latency/src/facets/common.ts`
- Composition layer types: `packages/latency/src/composition/`
