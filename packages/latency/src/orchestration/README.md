# Orchestration

Types and schemas for work distribution and agent orchestration across the Generacy platform.

## Purpose

This directory contains the contracts that enable coordinated work distribution between components:

- **Work Items**: Schemas for distributing and tracking units of work
- **Agent Info**: Agent registration and capability advertisement
- **Events**: Orchestration lifecycle events
- **Status**: Status enums and state tracking

These types facilitate communication between the orchestration layer and various agents (Agency, Generacy, Humancy) to coordinate tasks, report progress, and manage workload distribution.

## Usage

```typescript
import {
  WorkItem,
  AgentInfo,
  OrchestrationEvent,
  WorkItemStatus
} from '@generacy-ai/latency';
```

## Migration Note

Types migrated from `@generacy-ai/contracts/orchestration` as part of the contracts repository retirement (2026-02-24).
