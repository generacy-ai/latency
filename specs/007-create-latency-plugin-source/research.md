# Research: latency-plugin-source-control

## Technology Decisions

### Abstract Class Pattern
**Choice**: Template Method pattern — public methods validate, then delegate to protected abstract `do*` methods.

**Rationale**: Standard GoF pattern for this use case. Enforces validation at the base class level so subclass authors cannot skip it. TypeScript's `abstract` keyword provides compile-time enforcement.

**Alternatives considered**:
- **Mixin/decorator approach**: More flexible but adds complexity; unnecessary when we have a single inheritance chain.
- **Composition (strategy pattern)**: Would require a separate validator object; over-engineered for input validation.

### ValidationError Design
**Choice**: Extend `FacetError` with a fixed `VALIDATION_ERROR` code.

**Rationale**: `FacetError` is the established error base class in the ecosystem (defined in `packages/latency/src/facets/common.ts`). Using a fixed code keeps the error type simple — the message string differentiates specific validation failures. Consumers can catch by `instanceof ValidationError` or by checking `error.code === 'VALIDATION_ERROR'`.

**Alternatives considered**:
- **Per-field error codes** (e.g., `MISSING_BRANCH_NAME`): More granular but adds maintenance burden with little practical benefit for validation errors.
- **Plain `Error`**: Loses the `code` property and breaks the `FacetError` hierarchy.

### Test Framework: Vitest
**Choice**: Vitest with ESM mode.

**Rationale**: ESM-native (matches `"type": "module"`), fast startup, built-in TypeScript support without separate transform config. This is the first test framework in the repo, establishing the pattern for other packages.

**Configuration**: Minimal — just `defineConfig` with `test` block. No special transforms needed since the project uses `NodeNext` module resolution.

### Type Re-exports
**Choice**: Re-export core types (`SourceControl`, `Commit`, `Branch`, etc.) from the plugin package.

**Rationale**: Convenience for plugin consumers and subclass implementors — they can import everything from `@generacy-ai/latency-plugin-source-control` without needing a separate import from `@generacy-ai/latency`. This is a common pattern in TypeScript ecosystems (e.g., Express re-exporting types from `http`).

## Implementation Patterns

### Validation Guards
Each public method uses early-return guard clauses:
```typescript
if (!spec.name?.trim()) {
  throw new ValidationError('Branch name is required');
}
```

The `?.trim()` pattern handles `null`, `undefined`, empty string, and whitespace-only strings in one expression.

### Constructor Pattern
Simple options object with `workingDirectory`:
```typescript
constructor(options: { workingDirectory: string }) {
  this.workingDirectory = options.workingDirectory;
}
```

Using an options object (vs positional args) allows future extension without breaking the constructor signature.

## References

- Core `SourceControl` interface: `packages/latency/src/facets/source-control.ts`
- Core `FacetError` class: `packages/latency/src/facets/common.ts`
- TypeScript abstract classes: https://www.typescriptlang.org/docs/handbook/2/classes.html#abstract-classes-and-members
- Vitest documentation: https://vitest.dev/
