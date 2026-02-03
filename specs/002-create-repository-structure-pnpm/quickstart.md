# Quickstart: Latency Repository Setup

**Feature**: Create repository structure with pnpm workspace
**Last Updated**: 2026-02-03

## Prerequisites

- Node.js >= 20.0.0 ([download](https://nodejs.org/))
- pnpm >= 8.0.0 ([installation](https://pnpm.io/installation))
- Git

**Verify installations**:
```bash
node --version   # Should be v20.0.0 or higher
pnpm --version   # Should be 8.0.0 or higher
```

---

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/generacy-ai/latency.git
cd latency
```

### 2. Install Dependencies
```bash
pnpm install
```

**Expected output**:
```
Packages: +N
Progress: resolved N, reused N, downloaded 0, added N, done
```

**Troubleshooting**:
- If pnpm not found: `npm install -g pnpm`
- If Node version error: Install Node.js 20+ via [nvm](https://github.com/nvm-sh/nvm) or official installer

---

## Available Commands

### Build
Compile TypeScript to JavaScript:
```bash
pnpm build
```

**Output**: `packages/latency/dist/` directory created with:
- `index.js` (compiled JavaScript)
- `index.d.ts` (TypeScript declarations)
- `index.js.map` (source map)

**Usage**:
- Run after code changes to verify compilation
- Required before testing imports in consuming projects

---

### Test
Run unit tests with Vitest:
```bash
pnpm test
```

**Expected output** (infrastructure phase):
```
Test Files  0 passed (0)
     Tests  0 passed (0)
```

**Note**: No tests exist yet in this phase. Tests added in issues #3+.

**Watch mode** (for TDD workflow):
```bash
pnpm test:watch
```

---

### Lint
Check code quality with ESLint:
```bash
pnpm lint
```

**Expected output**:
```
✔ No problems found
```

**Auto-fix issues**:
```bash
pnpm lint:fix
```

**Troubleshooting**:
- If ESLint errors appear, run `pnpm lint:fix` first
- Review remaining errors and fix manually

---

### Format Check
Verify code formatting with Prettier:
```bash
prettier --check .
```

**Auto-format all files**:
```bash
prettier --write .
```

**IDE Integration**:
- VS Code: Install [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- JetBrains: Enable Prettier in Settings → Languages & Frameworks → JavaScript → Prettier

---

### Type Check
Run TypeScript compiler without emitting files:
```bash
pnpm type-check
```

**Usage**:
- Catch type errors before build
- Faster than full build (no file output)

---

### CI Validation (Local)
Run all CI checks locally before pushing:
```bash
pnpm build && pnpm type-check && pnpm lint && prettier --check . && pnpm test
```

**Tip**: Create a git pre-push hook to run this automatically:
```bash
# .git/hooks/pre-push
#!/bin/sh
pnpm build && pnpm lint && prettier --check . && pnpm test
```

---

## Package Usage

### Installation (for consumers)
Once published to npm:
```bash
npm install @generacy-ai/latency
# or
pnpm add @generacy-ai/latency
```

### Import (ESM)
```typescript
import {} from '@generacy-ai/latency';
```

**Note**: Package currently exports nothing (infrastructure phase). Actual exports added in issues #3, #4, #5.

---

## Development Workflow

### Making Changes

1. **Create a branch**:
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes** in `packages/latency/src/`

3. **Verify locally**:
   ```bash
   pnpm build
   pnpm lint
   pnpm test
   ```

4. **Commit and push**:
   ```bash
   git add .
   git commit -m "feat: Add my feature"
   git push origin feature/my-feature
   ```

5. **Create Pull Request** on GitHub

6. **CI pipeline runs automatically**:
   - Build ✓
   - Type Check ✓
   - Lint ✓
   - Format Check ✓
   - Test ✓

---

## Troubleshooting

### Error: "Cannot find module" after build
**Cause**: Missing or incomplete build output

**Solution**:
```bash
rm -rf packages/latency/dist
pnpm build
```

---

### Error: "Lockfile is up to date, resolution step is skipped"
**Cause**: pnpm lockfile out of sync with package.json

**Solution**:
```bash
pnpm install --force
```

---

### Error: ESLint "Parsing error: Cannot read file"
**Cause**: TypeScript config not found

**Solution**:
1. Verify `tsconfig.json` exists in `packages/latency/`
2. Verify `.eslintrc.js` has correct `parserOptions.project` path
3. Restart IDE/editor

---

### CI Pipeline Fails Locally Passes
**Cause**: Uncommitted files or different Node.js version

**Solution**:
1. Commit all changes (including config files)
2. Check Node.js version matches CI (20.x):
   ```bash
   node --version
   ```
3. Re-run commands in a clean clone:
   ```bash
   cd /tmp
   git clone <repo-url>
   cd latency
   pnpm install
   pnpm build && pnpm lint && pnpm test
   ```

---

## Next Steps

After completing this infrastructure setup, proceed to:
1. **Issue #3**: Implement core facet interfaces (Actor, Behavior, State)
2. **Issue #4**: Add composition primitives
3. **Issue #5**: Define runtime binding types

See `/workspaces/tetrad-development/docs/latency-integration-plan.md` for full roadmap.

---

## Additional Resources

- **Architecture**: `/workspaces/tetrad-development/docs/latency-architecture.md`
- **Integration Plan**: `/workspaces/tetrad-development/docs/latency-integration-plan.md`
- **GitHub Issues**: [latency/issues](https://github.com/generacy-ai/latency/issues)
- **pnpm docs**: [pnpm.io](https://pnpm.io/)
- **TypeScript docs**: [typescriptlang.org](https://www.typescriptlang.org/)

---

*Quickstart guide complete*
