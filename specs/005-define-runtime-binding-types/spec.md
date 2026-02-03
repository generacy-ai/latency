# Feature Specification: Define runtime binding types

**Branch**: `005-define-runtime-binding-types` | **Date**: 2026-02-03 | **Status**: Draft

## Summary

## Parent Epic
Part of #1 (Phase 1 - Repository & Package Setup)

## Description

Create the runtime types that cores (Agency, Generacy, Humancy) use to bind facets at startup. This defines the *interface* for runtime binding — each core implements the actual runtime.

## Tasks

- [ ] Create `src/runtime/registry.ts` - FacetRegistry interface
- [ ] Create `src/runtime/binder.ts` - Binder interface
- [ ] Create `src/runtime/resolution.ts` - Resolution types and errors
- [ ] Create `src/runtime/index.ts` - re-exports

## Core Types

```typescript
// src/runtime/registry.ts

/**
 * Registry of available facet providers.
 * Each core maintains its own registry instance.
 */
export interface FacetRegistry {
  /**
   * Register a facet provider.
   */
  register<T>(
    facet: string,
    provider: T,
    options?: RegistrationOptions
  ): void;
  
  /**
   * Resolve a facet to its provider.
   * Returns undefined if no provider is registered.
   */
  resolve<T>(facet: string, qualifier?: string): T | undefined;
  
  /**
   * List all registered providers for a facet.
   */
  list(facet: string): FacetRegistration[];
  
  /**
   * Check if a facet has any providers.
   */
  has(facet: string, qualifier?: string): boolean;
  
  /**
   * Unregister a provider.
   */
  unregister(facet: string, qualifier?: string): boolean;
}

export interface RegistrationOptions {
  /** Qualifier for this specific implementation */
  qualifier?: string;
  
  /** Priority for resolution (higher = preferred) */
  priority?: number;
  
  /** Metadata about the provider */
  metadata?: Record<string, unknown>;
}

export interface FacetRegistration {
  facet: string;
  qualifier?: string;
  priority: number;
  metadata?: Record<string, unknown>;
}
```

```typescript
// src/runtime/binder.ts

/**
 * Binds plugin requirements to available providers.
 * Called during system startup.
 */
export interface Binder {
  /**
   * Bind all plugins and resolve their dependencies.
   * Returns a map of plugin ID to bound context.
   */
  bind(
    plugins: PluginManifest[],
    registry: FacetRegistry,
    config?: BinderConfig
  ): BindingResult;
}

export interface BinderConfig {
  /** How to resolve when multiple providers match */
  resolutionStrategy?: 'first' | 'highest-priority' | 'explicit';
  
  /** Explicit bindings for specific requirements */
  explicitBindings?: ExplicitBinding[];
  
  /** Whether to fail on missing optional dependencies */
  strictOptional?: boolean;
}

export interface ExplicitBinding {
  /** Plugin requesting the facet */
  plugin: string;
  
  /** Facet being requested */
  facet: string;
  
  /** Specific qualifier to use */
  qualifier: string;
}

export interface BindingResult {
  /** Whether all required bindings were satisfied */
  success: boolean;
  
  /** Map of plugin ID to its bound context */
  contexts: Map<string, PluginContext>;
  
  /** Errors encountered during binding */
  errors: BindingError[];
  
  /** Warnings (e.g., unused providers) */
  warnings: string[];
}
```

```typescript
// src/runtime/resolution.ts

/**
 * Errors that can occur during facet resolution.
 */
export class FacetNotFoundError extends Error {
  constructor(
    public readonly facet: string,
    public readonly qualifier?: string
  ) {
    super(
      qualifier
        ? `No provider found for facet "${facet}" with qualifier "${qualifier}"`
        : `No provider found for facet "${facet}"`
    );
    this.name = 'FacetNotFoundError';
  }
}

export class AmbiguousFacetError extends Error {
  constructor(
    public readonly facet: string,
    public readonly providers: string[]
  ) {
    super(
      `Multiple providers for facet "${facet}": ${providers.join(', ')}. ` +
      `Specify a qualifier or configure explicit binding.`
    );
    this.name = 'AmbiguousFacetError';
  }
}

export class CircularDependencyError extends Error {
  constructor(public readonly cycle: string[]) {
    super(`Circular dependency detected: ${cycle.join(' -> ')}`);
    this.name = 'CircularDependencyError';
  }
}

export interface BindingError {
  plugin: string;
  facet: string;
  qualifier?: string;
  error: FacetNotFoundError | AmbiguousFacetError | CircularDependencyError;
}
```

## File Structure

```
packages/latency/src/
├── runtime/
│   ├── registry.ts           # FacetRegistry interface
│   ├── binder.ts             # Binder interface, BinderConfig, BindingResult
│   ├── resolution.ts         # Resolution errors and types
│   └── index.ts              # Re-exports
├── composition/
│   └── ...
├── facets/
│   └── ...
└── index.ts
```

## Important Note

This defines only the **interfaces** for runtime binding. Each core (Agency, Generacy, Humancy) implements its own runtime. This allows:

- Different binding strategies per core
- Core-specific optimizations
- Independent evolution of runtime implementations

## Acceptance Criteria

- [ ] FacetRegistry interface supports registration and discovery
- [ ] Binder interface supports resolution configuration
- [ ] Resolution supports qualifiers and fallbacks
- [ ] Error types cover common failure modes
- [ ] All types exported from package root
- [ ] Comprehensive JSDoc documentation

## Design Principles

1. **Interface over implementation** - Define contracts, not code
2. **Error-friendly** - Clear error types for debugging
3. **Configurable** - Multiple resolution strategies supported
4. **Testable** - Easy to mock for unit tests

## References

- [latency-integration-plan.md - Issue 1.4](/workspaces/tetrad-development/docs/latency-integration-plan.md)
- [latency-architecture.md - The Binding Moment](/workspaces/tetrad-development/docs/latency-architecture.md)

## User Stories

### US1: [Primary User Story]

**As a** [user type],
**I want** [capability],
**So that** [benefit].

**Acceptance Criteria**:
- [ ] [Criterion 1]
- [ ] [Criterion 2]

## Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-001 | [Description] | P1 | |

## Success Criteria

| ID | Metric | Target | Measurement |
|----|--------|--------|-------------|
| SC-001 | [Metric] | [Target] | [How to measure] |

## Assumptions

- [Assumption 1]

## Out of Scope

- [Exclusion 1]

---

*Generated by speckit*
