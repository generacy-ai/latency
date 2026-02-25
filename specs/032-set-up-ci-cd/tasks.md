# Tasks: Set up CI/CD and npm Publishing

**Input**: Design documents from `/workspaces/latency/specs/032-set-up-ci-cd/`
**Prerequisites**: plan.md (required), spec.md (required)
**Status**: Ready

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

---

## Phase 1: Fix Package Consistency Issues

Ensure all 16 packages have uniform scripts and dependency declarations before CI can run `pnpm lint`, `pnpm test`, and `pnpm build` across the monorepo without failures.

### T001 [P] Add missing `lint` script to `latency-plugin-source-control`
**File**: `packages/latency-plugin-source-control/package.json`
- Add `"lint": "tsc --noEmit"` to the `scripts` section
- Matches the pattern used by all other 15 packages

### T002 [P] Add missing `test` scripts to `github-actions-interface` and `jira-interface`
**Files**:
- `packages/github-actions-interface/package.json`
- `packages/jira-interface/package.json`
- Add `"test": "echo 'No tests yet'"` to the `scripts` section of both packages
- These are the only 2 packages missing a `test` script

### T003 [P] Convert peerDependencies from fixed ranges to `workspace:^`
**Files**:
- `packages/github-actions-interface/package.json` — `@generacy-ai/latency`
- `packages/plugin-ci-cd/package.json` — `@generacy-ai/latency`
- `packages/latency-plugin-github-actions/package.json` — `@generacy-ai/latency`, `@generacy-ai/latency-plugin-ci-cd`, `@generacy-ai/github-actions-interface`
- Change all `"^0.1.0"` peerDependency versions to `"workspace:^"`
- Changesets will auto-resolve these to real version ranges on publish

### T004 [P] Add `publishConfig` to all 16 packages
**Files**:
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
- Add `"publishConfig": { "access": "public" }` to each package.json
- Required for `@generacy-ai/` scoped packages to publish publicly to npm

---

## Phase 2: Initialize Changesets

Set up the changesets CLI and configuration for version management and changelog generation.

### T005 Install `@changesets/cli` as root devDependency
**File**: `package.json` (root)
- Run `pnpm add -Dw @changesets/cli`
- This updates root `package.json` and `pnpm-lock.yaml`

### T006 Create `.changeset/config.json`
**File**: `.changeset/config.json`
- Create with `baseBranch: "develop"`, `access: "public"`
- Set `commit: false`, `updateInternalDependencies: "patch"`
- Leave `fixed: []` and `linked: []` empty (no package grouping)
- Use `"changelog": "@changesets/cli/changelog"` for changelog generation

### T007 [P] Create `.changeset/README.md`
**File**: `.changeset/README.md`
- Standard changesets README explaining what changesets are and how they work
- This is the conventional file created by `changeset init`

---

## Phase 3: Create CI Workflow

### T008 Create `.github/workflows/ci.yml`
**File**: `.github/workflows/ci.yml`
- Trigger on `pull_request` (all branches) and `push` to `develop`/`main`
- Add `concurrency` group with `cancel-in-progress: true`
- Steps: checkout → setup pnpm (v4) → setup node (20, cache pnpm) → `pnpm install --frozen-lockfile` → lint → test → build
- Uses `pnpm/action-setup@v4` (reads pnpm version from `packageManager` field)
- Uses `actions/setup-node@v4` with `cache: pnpm`

---

## Phase 4: Create Preview Publish Workflow

### T009 Create `.github/workflows/publish-preview.yml`
**File**: `.github/workflows/publish-preview.yml`
- Trigger via `workflow_run` chained after CI on `develop` branch
- Guard with `if: conclusion == 'success' && event == 'push'`
- Check for `.changeset/*.md` files (excluding README.md) — skip if none found
- Conditional steps (only if changesets present): setup pnpm → setup node (with registry-url) → install → build → `changeset version --snapshot preview` → `changeset publish --tag preview`
- Uses `NODE_AUTH_TOKEN` env var from `secrets.NPM_TOKEN`

---

## Phase 5: Create Stable Release Workflow

### T010 Create `.github/workflows/release.yml`
**File**: `.github/workflows/release.yml`
- Trigger on `push` to `main`
- Add `concurrency` group with `cancel-in-progress: false` (never cancel a release)
- Steps: checkout → setup pnpm → setup node (with registry-url) → install → build → `changesets/action@v1`
- Configure `changesets/action` with `publish: pnpm changeset publish`, custom title/commit message `"chore: version packages"`
- Uses `GITHUB_TOKEN` and `NODE_AUTH_TOKEN` env vars

---

## Phase 6: Validation

### T011 Run `pnpm lint`, `pnpm test`, and `pnpm build` locally
**Commands**:
- `pnpm lint` — verify all 16 packages have lint scripts and pass
- `pnpm test` — verify all 16 packages have test scripts and pass
- `pnpm build` — verify all packages build successfully
- All three must pass for CI workflow to succeed

### T012 Validate changesets configuration
**Commands**:
- `pnpm changeset status` — verify changesets recognizes the config and all packages
- Confirm no errors about missing packages or invalid config

### T013 Validate workflow YAML syntax
**Files**:
- `.github/workflows/ci.yml`
- `.github/workflows/publish-preview.yml`
- `.github/workflows/release.yml`
- Verify YAML is well-formed (no syntax errors)
- Verify action versions are correct (`@v4`, `@v1`)
- Verify environment variable references use correct syntax

---

## Dependencies & Execution Order

**Phase dependencies (sequential)**:
- Phase 1 must complete before Phase 6 (validation depends on consistent scripts)
- Phase 2 (T005) must complete before T006 (config depends on CLI being installed)
- Phase 2 must complete before Phase 6 (T012 depends on changesets being installed)
- Phase 3, 4, 5 can start after Phase 1 (workflows reference scripts that must exist)
- Phase 6 depends on all prior phases

**Parallel opportunities within phases**:
- Phase 1: T001, T002, T003, T004 are all independent package.json edits — run in parallel
- Phase 2: T007 can run in parallel with T005/T006
- Phases 3, 4, 5: T008, T009, T010 create independent workflow files — run in parallel (but after Phase 1)
- Phase 6: T011, T012, T013 can run in parallel

**Critical path**:
T001-T004 (parallel) → T005 → T006 → T008/T009/T010 (parallel) → T011/T012/T013 (parallel)

---

## Post-Implementation Notes (Not Tasks)

These are manual steps documented in the PR description, not automated tasks:

1. **NPM_TOKEN secret**: Must be configured in GitHub Settings → Secrets before publish workflows can succeed
2. **Branch protection on `main`**: Run `gh api` commands documented in plan.md Phase 6 after workflows exist on `main`
3. **Main branch sync**: Reset `main` to match `develop` so workflows are available on both branches
