# Feature Specification: Address public repo configuration gaps

Post-publication hardening and documentation for the latency repository after being made public.

**Branch**: `039-summary-during-preparation` | **Date**: 2026-02-26 | **Status**: Draft

## Summary

During preparation of the agency repo for public visibility, several configuration gaps were identified in the latency repo that should be addressed. This specification covers six items spanning documentation (README, CONTRIBUTING, CODE_OF_CONDUCT), CI workflow consistency (`registry-url` in `publish-preview.yml`), and GitHub repository settings (Dependabot, secret scanning, auto-delete branches).

The items divide into two categories:

- **Code changes** (can be delivered via PR): README.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md, and the `publish-preview.yml` workflow fix.
- **Manual settings** (require admin action in GitHub UI): Dependabot security updates, secret scanning + push protection, and auto-delete head branches.

## Items

### 1. Missing README.md

The repo has no root-level README. A public repo should have at minimum:
- Project name and description
- Package table listing all 16 published packages
- Installation instructions (`pnpm install`)
- Development setup (prerequisites, build, test, lint)
- License reference (Apache-2.0)
- Links to SECURITY.md and CONTRIBUTING.md

### 2. `registry-url` in workflow files

The issue references commit 9a764d9 removing `registry-url` from `release.yml` to avoid `.npmrc` conflicts with `changesets/action`. However, inspection shows `registry-url: https://registry.npmjs.org` is still present in **both** workflow files:

- `release.yml` line 33 — uses `changesets/action` which manages its own `.npmrc` via `NPM_TOKEN` env var. The `registry-url` from `setup-node` may create a conflicting `.npmrc`. This should be reviewed and likely removed.
- `publish-preview.yml` line 47 — uses direct `pnpm changeset publish` with `NODE_AUTH_TOKEN`. The `setup-node` `registry-url` generates an `.npmrc` with `NODE_AUTH_TOKEN` interpolation, which is the expected auth mechanism here. This is likely correct but should be verified for consistency.

Decision needed: determine the intended auth strategy for each workflow and remove `registry-url` where it conflicts or is redundant.

### 3. Dependabot security updates disabled

Now that the repo is public, Dependabot security updates should be enabled under **Settings > Code security**. This provides automated PRs for known vulnerabilities in dependencies.

### 4. GitHub secret scanning disabled

Secret scanning and push protection should be enabled under **Settings > Code security**. This prevents accidental commits of API keys, tokens, and other credentials. The repo already has `.gitleaks.toml` for local scanning; GitHub-native scanning adds a server-side safety net.

### 5. `delete_branch_on_merge` disabled

Stale branches will accumulate after PRs are merged. Enable **"Automatically delete head branches"** under **Settings > General** to keep the repository clean.

### 6. No CONTRIBUTING.md or CODE_OF_CONDUCT.md

Standard community files for open-source projects:
- **CONTRIBUTING.md**: Development workflow, PR process, coding standards, commit conventions (Changesets), and how to run tests.
- **CODE_OF_CONDUCT.md**: Adopt a standard code of conduct (e.g., Contributor Covenant v2.1).

## User Stories

### US1: New contributor onboards via README

**As a** developer discovering the latency repo for the first time,
**I want** a README that explains the project purpose, lists packages, and shows how to install and develop,
**So that** I can understand the project and start contributing quickly.

**Acceptance Criteria**:
- [ ] README.md exists at repo root
- [ ] Contains project description and purpose
- [ ] Lists all published packages with brief descriptions
- [ ] Includes installation instructions (`pnpm install`)
- [ ] Includes development commands (build, test, lint, typecheck)
- [ ] References the Apache-2.0 license
- [ ] Links to SECURITY.md and CONTRIBUTING.md

### US2: Contributor understands contribution process

**As a** potential contributor,
**I want** CONTRIBUTING.md and CODE_OF_CONDUCT.md files,
**So that** I know the expectations for contributing and community behavior.

**Acceptance Criteria**:
- [ ] CONTRIBUTING.md exists at repo root
- [ ] Documents branching strategy, PR process, and commit conventions
- [ ] Explains how to add changesets for versioning
- [ ] Documents coding standards (TypeScript, ESM, vitest)
- [ ] CODE_OF_CONDUCT.md exists at repo root (Contributor Covenant v2.1 or similar)

### US3: CI workflows use consistent npm auth strategy

**As a** maintainer,
**I want** the `publish-preview.yml` and `release.yml` workflows to use a consistent and correct npm authentication strategy,
**So that** publishing does not fail due to `.npmrc` conflicts.

**Acceptance Criteria**:
- [ ] `registry-url` usage reviewed in both workflows
- [ ] `release.yml` auth strategy does not conflict with `changesets/action`
- [ ] `publish-preview.yml` auth strategy works with direct `pnpm changeset publish`
- [ ] Both workflows tested by publishing a preview/release successfully

### US4: Repository security settings are enabled

**As a** repository admin,
**I want** Dependabot security updates, secret scanning, and push protection enabled,
**So that** the public repo has standard security monitoring.

**Acceptance Criteria**:
- [ ] Dependabot security updates enabled in Settings > Code security
- [ ] Secret scanning enabled in Settings > Code security
- [ ] Push protection enabled in Settings > Code security

### US5: Merged PR branches are cleaned up automatically

**As a** maintainer,
**I want** head branches to be automatically deleted after PR merge,
**So that** stale branches do not accumulate in the repository.

**Acceptance Criteria**:
- [ ] "Automatically delete head branches" enabled in Settings > General

## Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-001 | Create root-level README.md with project description, package table, install/dev instructions, and license reference | P1 | Core documentation for a public repo |
| FR-002 | Review and fix `registry-url` usage in `release.yml` to avoid `.npmrc` conflicts with `changesets/action` | P1 | Currently present on line 33; may conflict with `changesets/action` NPM_TOKEN handling |
| FR-003 | Review `registry-url` usage in `publish-preview.yml` for consistency | P2 | Currently on line 47; works with `NODE_AUTH_TOKEN` but should be verified |
| FR-004 | Enable Dependabot security updates | P1 | Settings > Code security (manual, admin action) |
| FR-005 | Enable GitHub secret scanning and push protection | P1 | Settings > Code security (manual, admin action) |
| FR-006 | Enable "Automatically delete head branches" | P2 | Settings > General (manual, admin action) |
| FR-007 | Create CONTRIBUTING.md with development workflow, PR process, and coding standards | P2 | Standard open-source community file |
| FR-008 | Create CODE_OF_CONDUCT.md (Contributor Covenant v2.1) | P3 | Standard open-source community file |

## Implementation Notes

### README.md structure

```
# Latency
Project description and badges

## Packages
Table of all 16 @generacy-ai packages with descriptions

## Getting Started
Prerequisites (Node >=20, pnpm 9.x)
pnpm install / pnpm build / pnpm test

## Development
Build, test, lint, typecheck commands
Changesets workflow for versioning

## License
Apache-2.0 — see LICENSE

## Security
Link to SECURITY.md
```

### Workflow auth strategy

| Workflow | Publish method | Current auth | Recommendation |
|----------|---------------|--------------|----------------|
| `release.yml` | `changesets/action` | `registry-url` + `NPM_TOKEN` env var | Remove `registry-url`; `changesets/action` uses `NPM_TOKEN` env var directly to write its own `.npmrc` |
| `publish-preview.yml` | Direct `pnpm changeset publish` | `registry-url` + `NODE_AUTH_TOKEN` env var | Keep `registry-url`; `setup-node` generates `.npmrc` with `NODE_AUTH_TOKEN` interpolation, which is the standard pattern for direct publish |

### GitHub settings checklist (admin manual steps)

- [ ] Settings > Code security > Dependabot security updates: Enable
- [ ] Settings > Code security > Secret scanning: Enable
- [ ] Settings > Code security > Push protection: Enable
- [ ] Settings > General > Pull Requests > Automatically delete head branches: Enable

## Success Criteria

| ID | Metric | Target | Measurement |
|----|--------|--------|-------------|
| SC-001 | README completeness | All sections present (description, packages, install, dev, license) | Manual review of README.md |
| SC-002 | Workflow publish success | Both preview and release workflows publish without auth errors | Trigger a preview publish on develop and a release on main |
| SC-003 | Dependabot active | Security updates PRs auto-created for vulnerable deps | Check Settings > Code security shows enabled; verify Dependabot alerts tab is active |
| SC-004 | Secret scanning active | Scanning enabled with push protection | Check Settings > Code security; attempt to push a test secret (should be blocked) |
| SC-005 | Branch cleanup | Merged PR branches auto-deleted | Merge a PR and verify the head branch is deleted |
| SC-006 | Community files present | CONTRIBUTING.md and CODE_OF_CONDUCT.md at repo root | `ls` repo root for both files |

## Assumptions

- The repository is already public on GitHub (this spec addresses post-publication gaps, not the publication itself).
- An admin with Settings access is available to configure Dependabot, secret scanning, and branch auto-delete.
- The `NPM_TOKEN` secret is already configured in the repository's GitHub Actions secrets.
- OIDC trusted publishing (via `id-token: write` permission) is the long-term auth target, but token-based auth remains the current mechanism.
- The Contributor Covenant v2.1 is an acceptable code of conduct for the project.
- The existing SECURITY.md and LICENSE files are complete and do not need changes.

## Out of Scope

- Migrating npm auth from token-based (`NPM_TOKEN`) to OIDC trusted publishing — tracked separately.
- Branch protection rules, PR review requirements, or interaction limits — handled in a separate settings session.
- Adding CI badges, npm version badges, or other README badges beyond basic content.
- Setting up a documentation site or API reference generation.
- Configuring Dependabot version updates (auto-updating dependencies) — only security updates are in scope.
- Modifying the SECURITY.md or LICENSE files.

---

*Generated by speckit*
