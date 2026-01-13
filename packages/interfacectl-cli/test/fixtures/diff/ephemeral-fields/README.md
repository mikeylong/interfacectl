# Ephemeral Fields Fixture

This fixture tests the case where ephemeral fields (like source, timestamps) are different.

## Expected Behavior

- Ephemeral fields should be stripped in normalization
- Normalization metadata should show stripped paths
- No diff entries for ephemeral fields
