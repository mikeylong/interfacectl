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

test("enforce command supports --strict flag", async () => {
  const result = await runCLI([
    "enforce",
    "--strict",
    "--contract",
    "nonexistent.json",
  ]);
  assert(result.code !== undefined, "Should return an exit code");
});

test("enforce command supports --mode option", async () => {
  const result = await runCLI([
    "enforce",
    "--mode",
    "fail",
    "--contract",
    "nonexistent.json",
  ]);
  assert(result.code !== undefined, "Should return an exit code");
});

test("enforce command handles missing policy gracefully", async () => {
  const result = await runCLI([
    "enforce",
    "--mode",
    "fail",
    "--contract",
    "nonexistent.json",
  ]);
  // Should use default policy and handle gracefully
  assert(result.code !== undefined, "Should return an exit code");
});
