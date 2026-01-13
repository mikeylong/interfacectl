import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateDiffOutput } from "@surfaces/interfacectl-validator";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("example diff.json passes schema validation", async () => {
  const examplePath = path.resolve(
    __dirname,
    "fixtures/examples/diff.json",
  );
  const exampleContent = await readFile(examplePath, "utf-8");
  const example = JSON.parse(exampleContent);
  
  const validation = validateDiffOutput(example);
  assert.equal(validation.ok, true, "Example diff should pass schema validation");
  if (!validation.ok) {
    console.error("Validation errors:", validation.errors);
  }
});

test("example diff.json has correct schema version", async () => {
  const examplePath = path.resolve(
    __dirname,
    "fixtures/examples/diff.json",
  );
  const exampleContent = await readFile(examplePath, "utf-8");
  const example = JSON.parse(exampleContent);
  
  assert.equal(example.schemaVersion, "1.0.0", "Should have correct schema version");
  assert.equal(example.tool.name, "interfacectl", "Should have correct tool name");
});

test("example diff.json has deterministic structure", async () => {
  const examplePath = path.resolve(
    __dirname,
    "fixtures/examples/diff.json",
  );
  const exampleContent = await readFile(examplePath, "utf-8");
  const example = JSON.parse(exampleContent);
  
  // Check required fields
  assert(example.contract, "Should have contract field");
  assert(example.observed, "Should have observed field");
  assert(example.normalization, "Should have normalization field");
  assert(example.summary, "Should have summary field");
  assert(Array.isArray(example.entries), "Should have entries array");
});

test("example diff.json entries are sorted", async () => {
  const examplePath = path.resolve(
    __dirname,
    "fixtures/examples/diff.json",
  );
  const exampleContent = await readFile(examplePath, "utf-8");
  const example = JSON.parse(exampleContent);
  
  if (example.entries.length > 1) {
    // Check that entries are sorted (surfaceId, path, type)
    const sorted = [...example.entries].sort((a, b) => {
      if (a.surfaceId !== b.surfaceId) {
        if (!a.surfaceId) return 1;
        if (!b.surfaceId) return -1;
        return a.surfaceId.localeCompare(b.surfaceId);
      }
      if (a.path !== b.path) {
        return a.path.localeCompare(b.path);
      }
      return a.type.localeCompare(b.type);
    });
    assert.deepEqual(example.entries, sorted, "Entries should be sorted deterministically");
  }
});
