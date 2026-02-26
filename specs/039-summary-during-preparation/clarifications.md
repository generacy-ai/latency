# Clarification Questions

## Status: Pending

## Questions

### Q1: README Package Table Content
**Context**: The spec requires a "package table listing all 16 published packages" but doesn't define what columns or metadata each row should contain. The 16 packages include both `@generacy-ai/latency-plugin-*` packages and standalone `*-interface` packages, which serve different purposes and may warrant different levels of description.
**Question**: What columns should the package table include, and should it distinguish between plugin packages and interface packages?
**Options**:
- A) Minimal table: Package name + one-line description only
- B) Standard table: Package name, description, and npm badge/link
- C) Detailed table: Package name, description, npm link, and category grouping (plugins vs. interfaces)
**Answer**:

### Q2: README Package Descriptions Source
**Context**: The spec lists "all 16 published packages" but doesn't provide descriptions for any of them. Writing accurate one-line descriptions requires understanding each package's purpose. Some package.json files may have a `description` field, but they may be incomplete or inconsistent.
**Question**: Should package descriptions be pulled from existing `package.json` `description` fields, or should new descriptions be authored from scratch after reviewing each package's purpose?
**Options**:
- A) Use existing `package.json` descriptions as-is (fastest, but may be inconsistent or missing)
- B) Review each package and author fresh descriptions (more work, but ensures consistency and accuracy)
- C) Use `package.json` descriptions where adequate, author new ones where missing or unclear
**Answer**:

### Q3: Workflow Auth Strategy Verification Method
**Context**: The spec requires "Both workflows tested by publishing a preview/release successfully" (US3 acceptance criteria), but doesn't specify how this verification should be performed. Publishing to npm has real-world side effects (creating package versions that cannot be unpublished after 72 hours).
**Question**: How should the workflow auth changes be verified — through actual npm publishes or through a lower-risk method?
**Options**:
- A) Dry-run verification: Use `--dry-run` flags or inspect generated `.npmrc` without actually publishing
- B) Preview publish only: Trigger a snapshot/preview publish to npm (reversible since preview tags are not installed by default)
- C) Full verification: Trigger both a preview publish and a release publish to npm with real version bumps
- D) CI-level only: Verify the workflow YAML is correct by code review and trust the existing patterns
**Answer**:

### Q4: release.yml registry-url Removal Confidence
**Context**: The spec recommends removing `registry-url` from `release.yml` because `changesets/action` manages its own `.npmrc` via `NPM_TOKEN`. However, `release.yml` also has `id-token: write` permission, suggesting OIDC trusted publishing may have been partially set up. Removing `registry-url` could break publishing if `changesets/action` doesn't handle auth as expected.
**Question**: Has `changesets/action` been confirmed to work without `registry-url` in this repository, or should we test this change in isolation before combining it with the other items?
**Options**:
- A) Remove `registry-url` with confidence: `changesets/action` documents that it uses `NPM_TOKEN` env var directly and writes its own `.npmrc`
- B) Remove in a separate PR first: Land the `registry-url` removal independently and verify a release works before bundling with other changes
- C) Keep `registry-url` for now: Document the potential conflict but defer removal until OIDC migration
**Answer**:

### Q5: CONTRIBUTING.md Depth of Coding Standards
**Context**: The spec says CONTRIBUTING.md should document "coding standards (TypeScript, ESM, vitest)" but doesn't specify how detailed this section should be. The repo has no root-level ESLint or Prettier config, and individual packages may have varying configurations. Over-documenting standards that aren't enforced by tooling can create maintenance burden.
**Question**: How detailed should the coding standards section in CONTRIBUTING.md be?
**Options**:
- A) High-level only: Mention TypeScript, ESM, vitest, and link to tsconfig.base.json for details
- B) Moderate detail: Include specific conventions (e.g., strict TypeScript, no `any`, ESM-only imports, test file naming)
- C) Comprehensive: Full style guide with examples for common patterns, test structure, and error handling
**Answer**:

### Q6: CONTRIBUTING.md Changeset Workflow Detail
**Context**: The spec requires explaining "how to add changesets for versioning" but doesn't specify the level of detail. Contributors unfamiliar with Changesets need enough context to create valid changesets, but too much detail duplicates the Changesets documentation.
**Question**: How much detail should CONTRIBUTING.md provide about the Changesets workflow?
**Options**:
- A) Minimal: Just run `pnpm changeset` and follow the prompts, with a link to Changesets docs
- B) Step-by-step: Explain when to add changesets, the semver bump types (patch/minor/major), and what a good changeset description looks like, with examples
**Answer**:

### Q7: CODE_OF_CONDUCT.md Customization
**Context**: The spec says to "adopt a standard code of conduct (e.g., Contributor Covenant v2.1)." The Contributor Covenant template includes placeholder fields (contact method, enforcement details) that need to be filled in for the document to be actionable.
**Question**: What contact method and enforcement information should be used in the Code of Conduct?
**Options**:
- A) Email-based: Use a specific email address (e.g., conduct@generacy.ai) for reporting
- B) GitHub-based: Direct reports to GitHub repository issues or a specific GitHub team
- C) Placeholder: Use "[INSERT CONTACT METHOD]" and fill in later when enforcement processes are defined
**Answer**:

### Q8: Dependabot Configuration File
**Context**: The spec treats Dependabot security updates as a manual GitHub UI toggle only. However, Dependabot can also be configured via a `.github/dependabot.yml` file, which provides version control over the configuration and can specify update schedules, package ecosystems to monitor, and assignees for security PRs.
**Question**: Should a `.github/dependabot.yml` configuration file be created alongside enabling security updates in the UI, or should only the UI toggle be used?
**Options**:
- A) UI toggle only: Just enable Dependabot security updates in Settings (simplest, spec-aligned)
- B) Add `dependabot.yml` for security updates: Create a config file scoping Dependabot to security-only alerts for the npm ecosystem
- C) Add `dependabot.yml` with version updates too: Enable both security and version update PRs (out of scope per spec, but prevents configuration drift)
**Answer**:

### Q9: PR Scope — Single or Multiple PRs
**Context**: The spec groups all code changes (README, CONTRIBUTING, CODE_OF_CONDUCT, workflow fix) into a single deliverable, but these are independent changes touching different concerns. A single large PR may be harder to review, while multiple small PRs allow incremental delivery but add overhead.
**Question**: Should the code changes be delivered as a single PR or split into multiple PRs?
**Options**:
- A) Single PR: All code changes (docs + workflow fix) in one PR for simplicity
- B) Two PRs: One for documentation files (README, CONTRIBUTING, CODE_OF_CONDUCT), one for the workflow auth fix
- C) Three PRs: README separately, community files (CONTRIBUTING + CODE_OF_CONDUCT) together, workflow fix separately
**Answer**:

### Q10: Manual Settings Verification
**Context**: Three items (Dependabot, secret scanning, auto-delete branches) require admin access to GitHub Settings. The spec lists these as acceptance criteria but doesn't specify who performs them or how completion is tracked since they can't be verified via code review.
**Question**: How should completion of the manual GitHub Settings changes be tracked and verified?
**Options**:
- A) Trust-based: Admin self-reports completion; no formal verification beyond checking the Settings UI
- B) Screenshot evidence: Admin provides screenshots of each enabled setting
- C) Automated check: Use `gh api` to query repository settings and confirm each is enabled
- D) Separate tracking: Create a GitHub issue checklist for the admin to check off each manual item
**Answer**:

### Q11: README Prerequisites Specificity
**Context**: The spec mentions "Prerequisites (Node >=20, pnpm 9.x)" in the README structure outline. The root `package.json` specifies `"node": ">=20.0.0"` and `"packageManager": "pnpm@9.15.5"`. Being too specific (exact pnpm version) creates maintenance burden; being too vague may cause setup issues.
**Question**: How specific should the prerequisites be in the README?
**Options**:
- A) Exact versions: Node >=20.0.0, pnpm 9.15.5 (matches package.json exactly)
- B) Range versions: Node 20+, pnpm 9.x (easier to maintain, less likely to go stale)
- C) Corepack-based: Just mention Node 20+ and note that `corepack enable` will handle pnpm version automatically
**Answer**:

### Q12: Organization Name in Documentation
**Context**: The packages are published under `@generacy-ai` scope, but the spec and CLAUDE.md reference a "Tetrad ecosystem." The relationship between Generacy AI and Tetrad is not explained in the spec. Public-facing documentation should use consistent naming to avoid confusing new contributors.
**Question**: What organization/project name should be used in the README and CONTRIBUTING files?
**Options**:
- A) Generacy AI: Use `@generacy-ai` consistently since that's the npm scope and the public-facing brand
- B) Tetrad: Use "Tetrad ecosystem" as referenced in CLAUDE.md
- C) Both: Introduce the project as part of the Tetrad ecosystem by Generacy AI, explaining the relationship
**Answer**:
