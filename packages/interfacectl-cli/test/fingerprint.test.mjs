import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fingerprintPolicy,
  fingerprintDiffOutput,
  canonicalizeForFingerprint,
} from "../dist/utils/fingerprint.js";

test("canonicalizeForFingerprint produces deterministic output", () => {
  const obj1 = { b: 2, a: 1, c: 3 };
  const obj2 = { a: 1, c: 3, b: 2 };
  const canonical1 = canonicalizeForFingerprint(obj1);
  const canonical2 = canonicalizeForFingerprint(obj2);
  assert.equal(canonical1, canonical2, "Different key order should produce same canonical form");
});

test("fingerprintPolicy produces same hash for identical policies", () => {
  const policy1 = {
    version: "1.0.0",
    fingerprint: "placeholder",
    modes: { fail: { exitOnAny: true, severityThreshold: "error" } },
    autofixRules: [],
  };
  const policy2 = { ...policy1 };
  const hash1 = fingerprintPolicy(policy1);
  const hash2 = fingerprintPolicy(policy2);
  assert.equal(hash1, hash2, "Identical policies should produce same fingerprint");
});

test("fingerprintPolicy excludes fingerprint field from hash", () => {
  const policy1 = {
    version: "1.0.0",
    fingerprint: "hash1",
    modes: { fail: { exitOnAny: true, severityThreshold: "error" } },
    autofixRules: [],
  };
  const policy2 = {
    ...policy1,
    fingerprint: "hash2",
  };
  const hash1 = fingerprintPolicy(policy1);
  const hash2 = fingerprintPolicy(policy2);
  assert.equal(hash1, hash2, "Different fingerprint values should not affect hash");
});

test("fingerprintDiffOutput produces deterministic hash", () => {
  const output1 = {
    schemaVersion: "1.0.0",
    tool: { name: "interfacectl", version: "0.1.0" },
    contract: { path: "contract.json", version: "1.0.0" },
    observed: { root: "." },
    normalization: { enabled: true, reorderedPaths: [], strippedPaths: [] },
    summary: {
      totalChanges: 0,
      byType: { added: 0, removed: 0, modified: 0, renamed: 0 },
      bySeverity: { error: 0, warning: 0, info: 0 },
    },
    entries: [],
  };
  const output2 = { ...output1 };
  const hash1 = fingerprintDiffOutput(output1);
  const hash2 = fingerprintDiffOutput(output2);
  assert.equal(hash1, hash2, "Identical outputs should produce same hash");
  assert.equal(hash1.length, 64, "SHA-256 hash should be 64 hex characters");
});
