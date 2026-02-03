# Data Model: latency-plugin-issue-tracker

## Core Types (from `@generacy-ai/latency`)

These types are imported from the core package and used by the abstract plugin:

```typescript
// From facets/issue-tracker.ts
interface Issue {
  id: string;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: string[];
  assignees: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface IssueSpec {
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
}

interface IssueUpdate {
  title?: string;
  body?: string;
  state?: 'open' | 'closed';
  labels?: string[];
  assignees?: string[];
}

interface IssueQuery extends PaginatedQuery {
  state?: 'open' | 'closed' | 'all';
  labels?: string[];
  assignee?: string;
}

interface Comment {
  id: string;
  body: string;
  author: string;
  createdAt: Date;
}

// From facets/common.ts
interface PaginatedQuery {
  limit?: number;
  offset?: number;
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}
```

## New Types (defined in this package)

### CacheEntry<T>

```typescript
interface CacheEntry<T> {
  value: T;
  cachedAt: number;  // Date.now() timestamp
}
```

Wraps cached values with insertion timestamp for TTL expiry checks.

### ValidationError

```typescript
class ValidationError extends FacetError {
  constructor(message: string, options?: { cause?: unknown });
  // Inherits: code = 'VALIDATION', name = 'ValidationError'
}
```

Extends `FacetError` from core with `code = 'VALIDATION'`.

### AbstractIssueTrackerPlugin (constructor options)

```typescript
interface AbstractIssueTrackerOptions {
  cacheTimeout?: number;  // TTL in milliseconds, default: 60000
}
```

## Relationships

```
FacetError (core)
  └── ValidationError (this package)

IssueTracker (core interface)
  └── AbstractIssueTrackerPlugin (this package, abstract)
       └── ConcretePlugin (future packages, e.g., GitHub, Jira)

CacheEntry<Issue> stored in Map<string, CacheEntry<Issue>>
```

## Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| `IssueSpec.title` | Required, non-empty after trim | "Issue title is required" |
| `IssueUpdate.title` | If provided, non-empty after trim | "Issue title cannot be empty" |
| `addComment` comment | Required, non-empty after trim | "Comment cannot be empty" |
