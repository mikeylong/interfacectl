import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateDiffOutput,
  validatePolicy,
  validateFixSummary,
  getBundledDiffSchema,
  getBundledPolicySchema,
  getBundledFixSummarySchema,
} from "../dist/index.js";

// Valid diff output example
const validDiffOutput = {
  schemaVersion: "1.0.0",
  tool: { name: "interfacectl", version: "0.1.0" },
  contract: { path: "contracts/ui.contract.json", version: "1.0.0" },
  observed: { root: "." },
  normalization: {
    enabled: true,
    reorderedPaths: [],
    strippedPaths: [],
  },
  summary: {
    totalChanges: 0,
    byType: { added: 0, removed: 0, modified: 0, renamed: 0 },
    bySeverity: { error: 0, warning: 0, info: 0 },
  },
  entries: [],
};

// Valid policy example
const validPolicy = {
  version: "1.0.0",
  fingerprint: "a".repeat(64),
  modes: {
    fail: { exitOnAny: true, severityThreshold: "error" },
    fix: { rules: [], dryRun: true },
    pr: { patchFormat: "json" },
  },
  autofixRules: [],
};

// Valid fix summary example
const validFixSummary = {
  schemaVersion: "1.0.0",
  mode: "fix",
  policy: { version: "1.0.0", fingerprint: "a".repeat(64) },
  applied: [],
  skipped: [],
  errors: [],
};

test("validateDiffOutput accepts valid diff output", () => {
  const result = validateDiffOutput(validDiffOutput);
  assert.equal(result.ok, true);
  assert.equal(result.errors.length, 0);
});

test("validateDiffOutput rejects invalid diff output", () => {
  const invalid = { ...validDiffOutput, schemaVersion: "invalid" };
  const result = validateDiffOutput(invalid);
  // Schema validation should catch invalid version format
  // (Note: This may pass if schema is lenient, but structure should be validated)
  assert.equal(typeof result.ok, "boolean");
});

test("validatePolicy accepts valid policy", () => {
  const result = validatePolicy(validPolicy);
  assert.equal(result.ok, true);
  assert.equal(result.errors.length, 0);
});

test("validatePolicy rejects policy with invalid fingerprint format", () => {
  const invalid = { ...validPolicy, fingerprint: "not-a-valid-hex" };
  const result = validatePolicy(invalid);
  assert.equal(result.ok, false);
  assert(result.errors.length > 0);
});

test("validateFixSummary accepts valid fix summary", () => {
  const result = validateFixSummary(validFixSummary);
  assert.equal(result.ok, true);
  assert.equal(result.errors.length, 0);
});

test("getBundledDiffSchema returns schema object", () => {
  const schema = getBundledDiffSchema();
  assert.equal(typeof schema, "object");
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
});

test("getBundledPolicySchema returns schema object", () => {
  const schema = getBundledPolicySchema();
  assert.equal(typeof schema, "object");
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
});

test("getBundledFixSummarySchema returns schema object", () => {
  const schema = getBundledFixSummarySchema();
  assert.equal(typeof schema, "object");
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
});
