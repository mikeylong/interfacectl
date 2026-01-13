# Rename Scenarios Fixture

This fixture tests rename detection (similarity above threshold).

## Expected Behavior

- Similar changes should be detected as renames (not delete+add)
- Rename entries should have confidence scores
- Exit code: 1 (diffs exist)
