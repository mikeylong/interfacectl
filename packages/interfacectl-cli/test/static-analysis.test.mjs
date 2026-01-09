import { test } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import {
  mkdtemp,
  mkdir,
  writeFile,
  rm,
} from "node:fs/promises";

import { collectSurfaceDescriptors } from "../dist/descriptors/static-analysis.js";

test("collectSurfaceDescriptors captures sections, containers, fonts, colors, and motion", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "interfacectl-static-"));
  const surfaceId = "demo-surface";
  const surfaceRoot = path.join(tempRoot, "apps", surfaceId);

  try {
    await mkdir(path.join(surfaceRoot, "app", "__tests__"), { recursive: true });

    await writeFile(
      path.join(surfaceRoot, "app", "layout.tsx"),
      `
        export default function RootLayout({ children }) {
          return (
            <html lang="en">
              <body data-contract-container="primary-shell" className="contract-container">
                {children}
              </body>
            </html>
          );
        }
      `,
      "utf-8",
    );

    await writeFile(
      path.join(surfaceRoot, "app", "page.tsx"),
      `
        export default function Page() {
          return (
            <main
              data-contract-section="main.hero"
              data-contract-container="primary-shell contract-container"
              className="contract-container"
            >
              <section data-contract-section="main.hero">
                <h1>Demo Surface</h1>
              </section>
            </main>
          );
        }
      `,
      "utf-8",
    );

    await writeFile(
      path.join(surfaceRoot, "app", "globals.css"),
      `
        :root {
          --contract-max-width: 960px;
          --contract-motion-duration: 120ms;
          --contract-motion-timing: ease-in;
          --color-primary: #0066cc;
          --color-background: #ffffff;
        }

        .contract-container {
          transition: opacity var(--contract-motion-duration) ease-in;
          background-color: var(--color-background);
        }

        .demo-body {
          font-family: var(--font-demo), "Demo Sans", monospace;
          color: var(--color-primary);
        }

        .demo-text {
          color: #333333;
          border-color: rgb(200, 200, 200);
        }
      `,
      "utf-8",
    );

    await writeFile(
      path.join(surfaceRoot, "app", "__tests__", "ignored.spec.tsx"),
      `
        export default function Ignored() {
          return <section data-contract-section="ignored.section" />;
        }
      `,
      "utf-8",
    );

    const contract = {
      contractId: "test.contract",
      version: "1.0.0",
      sections: [
        {
          id: "main.hero",
          intent: "hero",
          description: "Hero section",
        },
      ],
      constraints: {
        motion: {
          allowedDurationsMs: [120],
          allowedTimingFunctions: ["linear", "ease-in"],
        },
      },
      surfaces: [
        {
          id: surfaceId,
          displayName: "Demo Surface",
          type: "web",
          requiredSections: ["main.hero"],
          allowedFonts: ["var(--font-demo)", "Demo Sans", "monospace"],
          allowedColors: [
            "var(--color-primary)",
            "var(--color-background)",
            "#333333",
            "rgb(200, 200, 200)",
          ],
          layout: {
            maxContentWidth: 960,
            requiredContainers: ["primary-shell"],
          },
        },
      ],
    };

    const result = await collectSurfaceDescriptors({
      workspaceRoot: tempRoot,
      contract,
      surfaceFilters: new Set(),
      surfaceRootMap: new Map(),
    });

    assert.equal(result.errors.length, 0);
    assert.equal(result.warnings.length, 0);
    assert.equal(result.descriptors.length, 1);

    const descriptor = result.descriptors[0];
    assert.ok(descriptor, "descriptor should be defined");

    assert.deepEqual(descriptor.sections, [
      {
        id: "main.hero",
        source: path.relative(tempRoot, path.join(surfaceRoot, "app", "page.tsx")),
      },
    ]);

    assert.equal(descriptor.layout.maxContentWidth, 960);
    assert.deepEqual(descriptor.layout.containers, [
      "contract-container",
      "primary-shell",
    ]);
    assert.deepEqual(descriptor.layout.containerSources, [
      path.relative(tempRoot, path.join(surfaceRoot, "app", "layout.tsx")),
      path.relative(tempRoot, path.join(surfaceRoot, "app", "page.tsx")),
    ]);

    const fontValues = descriptor.fonts.map((font) => font.value).sort();
    assert.deepEqual(fontValues, ["Demo Sans", "monospace", "var(--font-demo)"]);

    const colorValues = descriptor.colors.map((color) => color.value).sort();
    assert.deepEqual(colorValues, [
      "#333333",
      "rgb(200, 200, 200)",
      "var(--color-background)",
      "var(--color-primary)",
    ]);

    assert.ok(descriptor.motion.length > 0, "expected motion descriptors");
    const durations = descriptor.motion.map((motion) => motion.durationMs);
    assert.ok(durations.includes(120), "should include duration from CSS variable");
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});


