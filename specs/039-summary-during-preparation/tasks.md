# Tasks: Address Public Repo Configuration Gaps

**Input**: Design documents from feature directory
**Prerequisites**: plan.md (required), spec.md (required)
**Status**: Ready

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

---

## Phase 1: Community Documentation (PR1)

### T001 [US1] Create README.md
**File**: `README.md`
- Add project header with name ("Latency") and one-line description
- Add **Packages** section with a table of all 16 `@generacy-ai/*` packages grouped by category:
  - **Core**: `@generacy-ai/latency`
  - **Interfaces**: `git-interface`, `github-actions-interface`, `github-issues-interface`, `jira-interface`, `claude-code-interface`
  - **Abstract Plugins**: `latency-plugin-dev-agent`, `latency-plugin-source-control`, `latency-plugin-issue-tracker`, `latency-plugin-ci-cd`
  - **Concrete Plugins**: `latency-plugin-claude-code`, `latency-plugin-git`, `latency-plugin-github-actions`, `latency-plugin-github-issues`, `latency-plugin-jira`, `latency-plugin-health-check`
- Pull each description from its `package.json` `description` field; review for accuracy
- Add **Getting Started** section: prerequisites (Node 20+, `corepack enable`), `pnpm install`, `pnpm build`
- Add **Development** section: commands table (`pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck`), changesets workflow overview
- Add **License** section: Apache-2.0 reference linking to `LICENSE`
- Add **Security** and **Contributing** links to `SECURITY.md` and `CONTRIBUTING.md`

### T002 [P] [US2] Create CONTRIBUTING.md
**File**: `CONTRIBUTING.md`
- Add welcome/invitation section
- Add **Getting Started**: clone, `corepack enable`, `pnpm install`, `pnpm build`
- Add **Development Workflow**: branch from `develop`, create feature branch, open PR to `develop`
- Add **Adding Changesets**: when to add one, `pnpm changeset`, semver guidance (patch/minor/major), example changeset description
- Add **Pull Request Process**: PR against `develop`, CI must pass, describe changes
- Add **Coding Standards** (high-level): TypeScript (strict mode), ESM (`NodeNext`), vitest for testing; reference `tsconfig.base.json`
- Add **Reporting Issues**: link to GitHub Issues
- Add **Code of Conduct**: link to `CODE_OF_CONDUCT.md`

### T003 [P] [US2] Create CODE_OF_CONDUCT.md
**File**: `CODE_OF_CONDUCT.md`
- Use Contributor Covenant v2.1 template verbatim
- Set contact method to `conduct@generacy.ai`
- Include all four enforcement levels (Correction, Warning, Temporary Ban, Permanent Ban)
- Include attribution section linking to Contributor Covenant

### T004 [US1, US2] Verify cross-document links
**Files**:
- `README.md`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- Verify README links to CONTRIBUTING.md and SECURITY.md
- Verify CONTRIBUTING.md links to CODE_OF_CONDUCT.md
- Verify package table has exactly 16 packages with accurate descriptions
- Verify consistent use of "Generacy AI" / `@generacy-ai` branding (not "Tetrad")

---

## Phase 2: Workflow Auth Fix (PR2)

### T005 [US3] Remove `registry-url` from `release.yml`
**File**: `.github/workflows/release.yml`
- Remove `registry-url: https://registry.npmjs.org` from the `Setup Node.js` step (line 33)
- Keep `node-version: 22` and `cache: pnpm`
- Rationale: `changesets/action` (line 44) manages its own `.npmrc` via the `NPM_TOKEN` env var; `setup-node`'s `registry-url` creates a conflicting `.npmrc` using `NODE_AUTH_TOKEN` which is not set in this workflow

### T006 [US3] Verify `publish-preview.yml` auth is correct (no changes)
**File**: `.github/workflows/publish-preview.yml`
- Confirm `registry-url: https://registry.npmjs.org` on line 47 is correct for direct `pnpm changeset publish`
- Confirm `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` on line 67 maps the secret correctly
- Confirm `setup-node` generates `.npmrc` with `NODE_AUTH_TOKEN` interpolation — this is the standard pattern for direct publish
- No code changes needed; document verification in PR description

---

## Phase 3: GitHub Repository Settings (Admin Manual)

### T007 [P] [US4] Enable Dependabot security updates
**Action**: Manual — GitHub UI
- Navigate to **Settings > Code security and analysis**
- Enable **Dependabot alerts**
- Enable **Dependabot security updates**
- No `dependabot.yml` file needed (that controls version updates, which are out of scope)

### T008 [P] [US4] Enable secret scanning and push protection
**Action**: Manual — GitHub UI
- Navigate to **Settings > Code security and analysis**
- Enable **Secret scanning**
- Enable **Push protection**
- Note: repo already has `.gitleaks.toml` for local scanning; this adds server-side protection

### T009 [P] [US5] Enable auto-delete head branches
**Action**: Manual — GitHub UI
- Navigate to **Settings > General > Pull Requests**
- Check **"Automatically delete head branches"**

### T010 [US4, US5] Verify GitHub settings via API
**Action**: Run verification commands
- Run `gh api repos/generacy-ai/latency --jq '.delete_branch_on_merge'` — expect `true`
- Run `gh api repos/generacy-ai/latency --jq '{has_vulnerability_alerts, secret_scanning: .security_and_analysis.secret_scanning.status, push_protection: .security_and_analysis.secret_scanning_push_protection.status}'` — expect all enabled
- Document results in PR or issue comment

---

## Phase 4: Verification

### T011 [US1, US2] Review documentation for completeness
- Verify README.md has all required sections (description, packages, install, dev, license)
- Verify CONTRIBUTING.md covers workflow, changesets, PR process, coding standards
- Verify CODE_OF_CONDUCT.md is Contributor Covenant v2.1
- Verify all inter-document links resolve correctly

### T012 [US3] Verify workflow publishing
- After PR2 merges to `develop`, confirm `publish-preview.yml` triggers and publishes successfully (if pending changesets exist)
- After `develop` merges to `main`, confirm `release.yml` triggers and publishes without auth errors
- Verify no `.npmrc` conflicts in workflow logs

---

## Dependencies & Execution Order

**Phase dependencies (sequential)**:
- Phase 1 and Phase 2 are independent — can proceed in parallel
- Phase 3 is independent — can proceed at any time (requires admin access)
- Phase 4 depends on Phases 1, 2, and 3 completing

**Parallel opportunities within phases**:
- Phase 1: T001, T002, T003 can all run in parallel (different files, no dependencies); T004 depends on T001–T003
- Phase 2: T005 and T006 are sequential (T006 verifies the unchanged file after T005 establishes the pattern)
- Phase 3: T007, T008, T009 can all run in parallel (independent settings toggles); T010 depends on T007–T009

**Critical path**:
T001/T002/T003 (parallel) → T004 → PR1 review/merge
T005 → T006 → PR2 review/merge
T007/T008/T009 (parallel) → T010
All phases → T011/T012 (final verification)

**PR mapping**:
- **PR1** (branch `039-summary-during-preparation`): T001, T002, T003, T004 — community documentation
- **PR2** (branch `039-fix-release-registry-url`): T005, T006 — workflow auth fix
- **No PR**: T007, T008, T009, T010 — admin settings (manual GitHub UI actions)
