# Quickstart: latency-plugin-source-control

## Installation

From within the monorepo:

```bash
# Install dependencies (from repo root)
pnpm install
```

The package uses a workspace dependency on `@generacy-ai/latency`, so no external install is needed.

## Building

```bash
# Build all packages
pnpm build

# Build only this package
pnpm --filter @generacy-ai/latency-plugin-source-control build
```

## Running Tests

```bash
# Run tests for this package
pnpm --filter @generacy-ai/latency-plugin-source-control test

# Run tests in watch mode
pnpm --filter @generacy-ai/latency-plugin-source-control test -- --watch
```

## Usage

This package provides an abstract base class. You cannot instantiate it directly — create a subclass that implements the abstract `do*` methods.

### Creating a Subclass

```typescript
import {
  AbstractSourceControlPlugin,
  ValidationError,
  type CommitSpec,
  type Commit,
  type BranchSpec,
  type Branch,
  type DiffEntry,
  type PaginatedQuery,
  type PaginatedResult,
  type CommitQuery,
} from '@generacy-ai/latency-plugin-source-control';

class MyGitPlugin extends AbstractSourceControlPlugin {
  protected async doCreateBranch(spec: BranchSpec): Promise<Branch> {
    // Your implementation here
  }

  protected async doGetBranch(name: string): Promise<Branch> {
    // Your implementation here
  }

  protected async doListBranches(query?: PaginatedQuery): Promise<PaginatedResult<Branch>> {
    // Your implementation here
  }

  protected async doCommit(spec: CommitSpec): Promise<Commit> {
    // Your implementation here
  }

  protected async doGetCommit(ref: string): Promise<Commit> {
    // Your implementation here
  }

  protected async doListCommits(query: CommitQuery): Promise<PaginatedResult<Commit>> {
    // Your implementation here
  }

  protected async doGetDiff(from: string, to: string): Promise<DiffEntry[]> {
    // Your implementation here
  }

  // Additional VCS operations
  protected async doPush(remote?: string, branch?: string): Promise<void> {
    // Your implementation here
  }

  protected async doPull(remote?: string, branch?: string): Promise<void> {
    // Your implementation here
  }

  protected async doCheckout(ref: string): Promise<void> {
    // Your implementation here
  }

  protected async doGetStatus(): Promise<DiffEntry[]> {
    // Your implementation here
  }
}

// Usage
const plugin = new MyGitPlugin({ workingDirectory: '/path/to/repo' });
const branch = await plugin.createBranch({ name: 'feature/new' });
const commit = await plugin.commit({ message: 'Initial commit', files: ['src/index.ts'] });
```

### Error Handling

```typescript
import { ValidationError } from '@generacy-ai/latency-plugin-source-control';

try {
  await plugin.commit({ message: '', files: [] });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(`Validation failed: ${error.message}`);
    console.error(`Error code: ${error.code}`); // 'VALIDATION_ERROR'
  }
}
```

## Troubleshooting

### Build fails with "Cannot find module '@generacy-ai/latency'"
Run `pnpm install` from the repo root to ensure workspace links are set up.

### Tests fail with ESM errors
Ensure you're using Node.js ≥20 and that `"type": "module"` is set in the package's `package.json`.
