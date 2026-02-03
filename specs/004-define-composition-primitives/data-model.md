# Data Model: Composition Primitives

## Core Entities

### FacetProvider

Declares that a plugin provides an implementation of a named facet.

```typescript
interface FacetProvider {
  facet: string;          // Facet identifier (e.g., "IssueTracker")
  qualifier?: string;     // Implementation qualifier (e.g., "github", "jira")
  priority?: number;      // Resolution priority (higher = preferred)
}
```

**Relationships**: Referenced by `PluginManifest.provides[]`

### FacetRequirement

Declares that a plugin depends on a named facet.

```typescript
interface FacetRequirement {
  facet: string;          // Facet identifier
  qualifier?: string;     // Specific qualifier, or undefined for "any"
  optional?: boolean;     // If true, plugin works without this facet
}
```

**Relationships**: Referenced by `PluginManifest.requires[]` and `PluginManifest.uses[]`

### FacetDeclaration

Union type for any facet-related declaration (provider or requirement).

```typescript
type FacetDeclaration = FacetProvider | FacetRequirement;
```

### PluginManifest

The static contract declaring a plugin's identity, capabilities, and dependencies.

```typescript
interface PluginManifest {
  id: string;                     // Unique identifier
  version: string;                // Semantic version
  name: string;                   // Human-readable name
  description?: string;           // Optional description
  provides: FacetProvider[];      // Facets this plugin implements
  requires: FacetRequirement[];   // Required dependencies
  uses?: FacetRequirement[];      // Optional dependencies
}
```

### PluginContext

Runtime interface for plugin interaction with the host system.

```typescript
interface PluginContext {
  readonly manifest: PluginManifest;
  require<T>(facet: string, qualifier?: string): T;
  optional<T>(facet: string, qualifier?: string): T | undefined;
  provide<T>(facet: string, implementation: T, qualifier?: string): void;
  requestDecision(request: DecisionRequest): Promise<DecisionResult>;
  readonly logger: Logger;
  readonly state: StateStore;
}
```

## Supporting Types (Stubs)

### DecisionRequest

```typescript
interface DecisionRequest {
  type: string;           // Decision category
  prompt: string;         // Human-readable question
  options?: string[];     // Available choices
  context?: unknown;      // Additional context data
}
```

### DecisionResult

```typescript
interface DecisionResult {
  decision: string;       // The chosen option or free-form response
  metadata?: unknown;     // Additional response data
}
```

### Logger

```typescript
interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}
```

### StateStore

```typescript
interface StateStore {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  delete(key: string): boolean;
  has(key: string): boolean;
}
```

## Entity Relationships

```
FacetProvider ←──── PluginManifest.provides[]
FacetRequirement ←── PluginManifest.requires[]
FacetRequirement ←── PluginManifest.uses[]
PluginManifest ←──── PluginContext.manifest
DecisionRequest ───→ PluginContext.requestDecision()
DecisionResult ←──── PluginContext.requestDecision()
Logger ←──────────── PluginContext.logger
StateStore ←──────── PluginContext.state
```

## Validation Rules

- `PluginManifest.id`: Non-empty string, should follow package naming convention
- `PluginManifest.version`: Should be valid semver
- `FacetProvider.priority`: When present, non-negative integer
- `FacetProvider.facet` / `FacetRequirement.facet`: Non-empty string identifiers
- No duplicate facet+qualifier combinations in a single manifest's `provides[]`
