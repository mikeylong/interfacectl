# interfacectl CLI API Documentation

## Overview

`interfacectl` is a command-line tool for managing interface contracts in the Surfaces ecosystem. It validates, compares, and enforces compliance between defined interface contracts and actual implementation artifacts across multiple surfaces.

## Commands

### `validate`

Validates configured surfaces against a shared interface contract.

**Synopsis:**
```bash
interfacectl validate [options]
```

**Description:**
Performs comprehensive validation of surface implementations against an interface contract. This includes:
- Contract structure validation against schema
- Surface descriptor collection from codebase
- Compliance checking for fonts, colors, layout, motion, and sections
- Generation of structured validation reports

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--contract <path>` | Path to the contract JSON file | `contracts/surfaces.web.contract.json` or `SURFACES_CONTRACT` env var |
| `--schema <path>` | Optional path to the contract schema JSON file | Bundled schema |
| `--config <path>` | Path to interfacectl config JSON file | `interfacectl.config.json` |
| `--root <path>` | Project root directory | Current working directory or `SURFACES_ROOT` env var |
| `--workspace-root <path>` | Workspace root directory (alias for `--root`) | Current working directory |
| `--surface <id...>` | Limit validation to specified surface identifiers | All surfaces |
| `--format <text\|json>` | Output format | `text` |
| `--json` | Emit JSON output (shortcut for `--format json`) | `false` |
| `--out <path>` | Write output to file instead of stdout | stdout |

**Exit Codes:**
- `0`: All surfaces comply with the contract
- `1`: Contract violations detected
- `2`: Configuration or contract loading error

**Violation Types Detected:**
- `surface.unknown`: Surface ID not found in contract
- `descriptor.missing`: Surface descriptor not found in codebase
- `descriptor.unused`: Surface defined in contract but no descriptor found
- `section.missing`: Required section missing from surface
- `section.unexpected`: Unknown section in surface
- `font.disallowed`: Font not allowed by contract
- `color.disallowed`: Color not allowed by contract
- `layout.width-exceeded`: Layout width exceeds contract maximum
- `layout.width-undetermined`: Layout width cannot be determined
- `layout.container-missing`: Required container missing from layout
- `motion.duration`: Motion duration not allowed by contract
- `motion.timing`: Motion timing function not allowed by contract

**Output Format (JSON):**
```json
{
  "contractPath": "string",
  "contractVersion": "string | null",
  "summary": {
    "errors": "number",
    "warnings": "number"
  },
  "findings": [
    {
      "code": "string",
      "severity": "error | warning",
      "surface": "string",
      "message": "string",
      "expected": "unknown",
      "found": "unknown",
      "location": "string"
    }
  ]
}
```

---

### `diff`

Compares a contract against observed artifacts and generates a detailed diff.

**Synopsis:**
```bash
interfacectl diff [options]
```

**Description:**
Performs a structural comparison between the contract definition and observed surface descriptors. Generates a comprehensive diff showing additions, removals, modifications, and renames. Includes drift risk detection and normalization support.

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--contract <path>` | Path to the contract JSON file | `contracts/surfaces.web.contract.json` or `SURFACES_CONTRACT` env var |
| `--schema <path>` | Optional path to the contract schema JSON file | Bundled schema |
| `--config <path>` | Path to interfacectl config JSON file | `interfacectl.config.json` |
| `--root <path>` | Project root directory | Current working directory or `SURFACES_ROOT` env var |
| `--workspace-root <path>` | Workspace root directory (alias for `--root`) | Current working directory |
| `--surface <id...>` | Limit diff to specified surface identifiers | All surfaces |
| `--format <text\|json>` | Output format | `text` |
| `--json` | Emit JSON output (shortcut for `--format json`) | `false` |
| `--out <path>` | Write output to file instead of stdout | stdout |
| `--no-normalize` | Disable normalization (for debugging) | Normalization enabled |
| `--rename-threshold <0-1>` | Rename detection threshold (0.0-1.0) | `0.8` |
| `--policy <path>` | Optional policy path (for policy metadata in output) | None |

**Exit Codes:**
- `0`: No differences found
- `1`: Differences detected
- `2`: Configuration or contract loading error

**Diff Entry Types:**
- `added`: Path exists in contract but not in observed
- `removed`: Path exists in observed but not in contract
- `modified`: Path exists in both but values differ
- `renamed`: Path was renamed (detected via similarity threshold)

**Severity Levels:**
- `error`: Critical violation requiring immediate attention
- `warning`: Non-critical issue that may indicate drift
- `info`: Informational difference

**Drift Risks Detected:**
- `diff-noise`: Formatting-only or reorder-only changes filtered
- `semantic-ambiguity`: Diff entries lack rule/clause references
- `enforcement-overreach`: Semantic changes attempted in autofixes (only mechanical changes allowed)
- `policy-drift`: Policy fingerprint validation failed
- `contract-evolution`: Contract changes should be diffable
- `observed-instability`: Observed descriptors fail validation before diffing
- `rename-inflation`: Excessive rename detection (threshold too low)
- `output-schema-drift`: Output schema version mismatch
- `severity-inflation`: Policy has excessive error severity overrides
- `local-ci-mismatch`: Repro command missing from output

**Output Format (JSON):**
```json
{
  "schemaVersion": "1.0.0",
  "tool": {
    "name": "interfacectl",
    "version": "string"
  },
  "policy": {
    "version": "string",
    "fingerprint": "string"
  },
  "contract": {
    "path": "string",
    "version": "string"
  },
  "observed": {
    "root": "string"
  },
  "normalization": {
    "enabled": "boolean",
    "reorderedPaths": ["string"],
    "strippedPaths": ["string"]
  },
  "summary": {
    "totalChanges": "number",
    "byType": {
      "added": "number",
      "removed": "number",
      "modified": "number",
      "renamed": "number"
    },
    "bySeverity": {
      "error": "number",
      "warning": "number",
      "info": "number"
    }
  },
  "entries": [
    {
      "path": "string",
      "type": "added | removed | modified | renamed",
      "severity": "error | warning | info",
      "surfaceId": "string",
      "contractValue": "unknown",
      "observedValue": "unknown",
      "rule": "string",
      "rename": {
        "fromPath": "string",
        "toPath": "string",
        "confidence": "number"
      }
    }
  ],
  "driftRisks": [
    {
      "category": "string",
      "severity": "error | warning | info",
      "message": "string",
      "relatedPaths": ["string"]
    }
  ],
  "repro": {
    "command": "string"
  }
}
```

---

### `enforce`

Enforces policy on interface contract using configurable enforcement modes.

**Synopsis:**
```bash
interfacectl enforce [options]
```

**Description:**
Applies enforcement policies to interface contracts through three modes:
- **fail**: Validates compliance and exits with error code on violations
- **fix**: Automatically applies safe, mechanical fixes to non-compliant code
- **pr**: Generates patches for review (unified diff or JSON patch format)

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--mode <fail\|fix\|pr>` | Enforcement mode | `fail` |
| `--strict` | Alias for `--mode fail` (strict enforcement) | `false` |
| `--policy <path>` | Policy JSON path | Default policy |
| `--contract <path>` | Contract path | `SURFACES_CONTRACT` env var or default |
| `--root <path>` | Workspace root | `SURFACES_ROOT` env var or current directory |
| `--config <path>` | Config path | `interfacectl.config.json` |
| `--surface <id...>` | Filter surfaces | All surfaces |
| `--dry-run` | For fix mode, show what would change without applying | `false` |
| `--format <text\|json>` | Output format | `text` |
| `--json` | Emit JSON output (shortcut for `--format json`) | `false` |
| `--out <path>` | Output file path | stdout |

**Enforcement Modes:**

1. **fail** (default):
   - Checks for contract violations
   - Exits with error code if violations exceed policy threshold
   - Does not modify files
   - Suitable for CI/CD validation

2. **fix**:
   - Automatically applies safe fixes matching autofix rules
   - Only applies mechanical, non-semantic changes
   - Respects safety levels and rule patterns
   - Can run in `--dry-run` mode to preview changes

3. **pr**:
   - Generates patch files for review
   - Supports unified diff or JSON patch formats
   - Does not modify files directly
   - Suitable for automated PR generation

**Exit Codes:**
- `0`: Enforcement passed (no violations or fixes applied successfully)
- `1`: Violations remaining or enforcement failed
- `2`: Configuration or policy loading error

**Output Format (JSON):**
```json
{
  "schemaVersion": "1.0.0",
  "mode": "fix | pr",
  "policy": {
    "version": "string",
    "fingerprint": "string"
  },
  "applied": [
    {
      "ruleId": "string",
      "path": "string",
      "oldValue": "unknown",
      "newValue": "unknown",
      "confidence": "number"
    }
  ],
  "skipped": [
    {
      "ruleId": "string",
      "path": "string",
      "oldValue": "unknown",
      "newValue": "unknown",
      "confidence": "number"
    }
  ],
  "errors": [
    {
      "ruleId": "string",
      "path": "string",
      "message": "string"
    }
  ]
}
```

---

## Configuration

### Config File (`interfacectl.config.json`)

Maps surface IDs to their root directories in the codebase.

**Format:**
```json
{
  "surfaceRoots": {
    "surface-id": "path/to/surface/root",
    "another-surface": "apps/another-app"
  }
}
```

**Environment Variables:**
- `SURFACES_ROOT`: Default workspace root directory
- `SURFACES_CONTRACT`: Default contract file path
- `SURFACES_CONFIG`: Default config file path

---

## Policy

Enforcement policies define:
- **Autofix rules**: Patterns and conditions for automatic fixes
- **Mode configurations**: Behavior for fail/fix/pr modes
- **Severity thresholds**: Minimum severity to trigger enforcement
- **Safety levels**: Controls for what types of changes are allowed
- **Fingerprint**: Cryptographic hash for policy integrity verification

---

## Key Features

### Contract Validation
- Schema validation against JSON Schema
- Structural validation of contract format
- Surface descriptor discovery and parsing
- Multi-surface compliance checking

### Diff Generation
- Structural comparison between contract and implementation
- Normalization to handle formatting differences
- Rename detection via similarity thresholds
- Drift risk identification and reporting

### Policy Enforcement
- Rule-based autofix system
- Safety level enforcement (only mechanical changes)
- Confidence scoring for applied fixes
- Patch generation for review workflows

### Output Formats
- **Text**: Human-readable colored output with structured sections
- **JSON**: Machine-readable structured data with full details

### Surface Support
- Multiple surfaces in single contract
- Per-surface filtering and validation
- Surface-specific root directory mapping
- Cross-surface compliance checking

---

## Integration Examples

### CI/CD Validation
```bash
interfacectl validate --root . --contract ./contracts/ui.contract.json --format json
```

### Pre-commit Hook
```bash
interfacectl enforce --mode fail --strict
```

### Automated Fixing
```bash
interfacectl enforce --mode fix --dry-run
interfacectl enforce --mode fix
```

### PR Generation
```bash
interfacectl enforce --mode pr --format json --out fix-patch.json
```

---

## Error Handling

All commands provide structured error reporting:
- Clear error messages with context
- Exit codes for programmatic handling
- JSON error output for machine parsing
- Detailed validation error listings

---

## See Also

- Contract schema documentation
- Policy file format specification
- Surface descriptor format documentation
