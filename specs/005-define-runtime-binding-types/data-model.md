# Data Model: Runtime Binding Types

## Core Entities

### FacetRegistry (interface)

The central service locator for facet providers. Each core maintains its own instance.

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `register<T>` | facet: string, provider: T, options?: RegistrationOptions | void | Register a provider for a facet |
| `resolve<T>` | facet: string, qualifier?: string | T \| undefined | Look up a provider |
| `list` | facet: string | FacetRegistration[] | List all providers for a facet |
| `has` | facet: string, qualifier?: string | boolean | Check if a provider exists |
| `unregister` | facet: string, qualifier?: string | boolean | Remove a provider |

### RegistrationOptions

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| qualifier | string | No | undefined | Qualifier for this implementation |
| priority | number | No | 0 | Resolution priority (higher = preferred) |
| metadata | Record<string, unknown> | No | undefined | Arbitrary metadata |

### FacetRegistration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| facet | string | Yes | Facet identifier |
| qualifier | string | No | Implementation qualifier |
| priority | number | Yes | Resolution priority |
| metadata | Record<string, unknown> | No | Arbitrary metadata |

### Binder (interface)

Binds plugin requirements to available providers during startup.

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `bind` | plugins: PluginManifest[], registry: FacetRegistry, config?: BinderConfig | Promise\<BindingResult\> | Resolve all plugin dependencies |

### BinderConfig

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| resolutionStrategy | 'first' \| 'highest-priority' \| 'explicit' | No | 'highest-priority' | How to choose among multiple providers |
| explicitBindings | ExplicitBinding[] | No | [] | Manual binding overrides |
| strictOptional | boolean | No | false | Fail on missing optional deps |

### ExplicitBinding

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| plugin | string | Yes | Plugin ID requesting the facet |
| facet | string | Yes | Facet being requested |
| qualifier | string | Yes | Specific qualifier to bind |

### BindingResult

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Whether all required bindings were satisfied |
| contexts | Map<string, PluginContext> | Plugin ID → bound context |
| errors | BindingError[] | Binding failures |
| warnings | string[] | Non-fatal issues |

## Error Types

### FacetNotFoundError (extends Error)

| Field | Type | Description |
|-------|------|-------------|
| facet | string | The unresolved facet name |
| qualifier | string? | The requested qualifier |
| name | string | Always `'FacetNotFoundError'` |

### AmbiguousFacetError (extends Error)

| Field | Type | Description |
|-------|------|-------------|
| facet | string | The ambiguous facet name |
| providers | string[] | List of conflicting provider qualifiers |
| name | string | Always `'AmbiguousFacetError'` |

### CircularDependencyError (extends Error)

| Field | Type | Description |
|-------|------|-------------|
| cycle | string[] | The dependency cycle path |
| name | string | Always `'CircularDependencyError'` |

### BindingError

| Field | Type | Description |
|-------|------|-------------|
| plugin | string | The plugin that failed to bind |
| facet | string | The facet that couldn't be resolved |
| qualifier | string? | The requested qualifier |
| error | FacetNotFoundError \| AmbiguousFacetError \| CircularDependencyError | The specific error |

## Relationships

```
PluginManifest ──provides──> FacetProvider (composition)
PluginManifest ──requires──> FacetRequirement (composition)
      │
      ▼
   Binder.bind(manifests, registry, config)
      │
      ├──reads──> FacetRegistry.resolve()
      │              │
      │              └──returns──> registered provider
      │
      ├──produces──> BindingResult
      │                 ├── contexts: Map<string, PluginContext>
      │                 └── errors: BindingError[]
      │
      └──throws──> FacetNotFoundError
                   AmbiguousFacetError
                   CircularDependencyError
```

## Cross-Module Dependencies

```
runtime/binder.ts ──imports──> composition/manifest.ts (PluginManifest)
runtime/binder.ts ──imports──> composition/context.ts (PluginContext)
runtime/binder.ts ──imports──> runtime/registry.ts (FacetRegistry)
runtime/binder.ts ──imports──> runtime/resolution.ts (BindingError)
```
