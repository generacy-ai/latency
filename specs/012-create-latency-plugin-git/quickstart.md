# Quickstart: latency-plugin-git

## Installation

```bash
# From the monorepo root
pnpm install

# Build all packages (git-interface must build before latency-plugin-git)
pnpm build
```

## Usage

### Basic setup

```typescript
import { GitPlugin } from '@generacy-ai/latency-plugin-git';

const git = new GitPlugin({
  workingDirectory: '/path/to/repo',
  defaultRemote: 'origin',  // optional, defaults to "origin"
});
```

### Committing changes

```typescript
const commit = await git.commit({
  message: 'feat: add new feature',
  files: ['src/feature.ts', 'src/feature.test.ts'],
});
console.log(commit.sha);       // full SHA
console.log(commit.shortSha);  // 7-char SHA
```

### Working with branches

```typescript
// Create a branch
const branch = await git.createBranch({ name: 'feature/login', from: 'main' });

// Get branch info
const main = await git.getBranch('main');
console.log(main.head);  // HEAD commit SHA

// List branches
const { items, total } = await git.listBranches({ limit: 10 });
```

### Viewing diffs

```typescript
const diff = await git.getDiff('main', 'feature/login');
for (const entry of diff) {
  console.log(`${entry.status} ${entry.path} (+${entry.additions} -${entry.deletions})`);
}
```

### Using type guards

```typescript
import { isGitCommit, isGitBranch } from '@generacy-ai/git-interface';
import type { Commit } from '@generacy-ai/latency';

function handleCommit(commit: Commit) {
  if (isGitCommit(commit)) {
    console.log(`Tree: ${commit.tree}, Parents: ${commit.parents.join(', ')}`);
  }
}
```

## Available Commands

From the monorepo root:

```bash
# Build
pnpm --filter @generacy-ai/git-interface build
pnpm --filter @generacy-ai/latency-plugin-git build

# Type check
pnpm --filter @generacy-ai/latency-plugin-git typecheck

# Run tests
pnpm --filter @generacy-ai/latency-plugin-git test
pnpm --filter @generacy-ai/git-interface test
```

## Troubleshooting

### "not a git repository" error
Ensure `workingDirectory` points to a directory containing a `.git` folder or is inside a git repository.

### Build order issues
`git-interface` must be built before `latency-plugin-git`. Running `pnpm build` from the root handles this via workspace dependency ordering.
