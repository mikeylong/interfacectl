import { test } from "node:test";
import { spawn } from "node:child_process";
import { once } from "node:events";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import os from "node:os";
import {
  mkdtemp,
  mkdir,
  writeFile,
  rm,
} from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cliPackageDir = path.resolve(__dirname, "..");
const cliExecutable = path.resolve(cliPackageDir, "dist", "index.js");

async function runCommand(command, args, options = {}) {
  const proc = spawn(command, args, {
    ...options,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";

  proc.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
  });

  proc.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  const exitCode = await once(proc, "exit").then(([code]) => code ?? 1);

  return { exitCode, stdout, stderr };
}

test("validate emits deprecation warning for allowedColors", async () => {
  const tempRoot = await mkdtemp(
    path.join(os.tmpdir(), "interfacectl-deprecation-"),
  );

  try {
    const contractPath = path.join(tempRoot, "contract.json");
    const contract = {
      contractId: "test",
      version: "1.0.0",
      surfaces: [
        {
          id: "test-surface",
          displayName: "Test Surface",
          type: "web",
          requiredSections: ["header"],
          allowedFonts: ["Inter"],
          allowedColors: ["#000000", "#ffffff"],
          layout: {
            maxContentWidth: 1200,
          },
        },
      ],
      sections: [
        {
          id: "header",
          intent: "Page header",
          description: "Main header",
        },
      ],
      constraints: {
        motion: {
          allowedDurationsMs: [200],
          allowedTimingFunctions: ["ease"],
        },
      },
    };

    await writeFile(contractPath, JSON.stringify(contract, null, 2), "utf-8");

    // Create minimal surface directory structure with source files
    const surfaceDir = path.join(tempRoot, "apps", "test-surface");
    await mkdir(surfaceDir, { recursive: true });
    await writeFile(path.join(surfaceDir, "package.json"), JSON.stringify({ name: "test-surface" }), "utf-8");
    // Create minimal app structure for Next.js surface
    const appDir = path.join(surfaceDir, "app");
    await mkdir(appDir, { recursive: true });
    await writeFile(path.join(appDir, "layout.tsx"), `export default function Layout({ children }) { return <div>{children}</div>; }`, "utf-8");
    await writeFile(path.join(appDir, "page.tsx"), `export default function Page() { return <div>Test</div>; }`, "utf-8");

    const result = await runCommand(
      "node",
      [cliExecutable, "validate", "--contract", contractPath, "--workspace-root", tempRoot, "--format", "json", "--exit-codes", "v2"],
      { cwd: tempRoot },
    );

    // Should pass schema validation (allowedColors is accepted but deprecated)
    assert.equal(result.exitCode, 0, `Command failed: ${result.stderr}\n${result.stdout}`);

    const output = JSON.parse(result.stdout);
    assert.ok(output.findings);
    
    // Should have deprecation warning
    const deprecationFinding = output.findings.find(
      (f) => f.code === "contract.deprecated-field",
    );
    assert.ok(deprecationFinding, "Should emit contract.deprecated-field finding");
    assert.equal(deprecationFinding.severity, "warning");
    assert(deprecationFinding.message.includes("allowedColors"));
    assert(deprecationFinding.message.includes("deprecated"));
    assert(deprecationFinding.location, "Should include jsonPointer location");
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("validate accepts contract with color policy", async () => {
  const tempRoot = await mkdtemp(
    path.join(os.tmpdir(), "interfacectl-color-policy-"),
  );

  try {
    const contractPath = path.join(tempRoot, "contract.json");
    const contract = {
      contractId: "test",
      version: "1.0.0",
      surfaces: [
        {
          id: "test-surface",
          displayName: "Test Surface",
          type: "web",
          requiredSections: ["header"],
          allowedFonts: ["Inter"],
          layout: {
            maxContentWidth: 1200,
          },
        },
      ],
      sections: [
        {
          id: "header",
          intent: "Page header",
          description: "Main header",
        },
      ],
      constraints: {
        motion: {
          allowedDurationsMs: [200],
          allowedTimingFunctions: ["ease"],
        },
      },
      color: {
        sourceOfTruth: {
          type: "tokens",
          tokenNamespaces: ["--color-"],
        },
        rawValues: {
          policy: "warn",
        },
      },
    };

    await writeFile(contractPath, JSON.stringify(contract, null, 2), "utf-8");

    // Create minimal surface directory structure with source files
    const surfaceDir = path.join(tempRoot, "apps", "test-surface");
    await mkdir(surfaceDir, { recursive: true });
    await writeFile(path.join(surfaceDir, "package.json"), JSON.stringify({ name: "test-surface" }), "utf-8");
    // Create minimal app structure for Next.js surface
    const appDir = path.join(surfaceDir, "app");
    await mkdir(appDir, { recursive: true });
    await writeFile(path.join(appDir, "layout.tsx"), `export default function Layout({ children }) { return <div>{children}</div>; }`, "utf-8");
    await writeFile(path.join(appDir, "page.tsx"), `export default function Page() { return <div>Test</div>; }`, "utf-8");

    const result = await runCommand(
      "node",
      [cliExecutable, "validate", "--contract", contractPath, "--workspace-root", tempRoot, "--format", "json", "--exit-codes", "v2"],
      { cwd: tempRoot },
    );

    // Should pass schema validation
    assert.equal(result.exitCode, 0, `Command failed: ${result.stderr}\n${result.stdout}`);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});
