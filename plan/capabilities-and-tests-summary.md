# interfacectl CLI: Capabilities and Test Coverage Summary

## Current Capabilities

### Core Commands

#### `validate`
**What it does:**
- Loads and validates contract structure against JSON Schema (uses bundled schema by default)
- Collects surface descriptors from codebase using static analysis
- Evaluates contract compliance by comparing descriptors to contract requirements
- Reports violations with structured findings (errors and warnings)
- Supports filtering by surface ID
- Outputs text or JSON format

**Implementation details:**
- Uses `@surfaces/interfacectl-validator` for contract structure validation and compliance evaluation
- Static analysis uses regex-based parsing (not AST) to extract descriptors
- Surface descriptors collected from TS/TSX/JS/JSX files (sections, containers) and CSS files (fonts, colors, layout, motion)
- Exit codes: 0 (compliant), 1 (violations), 2 (config/contract errors)

**What works:**
- Contract schema validation
- Surface descriptor collection via regex parsing
- Compliance checking (fonts, colors, sections, layout, motion)
- Violation reporting with detailed findings
- Config file support (maps surface IDs to root directories)
- JSON and text output formats

#### `diff`
**What it does:**
- Compares contract definition against observed surface descriptors
- Generates structured diff with added/removed/modified/renamed entries
- Normalizes contract and descriptors before comparison (strips ephemeral fields, sorts deterministically)
- Detects drift risks (noise, semantic ambiguity, policy drift, etc.)
- Supports rename detection via similarity threshold (Levenshtein distance)

**Implementation details:**
- Normalization: strips ephemeral fields (`source`, `containerSources`, `timestamp`, etc.) from descriptors, sorts set-like arrays
- Rename detection uses Levenshtein distance with configurable threshold (default 0.8)
- Drift risk detection identifies: diff noise, semantic ambiguity, policy drift, output schema drift, severity inflation, local/CI mismatch
- Exit codes: 0 (no diffs), 1 (diffs exist), 2 (config/contract errors)

**What works:**
- Contract-to-descriptor comparison
- Normalization (ephemeral field stripping, deterministic sorting)
- Rename detection via string similarity
- Drift risk detection and reporting
- Structured diff output (JSON/text)
- Repro command generation

**Limitations:**
- Contract evolution detection (contract-to-contract diffing) is a placeholder (returns empty array)
- No actual file comparison - compares normalized JSON structures only

#### `enforce`
**What it does:**
- Applies enforcement policies to interface contracts
- Three modes: `fail` (validate and exit), `fix` (apply autofixes), `pr` (generate patches)
- Matches diff entries against autofix rules
- Generates patches in unified diff or JSON Patch format (RFC 6902)
- Supports dry-run mode for preview

**Implementation details:**
- Internally runs `diff` command to get diff output
- Matches diff entries against policy autofix rules using glob patterns
- Only applies "safe" fixes (safetyLevel !== "semantic")
- Generates unified diff or JSON Patch for pr mode
- Exit codes: 0 (passed/fixed), 1 (violations/failed), 2 (config/policy errors)

**What works:**
- Policy loading and validation
- Autofix rule matching (glob patterns with `*` and `**`)
- Fix validation (confidence scoring, safety checks)
- Patch generation (unified diff and JSON Patch formats)
- Fail mode (policy-based validation)

**Critical limitations:**
- **File mutation is a placeholder** - `applyFixesToFiles()` does not actually modify files (marked as TODO, just returns success without changes)
- Fix mode marks fixes as "applied" but does not write changes to disk
- Policy extends resolution is TODO (not implemented - `resolvePolicyExtends()` just loads base policy without merging)

### Static Analysis

**Implementation approach:**
- **Regex-based parsing** (not AST-based)
- Parses TS/TSX/JS/JSX files for:
  - Sections: `data-contract-section` and `data-section` attributes
  - Containers: `data-contract-container` attributes
  - Fonts: CSS `font-family` declarations and CSS variable references
  - Colors: CSS color property declarations and CSS variable references
- Parses CSS files for:
  - Layout: `--contract-max-width` CSS variable
  - Motion: `--contract-motion-duration`, `--contract-motion-timing` variables and `transition`/`animation` declarations
  - Fonts: `font-family` declarations
  - Colors: various color property declarations

**File discovery:**
- Uses `globby` to find files matching patterns (`app/**/*.{ts,tsx,js,jsx}` and `app/**/*.css`)
- Ignores: `node_modules`, `.next`, `dist`, `.turbo`, `__tests__`, `*.test.*`, `*.spec.*`
- Respects `.gitignore`

**Limitations:**
- Regex parsing is fragile (may miss complex syntax, template literals with nested quotes, etc.)
- No semantic understanding (just pattern matching)
- Cannot handle dynamically constructed attributes
- Limited CSS parsing (regex-based, not a CSS parser)

### Normalization

**What it does:**
- Strips ephemeral fields from descriptors (`source`, `containerSources`, `timestamp`, `buildId`, `commitHash`, `_metadata`)
- Sorts set-like arrays deterministically (e.g., `allowedFonts`, `allowedColors`, `requiredSections`)
- Ensures diff output is deterministic (no timestamps, relative paths only)

**What works:**
- Ephemeral field stripping with path tracking
- Deterministic sorting of set-like fields
- Normalization metadata (tracks what was reordered/stripped)

### Drift Detection

**What it detects:**
- Diff noise (formatting-only or reorder-only changes)
- Semantic ambiguity (diff entries missing rule/clause references)
- Policy drift (fingerprint validation)
- Output schema drift (version mismatch)
- Severity inflation (excessive error severity overrides)
- Local/CI mismatch (missing repro commands)

**What works:**
- Noise filtering (filters entries where contract/observed values are semantically equivalent after normalization)
- Semantic clarity validation (checks for rule field)
- Policy fingerprint validation
- Output schema validation
- Severity inflation detection

**Limitations:**
- Contract evolution detection is placeholder (not implemented)
- Observed stability validation is basic (checks required fields exist, doesn't validate semantic correctness)

### Autofix System

**What it does:**
- Matches diff entries against autofix rules using glob patterns
- Validates fixes (confidence scoring, safety checks)
- Only applies "safe" fixes (not "semantic" safety level)
- Generates fix entries with confidence scores

**What works:**
- Rule pattern matching (glob with `*` and `**`)
- Fix validation (rejects same old/new values, invalid confidence)
- Safety level checking (blocks semantic changes)
- Confidence scoring (varies by change type: added 0.9, removed 0.95, modified 0.85)

**Critical limitations:**
- **File application is stubbed** - `applyFixesToFiles()` returns success without modifying files
- Fix mode in `enforce` command marks fixes as applied but does not write to disk

### Patch Generation

**What it does:**
- Generates unified diff format (for pr mode)
- Generates JSON Patch format (RFC 6902) for pr mode
- Groups fixes by file

**What works:**
- Unified diff generation (basic format with `---`/`+++` headers)
- JSON Patch generation (RFC 6902 compliant with `add`/`remove`/`replace` operations)
- File grouping

**Limitations:**
- Patch generation is basic (doesn't include context lines, line numbers may be inaccurate)
- Patches are generated but files are not actually modified

### Policy System

**What it does:**
- Loads and validates policy files (JSON Schema validation)
- Computes policy fingerprints (SHA-256 hash excluding fingerprint field)
- Provides default policy
- Supports policy versioning via fingerprint

**What works:**
- Policy loading and validation
- Fingerprint computation and verification
- Default policy provision

**Limitations:**
- **Policy extends is TODO** - `resolvePolicyExtends()` does not merge extends chain (just loads base policy)

## Known Limitations and TODOs

### Critical (Functionality Missing)

1. **File mutation is not implemented** (`packages/interfacectl-cli/src/utils/file-mutator.ts:36`)
   - `applyFixesToFiles()` is a placeholder that returns success without modifying files
   - Fix mode in `enforce` command does not actually write changes to disk

2. **Policy extends resolution is not implemented** (`packages/interfacectl-cli/src/utils/policy.ts:97`)
   - `resolvePolicyExtends()` does not merge extends chain
   - Just loads base policy without processing extends

3. **Contract evolution detection is placeholder** (`packages/interfacectl-cli/src/utils/drift-detection.ts:81`)
   - `detectContractEvolution()` returns empty array
   - Would require contract-to-contract diffing (not implemented)

### Implementation Limitations

1. **Regex-based static analysis** (not AST-based)
   - Fragile to complex syntax
   - Cannot handle dynamic attributes
   - Limited CSS parsing

2. **Basic patch generation**
   - No context lines
   - Line numbers may be inaccurate
   - Unified diff format is simplified

3. **No semantic understanding**
   - Pattern matching only
   - Cannot reason about code structure

## Current Test Coverage

### Test Infrastructure

- **Test runner:** Node.js built-in test runner (`node:test`)
- **Test location:** `packages/interfacectl-cli/test/`
- **Test files:** 13 test files (all `.test.mjs`)
- **Fixtures:** Located in `test/fixtures/`
- **Integration tests:** Use actual CLI binary (`dist/index.js`)
- **Portable install test:** Validates CLI works from npm tarball install

### Test Files and Coverage

#### Unit Tests (Utilities)

1. **`normalize.test.mjs`** - Normalization utilities
   - Tests `normalizeSetField()` - deterministic array sorting
   - Tests `stripEphemeralFields()` - ephemeral field removal and path tracking
   - Tests `normalizeContract()` - contract normalization (sorts set-like arrays)
   - Tests `normalizeDescriptor()` - descriptor normalization (strips ephemeral fields)

2. **`compare.test.mjs`** - Comparison utilities
   - Tests `classifyChange()` - change type classification (added/removed/modified)
   - Tests `detectRename()` - rename detection with similarity threshold
   - Tests `buildDiffPath()` - stable path construction

3. **`autofix.test.mjs`** - Autofix utilities
   - Tests `canAutofix()` - rule matching (autofixable flag, safety level)
   - Tests `matchRulePattern()` - glob pattern matching (`*` and `**`)
   - Tests `validateFix()` - fix validation (same values, invalid confidence)

4. **`drift-detection.test.mjs`** - Drift detection utilities
   - Tests `detectDiffNoise()` - noise filtering
   - Tests `validateSemanticClarity()` - rule field validation
   - Tests `checkEnforcementOverreach()` - semantic change blocking
   - Tests `detectAllDriftRisks()` - multi-category risk detection

5. **`file-mutator.test.mjs`** - File mutation utilities
   - Tests `generateUnifiedPatch()` - unified diff format generation
   - Tests `generateJsonPatch()` - JSON Patch format generation
   - **Note:** Does not test actual file mutation (because it's not implemented)

6. **`fingerprint.test.mjs`** - Fingerprinting utilities
   - Tests `canonicalizeForFingerprint()` - deterministic object serialization
   - Tests `fingerprintPolicy()` - policy fingerprinting (excludes fingerprint field)
   - Tests `fingerprintDiffOutput()` - diff output fingerprinting

7. **`policy.test.mjs`** - Policy utilities
   - Tests `loadDefaultPolicy()` - default policy loading
   - Tests `verifyPolicyFingerprint()` - fingerprint verification (correct and incorrect)

8. **`determinism.test.mjs`** - Output determinism
   - Tests that output contains no timestamps or absolute paths
   - Validates deterministic JSON serialization

#### Integration Tests

9. **`static-analysis.test.mjs`** - Static analysis integration
   - Tests `collectSurfaceDescriptors()` with real fixtures
   - Validates sections, containers, fonts, colors, motion extraction
   - Uses temporary directory with actual TSX and CSS files
   - Tests file discovery and parsing

10. **`diff-integration.test.mjs`** - Diff command integration
    - Tests `diff` command CLI execution
    - Tests JSON format output
    - Tests error handling (missing contract file)
    - **Note:** Basic integration test (doesn't test full diff generation with fixtures)

11. **`enforce-integration.test.mjs`** - Enforce command integration
    - Tests `enforce` command CLI execution
    - Tests `--strict` flag
    - Tests `--mode` option
    - Tests missing policy handling
    - **Note:** Basic integration test (doesn't test full enforcement workflow)

12. **`validate-portability.test.mjs`** - Portable install test
    - Tests CLI works from npm tarball install
    - Packages validator and CLI, installs in temp directory
    - Runs `validate` command end-to-end
    - Validates JSON output structure and findings

#### Snapshot/Example Tests

13. **`diff-snapshot.test.mjs`** - Diff output schema validation
    - Tests example `diff.json` fixture passes schema validation
    - Tests schema version correctness
    - Tests required fields exist
    - Tests entries are sorted deterministically

### Test Coverage Gaps

1. **End-to-end scenarios**
   - Limited integration tests (basic CLI execution only)
   - No full workflow tests (e.g., validate -> diff -> enforce)
   - No tests with complex fixtures (multiple surfaces, violations, etc.)

2. **File mutation**
   - Not tested (because not implemented)
   - Patch generation is tested, but file application is not

3. **Policy extends**
   - Not tested (because not implemented)

4. **Contract evolution**
   - Not tested (because placeholder)

5. **Error handling**
   - Basic error handling tested (missing files)
   - Limited edge case coverage (malformed contracts, invalid configs, etc.)

6. **Static analysis edge cases**
   - Basic parsing tested
   - Limited coverage of complex syntax, edge cases, malformed files

7. **Normalization edge cases**
   - Basic normalization tested
   - Limited coverage of nested structures, edge cases

8. **Rename detection**
   - Basic rename detection tested
   - Limited coverage of complex rename scenarios

9. **Drift detection**
   - Individual functions tested
   - Limited integration testing of drift risk detection in diff output

10. **Autofix edge cases**
    - Basic rule matching tested
    - Limited coverage of complex patterns, edge cases

### Test Quality

**Strengths:**
- Comprehensive unit test coverage for utilities
- Integration test validates portable install
- Snapshot test validates output schema
- Determinism test ensures reproducible output
- Uses Node.js built-in test runner (no external dependencies)

**Weaknesses:**
- Limited end-to-end integration tests
- No complex scenario testing
- Limited error handling coverage
- Limited edge case coverage
- Test fixtures are minimal (single surface, simple cases)

## Summary

**What works:**
- Contract validation (schema + compliance)
- Static analysis (regex-based descriptor extraction)
- Diff generation (normalized comparison)
- Drift detection (multiple risk categories)
- Autofix rule matching and validation
- Patch generation (unified diff and JSON Patch)
- Policy loading and fingerprinting
- Deterministic output generation
- Portable CLI installation

**What's incomplete:**
- File mutation (enforce fix mode doesn't write to disk)
- Policy extends resolution (no merging)
- Contract evolution detection (placeholder)
- AST-based static analysis (uses regex)
- Full end-to-end integration tests
- Complex scenario testing

**Overall assessment:**
The CLI provides core validation and diff capabilities with solid unit test coverage. The enforce command's fix mode and policy extends are incomplete, and file mutation is not implemented. Static analysis uses regex parsing (not AST), which works for basic cases but is fragile. Test coverage is good for utilities but limited for integration scenarios.
