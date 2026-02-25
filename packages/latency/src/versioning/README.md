# Versioning

Capability negotiation and version compatibility management for the Generacy platform.

## Purpose

This directory provides the infrastructure for handling version compatibility across components with different release cadences:

- **Capability Registry**: Central registry for component capabilities
- **Versioned Schemas**: Schema versioning and migration support
- **Deprecation Warnings**: Graceful deprecation handling and warnings

The versioning system enables components to:
1. Advertise their capabilities and supported versions
2. Negotiate compatible features at runtime
3. Handle schema evolution gracefully
4. Provide clear deprecation paths

## Usage

```typescript
import {
  validateCapabilityDependencies,
  createVersionedSchema,
  collectDeprecationWarnings
} from '@generacy-ai/latency/versioning';
```

## Migration Note

Types migrated from `@generacy-ai/contracts/version-compatibility` as part of the contracts repository retirement (2026-02-24).
