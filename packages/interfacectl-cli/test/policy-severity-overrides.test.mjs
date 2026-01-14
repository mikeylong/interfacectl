import { test } from "node:test";
import assert from "node:assert/strict";
import { applyPolicySeverityOverrides } from "../dist/utils/apply-policy-severity.js";

test("applyPolicySeverityOverrides: no policy returns entries unchanged", () => {
  const entries = [
    { severity: "error", path: "test1", type: "modified" },
    { severity: "warning", path: "test2", type: "added" },
  ];

  const result = applyPolicySeverityOverrides(entries, undefined);
  assert.deepEqual(result, entries);
});

test("applyPolicySeverityOverrides: last match wins", () => {
  const entries = [
    { severity: "error", path: "surfaces/test/allowedFonts", type: "added" },
  ];

  const policy = {
    version: "1.0.0",
    fingerprint: "test",
    modes: {
      fail: { exitOnAny: true, severityThreshold: "error" },
      fix: { rules: [], dryRun: false },
      pr: { patchFormat: "unified" },
    },
    autofixRules: [
      {
        id: "rule1",
        pattern: "surfaces/**",
        autofixable: false,
        description: "First rule",
        safetyLevel: "safe",
        setSeverity: "warning",
      },
      {
        id: "rule2",
        pattern: "surfaces/**",
        autofixable: false,
        description: "Second rule (should win)",
        safetyLevel: "safe",
        setSeverity: "info",
      },
    ],
  };

  const result = applyPolicySeverityOverrides(entries, policy);
  assert.equal(result[0].severity, "info", "Last matching rule should win");
});

test("applyPolicySeverityOverrides: allows downgrades", () => {
  const entries = [
    { severity: "error", path: "surfaces/test/allowedFonts", type: "added" },
  ];

  const policy = {
    version: "1.0.0",
    fingerprint: "test",
    modes: {
      fail: { exitOnAny: true, severityThreshold: "error" },
      fix: { rules: [], dryRun: false },
      pr: { patchFormat: "unified" },
    },
    autofixRules: [
      {
        id: "rule1",
        pattern: "surfaces/**",
        autofixable: false,
        description: "Downgrade rule",
        safetyLevel: "safe",
        setSeverity: "info",
      },
    ],
  };

  const result = applyPolicySeverityOverrides(entries, policy);
  assert.equal(result[0].severity, "info", "Should allow downgrade error→info");
});

test("applyPolicySeverityOverrides: allows upgrades", () => {
  const entries = [
    { severity: "info", path: "surfaces/test/allowedFonts", type: "added" },
  ];

  const policy = {
    version: "1.0.0",
    fingerprint: "test",
    modes: {
      fail: { exitOnAny: true, severityThreshold: "error" },
      fix: { rules: [], dryRun: false },
      pr: { patchFormat: "unified" },
    },
    autofixRules: [
      {
        id: "rule1",
        pattern: "surfaces/**",
        autofixable: false,
        description: "Upgrade rule",
        safetyLevel: "safe",
        setSeverity: "error",
      },
    ],
  };

  const result = applyPolicySeverityOverrides(entries, policy);
  assert.equal(result[0].severity, "error", "Should allow upgrade info→error");
});

test("applyPolicySeverityOverrides: non-matching entries unchanged", () => {
  const entries = [
    { severity: "error", path: "surfaces/test/allowedFonts", type: "added" },
    { severity: "warning", path: "other/path", type: "modified" },
  ];

  const policy = {
    version: "1.0.0",
    fingerprint: "test",
    modes: {
      fail: { exitOnAny: true, severityThreshold: "error" },
      fix: { rules: [], dryRun: false },
      pr: { patchFormat: "unified" },
    },
    autofixRules: [
      {
        id: "rule1",
        pattern: "surfaces/**",
        autofixable: false,
        description: "Matching rule",
        safetyLevel: "safe",
        setSeverity: "info",
      },
    ],
  };

  const result = applyPolicySeverityOverrides(entries, policy);
  assert.equal(result[0].severity, "info", "Matching entry should be overridden");
  assert.equal(result[1].severity, "warning", "Non-matching entry should be unchanged");
});
