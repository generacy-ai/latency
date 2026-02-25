# Types

Cross-component contract types for inter-service communication in the Generacy platform.

## Purpose

This directory organizes TypeScript interfaces and Zod schemas that define contracts between different components and features. Each subdirectory represents a specific domain or integration point:

### Component Integration
- **agency-generacy**: Agency ↔ Generacy communication contracts
- **agency-humancy**: Agency ↔ Humancy communication contracts
- **generacy-humancy**: Generacy ↔ Humancy communication contracts

### Feature Domains
- **decision-model**: Decision-making and reasoning types
- **extension-comms**: Browser extension communication protocols
- **knowledge-store**: Knowledge management and retrieval types
- **learning-loop**: Learning and feedback loop schemas
- **attribution-metrics**: Attribution tracking and metrics
- **data-export**: Data export format definitions
- **github-app**: GitHub App integration types

## Design Principle

Types are organized by the **communication boundary** they serve, not by the component that owns them. This approach:
- Makes integration points explicit and discoverable
- Prevents circular dependencies between components
- Creates a single source of truth for cross-component contracts
- Enables independent evolution of components while maintaining compatibility

## Usage

```typescript
import {
  // Component integration
  AgencyGeneracyMessage,

  // Feature domains
  DecisionContext,
  ExtensionMessage,
  KnowledgeEntry
} from '@generacy-ai/latency';
```

## Migration Note

Types migrated from `@generacy-ai/contracts/schemas` and component-specific directories as part of the contracts repository retirement (2026-02-24).
