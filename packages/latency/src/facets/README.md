# Facets

This directory contains the core facet interfaces for the Latency plugin architecture. Facets are abstract contracts that plugins can implement or consume, enabling a loosely-coupled, provider-agnostic ecosystem.

## Facet Maturity Matrix

Facets are categorized by their current adoption status:

| Facet | Module | Status | Notes |
|-------|--------|--------|-------|
| `IssueTracker` | issue-tracker.ts | **Active** | GitHub Issues, Jira plugins implemented |
| `SourceControl` | source-control.ts | **Active** | Git plugin implemented |
| `DevAgent` | dev-agent.ts | **Active** | Claude Code plugin implemented |
| `Pipeline` | pipeline.ts | **Active** | GitHub Actions plugin implemented |
| `Logger` | logging.ts | **Active** | Core logging abstraction |
| `EventBus` | events.ts | Awaiting Adoption | Phase 3 - cross-cutting pub/sub |
| `SecretStore` | secrets.ts | Awaiting Adoption | Phase 3 - credential management |
| `StateStore` | state.ts | Awaiting Adoption | Phase 3 - persistent key-value storage |
| `DecisionHandler` | decision.ts | Awaiting Adoption | Phase 3 - human-in-the-loop decisions |
| `WorkflowEngine` | workflow.ts | Awaiting Adoption | Phase 3 - multi-step orchestration |

### Status Definitions

- **Active**: Interface is stable and has one or more production implementations.
- **Awaiting Adoption**: Interface is defined and stable, but no consumer plugins have been implemented yet. These are planned for Phase 3 of the Latency roadmap.

## Architecture Notes

### Async-First Design

All facet methods return Promises (except `Logger`, which is intentionally synchronous). This ensures compatibility with remote backends (APIs, databases, cloud services) without blocking the caller.

### StateStore vs PluginStateStore

There are two distinct state storage interfaces:

1. **`StateStore`** (this module, `state.ts`): Async, persistent key-value storage for plugin-managed state. Intended for backends like Redis, S3, or databases.

2. **`PluginStateStore`** (`composition/context.ts`): Sync, in-memory state scoped to a single plugin instance. Used for ephemeral, request-scoped data within the plugin runtime.

The naming distinction (`StateStore` vs `PluginStateStore`) clarifies their different purposes and prevents import confusion.
