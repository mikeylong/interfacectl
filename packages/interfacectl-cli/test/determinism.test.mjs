import { test } from "node:test";
import assert from "node:assert/strict";

test("output has no timestamps or absolute paths", () => {
  const output = {
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
  
  const json = JSON.stringify(output);
  // Check for common non-deterministic patterns
  assert(!json.includes("timestamp"), "Should not contain timestamp");
  assert(!json.match(/\/Users\/|\/home\/|C:\\/), "Should not contain absolute paths");
  assert(!json.includes("Date.now"), "Should not contain Date.now");
  assert(!json.includes("Math.random"), "Should not contain Math.random");
});
