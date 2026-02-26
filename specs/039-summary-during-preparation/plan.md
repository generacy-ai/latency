# Implementation Plan: Address Public Repo Configuration Gaps

## Summary

This plan delivers post-publication hardening for the latency repository across two PRs and one admin settings session. PR1 adds community documentation (README.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md). PR2 fixes the `release.yml` workflow by removing the conflicting `registry-url`. A third track covers manual GitHub settings (Dependabot, secret scanning, auto-delete branches) verified via `gh api`.

No new dependencies, data models, or API contracts are involved — this is purely documentation, CI configuration, and repository settings.

## Technical Context

| Aspect | Value |
|--------|-------|
| Language | Markdown, YAML |
| Monorepo tool | pnpm workspaces |
| Package manager | pnpm 9.15.5 (Corepack) |
| CI platform | GitHub Actions |
| Published packages | 16 (`@generacy-ai/*`) |
| License | Apache-2.0 |
| Org name in docs | Generacy AI / `@generacy-ai` |

## Architecture Overview

No architectural changes. All work is additive documentation and configuration:

```
latency/
├── README.md                          # NEW — project overview + package table
├── CONTRIBUTING.md                    # NEW — contributor guide
├── CODE_OF_CONDUCT.md                 # NEW — Contributor Covenant v2.1
├── SECURITY.md                        # EXISTING — no changes
├── LICENSE                            # EXISTING — no changes
├── .github/
│   ├── dependabot.yml                 # NEW — security-only for npm
│   └── workflows/
│       ├── release.yml                # MODIFIED — remove registry-url
│       ├── publish-preview.yml        # UNCHANGED — registry-url is correct here
│       └── ci.yml                     # UNCHANGED
└── packages/                          # UNCHANGED
```

## Implementation Phases

### Phase 1: Documentation PR (PR1)

**Branch**: `039-summary-during-preparation` (current branch)

All four documentation files plus the Dependabot config in a single PR.

#### Step 1.1: Create README.md

Create `/workspaces/latency/README.md` with the following sections:

1. **Header**: `# Latency` with one-line project description
2. **Packages table**: Three category groups (Core, Interfaces, Abstract Plugins, Concrete Plugins) with columns: Package (npm link), Description. Pull descriptions from each `package.json` `description` field, review for accuracy.
3. **Getting Started**: Prerequisites (Node 20+, `corepack enable`), `pnpm install`, `pnpm build`
4. **Development**: Commands table (`pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck`), changesets workflow overview
5. **License**: Apache-2.0 reference with link to `LICENSE`
6. **Security & Contributing**: Links to `SECURITY.md` and `CONTRIBUTING.md`

Source for package descriptions: each package's `package.json` `description` field. Review each for consistency with actual package purpose.

#### Step 1.2: Create CONTRIBUTING.md

Create `/workspaces/latency/CONTRIBUTING.md` with:

1. **Welcome section**: Brief invitation to contribute
2. **Getting Started**: Clone, `corepack enable`, `pnpm install`, `pnpm build`
3. **Development Workflow**: Branch from `develop`, create feature branch, make changes, open PR to `develop`
4. **Adding Changesets**: Step-by-step — when to add one, `pnpm changeset`, semver bump guidance (patch for fixes, minor for features, major for breaking), example of a good changeset description
5. **Pull Request Process**: PR against `develop`, CI must pass, describe changes
6. **Coding Standards**: High-level only — TypeScript (strict mode), ESM (`NodeNext`), vitest for testing. Point to `tsconfig.base.json` for TypeScript config details.
7. **Reporting Issues**: Link to GitHub Issues
8. **Code of Conduct**: Link to `CODE_OF_CONDUCT.md`

#### Step 1.3: Create CODE_OF_CONDUCT.md

Create `/workspaces/latency/CODE_OF_CONDUCT.md` using the Contributor Covenant v2.1 template with:
- **Contact method**: `conduct@generacy.ai`
- All four enforcement levels (Correction, Warning, Temporary Ban, Permanent Ban)
- No other customization needed

#### Step 1.4: Create .github/dependabot.yml

Create `/workspaces/latency/.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    # Security-only: no version update PRs
    # Dependabot security updates are enabled separately in Settings > Code security
```

Note: This file configures Dependabot version updates structure but security updates are controlled via the GitHub UI toggle (Step 3.1). Including this file with `open-pull-requests-limit` provides configuration-as-code for the npm ecosystem scope. However, per the spec, version updates are out of scope — this file is primarily for declaring the ecosystem. The actual security updates toggle is a manual admin action.

**Revision**: On reflection, Dependabot security updates do NOT require a `dependabot.yml` file — they are purely a Settings toggle. The `dependabot.yml` file controls *version* updates, which are explicitly out of scope. Creating this file would enable version update PRs, which contradicts the spec.

**Decision**: Do NOT create `dependabot.yml`. Security updates are enabled purely via the GitHub UI in Phase 3. This aligns with Q8 answer option B's intent (security-only), but the correct mechanism for security-only is the UI toggle, not the config file. The config file is only needed if we wanted automated version bump PRs.

#### Step 1.5: Review and verify

- Confirm all links between documents are correct (README → CONTRIBUTING, README → SECURITY, CONTRIBUTING → CODE_OF_CONDUCT)
- Verify the package table has all 16 packages with accurate descriptions
- Ensure consistent use of "Generacy AI" / `@generacy-ai` (not "Tetrad") per Q12

### Phase 2: Workflow Auth Fix PR (PR2)

**Branch**: Create a new branch from `develop` (e.g., `039-fix-release-registry-url`)

This is a separate PR to allow independent verification via a preview publish.

#### Step 2.1: Remove `registry-url` from `release.yml`

Edit `/workspaces/latency/.github/workflows/release.yml`:

**Before** (line ~33):
```yaml
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
          registry-url: https://registry.npmjs.org
```

**After**:
```yaml
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
```

**Rationale**: `changesets/action` manages its own `.npmrc` using the `NPM_TOKEN` environment variable. The `setup-node` `registry-url` creates a second `.npmrc` using `NODE_AUTH_TOKEN`, which is not set in the release workflow and may conflict. This was already validated by commit `9a764d9`.

#### Step 2.2: Verify `publish-preview.yml` is correct (no changes)

Confirm `publish-preview.yml` uses:
- `registry-url: https://registry.npmjs.org` in `setup-node` ✓
- `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` as env var ✓

This is the correct pattern: `setup-node` generates `.npmrc` with `NODE_AUTH_TOKEN` interpolation, and the env var maps `NPM_TOKEN` secret to `NODE_AUTH_TOKEN`. No changes needed.

#### Step 2.3: Verification

After merging PR2 to `develop`, the `publish-preview.yml` workflow will trigger automatically (it runs on CI success for `develop` pushes). If there are pending changesets, this will publish preview packages to npm, confirming auth works end-to-end.

For `release.yml`, verification happens when `develop` is merged to `main` and a release is triggered. The `changesets/action` auth pattern is well-documented and was previously validated.

### Phase 3: Manual GitHub Settings (Admin Action)

These require repository admin access and cannot be delivered via PR.

#### Step 3.1: Enable Dependabot security updates

Navigate to **Settings > Code security and analysis**:
- Enable **Dependabot alerts**
- Enable **Dependabot security updates**

#### Step 3.2: Enable secret scanning

Navigate to **Settings > Code security and analysis**:
- Enable **Secret scanning**
- Enable **Push protection**

#### Step 3.3: Enable auto-delete head branches

Navigate to **Settings > General > Pull Requests**:
- Check **Automatically delete head branches**

#### Step 3.4: Verify settings via API

Run the following commands to confirm settings:

```bash
# Check delete_branch_on_merge
gh api repos/generacy-ai/latency --jq '.delete_branch_on_merge'
# Expected: true

# Check security settings
gh api repos/generacy-ai/latency --jq '{
  has_vulnerability_alerts: .has_vulnerability_alerts,
  secret_scanning: .security_and_analysis.secret_scanning.status,
  secret_scanning_push_protection: .security_and_analysis.secret_scanning_push_protection.status
}'
# Expected: has_vulnerability_alerts=true, secret_scanning=enabled, push_protection=enabled
```

## Key Technical Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Two PRs (docs + workflow fix) | Independent concerns; docs can land quickly while workflow change needs publish verification (Q9) |
| 2 | Remove `registry-url` from `release.yml` only | `changesets/action` writes its own `.npmrc`; `publish-preview.yml` correctly uses `setup-node`'s `.npmrc` pattern (Q4) |
| 3 | No `dependabot.yml` file | Security updates are a UI toggle; the config file controls version updates which are out of scope (Q8 clarified) |
| 4 | Corepack-based prerequisites | Modern, zero-maintenance approach — `corepack enable` handles pnpm version automatically (Q11) |
| 5 | High-level coding standards only | No root ESLint/Prettier config to enforce detailed rules; avoid documenting unenforced standards (Q5) |
| 6 | Contributor Covenant v2.1 with `conduct@generacy.ai` | Professional standard; email preferable to GitHub Issues for sensitive reports (Q7) |
| 7 | Package table with category grouping | Reflects the three-tier architecture (core, abstract plugins, concrete implementations) (Q1) |
| 8 | "Generacy AI" branding, not "Tetrad" | `@generacy-ai` is the npm scope, org name, and public brand (Q12) |

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| `registry-url` removal breaks release publishing | P1 — packages can't publish | Low risk: `changesets/action` docs confirm `NPM_TOKEN` env var auth. Prior commit `9a764d9` validated this. Separate PR allows isolated verification. |
| `conduct@generacy.ai` email not configured | P3 — CoC reports go unanswered | Note in PR description that email forwarding needs setup. Can forward to an existing team member initially. |
| Package descriptions in README go stale | P3 — misleading docs | Descriptions pulled from `package.json` fields, which are maintained as part of normal development. |
| Admin settings not applied | P2 — security gaps remain | `gh api` verification script provides automated check. Include as a PR comment checklist item. |

## File Change Summary

| File | Action | PR |
|------|--------|----|
| `README.md` | Create | PR1 |
| `CONTRIBUTING.md` | Create | PR1 |
| `CODE_OF_CONDUCT.md` | Create | PR1 |
| `.github/workflows/release.yml` | Edit (remove `registry-url`) | PR2 |
| `.github/workflows/publish-preview.yml` | No changes | — |
| GitHub Settings (3 toggles) | Manual admin action | — |

## Acceptance Criteria Mapping

| Spec AC | Plan Step | Verification |
|---------|-----------|-------------|
| README.md exists with all sections | Step 1.1 | PR review |
| CONTRIBUTING.md with workflow, changesets, standards | Step 1.2 | PR review |
| CODE_OF_CONDUCT.md (Contributor Covenant v2.1) | Step 1.3 | PR review |
| `registry-url` reviewed in both workflows | Steps 2.1, 2.2 | PR review + preview publish |
| `release.yml` auth doesn't conflict with `changesets/action` | Step 2.1 | Preview/release publish success |
| `publish-preview.yml` auth works with direct publish | Step 2.2 (no change needed) | Existing preview publishes work |
| Dependabot security updates enabled | Step 3.1 | `gh api` check |
| Secret scanning + push protection enabled | Step 3.2 | `gh api` check |
| Auto-delete head branches enabled | Step 3.3 | `gh api` check |

## Implementation Order

1. **Phase 1** (PR1 — documentation): Steps 1.1 → 1.2 → 1.3 → 1.5
2. **Phase 2** (PR2 — workflow fix): Steps 2.1 → 2.2 → 2.3
3. **Phase 3** (admin settings): Steps 3.1 → 3.2 → 3.3 → 3.4

Phases 1 and 2 can proceed in parallel. Phase 3 can proceed independently at any time.
