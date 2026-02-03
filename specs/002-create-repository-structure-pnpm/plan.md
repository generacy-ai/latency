# Implementation Plan: Create repository structure with pnpm workspace

**Feature**: Initialize Latency monorepo with pnpm workspace and tooling
**Branch**: `002-create-repository-structure-pnpm`
**Status**: Complete

## Summary

This plan establishes the foundational infrastructure for the Latency package by setting up a pnpm workspace monorepo with TypeScript, linting, formatting, testing, and CI/CD configuration. The implementation follows the patterns established in the existing Generacy/Agency projects to maintain consistency across the tetrad ecosystem.

This is Wave 1 foundation work - infrastructure only. The package will build successfully but export nothing initially. Subsequent issues (#3, #4, #5) will add actual functionality.

## Technical Context

### Technology Stack
- **Language**: TypeScript 5.4+
- **Package Manager**: pnpm (workspace monorepo)
- **Build System**: TypeScript compiler (tsc)
- **Testing**: Vitest 1.6+
- **Linting**: ESLint 8.57+ with TypeScript plugin
- **Formatting**: Prettier
- **CI/CD**: GitHub Actions
- **Node Version**: >=20.0.0

### Dependencies
**Production**: None (infrastructure-only phase)

**Development**:
- `typescript`: ^5.4.5
- `vitest`: ^1.6.0
- `eslint`: ^8.57.0
- `@typescript-eslint/eslint-plugin`: ^7.13.0
- `@typescript-eslint/parser`: ^7.13.0
- `@types/node`: ^20.14.0

## Project Structure

```
generacy-ai/latency/
├── packages/
│   └── latency/                    # @generacy-ai/latency
│       ├── src/
│       │   └── index.ts           # Empty barrel export (placeholder)
│       ├── package.json           # Package manifest with npm config
│       ├── tsconfig.json          # Package-specific TypeScript config
│       └── README.md              # Package-level documentation
├── .github/
│   └── workflows/
│       └── ci.yml                 # CI pipeline (build, test, lint, format)
├── package.json                   # Root workspace manifest
├── pnpm-workspace.yaml            # Workspace configuration
├── tsconfig.base.json             # Shared TypeScript base config
├── .eslintrc.js                   # ESLint configuration
├── .prettierrc                    # Prettier configuration
├── vitest.config.ts               # Vitest test configuration
├── .gitignore                     # Git ignore rules
├── CHANGELOG.md                   # Version history
└── README.md                      # Repository overview
```

## Implementation Phases

### Phase 1: Workspace Foundation
**Goal**: Establish pnpm workspace structure

**Files to Create**:
1. `pnpm-workspace.yaml` - Define workspace packages
   ```yaml
   packages:
     - 'packages/*'
   ```

2. `package.json` (root) - Workspace root manifest
   - Set `"private": true` (workspace root not published)
   - Define workspace scripts: `build`, `test`, `lint`, `format`
   - Specify Node.js engine requirement (>=20.0.0)

3. `packages/latency/package.json` - Package manifest
   - Name: `@generacy-ai/latency`
   - Version: `0.1.0` (initial)
   - Main: `dist/index.js`
   - Types: `dist/index.d.ts`
   - Set `"type": "module"` for ESM
   - Configure npm publishing fields: `files`, `publishConfig`

**Validation**:
- `pnpm install` completes without errors

---

### Phase 2: TypeScript Configuration
**Goal**: Configure TypeScript compilation matching Generacy standards

**Files to Create**:
1. `tsconfig.base.json` (root) - Shared base configuration
   - Target: ES2022
   - Module: NodeNext
   - Strict mode enabled
   - Declaration files enabled
   - Source maps enabled

2. `packages/latency/tsconfig.json` - Package-specific config
   - Extends `../../tsconfig.base.json`
   - Define `rootDir: "./src"` and `outDir: "./dist"`
   - Include: `["src/**/*"]`

3. `packages/latency/src/index.ts` - Empty barrel export
   ```typescript
   // Placeholder - actual exports added in subsequent issues (#3, #4, #5)
   export {};
   ```

**Reference**: Copy structure from `/workspaces/generacy/tsconfig.json`

**Validation**:
- `pnpm build` compiles successfully
- `packages/latency/dist/index.js` and `index.d.ts` generated

---

### Phase 3: Linting & Formatting
**Goal**: Configure code quality tools

**Files to Create**:
1. `.eslintrc.js` - ESLint configuration
   - Parser: `@typescript-eslint/parser`
   - Plugin: `@typescript-eslint/eslint-plugin`
   - Rules: Match Generacy standards (strict TypeScript checks)

2. `.prettierrc` - Prettier configuration
   - Semi: true
   - Single quotes: true
   - Trailing comma: all
   - Tab width: 2

**Reference**: Copy from existing Generacy project configurations

**Validation**:
- `pnpm lint` passes (no errors on empty index.ts)

---

### Phase 4: Testing Setup
**Goal**: Configure Vitest for unit testing

**Files to Create**:
1. `vitest.config.ts` - Vitest configuration
   - Test directory: `packages/latency/tests/`
   - Coverage configuration
   - TypeScript support

2. `packages/latency/tests/.gitkeep` - Placeholder for test directory
   - No actual tests yet (infrastructure only)

**Validation**:
- `pnpm test` runs without errors (reports 0 tests)

---

### Phase 5: CI/CD Pipeline
**Goal**: Automate validation on push/PR

**Files to Create**:
1. `.github/workflows/ci.yml` - GitHub Actions workflow
   - Trigger: push to any branch, pull requests
   - Jobs:
     1. **Build**: `pnpm build`
     2. **Type Check**: `tsc --noEmit`
     3. **Lint**: `pnpm lint`
     4. **Format Check**: `prettier --check .`
     5. **Test**: `pnpm test`
   - Matrix: Node.js 20.x
   - Cache pnpm store for performance

**Validation**:
- Workflow runs on push to branch
- All jobs pass (green check)

---

### Phase 6: Documentation & Metadata
**Goal**: Create repository documentation

**Files to Create**:
1. `README.md` (root) - Repository overview
   - Brief (1-2 paragraphs) philosophy overview
   - Link to `/workspaces/tetrad-development/docs/latency-architecture.md`
   - Installation instructions
   - Basic usage (placeholder - detailed in later issues)
   - Link to CHANGELOG.md

2. `packages/latency/README.md` - Package-level documentation
   - Package purpose and philosophy
   - Installation via npm/pnpm
   - Import examples (empty for now)

3. `CHANGELOG.md` - Version history
   - Initial entry: `## [0.1.0] - 2026-02-03 - Initial repository setup`

4. `.gitignore` - Git ignore rules
   - `node_modules/`, `dist/`, `*.log`, `.DS_Store`, coverage reports

**Validation**:
- README renders correctly on GitHub
- Documentation links are valid

---

## Constitution Check

**Location**: `.specify/memory/constitution.md` (if exists)

Based on clarifications, this implementation adheres to:
- **Cross-repo consistency**: Matches Generacy/Agency TypeScript/ESLint/Prettier standards
- **Minimal initial scope**: Infrastructure only, no premature functionality
- **Documentation standards**: Brief philosophy overview, link to full architecture

No constitution violations detected.

## Success Criteria

| Criterion | Validation Command | Expected Result |
|-----------|-------------------|-----------------|
| Workspace installs | `pnpm install` | No errors |
| TypeScript compiles | `pnpm build` | Generates `dist/index.js`, `dist/index.d.ts` |
| Tests run | `pnpm test` | Passes (0 tests) |
| Linting passes | `pnpm lint` | No errors |
| Formatting valid | `prettier --check .` | All files formatted |
| CI pipeline | Push to branch | All jobs green |
| Package exports | `import {} from '@generacy-ai/latency'` | No errors (empty export) |

## Dependencies & Blockers

**Dependencies**:
- Access to `/workspaces/generacy/` configurations (for copying standards)
- Existing `latency-architecture.md` document (referenced in README)

**Blockers**: None

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Mismatched TypeScript config vs. Generacy | Medium | Copy exact config from `/workspaces/generacy/tsconfig.json` |
| CI pipeline failures on first run | Low | Test locally with `pnpm build && pnpm test && pnpm lint` before push |
| Missing architecture docs | Low | README links to external doc; validate link exists |

## Post-Implementation

**Next Steps**:
1. Issue #3: Implement core facet interfaces (Actor, Behavior, State)
2. Issue #4: Add composition primitives
3. Issue #5: Define runtime binding types

**Maintenance**:
- Update CHANGELOG.md when merging to main
- Monitor CI pipeline health
- Keep TypeScript/ESLint dependencies in sync with Generacy project

---

*Generated by speckit - Implementation plan complete*
