# Research: Define Composition Primitives

## Technology Decisions

### TypeScript-Only Types (No Runtime)

**Decision**: All composition primitives are pure TypeScript interfaces/types with no runtime code.

**Rationale**:
- This issue establishes contracts, not implementations
- Pure types have zero bundle size impact
- Enables type-safe plugin development without coupling to runtime
- Future issues add implementations against these interfaces

### Module Organization Pattern

**Decision**: Leaf-dependency pattern with `facet.ts` → `manifest.ts` → `context.ts`.

**Alternatives considered**:
1. **Single file** — All types in one `composition.ts`. Rejected: grows unwieldy as types expand.
2. **Flat modules** — Each type in its own file with no dependency order. Rejected: risks circular imports.
3. **Leaf-dependency** (chosen) — `facet.ts` has no local imports; `manifest.ts` imports from facet; `context.ts` imports from manifest. Clean dependency DAG.

### Stub Types for Supporting Interfaces

**Decision**: Define minimal stub interfaces for `Logger`, `StateStore`, `DecisionRequest`, `DecisionResult` in `context.ts`.

**Alternatives considered**:
1. **Forward references only** — Use `type Logger = unknown`. Rejected: provides no compile-time guidance.
2. **Remove from PluginContext** — Strip undeclared types. Rejected: context wouldn't represent the intended API.
3. **Minimal stubs** (chosen) — Define narrow interfaces with essential methods. Can be expanded later without breaking existing code if new methods are added.

### Barrel Export Pattern

**Decision**: Two-level barrel exports (composition/index.ts and package-level src/index.ts).

**Rationale**:
- `import { PluginManifest } from '@generacy-ai/latency'` — clean consumer API
- `import { PluginManifest } from '@generacy-ai/latency/composition'` — granular import option if package.json exports are added later

## Implementation Patterns

### JSDoc Documentation

All exported types use JSDoc with:
- Interface-level description of purpose
- Property-level descriptions for each field
- `@example` blocks where helpful
- Generic type parameter documentation

### Optional vs Required Fields

The spec distinguishes between required plugin metadata (`id`, `version`, `name`) and optional metadata (`description`, `uses`). This pattern is maintained consistently:
- Required fields: no `?` modifier
- Optional fields: explicit `?` modifier
- Arrays default to required but can be empty (e.g., `provides: FacetProvider[]`)

## References

- TypeScript handbook: Declaration files and module augmentation
- Plugin architecture patterns: Eclipse/VSCode extension model (declare → resolve → activate)
- Facet pattern inspired by CodeMirror 6's facet system (declarative, composable, typed)
