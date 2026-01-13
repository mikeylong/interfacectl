import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canAutofix,
  matchRulePattern,
  applyFix,
  validateFix,
} from "../dist/utils/autofix.js";

test("canAutofix returns false for non-autofixable rules", () => {
  const entry = {
    type: "modified",
    path: "surfaces/test/allowedFonts",
    severity: "error",
  };
  const rule = {
    id: "test-rule",
    pattern: "surfaces/*/allowedFonts",
    autofixable: false,
    description: "Test rule",
    safetyLevel: "safe",
  };
  assert.equal(canAutofix(entry, rule), false);
});

test("canAutofix returns false for semantic safety level", () => {
  const entry = {
    type: "modified",
    path: "surfaces/test/allowedFonts",
    severity: "error",
  };
  const rule = {
    id: "test-rule",
    pattern: "surfaces/*/allowedFonts",
    autofixable: true,
    description: "Test rule",
    safetyLevel: "semantic",
  };
  assert.equal(canAutofix(entry, rule), false);
});

test("matchRulePattern matches glob patterns", () => {
  assert.equal(matchRulePattern("surfaces/test/allowedFonts", "surfaces/*/allowedFonts"), true);
  assert.equal(matchRulePattern("surfaces/test/other", "surfaces/*/allowedFonts"), false);
});

test("matchRulePattern handles wildcards", () => {
  assert.equal(matchRulePattern("surfaces/any/allowedFonts", "surfaces/*/allowedFonts"), true);
  assert.equal(matchRulePattern("surfaces/test/nested/path", "surfaces/**/path"), true);
});

test("validateFix accepts valid fixes", () => {
  const fix = {
    ruleId: "test",
    path: "test/path",
    oldValue: "old",
    newValue: "new",
    confidence: 0.9,
  };
  assert.equal(validateFix(fix), true);
});

test("validateFix rejects fixes with same old and new values", () => {
  const fix = {
    ruleId: "test",
    path: "test/path",
    oldValue: "same",
    newValue: "same",
    confidence: 0.9,
  };
  assert.equal(validateFix(fix), false);
});

test("validateFix rejects fixes with invalid confidence", () => {
  const fix = {
    ruleId: "test",
    path: "test/path",
    oldValue: "old",
    newValue: "new",
    confidence: 1.5, // Invalid: > 1.0
  };
  assert.equal(validateFix(fix), false);
});
