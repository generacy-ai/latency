# Common

Shared foundation types and utilities used across all Generacy components.

## Purpose

This directory contains fundamental building blocks that are universally needed across the platform:

- **Identity**: ULID generators for universally unique, lexicographically sortable identifiers
- **Timestamps**: ISO timestamp utilities for consistent time handling
- **Pagination**: Standard pagination schemas and utilities
- **Errors**: Centralized error codes and error response types
- **Urgency**: Urgency enum for task prioritization
- **Configuration**: Base configuration schemas
- **Messaging**: Message envelope types for inter-component communication
- **Versioning**: Semantic versioning utilities
- **Capabilities**: Capability system for feature negotiation
- **Metadata**: Plugin and extension metadata types

## Usage

```typescript
import {
  generateULID,
  ErrorCode,
  ErrorResponse,
  Urgency,
  MessageEnvelope,
  Capability
} from '@generacy-ai/latency';
```

## Migration Note

Types migrated from `@generacy-ai/contracts/common` as part of the contracts repository retirement (2026-02-24).
