import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateUnifiedPatch,
  generateJsonPatch,
} from "../dist/utils/file-mutator.js";

test("generateUnifiedPatch creates unified diff format", () => {
  const fixes = [
    {
      ruleId: "test",
      path: "test/path",
      oldValue: "old",
      newValue: "new",
      confidence: 0.9,
      file: "test.ts",
    },
  ];
  const patch = generateUnifiedPatch(fixes, ".");
  assert(patch.includes("---"), "Should include unified diff header");
  assert(patch.includes("+++"), "Should include unified diff header");
  assert(patch.includes('-"old"'), "Should include old value (JSON-stringified)");
  assert(patch.includes('+"new"'), "Should include new value (JSON-stringified)");
});

test("generateJsonPatch creates JSON Patch format", () => {
  const fixes = [
    {
      ruleId: "test",
      path: "test.path",
      oldValue: "old",
      newValue: "new",
      confidence: 0.9,
    },
  ];
  const patch = generateJsonPatch(fixes);
  assert(Array.isArray(patch), "JSON Patch should be an array");
  assert.equal(patch[0].op, "replace", "Should use replace operation for modified values");
  assert.equal(patch[0].path, "/test/path", "Path should be converted to JSON Pointer");
});
