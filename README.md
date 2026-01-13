# interfacectl

Interface contract tooling for the Surfaces ecosystem. Validates, compares, and enforces compliance between defined interface contracts and actual implementation artifacts across multiple surfaces.

This repository contains two packages:

- **`@surfaces/interfacectl-validator`** — Core validation library with TypeScript types, schema validation, and bundled contract schema definitions. Provides the foundation for contract validation.

- **`@surfaces/interfacectl-cli`** — Command-line interface that consumes the validator to run contract checks from any repository. Most users only need this package.

## Requirements

- **Node.js**: >=18.20.0 or >=20.10.0 (required for `with { type: "json" }` import syntax support)
- **pnpm**: 10.26.2 (specified in `packageManager` field)

## Installation

Install the CLI package as a development dependency:

```bash
pnpm add -D @surfaces/interfacectl-cli
```

## Quick Start

After installation, validate your surfaces against a contract:

```bash
interfacectl validate --root . --contract ./contracts/ui.contract.json
```

For detailed command documentation, see [API.md](API.md).

## Commands Overview

The CLI provides three main commands:

### `validate`

Validates configured surfaces against a shared interface contract. Performs comprehensive validation including contract structure validation, surface descriptor collection, and compliance checking for fonts, colors, layout, motion, and sections.

```bash
interfacectl validate [options]
```

### `diff`

Compares a contract against observed artifacts and generates a detailed diff. Performs structural comparison showing additions, removals, modifications, and renames with drift risk detection.

```bash
interfacectl diff [options]
```

### `enforce`

Enforces policy on interface contracts using configurable enforcement modes: `fail` (validate and exit on violations), `fix` (automatically apply safe fixes), or `pr` (generate patches for review).

```bash
interfacectl enforce [options]
```

For complete command documentation with all options, exit codes, and output formats, see [API.md](API.md).

## Usage Examples

### Validation

Validate all surfaces against a contract:

```bash
interfacectl validate --root . --contract ./contracts/ui.contract.json
```

Validate with JSON output for CI integration:

```bash
interfacectl validate --root . --contract ./contracts/ui.contract.json --format json
```

Validate specific surfaces only:

```bash
interfacectl validate --surface my-surface --surface another-surface
```

### Diff

Compare contract against observed artifacts:

```bash
interfacectl diff --root . --contract ./contracts/ui.contract.json
```

Generate diff with normalization disabled (for debugging):

```bash
interfacectl diff --no-normalize
```

### Enforcement

Fail on violations (useful for CI):

```bash
interfacectl enforce --mode fail
```

Preview automatic fixes:

```bash
interfacectl enforce --mode fix --dry-run
```

Apply automatic fixes:

```bash
interfacectl enforce --mode fix
```

Generate patch for review:

```bash
interfacectl enforce --mode pr --format json --out fix-patch.json
```

## Configuration

### Environment Variables

Configuration options can be set via environment variables:

- `SURFACES_ROOT` — Project root directory (defaults to current working directory)
- `SURFACES_CONTRACT` — Path to contract JSON file (defaults to `contracts/surfaces.web.contract.json`)
- `SURFACES_CONFIG` — Path to interfacectl config JSON file (defaults to `interfacectl.config.json`)

**Precedence:** CLI flags > environment variables > defaults

### Config File

Create an `interfacectl.config.json` file in your project root to map surface IDs to their root directories:

```json
{
  "surfaceRoots": {
    "demo-surface": "src/demo-surface",
    "my-app": "apps/my-app"
  }
}
```

The config file tells interfacectl where to find surface descriptors in your codebase. Each key is a surface ID that must match an entry in your contract file.

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
- uses: pnpm/action-setup@v4
  with:
    version: 10.26.2
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: pnpm
- run: pnpm install --frozen-lockfile
- run: pnpm exec interfacectl validate --root . --contract contracts/ui.contract.json --format json
```

For enforcement in CI, use:

```yaml
- run: pnpm exec interfacectl enforce --mode fail --strict
```

## Development

### Building

Build produces `dist/` directories in each package:

```bash
pnpm install
pnpm run build
```

### Testing

Tests assume `dist/` exists and run against built artifacts. Consumers depend only on the CLI interface, not build internals. The tarball-install test validates CLI works from a packaged install.

```bash
pnpm run test
```

## Releasing

1. Run `pnpm changeset` and choose affected packages.
2. Merge the generated changeset.
3. Trigger the **Release** workflow (requires `NPM_TOKEN`) or push a `v*` tag.

The release workflow builds, tests, and publishes packages through Changesets.
