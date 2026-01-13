import { test } from "node:test";
import assert from "node:assert/strict";
import {
  classifyChange,
  detectRename,
  buildDiffPath,
} from "../dist/utils/compare.js";

test("classifyChange identifies added entries", () => {
  const type = classifyChange(undefined, "value");
  assert.equal(type, "added");
});

test("classifyChange identifies removed entries", () => {
  const type = classifyChange("value", undefined);
  assert.equal(type, "removed");
});

test("classifyChange identifies modified entries", () => {
  const type = classifyChange("old", "new");
  assert.equal(type, "modified");
});

test("detectRename finds similar paths above threshold", () => {
  const oldPaths = ["section.hero", "section.footer"];
  const newPaths = ["section.hero-new", "section.footer-updated"];
  const renames = detectRename(oldPaths, newPaths, 0.7);
  assert(renames.length > 0, "Should detect renames with similarity > threshold");
  assert(renames[0].confidence >= 0.7, "Confidence should meet threshold");
});

test("detectRename returns empty for low similarity", () => {
  const oldPaths = ["section.hero"];
  const newPaths = ["completely.different"];
  const renames = detectRename(oldPaths, newPaths, 0.8);
  assert.equal(renames.length, 0, "Should not detect renames below threshold");
});

test("buildDiffPath creates stable paths", () => {
  const path1 = buildDiffPath("surfaces/test", "allowedFonts");
  assert.equal(path1, "surfaces/test/allowedFonts");
  
  const path2 = buildDiffPath("surfaces/test", "sections", 0);
  assert.equal(path2, "surfaces/test/sections/0");
});
