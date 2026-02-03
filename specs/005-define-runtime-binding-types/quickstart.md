# Quickstart: Runtime Binding Types

## Overview

The runtime module defines the interfaces for binding facet providers to plugin requirements at startup. Each core (Agency, Generacy, Humancy) implements these interfaces.

## Installation

No additional dependencies — the runtime types are part of `@generacy-ai/latency`.

```bash
pnpm build
```

## Usage

### Importing Types

```typescript
import type {
  FacetRegistry,
  RegistrationOptions,
  FacetRegistration,
  Binder,
  BinderConfig,
  BindingResult,
  BindingError,
} from '@generacy-ai/latency';

import {
  FacetNotFoundError,
  AmbiguousFacetError,
  CircularDependencyError,
} from '@generacy-ai/latency';
```

### Implementing a FacetRegistry

```typescript
import type { FacetRegistry, RegistrationOptions, FacetRegistration } from '@generacy-ai/latency';

class InMemoryRegistry implements FacetRegistry {
  private providers = new Map<string, Map<string, { provider: unknown; registration: FacetRegistration }>>();

  register<T>(facet: string, provider: T, options?: RegistrationOptions): void {
    const qualifier = options?.qualifier ?? 'default';
    if (!this.providers.has(facet)) {
      this.providers.set(facet, new Map());
    }
    this.providers.get(facet)!.set(qualifier, {
      provider,
      registration: {
        facet,
        qualifier,
        priority: options?.priority ?? 0,
        metadata: options?.metadata,
      },
    });
  }

  resolve<T>(facet: string, qualifier?: string): T | undefined {
    const providers = this.providers.get(facet);
    if (!providers) return undefined;
    if (qualifier) return providers.get(qualifier)?.provider as T | undefined;
    // Return highest priority
    let best: { provider: unknown; registration: FacetRegistration } | undefined;
    for (const entry of providers.values()) {
      if (!best || entry.registration.priority > best.registration.priority) {
        best = entry;
      }
    }
    return best?.provider as T | undefined;
  }

  list(facet: string): FacetRegistration[] {
    const providers = this.providers.get(facet);
    if (!providers) return [];
    return Array.from(providers.values()).map(e => e.registration);
  }

  has(facet: string, qualifier?: string): boolean {
    return this.resolve(facet, qualifier) !== undefined;
  }

  unregister(facet: string, qualifier?: string): boolean {
    const providers = this.providers.get(facet);
    if (!providers) return false;
    return providers.delete(qualifier ?? 'default');
  }
}
```

### Implementing a Binder

```typescript
import type { Binder, BinderConfig, BindingResult } from '@generacy-ai/latency';
import type { FacetRegistry } from '@generacy-ai/latency';
import type { PluginManifest } from '@generacy-ai/latency';
import { FacetNotFoundError } from '@generacy-ai/latency';

class SimpleBinder implements Binder {
  async bind(
    plugins: PluginManifest[],
    registry: FacetRegistry,
    config?: BinderConfig,
  ): Promise<BindingResult> {
    const errors: BindingError[] = [];
    const contexts = new Map();

    for (const plugin of plugins) {
      for (const req of plugin.requires) {
        if (!registry.has(req.facet, req.qualifier)) {
          if (!req.optional) {
            errors.push({
              plugin: plugin.id,
              facet: req.facet,
              qualifier: req.qualifier,
              error: new FacetNotFoundError(req.facet, req.qualifier),
            });
          }
        }
      }
    }

    return {
      success: errors.length === 0,
      contexts,
      errors,
      warnings: [],
    };
  }
}
```

### Error Handling

```typescript
import { FacetNotFoundError, AmbiguousFacetError } from '@generacy-ai/latency';

try {
  // ... binding logic
} catch (error) {
  if (error instanceof FacetNotFoundError) {
    console.error(`Missing provider for ${error.facet}`);
  } else if (error instanceof AmbiguousFacetError) {
    console.error(`Ambiguous providers: ${error.providers.join(', ')}`);
  }
}
```

## Build & Verify

```bash
# Type check
pnpm typecheck

# Build
pnpm build

# Verify exports
node -e "import('@generacy-ai/latency').then(m => console.log(Object.keys(m)))"
```

## Troubleshooting

### Import errors
Ensure you're using `.js` extensions in TypeScript imports (NodeNext module resolution):
```typescript
// Correct
import { FacetRegistry } from './registry.js';

// Incorrect
import { FacetRegistry } from './registry';
```

### Type-only imports
Use `import type` for interfaces to ensure they're erased at compile time:
```typescript
import type { FacetRegistry, Binder } from '@generacy-ai/latency';
```
