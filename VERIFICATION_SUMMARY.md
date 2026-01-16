# Color Policy Implementation Verification

## ✅ Code Names Match Documentation

All emitted codes match the documentation in `color-policy.md`:

- ✅ `color.raw-value.used` - Emitted for raw color literals
- ✅ `color.token.namespace.violation` - Emitted for CSS variables not matching allowed namespaces  
- ✅ `contract.deprecated-field` - Emitted when `allowedColors` is present

## ✅ Severity Mapping Matches Documentation

### `color.raw-value.used`
- **Policy: `"warn"`** → Severity: `"warning"` (does not fail validation)
- **Policy: `"strict"`** → Severity: `"error"` (fails validation with exit code)

Implementation location: `packages/interfacectl-cli/src/commands/validate.ts:578-592`

```typescript
case "color-raw-value-used": {
  finding.expected = details.allowedValues;
  finding.found = details.colorValue;
  // Set severity based on policy: "warn" -> warning, "strict" -> error
  if (details.policy === "warn") {
    finding.severity = "warning";
  } else if (details.policy === "strict") {
    finding.severity = "error";
  }
  break;
}
```

### `color.token.namespace.violation`
- **Default**: Severity: `"warning"` (does not fail validation)

Implementation location: `packages/interfacectl-cli/src/commands/validate.ts:595-601`

```typescript
case "color-token-namespace-violation": {
  finding.expected = details.allowedNamespaces;
  finding.found = details.tokenName;
  // Token namespace violations are warnings by default
  finding.severity = "warning";
  break;
}
```

### `contract.deprecated-field`
- **Default**: Severity: `"warning"` (does not fail validation)

Implementation location: `packages/interfacectl-cli/src/commands/validate.ts:258`

## ✅ Exit Code Behavior

**Warnings do not fail validation** - Only errors cause non-zero exit codes.

Implementation location: `packages/interfacectl-cli/src/commands/validate.ts:330-348`

```typescript
} else {
  // Filter to only error-level findings for exit code determination
  const errorFindings = violationFindings.filter((f) => f.severity === "error");
  if (errorFindings.length === 0) {
    exitCode = 0; // Only warnings, don't fail
  } else {
    // Find the highest severity category (E2 > E1)
    // ... exit code logic based on error findings only
  }
}
```

## Test Coverage

All scenarios are covered in tests:

- ✅ Schema accepts contract without `allowedColors`
- ✅ Schema accepts contract with `color` policy
- ✅ Deprecation warning emitted for `allowedColors`
- ✅ Raw literal detection with `warn` policy (severity: warning)
- ✅ Raw literal detection with `strict` policy (severity: error)
- ✅ Allowlist/denylist behavior
- ✅ Token namespace validation
- ✅ Policy `off` skips checks

## Ready for surfaces-monorepo Integration

The implementation is ready for use in surfaces-monorepo:

1. **Contracts with `allowedColors`** will:
   - ✅ Pass schema validation
   - ✅ Emit `contract.deprecated-field` warnings
   - ✅ Continue to compliance checks (layout pageFrame drift will appear)

2. **Contracts with `color` policy** will:
   - ✅ Pass schema validation
   - ✅ Emit `color.raw-value.used` findings based on policy (warn/strict)
   - ✅ Emit `color.token.namespace.violation` warnings for invalid tokens

3. **Exit codes**:
   - ✅ `rawValues.policy: "warn"` → warnings only, exit code 0
   - ✅ `rawValues.policy: "strict"` → errors, exit code based on category (E1/E2)

## Next Steps for surfaces-monorepo

1. Pull updated interfacectl changes
2. Run `pnpm validate:ci`
3. Verify output includes:
   - `contract.deprecated-field` warnings for legacy `allowedColors`
   - Actual compliance checks (layout pageFrame drift)
4. (Optional) Add `color` policy section to contract:
   ```json
   {
     "color": {
       "sourceOfTruth": {
         "type": "tokens",
         "tokenNamespaces": ["--color-"]
       },
       "rawValues": {
         "policy": "warn"
       }
     }
   }
   ```
5. Leave `allowedColors` on surfaces for one iteration to see both deprecation warnings and v1 color findings
