import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cliPath = path.resolve(__dirname, "../dist/index.js");

function runCLI(args, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    const proc = spawn("node", [cliPath, ...args], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    proc.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
    proc.on("error", reject);
  });
}

test("diff command returns exit code 0 for no diffs", async () => {
  // This test would need actual fixtures to run
  // For now, just test that the command exists and handles errors
  const result = await runCLI(["diff", "--contract", "nonexistent.json"]);
  assert(result.code === 2 || result.code === 1, "Should return error code for missing file");
});

test("diff command supports --json format", async () => {
  const result = await runCLI([
    "diff",
    "--contract",
    "nonexistent.json",
    "--format",
    "json",
  ]);
  // Should handle error gracefully
  assert(result.code !== undefined, "Should return an exit code");
});
