# Reorder-Only Fixture

This fixture tests the case where arrays are reordered but values are the same.

## Expected Behavior

- Diff entries should be suppressed via normalization
- Normalization metadata should show reordered paths
- Exit code: 0 (no actual diffs after normalization)
