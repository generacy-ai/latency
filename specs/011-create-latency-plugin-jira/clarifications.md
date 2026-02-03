# Clarifications

Questions and answers to clarify the feature specification.

## Batch 1 - 2026-02-03 21:16

### Q1: Jira API Client Library
**Context**: The spec lists 'Jira API client' as a dependency. The choice of HTTP client affects error handling patterns, authentication setup, and retry logic throughout the plugin.
**Question**: Should we use a specific Jira client library (e.g., jira.js, jira-client) or implement direct HTTP calls against the Jira REST API v3?
**Options**:
- A: Use jira.js (popular, typed, maintained library with REST API v2/v3 support)
- B: Use direct HTTP calls (e.g., via fetch/axios) against Jira REST API v3 for full control
- C: Define an injectable HTTP adapter interface so consumers can bring their own client

**Answer**: *Pending*

### Q2: Authentication Strategy
**Context**: Jira Cloud and Jira Server/Data Center use different authentication methods. This affects plugin configuration and the constructor signature.
**Question**: Which Jira authentication method(s) should the plugin support?
**Options**:
- A: API Token only (Jira Cloud - simplest, email + token)
- B: API Token + Personal Access Token (covers both Cloud and Server/DC)
- C: Accept a pre-configured HTTP client/adapter and leave auth to the consumer

**Answer**: *Pending*

### Q3: Jira REST API Version
**Context**: Jira REST API v2 and v3 have different response formats. V3 uses ADF (Atlassian Document Format) for rich text, while v2 uses wiki markup. This affects how issue bodies are read and written.
**Question**: Should the plugin target Jira REST API v2 (wiki markup, broader compatibility) or v3 (ADF, modern but more complex)?
**Options**:
- A: V2 - simpler text handling, works with Server/DC and Cloud
- B: V3 - modern format, Cloud-focused, richer content support
- C: Support both via a version configuration option

**Answer**: *Pending*

### Q4: Package Directory Location
**Context**: Existing packages live under packages/ (e.g., packages/latency-plugin-issue-tracker). The interface package is a new pattern — no existing 'interface' packages exist yet.
**Question**: Should the jira-interface package live at packages/jira-interface/ or should it be nested differently (e.g., packages/interfaces/jira/)?
**Options**:
- A: packages/jira-interface/ — flat, consistent with existing package naming
- B: packages/interfaces/jira/ — grouped with future interface packages

**Answer**: *Pending*

### Q5: Undefined Jira Types Scope
**Context**: The spec references JiraIssueType, JiraPriority, JiraStatus, JiraSprint, and JiraTransition but doesn't define them. These types need to be comprehensive enough for real Jira usage but not over-engineered.
**Question**: Should the Jira-specific types (JiraIssueType, JiraPriority, etc.) use string literals matching Jira's built-in values, or be open string types to accommodate custom Jira configurations?
**Options**:
- A: String enums with Jira defaults (e.g., 'Bug' | 'Story' | 'Task' | 'Epic') plus a string escape hatch
- B: Open string types (just 'string') — maximally flexible for custom Jira setups
- C: Branded string types (nominal typing) for type safety without restricting values

**Answer**: *Pending*

