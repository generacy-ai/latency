# Implementation Plan: CI/CD for Latency Repo (1.2)

**Branch**: `031-1-2-ci-cd` | **Date**: 2026-02-26 | **Status**: Draft

## Summary

This is a **targeted fixes** implementation (per Q4 clarification). All three GitHub Actions workflows (`ci.yml`, `publish-preview.yml`, `release.yml`) and the changeset configuration already exist and are broadly functional. The work consists of fixing specific discrepancies between the spec/clarifications and the current implementation, then verifying the complete pipeline.

### Changes Required (derived from clarifications Q1–Q12)

| # | Source | Change | File |
|---|--------|--------|------|
| 1 | Q1 | Remove `--provenance` flag from publish command | `publish-preview.yml` |
| 2 | Q1 | Remove `id-token: write` permission | `publish-preview.yml` |
| 3 | Q1 | Remove `id-token: write` permission | `release.yml` |
| 4 | Q3 | Remove `npm install -g npm@latest` step | `publish-preview.yml` |
| 5 | Q3 | Remove `npm install -g npm@latest` step | `release.yml` |
| 6 | Q7 | Add `registry-url: https://registry.npmjs.org` to `setup-node` | `release.yml` |
| 7 | Q7 | Add `NODE_AUTH_TOKEN` env var to changesets/action step | `release.yml` |
| 8 | Q9 | Add concurrency group with `cancel-in-progress: true` | `publish-preview.yml` |
| 9 | Q12 | Document branch protection verification commands in PR | PR description |

## Technical Context

- **Language**: YAML (GitHub Actions workflows), JSON (changeset config)
- **Package manager**: pnpm 9.15.5, workspaces in `packages/*`
- **Node.js**: v22 in CI, >=20 in engines
- **Build tool**: TypeScript compiler (`tsc`) — no Turbo/Nx orchestration
- **Version management**: Changesets (`@changesets/cli` ^2.29.8)
- **Packages**: 16 workspace packages under `@generacy-ai/` scope

## Architecture Overview

### CI/CD Pipeline Flow

```
Developer opens PR (any branch)
    │
    ▼
┌─────────────────────────────┐
│  CI Workflow (ci.yml)       │
│  Trigger: pull_request,     │
│           push to develop/  │
│           main              │
│  Steps: build → lint → test │
│  Concurrency: cancel stale  │
└─────────────┬───────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
  (develop)           (main)
    │                   │
    ▼                   ▼
┌──────────────┐  ┌──────────────────┐
│ Preview      │  │ Release          │
│ Publish      │  │ Workflow         │
│ (workflow_   │  │ (push to main)   │
│  run after   │  │                  │
│  CI success) │  │ changesets/      │
│              │  │ action@v1:       │
│ snapshot     │  │ - Creates        │
│ versions     │  │   "Version       │
│ @preview tag │  │    Packages" PR  │
└──────────────┘  │ - OR publishes   │
                  │   @latest        │
                  └──────────────────┘
```

### Build Order (pnpm -r)

pnpm's recursive command naturally resolves workspace dependencies in topological order. No explicit build ordering configuration is needed because `pnpm -r build` already respects the dependency graph:

```
Level 0: @generacy-ai/latency (core — no internal deps)
Level 1: Interfaces + abstract plugins (depend only on core)
          ├── claude-code-interface
          ├── git-interface
          ├── github-issues-interface
          ├── jira-interface
          ├── latency-plugin-ci-cd
          ├── latency-plugin-dev-agent
          ├── latency-plugin-issue-tracker
          ├── latency-plugin-source-control
          └── latency-plugin-health-check
Level 2: Concrete plugins (depend on core + interfaces/abstracts)
          ├── github-actions-interface
          ├── latency-plugin-git
          ├── latency-plugin-jira
          └── latency-plugin-github-issues
Level 3: Top-level plugins (depend on Level 0–2)
          ├── latency-plugin-claude-code
          └── latency-plugin-github-actions
```

### npm Authentication Flow

```
setup-node with registry-url
    │
    ▼
Auto-creates .npmrc with:
  //registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}
    │
    ▼
NODE_AUTH_TOKEN set from secrets.NPM_TOKEN
    │
    ▼
pnpm changeset publish reads .npmrc for auth
```

## Implementation Phases

### Phase 1: Fix `publish-preview.yml` (4 changes)

**File**: `.github/workflows/publish-preview.yml`

**Change 1.1** — Remove `id-token: write` permission (Q1):
```yaml
# BEFORE
permissions:
  contents: read
  id-token: write

# AFTER
permissions:
  contents: read
```

**Change 1.2** — Add concurrency group (Q9):
```yaml
# ADD after permissions block
concurrency:
  group: preview-publish
  cancel-in-progress: true
```
Using a fixed group name (not branch-scoped) because this workflow only triggers on `develop`. This means only one preview publish can run at a time, and newer runs cancel stale ones.

**Change 1.3** — Remove `npm install -g npm@latest` step (Q3):
```yaml
# REMOVE this entire step (lines 49-51)
      - name: Update npm
        if: steps.changesets-check.outputs.has_changesets == 'true'
        run: npm install -g npm@latest
```

**Change 1.4** — Remove `--provenance` flag (Q1):
```yaml
# BEFORE
          pnpm changeset publish --tag preview --provenance

# AFTER
          pnpm changeset publish --tag preview
```

### Phase 2: Fix `release.yml` (3 changes)

**File**: `.github/workflows/release.yml`

**Change 2.1** — Remove `id-token: write` permission (Q1):
```yaml
# BEFORE
permissions:
  contents: write
  pull-requests: write
  id-token: write

# AFTER
permissions:
  contents: write
  pull-requests: write
```

**Change 2.2** — Add `registry-url` to `setup-node` (Q7):
```yaml
# BEFORE
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

# AFTER
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
          registry-url: https://registry.npmjs.org
```

**Change 2.3** — Remove `npm install -g npm@latest` step (Q3):
```yaml
# REMOVE this entire step (line 34)
      - run: npm install -g npm@latest
```

**Change 2.4** — Add `NODE_AUTH_TOKEN` to changesets/action env (Q7):
The `changesets/action` calls `pnpm changeset publish` internally. With `registry-url` set, `setup-node` creates an `.npmrc` that references `NODE_AUTH_TOKEN`. We need to ensure this env var is available:
```yaml
# BEFORE
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}

# AFTER
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```
Note: `NPM_TOKEN` is kept for backwards compatibility with the changesets action, which may reference it internally. `NODE_AUTH_TOKEN` is the variable that `.npmrc` (created by `setup-node`) uses.

### Phase 3: Verify `ci.yml` (no changes expected)

**File**: `.github/workflows/ci.yml`

Review confirms `ci.yml` already matches the spec:
- Triggers on `pull_request` (all branches) and `push` to `develop`/`main` ✓ (Q6)
- Concurrency group with `cancel-in-progress: true` ✓
- Steps: checkout → setup pnpm → setup node → install → build → lint → test ✓
- No provenance, no npm update, no registry-url (not needed for CI-only) ✓

**No changes required.**

### Phase 4: Verify `.changeset/config.json` (no changes expected)

Review confirms changeset config matches the spec:
- `baseBranch: "develop"` ✓
- `access: "public"` ✓
- `updateInternalDependencies: "patch"` ✓
- `commit: false` ✓

**No changes required.**

### Phase 5: Post-merge verification checklist (Q12)

Include in PR description — these commands verify branch protection rules reference the CI status check. Must be run after workflows exist on `main`:

```bash
# Verify branch protection on develop
gh api repos/{owner}/{repo}/branches/develop/protection \
  --jq '.required_status_checks.contexts'

# Verify branch protection on main
gh api repos/{owner}/{repo}/branches/main/protection \
  --jq '.required_status_checks.contexts'

# Expected: should include "Build, Lint, Test" (the CI job name)
```

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth mechanism | `registry-url` in `setup-node` | Standard GitHub Actions approach; auto-creates `.npmrc` with `NODE_AUTH_TOKEN`. Consistent across both publish workflows (Q2, Q7). |
| Provenance | Removed | Spec lists OIDC as out of scope. Prior commit removed it due to issues. Pure `NPM_TOKEN` auth is simpler (Q1). |
| npm global update | Removed | pnpm is the package manager; global npm update was a workaround for the provenance bug. Saves ~10s per workflow (Q3). |
| Preview concurrency | `cancel-in-progress: true` | Prevents duplicate snapshot publishes. Latest merge wins since older previews are stale (Q9). |
| Release concurrency | `cancel-in-progress: false` (unchanged) | Release publishes should never be cancelled mid-publish to avoid partial releases. |
| Changesets action version | `@v1` major tag (unchanged) | Standard convention. Well-maintained action. SHA pinning adds maintenance burden (Q10). |
| Build ordering | pnpm topological sort (unchanged) | `pnpm -r build` already respects workspace dependency graph. No Turbo/Nx needed for 16 packages (Q11). |
| Test coverage | Accept zero tests (unchanged) | CI validates what exists. Coverage thresholds are a separate concern (Q8). |
| CI trigger scope | All branches (unchanged) | Spec explicitly says "on PR to any branch." Minimal Actions minutes overhead (Q6). |
| Failure handling | Fail fast (unchanged) | Preview publishes are best-effort; next merge re-triggers. No retry logic needed (Q5). |

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `NODE_AUTH_TOKEN` not picked up by changesets/action | Low | High — publish fails | Both `NPM_TOKEN` and `NODE_AUTH_TOKEN` are set in env. The `.npmrc` from `setup-node` uses `NODE_AUTH_TOKEN`. Changesets action may use `NPM_TOKEN` directly. Belt-and-suspenders approach. |
| Removing `--provenance` breaks something | Very Low | Low | Provenance is additive metadata, not required for publishing. Its removal cannot break the publish itself. |
| `registry-url` conflicts with pnpm | Low | Medium — auth fails | This was the concern from commit 9a764d9, but that issue was linked to OIDC/provenance (now removed). With pure token auth, `registry-url` is the standard approach. |
| Branch protection not configured after merge | Medium | Medium — PRs can merge without CI | Explicit verification checklist in PR description with `gh api` commands. |
| Concurrent preview publishes before fix | Low | Low — version conflicts | Fix is a one-liner concurrency group. Once merged, the race condition is eliminated. |

## Files Modified

| File | Action | Lines Changed (approx) |
|------|--------|----------------------|
| `.github/workflows/publish-preview.yml` | Edit | ~8 lines removed/modified, ~3 lines added |
| `.github/workflows/release.yml` | Edit | ~4 lines removed/modified, ~3 lines added |
| `.github/workflows/ci.yml` | None | Verified as-is |
| `.changeset/config.json` | None | Verified as-is |

## Out of Scope

- npm OIDC trusted publishing / provenance (Q1)
- ESLint/Biome linter setup (Q11)
- Test coverage thresholds (Q8)
- Branch protection rule configuration (Q12 — verification only)
- Turbo/Nx build orchestration
- GitHub Environments or deployment protection rules

## Acceptance Criteria Verification

| Criterion | How Verified |
|-----------|-------------|
| CI runs lint, test, build on all PRs | `ci.yml` triggers on `pull_request` with no branch filter |
| Preview publish on merge to develop | `publish-preview.yml` triggers via `workflow_run` on CI success for develop push |
| Stable publish on merge to main | `release.yml` triggers on push to main, uses `changesets/action@v1` |
| Build order respects dependencies | `pnpm -r build` resolves topologically; verified by dependency graph analysis |
| Changesets for version management | `.changeset/config.json` configured with `baseBranch: "develop"`, `access: "public"` |
| Tagging a release publishes all changed packages | Changesets action creates "Version Packages" PR on main; merging that PR triggers publish |
| Branch protection blocks failing PRs | Post-merge verification checklist with `gh api` commands |
