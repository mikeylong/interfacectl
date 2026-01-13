# interfacectl enforce

The `enforce` command applies a policy to interface contract diffs, either failing CI, applying fixes, or generating patches.

## Usage

```bash
interfacectl enforce [options]
interfacectl enforce --strict [options]
```

## Options

- `--mode <fail|fix|pr>`: Enforcement mode (default: `fail`)
- `--strict`: Alias for `--mode fail` (compatibility with web page)
- `--policy <path>`: Policy JSON path (optional, uses default if not provided)
- `--contract <path>`: Contract path
- `--root <path>`: Workspace root
- `--config <path>`: Config path
- `--surface <id...>`: Filter surfaces
- `--dry-run`: For fix mode, show what would change
- `--format <text|json>`: Output format
- `--out <path>`: Output file
- `--json`: Alias for `--format json`

## Enforcement Modes

### fail (default)

Run diff and apply policy. Exit with code 1 if violations remain (CI default).

- Uses policy `modes.fail.severityThreshold` to determine which violations fail
- Uses policy `modes.fail.exitOnAny` to determine exit behavior
- Does not mutate files

### fix

Apply autofixes matching policy rules, write changes to files, emit fix summary.

- Only applies fixes matching policy `modes.fix.rules`
- Respects `modes.fix.dryRun` flag (unless overridden by `--dry-run`)
- Mutates files (use with caution)
- Generates `FixSummary` output

### pr

Generate patch/PR artifacts (unified diff or JSON), don't mutate files.

- Uses policy `modes.pr.patchFormat` (unified or json)
- Writes to `modes.pr.outputPath` if specified
- Does not mutate files (CI-friendly)

## Policy Configuration

Policies are JSON files conforming to `interfacectl.policy.schema.json`:

- `version`: Policy version (semantic versioning)
- `fingerprint`: SHA-256 hash of policy content (computed automatically)
- `modes`: Configuration for fail/fix/pr modes
- `autofixRules`: Rules defining which fixes are allowed
- `budgets`: Optional drift budgeting for gradual rollout

## Autofix Rules

Autofix rules define which diffs can be automatically fixed:

- `id`: Unique rule identifier
- `pattern`: Path pattern (JSONPath/glob syntax)
- `autofixable`: Whether this rule allows autofix
- `description`: Human-readable description
- `safetyLevel`: Only `safe` or `mechanical` allowed for autofixable rules
- `setSeverity`: Optional severity override

## Safety Guarantees

- **Only safe/mechanical fixes**: Autofix is only allowed for rules with `safetyLevel: "safe"` or `safetyLevel: "mechanical"`
- **Semantic changes blocked**: Rules with `safetyLevel: "semantic"` cannot be autofixed
- **Reversible fixes**: All fixes store old → new mapping for reversibility
- **Confidence scores**: Each fix includes a confidence score (0-1)

## Patch Formats

### unified

Standard unified diff format:

```
--- a/file.ts
+++ b/file.ts
@@ -1,2 +1,2 @@
-old value
+new value
```

### json

JSON Patch format (RFC 6902):

```json
[
  {
    "op": "replace",
    "path": "/surfaces/0/allowedFonts/0",
    "value": "var(--font-new)"
  }
]
```

## Exit Codes

- `0`: Clean/passed (no violations or fixes applied successfully)
- `1`: Violations remaining
- `2`: Configuration/usage error
- `3`: Internal error

## Examples

```bash
# Fail mode (CI default)
interfacectl enforce --strict

# Fix mode (apply autofixes)
interfacectl enforce --mode fix

# PR mode (generate patch)
interfacectl enforce --mode pr --policy policy.json
```

## Default Policy

The default policy is conservative:
- Fail mode: exit on any error-level violation
- Fix mode: no autofix rules enabled (empty rules array)
- PR mode: JSON patch format
