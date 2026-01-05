# interfacectl

Standalone packages for the Surfaces interface contract tooling:

- `@surfaces/interfacectl-validator` — Types, schema validation, and bundled contract schema.
- `@surfaces/interfacectl-cli` — CLI wrapper that consumes the validator to run contract checks from any repo.

## Getting Started

```bash
pnpm install
pnpm test
```

## Installing the CLI

```bash
pnpm add -D @surfaces/interfacectl-cli
```

## Usage

```bash
interfacectl validate --root . --contract ./contracts/ui.contract.json
```

Key options:

- `--root` (default `process.cwd()` or `SURFACES_ROOT`)
- `--contract` (default `contracts/surfaces.web.contract.json` or `SURFACES_CONTRACT`)
- `--config` (optional path to `interfacectl.config.json` mapping surface IDs to descriptor roots)
- `--format text|json`
- `--out <file>` writes output to disk

### Sample Config

```json
{
  "surfaceRoots": {
    "interfacectl-web": "apps/interfacectl-web"
  }
}
```

## CI Example

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

## Releasing

1. Run `pnpm changeset` and choose affected packages.
2. Merge the generated changeset.
3. Trigger the **Release** workflow (requires `NPM_TOKEN`) or push a `v*` tag.

The release workflow builds, tests, and publishes packages through Changesets.

