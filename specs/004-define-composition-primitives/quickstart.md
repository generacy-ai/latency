# Quickstart: Composition Primitives

## Installation

```bash
pnpm install
pnpm build
```

## Usage

### Import types

```typescript
import {
  PluginManifest,
  FacetProvider,
  FacetRequirement,
  PluginContext,
} from '@generacy-ai/latency';
```

### Define a plugin manifest

```typescript
const manifest: PluginManifest = {
  id: 'my-plugin',
  version: '1.0.0',
  name: 'My Plugin',
  provides: [
    { facet: 'IssueTracker', qualifier: 'github' },
  ],
  requires: [
    { facet: 'Authentication' },
  ],
  uses: [
    { facet: 'Cache', optional: true },
  ],
};
```

### Use PluginContext (in a plugin implementation)

```typescript
function activate(ctx: PluginContext): void {
  // Get a required facet
  const auth = ctx.require<AuthService>('Authentication');

  // Get an optional facet
  const cache = ctx.optional<CacheService>('Cache');

  // Register a facet provider
  ctx.provide('IssueTracker', new GitHubIssueTracker(auth), 'github');

  // Log
  ctx.logger.info('Plugin activated');
}
```

## Available Commands

```bash
pnpm build        # Compile TypeScript
pnpm typecheck    # Type-check without emitting
pnpm lint         # Run ESLint
pnpm test         # Run tests (none yet for types-only)
```

## Troubleshooting

**Build fails with missing imports**: Ensure `pnpm install` was run from the repo root.

**Type errors in context.ts**: The stub types (Logger, StateStore, etc.) are minimal placeholders. They will be expanded in future issues.
