# Autofix Blocked Fixture

This fixture tests semantic changes that cannot be autofixed.

## Expected Behavior

- Diff entries should NOT be marked as autofixable
- Fix mode should skip these entries
- Exit code: 1 (violations remain)
