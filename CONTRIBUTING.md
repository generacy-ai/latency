# Contributing to Latency

Thank you for your interest in contributing to Latency! This guide will help you get started.

## Getting Started

1. Fork and clone the repository:

   ```bash
   git clone https://github.com/generacy-ai/latency.git
   cd latency
   ```

2. Enable Corepack (provides the correct pnpm version automatically):

   ```bash
   corepack enable
   ```

3. Install dependencies:

   ```bash
   pnpm install
   ```

4. Build all packages:

   ```bash
   pnpm build
   ```

## Development Workflow

1. Create a feature branch from `develop`:

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b my-feature
   ```

2. Make your changes and verify they pass all checks:

   ```bash
   pnpm build
   pnpm test
   pnpm lint
   pnpm typecheck
   ```

3. Add a changeset if your change affects a published package (see below).

4. Commit your changes and open a pull request against `develop`.

## Adding Changesets

This project uses [Changesets](https://github.com/changesets/changesets) to manage versioning and changelogs. If your change affects the public API or behavior of any published `@generacy-ai/*` package, add a changeset:

```bash
pnpm changeset
```

You will be prompted to:

1. **Select packages** — choose the packages affected by your change.
2. **Choose a bump type** — follow [semver](https://semver.org/):
   - **patch** — bug fixes, documentation corrections
   - **minor** — new features, non-breaking additions
   - **major** — breaking changes to public API
3. **Write a summary** — a short description of the change for the changelog.

A good changeset summary describes what changed from a user's perspective:

```
Add timeout option to HealthCheckPlugin constructor
```

You do **not** need a changeset for changes that don't affect published packages, such as updates to CI configuration, dev tooling, or documentation files.

## Pull Request Process

- Open pull requests against the `develop` branch.
- CI must pass (build, test, lint, typecheck) before merging.
- Include a clear description of what your PR changes and why.
- If your PR includes a changeset, verify the selected packages and bump type are correct.

## Coding Standards

- **TypeScript** — strict mode enabled. See [`tsconfig.base.json`](tsconfig.base.json) for the shared compiler configuration.
- **ESM** — all packages use ES modules with `NodeNext` module resolution.
- **Testing** — [vitest](https://vitest.dev/) is used for unit and integration tests.

## Reporting Issues

Found a bug or have a feature request? Please open an issue on [GitHub Issues](https://github.com/generacy-ai/latency/issues).

For security vulnerabilities, **do not** open a public issue. See [SECURITY.md](SECURITY.md) for responsible disclosure instructions.

## Code of Conduct

This project follows the Contributor Covenant Code of Conduct. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for details.
