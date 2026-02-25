# Implementation Plan: Set up CI/CD and npm Publishing

**Spec**: 032-set-up-ci-cd | **Branch**: `032-set-up-ci-cd` | **Date**: 2026-02-25

## Summary

Configure automated CI, changesets-based versioning, and npm publishing for the latency monorepo's 16 `@generacy-ai` scoped packages. This involves creating three GitHub Actions workflows (CI, preview publish, stable release), initializing changesets, fixing package.json inconsistencies, and documenting branch protection setup.

## Technical Context

- **Language**: TypeScript (ES2022, NodeNext modules)
- **Package manager**: pnpm 9.15.5 with `pnpm-workspace.yaml`
- **Node version**: >=20.0.0
- **Build tool**: `tsc` (no bundler, no Turbo/Nx)
- **Test framework**: Vitest 3.2.4
- **Packages**: 16 packages under `packages/*`, all `@generacy-ai/` scope, all at version 0.1.0
- **New dependency**: `@changesets/cli` (devDependency at root)

## Architecture Overview

```
Push/PR → CI workflow (lint, test, build)
                ↓ (on develop, via workflow_run)
         Preview Publish workflow (snapshot → npm @preview)

Push to main → Release workflow (changesets/action → Version PR → npm @latest)
```

Three independent workflow files, with preview publish chained after CI via `workflow_run`:

1. **`.github/workflows/ci.yml`** — Runs on all PRs + pushes to develop/main
2. **`.github/workflows/publish-preview.yml`** — Triggered by successful CI on develop (via `workflow_run`)
3. **`.github/workflows/release.yml`** — Runs on push to main, creates Version Packages PR or publishes

## Implementation Phases

### Phase 1: Fix Package Consistency Issues

Fix script and dependency inconsistencies across packages before adding CI.

#### 1.1 Add missing `lint` script to `latency-plugin-source-control`

**File**: `packages/latency-plugin-source-control/package.json`

Add `"lint": "tsc --noEmit"` to the `scripts` section to match all other packages.

**Before**:
```json
"scripts": {
  "build": "tsc",
  "typecheck": "tsc --noEmit",
  "test": "vitest run"
}
```

**After**:
```json
"scripts": {
  "build": "tsc",
  "typecheck": "tsc --noEmit",
  "lint": "tsc --noEmit",
  "test": "vitest run"
}
```

#### 1.2 Add missing `test` scripts to 2 packages

**Files**:
- `packages/github-actions-interface/package.json`
- `packages/jira-interface/package.json`

Add `"test": "echo 'No tests yet'"` to the `scripts` section.

**github-actions-interface — before**:
```json
"scripts": {
  "build": "tsc",
  "typecheck": "tsc --noEmit",
  "lint": "tsc --noEmit"
}
```

**github-actions-interface — after**:
```json
"scripts": {
  "build": "tsc",
  "typecheck": "tsc --noEmit",
  "lint": "tsc --noEmit",
  "test": "echo 'No tests yet'"
}
```

Same pattern for `jira-interface`.

#### 1.3 Convert peerDependencies from fixed ranges to `workspace:^`

Per Q2 answer: convert `^0.1.0` peer dependency ranges to `workspace:^` so changesets resolves them automatically on publish.

**Files** (3 packages):

**`packages/github-actions-interface/package.json`**:
```json
// Before
"peerDependencies": {
  "@generacy-ai/latency": "^0.1.0"
}
// After
"peerDependencies": {
  "@generacy-ai/latency": "workspace:^"
}
```

**`packages/plugin-ci-cd/package.json`**:
```json
// Before
"peerDependencies": {
  "@generacy-ai/latency": "^0.1.0"
}
// After
"peerDependencies": {
  "@generacy-ai/latency": "workspace:^"
}
```

**`packages/latency-plugin-github-actions/package.json`**:
```json
// Before
"peerDependencies": {
  "@generacy-ai/latency": "^0.1.0",
  "@generacy-ai/latency-plugin-ci-cd": "^0.1.0",
  "@generacy-ai/github-actions-interface": "^0.1.0"
}
// After
"peerDependencies": {
  "@generacy-ai/latency": "workspace:^",
  "@generacy-ai/latency-plugin-ci-cd": "workspace:^",
  "@generacy-ai/github-actions-interface": "workspace:^"
}
```

#### 1.4 Add `publishConfig` to all 16 packages

Add to every `packages/*/package.json`:
```json
"publishConfig": {
  "access": "public"
}
```

**All 16 packages**:
- `packages/latency/package.json`
- `packages/claude-code-interface/package.json`
- `packages/git-interface/package.json`
- `packages/github-actions-interface/package.json`
- `packages/github-issues-interface/package.json`
- `packages/jira-interface/package.json`
- `packages/latency-plugin-claude-code/package.json`
- `packages/latency-plugin-dev-agent/package.json`
- `packages/latency-plugin-git/package.json`
- `packages/latency-plugin-github-actions/package.json`
- `packages/latency-plugin-github-issues/package.json`
- `packages/latency-plugin-health-check/package.json`
- `packages/latency-plugin-issue-tracker/package.json`
- `packages/latency-plugin-jira/package.json`
- `packages/latency-plugin-source-control/package.json`
- `packages/plugin-ci-cd/package.json`

---

### Phase 2: Initialize Changesets

#### 2.1 Install `@changesets/cli`

```bash
pnpm add -Dw @changesets/cli
```

#### 2.2 Create `.changeset/config.json`

**File**: `.changeset/config.json`

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "develop",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

Key decisions (per clarifications):
- `baseBranch: "develop"` — PRs target develop
- `access: "public"` — all packages published publicly
- `fixed: []` and `linked: []` — no grouping (per Q9)
- `updateInternalDependencies: "patch"` — changesets default behavior

#### 2.3 Create `.changeset/README.md`

Standard changesets README file (created automatically by `npx changeset init`, but we'll create it manually since we're writing config by hand):

```markdown
# Changesets

Hello and welcome! This folder has been automatically generated by `@changesets/cli`, a build tool that works
with multi-package repos, or single-package repos to help you version and publish your code. You can
find the full documentation for it [in the main changesets repo](https://github.com/changesets/changesets).

**What is a changeset?**

A changeset is a piece of information about changes made in a branch or commit. It holds three bits of information:
- What we need to release
- What version we are releasing packages at (using a semver bump type)
- A changelog entry for the released packages
```

---

### Phase 3: Create CI Workflow

#### 3.1 Create `.github/workflows/ci.yml`

**File**: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [develop, main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    name: Lint, Test, Build
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Test
        run: pnpm test

      - name: Build
        run: pnpm build
```

**Design decisions**:
- `pull_request` with no branch filter — CI runs on PRs to any branch (per Q5)
- `push` to develop/main — validates merged result
- `concurrency` with `cancel-in-progress` — avoids wasted runs on rapid pushes
- `pnpm/action-setup@v4` reads `packageManager` from root `package.json` to determine pnpm version
- `actions/setup-node@v4` with `cache: pnpm` — caches pnpm store for faster installs
- Steps run in order: lint → test → build (fail fast on cheaper checks first)

---

### Phase 4: Create Preview Publish Workflow

#### 4.1 Create `.github/workflows/publish-preview.yml`

**File**: `.github/workflows/publish-preview.yml`

Chained after CI via `workflow_run` (per Q10 answer: B).

```yaml
name: Publish Preview

on:
  workflow_run:
    workflows: [CI]
    types: [completed]
    branches: [develop]

jobs:
  publish-preview:
    name: Publish Preview Packages
    runs-on: ubuntu-latest
    if: >-
      github.event.workflow_run.conclusion == 'success' &&
      github.event.workflow_run.event == 'push'

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Check for changesets
        id: changesets-check
        run: |
          CHANGESET_FILES=$(find .changeset -name '*.md' ! -name 'README.md' 2>/dev/null | head -1)
          if [ -z "$CHANGESET_FILES" ]; then
            echo "has_changesets=false" >> "$GITHUB_OUTPUT"
            echo "No changeset files found, skipping preview publish"
          else
            echo "has_changesets=true" >> "$GITHUB_OUTPUT"
            echo "Changeset files found, proceeding with preview publish"
          fi

      - name: Setup pnpm
        if: steps.changesets-check.outputs.has_changesets == 'true'
        uses: pnpm/action-setup@v4

      - name: Setup Node.js
        if: steps.changesets-check.outputs.has_changesets == 'true'
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
          registry-url: https://registry.npmjs.org

      - name: Install dependencies
        if: steps.changesets-check.outputs.has_changesets == 'true'
        run: pnpm install --frozen-lockfile

      - name: Build
        if: steps.changesets-check.outputs.has_changesets == 'true'
        run: pnpm build

      - name: Publish preview packages
        if: steps.changesets-check.outputs.has_changesets == 'true'
        run: |
          pnpm changeset version --snapshot preview
          pnpm changeset publish --tag preview
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Design decisions**:
- `workflow_run` trigger on CI completion (per Q10: B) — preview only publishes after CI passes
- `if` condition checks `conclusion == 'success'` and `event == 'push'` — skips PR events
- Changeset file check — only publishes when `.changeset/*.md` files exist (not README.md), avoiding noise from docs-only changes
- `--snapshot preview` — produces versions like `0.1.0-preview-YYYYMMDDHHMMSS` (per Q4: A, accept default format)
- `--tag preview` — publishes with `@preview` dist-tag
- `NODE_AUTH_TOKEN` standardized (per Q6: A)
- Build step is needed since `workflow_run` runs on a fresh checkout

---

### Phase 5: Create Stable Release Workflow

#### 5.1 Create `.github/workflows/release.yml`

**File**: `.github/workflows/release.yml`

```yaml
name: Release

on:
  push:
    branches: [main]

concurrency:
  group: release-${{ github.ref }}
  cancel-in-progress: false

jobs:
  release:
    name: Release Packages
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
          registry-url: https://registry.npmjs.org

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Create Release PR or Publish
        uses: changesets/action@v1
        with:
          publish: pnpm changeset publish
          title: "chore: version packages"
          commit: "chore: version packages"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Design decisions**:
- `concurrency` with `cancel-in-progress: false` — never cancel an in-progress release
- `changesets/action@v1` handles two cases:
  1. If changeset files exist → creates "Version Packages" PR that bumps versions and updates changelogs
  2. If no changeset files exist (i.e., after merging the Version Packages PR) → publishes to npm with `@latest` tag
- `NODE_AUTH_TOKEN` standardized (per Q6: A)
- Idempotent — re-running skips already-published versions (npm publish fails gracefully for existing versions, changesets handles this)

---

### Phase 6: Documentation (Branch Protection)

Per Q8 answer (A): document branch protection setup in the PR description as manual post-merge steps.

The PR description should include these `gh api` commands to be run after workflows are on `main`:

```bash
# Set branch protection on main
gh api repos/generacy-ai/latency/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["ci"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null
```

This is **not** automated — it's documented as a one-time manual step for a maintainer to run after the CI workflow exists on `main`.

---

## File Changes Summary

### New Files (5)
| File | Description |
|------|-------------|
| `.changeset/config.json` | Changesets configuration |
| `.changeset/README.md` | Changesets documentation |
| `.github/workflows/ci.yml` | CI workflow (lint, test, build) |
| `.github/workflows/publish-preview.yml` | Preview publish workflow |
| `.github/workflows/release.yml` | Stable release workflow |

### Modified Files (18)
| File | Changes |
|------|---------|
| `package.json` (root) | Add `@changesets/cli` devDependency |
| `pnpm-lock.yaml` | Updated by `pnpm install` |
| `packages/latency-plugin-source-control/package.json` | Add `lint` script, add `publishConfig` |
| `packages/github-actions-interface/package.json` | Add `test` script, convert peerDeps to `workspace:^`, add `publishConfig` |
| `packages/jira-interface/package.json` | Add `test` script, add `publishConfig` |
| `packages/plugin-ci-cd/package.json` | Convert peerDeps to `workspace:^`, add `publishConfig` |
| `packages/latency-plugin-github-actions/package.json` | Convert peerDeps to `workspace:^`, add `publishConfig` |
| `packages/latency/package.json` | Add `publishConfig` |
| `packages/claude-code-interface/package.json` | Add `publishConfig` |
| `packages/git-interface/package.json` | Add `publishConfig` |
| `packages/github-issues-interface/package.json` | Add `publishConfig` |
| `packages/latency-plugin-claude-code/package.json` | Add `publishConfig` |
| `packages/latency-plugin-dev-agent/package.json` | Add `publishConfig` |
| `packages/latency-plugin-git/package.json` | Add `publishConfig` |
| `packages/latency-plugin-github-issues/package.json` | Add `publishConfig` |
| `packages/latency-plugin-health-check/package.json` | Add `publishConfig` |
| `packages/latency-plugin-issue-tracker/package.json` | Add `publishConfig` |
| `packages/latency-plugin-jira/package.json` | Add `publishConfig` |

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Preview trigger mechanism | `workflow_run` chained after CI | Avoids publishing packages that fail CI; saves duplicate install/build (Q10: B) |
| PR trigger scope | All PRs (no branch filter) | Spec explicitly says CI runs on all PRs (Q5: A) |
| Missing scripts | Add placeholder scripts | Consistency; `--if-present` would mask future gaps (Q1: A, Q7: A) |
| Peer dependency versions | `workspace:^` protocol | Changesets auto-resolves on publish; fixed ranges go stale (Q2: A) |
| Lint in CI | Keep as separate step | Future-proofs for real linter; minimal overhead (Q3: A) |
| Snapshot version format | Accept changesets default | `@preview` tag and pre-release identification matter, not exact format (Q4: A) |
| Auth token env var | `NODE_AUTH_TOKEN` everywhere | Consistent with `actions/setup-node` `.npmrc` convention (Q6: A) |
| Package grouping | None (empty fixed/linked) | Too early to group; all at 0.1.0, no external consumers yet (Q9: A) |
| Branch protection | Document in PR description | One-time manual step; requires CI on main first (Q8: A) |

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| `NPM_TOKEN` secret not configured | Workflows will fail gracefully at publish step; CI still runs. Document required secret in PR description. |
| `workflow_run` uses default branch workflow definition | The `publish-preview.yml` must exist on the default branch (`develop`) for `workflow_run` to trigger. This is satisfied since we're merging to `develop`. |
| Changesets snapshot publish on packages with no real changes | Changesets only versions/publishes packages listed in changeset files — no accidental publishes. |
| `pnpm-lock.yaml` changes from adding `@changesets/cli` | Expected; lock file will be committed as part of this PR. |
| Concurrent release and preview publishes | `concurrency` groups prevent parallel runs within each workflow. |

## Prerequisites

Before merging:
- [ ] `NPM_TOKEN` secret must be configured at the org or repo level in GitHub Settings → Secrets

Post-merge to `develop` and after syncing `main`:
- [ ] Configure branch protection on `main` using documented `gh api` commands

## Validation

After implementation, verify locally:
```bash
# All scripts exist and pass
pnpm lint
pnpm test
pnpm build

# Changeset config is valid
pnpm changeset status

# Workflow YAML is valid (if act is available)
# act -l
```

After merge to `develop`:
- [ ] CI workflow triggers on the push event
- [ ] Preview publish workflow triggers after CI succeeds (only if changeset files exist)

After syncing `main`:
- [ ] Release workflow triggers and creates Version Packages PR (if changesets present)
