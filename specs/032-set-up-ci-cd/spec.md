# Feature Specification: Set up CI/CD and npm publishing

Configure automated CI and npm publishing for the latency repo's @generacy-ai scoped packages.

**Branch**: `032-set-up-ci-cd` | **Date**: 2026-02-25 | **Status**: Draft

## Summary

Set up a complete CI/CD pipeline for the `latency` monorepo (16 packages under the `@generacy-ai/` scope) using GitHub Actions and Changesets. The pipeline provides three workflows: continuous integration on all PRs, preview snapshot publishing on `develop`, and stable release publishing on `main`. This establishes latency as the first repo in the dependency chain (latency → agency → generacy) to have automated publishing.

## User Stories

### US1: Developer submitting a PR

**As a** developer contributing to the latency repo,
**I want** automated CI checks (lint, test, build) to run on my pull request,
**So that** I get immediate feedback on whether my changes are safe to merge.

**Acceptance Criteria**:
- [ ] CI workflow triggers on all PRs targeting `develop` or `main`
- [ ] CI runs lint (`pnpm lint`), test (`pnpm test`), and build (`pnpm build`) steps
- [ ] CI uses `pnpm install --frozen-lockfile` to ensure reproducible installs
- [ ] CI runs on Node 20 with the repo's pinned pnpm version (9.15.5)
- [ ] PR cannot be merged if CI fails (branch protection on `main`)

### US2: Developer describing changes for release

**As a** developer merging a feature or fix,
**I want** to add a changeset file describing my change and its semver impact,
**So that** the release process knows what version bump to apply and what to include in the changelog.

**Acceptance Criteria**:
- [ ] `@changesets/cli` is installed as a root dev dependency
- [ ] `.changeset/config.json` is configured with `baseBranch: "develop"` and `access: "public"`
- [ ] Developers can run `pnpm changeset` to interactively create changeset files
- [ ] Changeset files are committed as part of the PR (`.changeset/*.md`)

### US3: Consuming preview versions during development

**As a** developer working on a downstream repo (agency or generacy),
**I want** preview versions of latency packages published automatically when changes land on `develop`,
**So that** I can test against the latest changes before a stable release.

**Acceptance Criteria**:
- [ ] Preview publish triggers on push to `develop` (i.e., after PR merge)
- [ ] Versions use the format `X.Y.Z-preview.YYYYMMDDHHMMSS` (datetime-based snapshot)
- [ ] Packages are published with the `@preview` dist-tag
- [ ] Publishing only occurs when `.changeset/*.md` files are present (skip docs-only changes)
- [ ] Downstream consumers install via `pnpm add @generacy-ai/latency@preview`

### US4: Releasing stable versions

**As a** maintainer preparing a stable release,
**I want** an automated workflow that versions packages and publishes to npm on merge to `main`,
**So that** releases are consistent, traceable, and require no manual npm commands.

**Acceptance Criteria**:
- [ ] On push to `main`, the `changesets/action` creates a "Version Packages" PR
- [ ] The Version Packages PR bumps versions and updates changelogs based on accumulated changesets
- [ ] Merging the Version Packages PR triggers `pnpm publish -r` with `@latest` dist-tag
- [ ] Already-published versions are skipped (idempotent re-runs)
- [ ] All packages are published with `--access public`

### US5: Protecting the main branch

**As a** maintainer,
**I want** branch protection rules on `main`,
**So that** only reviewed and CI-passing code reaches the release branch.

**Acceptance Criteria**:
- [ ] `main` requires a pull request for all changes (no direct pushes)
- [ ] `main` requires CI status checks to pass before merge (build + tests + lint)
- [ ] `main` is synced to match `develop` before protection is applied (one-time setup)

## Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-001 | Create `.github/workflows/ci.yml` that runs lint, test, and build on PRs and pushes to `develop`/`main` | P0 | Use `pnpm install --frozen-lockfile`; target Node 20; use `pnpm/action-setup@v4` with version from `packageManager` field |
| FR-002 | Install `@changesets/cli` as a root dev dependency | P0 | `pnpm add -Dw @changesets/cli` |
| FR-003 | Create `.changeset/config.json` with `baseBranch: "develop"`, `access: "public"` | P0 | Standard changesets monorepo config |
| FR-004 | Create `.github/workflows/publish-preview.yml` for snapshot publishing on `develop` push | P0 | Use changesets snapshot mode; dist-tag `@preview`; datetime-based version format |
| FR-005 | Add conditional check: only publish previews when `.changeset/*.md` files exist | P1 | Prevents noise from docs-only or config-only merges |
| FR-006 | Create `.github/workflows/release.yml` for stable publishing on `main` push | P0 | Uses `changesets/action` to open Version Packages PR; merge triggers publish |
| FR-007 | Add `"publishConfig": { "access": "public" }` to all 16 package.json files | P0 | Required for scoped packages to publish publicly to npm |
| FR-008 | Add `NPM_TOKEN` as a GitHub Actions secret | P0 | Org-level secret; used by publish workflows for npm authentication |
| FR-009 | Configure branch protection on `main`: require PR + CI checks | P1 | Applied via GitHub repo settings or `gh api` |
| FR-010 | Sync `main` to match `develop` before enabling branch protection | P1 | One-time operation; both currently at same commit `d396b4b` so may be a no-op |
| FR-011 | Ensure all workflows are idempotent — re-running skips already-published versions | P1 | Changesets + npm natively handle this; verify behavior |
| FR-012 | Add `changeset` script to root `package.json` | P2 | `"changeset": "changeset"` for developer ergonomics |

## Technical Design

### Repository Context

- **Monorepo**: 16 packages under `packages/*`, managed by pnpm workspaces
- **Build tool**: TypeScript compiler (`tsc`) — each package has `build`, `typecheck`, `lint`, `test` scripts
- **Test framework**: Vitest 3.2.4 (13 of 16 packages have tests)
- **Package manager**: pnpm 9.15.5 (pinned via `packageManager` field)
- **Node requirement**: >=20.0.0
- **All packages at version**: 0.1.0 (initial)

### CI Workflow (`.github/workflows/ci.yml`)

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [develop, main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
```

### Preview Publish Workflow (`.github/workflows/publish-preview.yml`)

```yaml
name: Publish Preview
on:
  push:
    branches: [develop]

jobs:
  publish-preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - id: check-changesets
        # Check for .changeset/*.md files; skip if none
      - uses: pnpm/action-setup@v4
        if: steps.check-changesets.outputs.has_changesets == 'true'
      - uses: actions/setup-node@v4
        if: steps.check-changesets.outputs.has_changesets == 'true'
        with:
          node-version: 20
          cache: pnpm
          registry-url: https://registry.npmjs.org
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm changeset version --snapshot preview
      - run: pnpm publish -r --tag preview --no-git-checks --access public
    env:
      NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Stable Release Workflow (`.github/workflows/release.yml`)

```yaml
name: Release
on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
          registry-url: https://registry.npmjs.org
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: changesets/action@v1
        with:
          publish: pnpm publish -r --access public
          version: pnpm changeset version
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Changesets Config (`.changeset/config.json`)

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

### Packages Requiring `publishConfig` Update

All 16 packages need `"publishConfig": { "access": "public" }` added:

| # | Package directory | npm name |
|---|-------------------|----------|
| 1 | `packages/latency` | `@generacy-ai/latency` |
| 2 | `packages/claude-code-interface` | `@generacy-ai/claude-code-interface` |
| 3 | `packages/git-interface` | `@generacy-ai/git-interface` |
| 4 | `packages/github-actions-interface` | `@generacy-ai/github-actions-interface` |
| 5 | `packages/github-issues-interface` | `@generacy-ai/github-issues-interface` |
| 6 | `packages/jira-interface` | `@generacy-ai/jira-interface` |
| 7 | `packages/latency-plugin-claude-code` | `@generacy-ai/latency-plugin-claude-code` |
| 8 | `packages/latency-plugin-dev-agent` | `@generacy-ai/latency-plugin-dev-agent` |
| 9 | `packages/latency-plugin-git` | `@generacy-ai/latency-plugin-git` |
| 10 | `packages/latency-plugin-github-actions` | `@generacy-ai/latency-plugin-github-actions` |
| 11 | `packages/latency-plugin-github-issues` | `@generacy-ai/latency-plugin-github-issues` |
| 12 | `packages/latency-plugin-health-check` | `@generacy-ai/latency-plugin-health-check` |
| 13 | `packages/latency-plugin-issue-tracker` | `@generacy-ai/latency-plugin-issue-tracker` |
| 14 | `packages/latency-plugin-jira` | `@generacy-ai/latency-plugin-jira` |
| 15 | `packages/latency-plugin-source-control` | `@generacy-ai/latency-plugin-source-control` |
| 16 | `packages/plugin-ci-cd` | `@generacy-ai/latency-plugin-ci-cd` |

## Implementation Plan

### Phase 1: Package configuration

1. Add `"publishConfig": { "access": "public" }` to all 16 `package.json` files
2. Install `@changesets/cli` as a root dev dependency (`pnpm add -Dw @changesets/cli`)
3. Create `.changeset/config.json` with the config above
4. Add `"changeset": "changeset"` script to root `package.json`

### Phase 2: CI workflow

5. Create `.github/workflows/ci.yml` — lint, test, build on PRs and pushes to `develop`/`main`

### Phase 3: Preview publish workflow

6. Create `.github/workflows/publish-preview.yml` — snapshot publish on `develop` push with `@preview` dist-tag
7. Include changeset file detection to skip publishing when no changesets are present

### Phase 4: Stable release workflow

8. Create `.github/workflows/release.yml` — changesets/action to create Version Packages PR and publish on `main`

### Phase 5: Branch protection (manual / post-merge)

9. Sync `main` to match `develop` (if not already in sync)
10. Configure branch protection rules on `main` via GitHub settings

## Success Criteria

| ID | Metric | Target | Measurement |
|----|--------|--------|-------------|
| SC-001 | CI runs on all PRs | 100% of PRs have CI checks | Verify via GitHub Actions tab and required status checks |
| SC-002 | CI catches build failures | Lint, test, and build failures block merge | Open a PR with a deliberate type error; confirm CI fails |
| SC-003 | Preview versions publish on develop merge | Within 5 minutes of merge when changesets exist | Merge a PR with a changeset; verify `@preview` tag on npm |
| SC-004 | Preview skips when no changesets | No publish triggered | Merge a docs-only PR; verify no npm publish in Actions log |
| SC-005 | Stable release workflow creates Version Packages PR | PR created automatically | Push to `main` with pending changesets; verify PR is opened |
| SC-006 | Stable publish on Version Packages PR merge | Packages published with `@latest` tag | Merge the Version Packages PR; verify on npm |
| SC-007 | Idempotent re-runs | Re-running workflow does not fail or double-publish | Re-run a completed publish workflow; verify it skips gracefully |
| SC-008 | All 16 packages have public publishConfig | 16/16 packages | `grep -r "publishConfig" packages/*/package.json` returns 16 matches |
| SC-009 | Branch protection enforced on main | Direct pushes rejected | Attempt `git push origin main` directly; confirm rejection |

## Assumptions

- The GitHub organization (`generacy-ai`) has or will have an `NPM_TOKEN` secret configured at the org level before publish workflows are first triggered
- All 16 packages are intended to be published to the public npm registry
- The `develop` branch is the default/primary development branch; `main` is the release branch
- Both `develop` and `main` are currently at the same commit (`d396b4b`), so the initial sync is a no-op
- Developers are familiar with the changesets workflow (add changeset → PR → merge → publish)
- No existing npm packages exist under `@generacy-ai/` scope for these package names (first publish)
- The `generacy-ai` npm organization exists and the `NPM_TOKEN` has publish access to it
- pnpm 9.15.5 is the correct version to pin in CI (matches `packageManager` field in root `package.json`)
- Vitest tests are deterministic and will pass reliably in CI

## Out of Scope

- **Downstream repo CI/CD** — agency and generacy repos will get their own CI/CD setup separately
- **Canary/nightly builds** — only preview (snapshot) and stable releases are in scope
- **npm provenance / SLSA attestation** — can be added later as a security enhancement
- **Matrix builds** (multiple Node versions or OS) — single Node 20 / ubuntu-latest is sufficient
- **Code coverage reporting** — some packages have `test:coverage` scripts but coverage thresholds and reporting are not part of this spec
- **Automated changelog generation beyond changesets** — no custom changelog format or GitHub Release notes
- **Monorepo dependency graph optimization** — CI runs all lint/test/build; no selective/affected-only filtering
- **Pull request labeling or auto-merge** — not part of this CI/CD setup
- **Docker or container-based deployments** — these are npm library packages only
- **Slack/Discord notifications** — can be added later
- **NPM_TOKEN creation or npm org setup** — assumed to exist or be handled outside this spec

---

*Generated by speckit*
