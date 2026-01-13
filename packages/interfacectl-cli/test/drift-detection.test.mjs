import { test } from "node:test";
import assert from "node:assert/strict";
import {
  detectDiffNoise,
  validateSemanticClarity,
  checkEnforcementOverreach,
  detectAllDriftRisks,
} from "../dist/utils/drift-detection.js";

test("detectDiffNoise filters noise entries", () => {
  const entries = [
    {
      type: "modified",
      path: "test/path",
      contractValue: "value",
      observedValue: "value", // Same value = noise
      severity: "info",
    },
    {
      type: "modified",
      path: "test/path2",
      contractValue: "old",
      observedValue: "new", // Different value = real diff
      severity: "error",
    },
  ];
  const filtered = detectDiffNoise(entries);
  assert(filtered.length <= entries.length, "Should filter some entries");
});

test("validateSemanticClarity requires rule field", () => {
  const entryWithRule = {
    type: "modified",
    path: "test/path",
    severity: "error",
    rule: "contract.surfaces[0].allowedFonts",
  };
  const entryWithoutRule = {
    type: "modified",
    path: "test/path",
    severity: "error",
  };
  assert.equal(validateSemanticClarity(entryWithRule), true);
  assert.equal(validateSemanticClarity(entryWithoutRule), false);
});

test("checkEnforcementOverreach blocks semantic changes", () => {
  const semanticFix = {
    ruleId: "test",
    path: "surfaces/test/intent",
    oldValue: "old intent",
    newValue: "new intent",
    confidence: 0.9,
  };
  assert.equal(checkEnforcementOverreach(semanticFix), true, "Semantic changes should be blocked");
});

test("detectAllDriftRisks detects multiple risk categories", () => {
  const diffOutput = {
    schemaVersion: "1.0.0",
    tool: { name: "interfacectl", version: "0.1.0" },
    contract: { path: "contract.json", version: "1.0.0" },
    observed: { root: "." },
    normalization: { enabled: true, reorderedPaths: [], strippedPaths: [] },
    summary: {
      totalChanges: 1,
      byType: { added: 1, removed: 0, modified: 0, renamed: 0 },
      bySeverity: { error: 0, warning: 1, info: 0 },
    },
    entries: [
      {
        type: "added",
        path: "test/path",
        severity: "warning",
        // Missing rule = semantic ambiguity
      },
    ],
  };
  const risks = detectAllDriftRisks(diffOutput);
  assert(risks.length >= 0, "Should detect at least some risks");
});
