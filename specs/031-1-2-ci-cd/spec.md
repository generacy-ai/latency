# Feature Specification: CI/CD for Latency Repo

**Branch**: `031-1-2-ci-cd` | **Date**: 2026-02-26 | **Status**: Draft

## Summary

Implement a complete CI/CD pipeline for the `latency` monorepo (16 packages under the `@generacy-ai` npm scope). The pipeline has three release streams: **PR CI** (lint, test, build on every pull request), **Preview publish** (snapshot versions on merge to `develop`), and **Stable publish** (changesets-managed releases on merge to `main`). Build order must respect the internal dependency graph: core (`@generacy-ai/latency`) before abstract plugins and interfaces, before concrete plugins.

### Package Inventory (16 packages)

| Layer | Packages |
|-------|----------|
| **Core** | `@generacy-ai/latency` |
| **Abstract Plugins** | `latency-plugin-dev-agent`, `latency-plugin-source-control`, `latency-plugin-issue-tracker`, `plugin-ci-cd` |
| **Interfaces** | `claude-code-interface`, `git-interface`, `github-actions-interface`, `github-issues-interface`, `jira-interface` |
| **Concrete Plugins** | `latency-plugin-claude-code`, `latency-plugin-git`, `latency-plugin-github-actions`, `latency-plugin-github-issues`, `latency-plugin-jira`, `latency-plugin-health-check` |

### Dependency Build Order

```
@generacy-ai/latency (core)
  ├─► abstract plugins (latency-plugin-dev-agent, latency-plugin-source-control,
  │     latency-plugin-issue-tracker, plugin-ci-cd)
  ├─► interfaces (claude-code-interface, git-interface, github-actions-interface,
  │     github-issues-interface, jira-interface)
  └─► concrete plugins (latency-plugin-claude-code, latency-plugin-git,
        latency-plugin-github-actions, latency-plugin-github-issues,
        latency-plugin-jira, latency-plugin-health-check)
```

pnpm's recursive build (`pnpm -r build`) inherently resolves workspace dependency order via its topological sort, satisfying the build-order requirement without custom scripting.

### Dependencies

- generacy#242: Set up npm publishing for @generacy-ai packages

### Plan Reference

[onboarding-buildout-plan.md](https://github.com/generacy-ai/tetrad-development/blob/develop/docs/onboarding-buildout-plan.md) — Issue 1.2

### Execution

**Phase:** 2
**Blocked by:**
- [ ] generacy-ai/generacy#242 — npm publishing setup

## User Stories

### US1: Pull Request Quality Gate

**As a** developer contributing to the latency repo,
**I want** every pull request to automatically run lint, test, and build checks,
**So that** broken code is caught before it reaches any integration branch.

**Acceptance Criteria**:
- [ ] A GitHub Actions workflow triggers on all pull requests (to any branch)
- [ ] The workflow also triggers on pushes to `develop` and `main`
- [ ] The workflow runs `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm lint`, and `pnpm test`
- [ ] Concurrent runs for the same branch are cancelled in favor of the latest push
- [ ] The CI job uses Node.js 22 with pnpm caching for fast installs
- [ ] PR merge is blocked if any step fails (via branch protection rules)

### US2: Preview Snapshot Publish

**As a** developer or downstream consumer,
**I want** preview versions of changed packages to be published to npm on merge to `develop`,
**So that** I can test unreleased changes without waiting for a stable release.

**Acceptance Criteria**:
- [ ] A workflow triggers after the CI workflow succeeds on a push to `develop`
- [ ] If no changeset files exist, the workflow exits early (no publish)
- [ ] Snapshot versions are published using `pnpm changeset version --snapshot preview`
- [ ] Packages are published with the `preview` npm dist-tag
- [ ] Publishing uses `NPM_TOKEN` for authentication
- [ ] Only packages with pending changesets are published

### US3: Stable Release Publish

**As a** package maintainer,
**I want** merging to `main` to automatically create a release PR (or publish if versions are already bumped),
**So that** stable releases are published to npm with minimal manual intervention.

**Acceptance Criteria**:
- [ ] A workflow triggers on push to `main`
- [ ] The `changesets/action@v1` action manages the two-phase release process: (1) opens a version PR when changesets exist, (2) publishes to npm when changesets are consumed
- [ ] Published packages receive the `latest` npm dist-tag
- [ ] Release runs are never cancelled mid-execution (`cancel-in-progress: false`)
- [ ] The workflow has `contents: write` and `pull-requests: write` permissions for the changesets action to create PRs and push version commits
- [ ] All 16 packages that have pending changes are published in a single release

### US4: Changesets Version Management

**As a** developer,
**I want** to use Changesets to declare version bumps alongside my code changes,
**So that** versioning is intentional, traceable, and respects semver.

**Acceptance Criteria**:
- [ ] Changesets CLI is configured with `baseBranch: "develop"` and `access: "public"`
- [ ] Internal dependency updates use `patch` bump strategy (`updateInternalDependencies: "patch"`)
- [ ] The changelog is auto-generated using `@changesets/cli/changelog`
- [ ] Developers can run `pnpm changeset` locally to create changeset files

## Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-001 | CI workflow runs lint, test, and build on all PRs and pushes to `develop`/`main` | P1 | Single job: `Build, Lint, Test` |
| FR-002 | CI uses Node.js 22, pnpm with `--frozen-lockfile`, and pnpm caching | P1 | Ensures reproducible installs |
| FR-003 | CI concurrency group cancels in-progress runs for the same ref | P1 | `ci-${{ github.ref }}` |
| FR-004 | Preview publish triggers only after CI succeeds on `develop` push | P1 | Uses `workflow_run` event |
| FR-005 | Preview publish skips when no changeset files are present | P1 | Checks `.changeset/*.md` excluding README |
| FR-006 | Preview publish creates snapshot versions with `--snapshot preview` | P1 | Versions like `0.0.0-preview-20260226` |
| FR-007 | Preview packages are tagged `preview` on npm | P1 | `--tag preview` flag |
| FR-008 | Stable release workflow triggers on push to `main` | P1 | Uses `changesets/action@v1` |
| FR-009 | Stable release creates a version PR when changesets exist | P1 | PR titled `chore: version packages` |
| FR-010 | Stable release publishes to npm when version PR is merged | P1 | Packages get `@latest` tag |
| FR-011 | Release concurrency group never cancels in-progress runs | P1 | Prevents partial publishes |
| FR-012 | Build order respects dependency graph (core before plugins) | P1 | pnpm topological sort handles this |
| FR-013 | All packages use `"access": "public"` in publishConfig | P1 | Required for scoped public packages |
| FR-014 | Changesets configured with `baseBranch: "develop"` | P2 | Matches the repo's integration branch |
| FR-015 | npm authentication via `NPM_TOKEN` secret | P1 | Token-based publishing |
| FR-016 | Workflow permissions follow least-privilege: CI is read-only, release adds write | P2 | Security best practice |

## Implementation Details

### Workflow Files

| File | Trigger | Purpose |
|------|---------|---------|
| `.github/workflows/ci.yml` | `pull_request`, `push` to `develop`/`main` | Lint, test, build quality gate |
| `.github/workflows/publish-preview.yml` | `workflow_run` (CI success on `develop`) | Snapshot publish with `@preview` tag |
| `.github/workflows/release.yml` | `push` to `main` | Changesets release PR + `@latest` publish |

### Changesets Configuration

| Setting | Value | Rationale |
|---------|-------|-----------|
| `baseBranch` | `develop` | Integration branch for this repo |
| `access` | `public` | All `@generacy-ai/*` packages are public |
| `updateInternalDependencies` | `patch` | Automatically bumps internal consumers on release |
| `commit` | `false` | Version bumps happen via PR, not direct commits |
| `changelog` | `@changesets/cli/changelog` | Default changelog generation |

### Authentication & Secrets

| Secret | Used By | Purpose |
|--------|---------|---------|
| `NPM_TOKEN` | Preview publish, Release | npm registry authentication |
| `GITHUB_TOKEN` | All workflows | GitHub API access (auto-provided) |

## Success Criteria

| ID | Metric | Target | Measurement |
|----|--------|--------|-------------|
| SC-001 | PR CI pass rate for clean code | 100% | CI passes on all PRs that have no lint/test/build errors |
| SC-002 | CI execution time | < 5 minutes | Measure from workflow start to completion |
| SC-003 | Preview publish on develop merge | Publishes within 10 min of merge | Verify `@preview` tagged versions appear on npm |
| SC-004 | Stable release end-to-end | Version PR created automatically; publish on merge | Verify `@latest` tagged versions on npm after merging version PR |
| SC-005 | Build order correctness | No build failures due to dependency ordering | pnpm topological sort resolves all 16 packages correctly |
| SC-006 | Changeset coverage | All intentional version bumps tracked | Every publish corresponds to a developer-authored changeset |

## Assumptions

- The npm organization `@generacy-ai` is configured and the `NPM_TOKEN` secret has publish access to all 16 packages
- Branch protection rules on `develop` and `main` are configured externally to require CI to pass before merge
- pnpm's recursive topological build (`pnpm -r build`) correctly resolves all workspace dependency edges — no custom build ordering script is needed
- The `develop` branch is the primary integration branch; `main` is the stable release branch
- GitHub Actions OIDC for npm trusted publishing may be adopted in the future but is not required for initial operation (token-based auth via `NPM_TOKEN` is sufficient)
- The upstream dependency (generacy#242 — npm publishing setup) is resolved before this pipeline publishes its first packages

## Out of Scope

- **Branch protection rule configuration**: GitHub branch protection settings are managed separately, not by these workflow files
- **npm OIDC trusted publishing**: The current implementation uses `NPM_TOKEN`; migration to OIDC provenance-based publishing is a future enhancement
- **Monorepo splitting / independent versioning groups**: All packages version independently via changesets; no `fixed` or `linked` version groups are configured
- **Canary/nightly builds**: Only preview (on develop merge) and stable (on main merge) streams are implemented
- **E2E or integration tests**: The CI pipeline runs unit tests only; end-to-end testing across the Tetrad ecosystem is out of scope
- **Release notes / GitHub Releases**: Auto-generated changelogs are created by changesets; rich GitHub Release notes with assets are not included
- **Notification / alerting**: No Slack, email, or other notifications on publish success/failure
- **Manual publish workflow**: No `workflow_dispatch` trigger for ad-hoc publishing; all publishes are automated via branch merges

---

*Generated by speckit*
