# Research: Repository Structure Decisions

**Feature**: Create repository structure with pnpm workspace
**Date**: 2026-02-03

## Technology Decisions

### 1. Package Manager: pnpm

**Decision**: Use pnpm with workspace monorepo structure

**Rationale**:
- **Consistency**: Matches existing Generacy/Agency projects
- **Disk efficiency**: Symlinked node_modules saves space across workspace packages
- **Speed**: Faster install/update compared to npm/yarn
- **Strictness**: Better dependency resolution prevents phantom dependencies

**Alternatives Considered**:
- **npm workspaces**: Standard but slower, less efficient disk usage
- **yarn workspaces**: Popular but less strict than pnpm
- **Turbo/Nx**: Over-engineered for current single-package scope

**References**:
- [pnpm workspaces documentation](https://pnpm.io/workspaces)
- Existing implementation: `/workspaces/generacy/pnpm-workspace.yaml`

---

### 2. TypeScript Configuration: Strict NodeNext

**Decision**: Use strict TypeScript with NodeNext module resolution

**Rationale**:
- **ESM compatibility**: NodeNext ensures proper ESM/CJS interop
- **Type safety**: Strict mode catches errors early
- **Ecosystem alignment**: Matches Node.js 20+ module system
- **Future-proof**: Aligns with Node.js LTS direction

**Configuration Highlights**:
```json
{
  "target": "ES2022",
  "module": "NodeNext",
  "moduleResolution": "NodeNext",
  "strict": true,
  "noUncheckedIndexedAccess": true
}
```

**Alternatives Considered**:
- **ES2020 + CommonJS**: Outdated, poor ESM support
- **Bundler module resolution**: Not suitable for library packages
- **Loose mode**: Sacrifices type safety for convenience (rejected)

**References**:
- [TypeScript NodeNext documentation](https://www.typescriptlang.org/docs/handbook/modules/reference.html#node16-nodenext)
- Existing config: `/workspaces/generacy/tsconfig.json`

---

### 3. Testing Framework: Vitest

**Decision**: Use Vitest for unit testing

**Rationale**:
- **Native ESM support**: Works seamlessly with NodeNext modules
- **Performance**: Faster than Jest for TypeScript projects
- **Vite ecosystem**: Future-proofs for potential browser testing
- **TypeScript first**: Built-in TypeScript support without extra config

**Alternatives Considered**:
- **Jest**: Industry standard but slower, requires additional ESM config
- **Mocha/Chai**: More setup boilerplate, no built-in TypeScript support
- **Node test runner**: Too minimal, lacks ecosystem tooling

**References**:
- [Vitest documentation](https://vitest.dev/)
- Existing usage: `/workspaces/generacy/package.json` (devDependencies)

---

### 4. Linting/Formatting: ESLint + Prettier

**Decision**: Use ESLint with TypeScript plugin and Prettier for formatting

**Rationale**:
- **Cross-repo consistency**: Matches Generacy/Agency standards
- **Separation of concerns**: ESLint for code quality, Prettier for formatting
- **IDE integration**: Broad support across VS Code, JetBrains, etc.
- **Proven stack**: Industry standard for TypeScript projects

**Configuration Strategy**:
- Copy `.eslintrc.js` and `.prettierrc` from `/workspaces/generacy/`
- Ensures consistent code style across tetrad ecosystem
- Reduces friction for developers working across projects

**Alternatives Considered**:
- **Biome**: Newer, faster, but lacks ecosystem maturity
- **ESLint only**: Formatting rules conflict with Prettier philosophy
- **No linting**: Unacceptable for library code

**References**:
- [TypeScript ESLint documentation](https://typescript-eslint.io/)
- [Prettier documentation](https://prettier.io/)

---

### 5. CI/CD: GitHub Actions

**Decision**: Use GitHub Actions with matrix testing

**Rationale**:
- **Native integration**: Built into GitHub workflow
- **Free for public repos**: No external CI cost
- **Ecosystem support**: Wide action marketplace
- **Simplicity**: No external service configuration needed

**Workflow Strategy**:
```yaml
jobs:
  - build (pnpm build)
  - type-check (tsc --noEmit)
  - lint (pnpm lint)
  - format-check (prettier --check)
  - test (pnpm test)
```

**Alternatives Considered**:
- **CircleCI**: More configuration, external service dependency
- **Travis CI**: Declining community support
- **GitLab CI**: Not applicable (using GitHub)

**References**:
- [GitHub Actions documentation](https://docs.github.com/en/actions)
- Node.js action: [setup-node](https://github.com/actions/setup-node)

---

## Implementation Patterns

### Monorepo Structure Pattern

**Pattern**: Flat workspace with `packages/*` glob

```
root/
├── packages/
│   └── latency/        # Published package
├── package.json        # Workspace root (private)
└── pnpm-workspace.yaml
```

**Benefits**:
- Simple, flat hierarchy (no nested workspaces)
- Easy to add future packages (`packages/latency-plugins`, etc.)
- Clear separation: root = tooling, packages = publishable code

**Trade-offs**:
- Slightly more boilerplate than single-package repo
- Requires workspace-aware scripts (`-w` flags)

---

### TypeScript Build Pattern

**Pattern**: Shared base config with package-specific extensions

```
tsconfig.base.json (root) → tsconfig.json (package)
```

**Benefits**:
- DRY: Common settings defined once
- Flexibility: Packages can override base settings
- Scalability: New packages inherit base config automatically

**Implementation**:
```json
// packages/latency/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  }
}
```

---

### Empty Barrel Export Pattern

**Pattern**: Initial `index.ts` exports nothing

```typescript
// packages/latency/src/index.ts
export {};
```

**Rationale**:
- **Proves build mechanism works**: `tsc` compiles successfully
- **Avoids premature API design**: Functionality added in later issues
- **TypeScript compliance**: Valid empty module

**Next Steps** (later issues):
- Issue #3: Export facet interfaces (`Actor`, `Behavior`, `State`)
- Issue #4: Export composition primitives
- Issue #5: Export runtime binding types

---

## Key Sources

1. **Generacy Project Configuration**:
   - `/workspaces/generacy/tsconfig.json`
   - `/workspaces/generacy/package.json`
   - `/workspaces/generacy/pnpm-workspace.yaml`

2. **Documentation References**:
   - [pnpm workspaces](https://pnpm.io/workspaces)
   - [TypeScript NodeNext modules](https://www.typescriptlang.org/docs/handbook/modules/reference.html#node16-nodenext)
   - [Vitest Getting Started](https://vitest.dev/guide/)
   - [GitHub Actions: Node.js](https://docs.github.com/en/actions/use-cases-and-examples/building-and-testing/building-and-testing-nodejs)

3. **Latency Architecture**:
   - `/workspaces/tetrad-development/docs/latency-architecture.md` (philosophy)
   - `/workspaces/tetrad-development/docs/latency-integration-plan.md` (roadmap)

---

## Open Questions

**Q1**: Should we include security audits (npm audit, Snyk) in CI?
**A1**: Deferred to later phases. Infrastructure-only phase has zero production dependencies, making audits unnecessary at this stage.

**Q2**: Should we configure code coverage thresholds?
**A2**: Not yet. No tests exist in this phase. Coverage thresholds added in issue #3+ when actual tests are written.

**Q3**: Should we use conventional commits for CHANGELOG automation?
**A3**: Manual CHANGELOG updates for now. Automation considered in later phases if commit volume justifies it.

---

*Research complete - All technical decisions documented*
