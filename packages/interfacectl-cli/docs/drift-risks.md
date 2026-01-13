# Drift Risks Documentation

This document enumerates all 10 drift risk categories that the diff and enforce commands detect and mitigate.

## 1. diff-noise

**Category**: `diff-noise`

**Description**: Noise in diffs caused by reorder-only or formatting-only changes that don't represent actual semantic differences.

**Detection Signals**:
- Modified entries where values are semantically equivalent after normalization
- Reorder-only changes in set-like arrays

**Guardrails**:
- Normalization pipeline sorts set-like arrays before comparison
- Normalization metadata tracks reordered paths
- Diff entries filtered as noise are excluded from violation counts

**Mitigation**: Normalization pipeline suppresses noise automatically.

## 2. semantic-ambiguity

**Category**: `semantic-ambiguity`

**Description**: Diff entries that lack rule/clause references, making it unclear why they exist or how to resolve them.

**Detection Signals**:
- Diff entries without `rule` field
- Diff entries with empty `rule` field

**Guardrails**:
- All diff entries must have a `rule` field (contract clause or rule ID)
- Validation checks for rule presence

**Mitigation**: Comparison engine includes rule references in all diff entries.

## 3. enforcement-overreach

**Category**: `enforcement-overreach`

**Description**: Autofixes that change semantic meaning rather than applying mechanical transformations.

**Detection Signals**:
- Fixes that modify intent or description fields
- Fixes that change value types (string → number, etc.)

**Guardrails**:
- Only `safe` and `mechanical` safety levels allowed for autofixable rules
- Semantic changes blocked from autofix
- Fix validation checks for semantic changes

**Mitigation**: Autofix engine validates fixes before applying, blocks semantic changes.

## 4. policy-drift

**Category**: `policy-drift`

**Description**: Policy fingerprint doesn't match policy content, indicating policy was modified without updating fingerprint.

**Detection Signals**:
- Computed fingerprint differs from stored fingerprint
- Invalid fingerprint format

**Guardrails**:
- Policy fingerprint validated on load
- Fingerprint computed deterministically from policy content
- Fingerprint verification function checks integrity

**Mitigation**: Policy utilities compute and verify fingerprints automatically.

## 5. contract-evolution

**Category**: `contract-evolution`

**Description**: Contract changes that are not diffable or migratable between versions.

**Detection Signals**:
- Contract version changes without migration path
- Breaking contract changes not detected

**Guardrails**:
- Contract versioning uses semantic versioning
- Contract structure validation ensures schema compliance

**Mitigation**: Contract comparison engine supports contract-to-contract diffing (future enhancement).

## 6. observed-instability

**Category**: `observed-instability`

**Description**: Observed artifacts (descriptors) that are invalid or unstable, causing non-deterministic diffs.

**Detection Signals**:
- Descriptors with missing required fields
- Descriptors with invalid structure

**Guardrails**:
- Descriptor validation before diffing
- Static analysis ensures descriptor stability

**Mitigation**: Descriptor collection validates structure before diffing.

## 7. rename-inflation

**Category**: `rename-inflation`

**Description**: Delete+add pairs that should be detected as renames (similarity above threshold).

**Detection Signals**:
- Similar counts of old and new paths
- High similarity between old and new paths (>80%)

**Guardrails**:
- Rename detection with configurable threshold (default: 0.8)
- Similarity calculation using string metrics
- Rename entries include confidence scores

**Mitigation**: Comparison engine detects renames using similarity thresholds.

## 8. output-schema-drift

**Category**: `output-schema-drift`

**Description**: JSON output schema version mismatch, indicating incompatible output format.

**Detection Signals**:
- Output `schemaVersion` doesn't match expected version
- Schema validation failures

**Guardrails**:
- Output schema versioned (currently `1.0.0`)
- Schema validation in development mode
- Version checks before processing output

**Mitigation**: Schema versioning policy requires version bumps for breaking changes.

## 9. severity-inflation

**Category**: `severity-inflation`

**Description**: Policies that set too many rules to error severity, making everything a CI blocker.

**Detection Signals**:
- >50% of policy rules set severity to "error"
- All violations treated as errors

**Guardrails**:
- Policy controls severity thresholds, not hardcoded
- Severity inflation detection warns about excessive error severity
- Default policy uses conservative severity settings

**Mitigation**: Policy design guidelines recommend appropriate severity thresholds.

## 10. local-ci-mismatch

**Category**: `local-ci-mismatch`

**Description**: Output that doesn't include local reproduction command, making CI failures hard to reproduce locally.

**Detection Signals**:
- Output missing `repro` field
- Repro command not executable locally

**Guardrails**:
- All JSON outputs include `repro` field with local command
- Repro command uses relative paths
- Repro command uses same options as original invocation

**Mitigation**: Diff and enforce commands always include repro commands in output.

## How to Interpret driftRisks in JSON Output

The `driftRisks` array in diff output contains risk signals:

```json
{
  "driftRisks": [
    {
      "category": "diff-noise",
      "severity": "info",
      "message": "1 diff entries were filtered as noise",
      "relatedPaths": ["surfaces[0].allowedFonts"]
    }
  ]
}
```

- `category`: One of the 10 risk categories
- `severity`: `error`, `warning`, or `info`
- `message`: Human-readable description
- `relatedPaths`: Optional array of related paths

Use drift risks to:
- Understand normalization effects
- Detect policy configuration issues
- Identify non-deterministic patterns
- Debug CI/local mismatches
