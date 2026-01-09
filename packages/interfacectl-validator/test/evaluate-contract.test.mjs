import { test } from "node:test";
import assert from "node:assert/strict";

import {
  evaluateSurfaceCompliance,
  evaluateContractCompliance,
} from "../dist/index.js";

const baseContract = {
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
      allowedTimingFunctions: ["linear"],
    },
  },
};

test("defaults to contract-container when requiredContainers omitted", () => {
  const contract = {
    ...baseContract,
      surfaces: [
        {
          id: "surface-a",
          displayName: "Surface A",
          type: "web",
          requiredSections: ["main.hero"],
          allowedFonts: ["var(--font-a)"],
          allowedColors: ["var(--color-primary)"],
          layout: {
            maxContentWidth: 960,
          },
        },
      ],
  };

  const descriptor = {
    surfaceId: "surface-a",
    sections: [{ id: "main.hero" }],
    fonts: [{ value: "var(--font-a)" }],
    colors: [{ value: "var(--color-primary)" }],
    layout: {
      maxContentWidth: 920,
      containers: ["contract-container"],
      containerSources: ["apps/surface-a/app/page.tsx"],
    },
    motion: [
      {
        durationMs: 120,
        timingFunction: "linear",
        source: "apps/surface-a/app/globals.css",
      },
    ],
  };

  const report = evaluateSurfaceCompliance(contract, descriptor);
  assert.equal(report.violations.length, 0);
});

test("reports missing custom required containers", () => {
  const contract = {
    ...baseContract,
      surfaces: [
        {
          id: "surface-b",
          displayName: "Surface B",
          type: "web",
          requiredSections: ["main.hero"],
          allowedFonts: ["var(--font-b)"],
          allowedColors: ["var(--color-b)"],
          layout: {
            maxContentWidth: 960,
            requiredContainers: ["primary-shell", "contract-container"],
          },
        },
      ],
  };

  const descriptor = {
    surfaceId: "surface-b",
    sections: [{ id: "main.hero" }],
    fonts: [{ value: "var(--font-b)" }],
    colors: [{ value: "var(--color-b)" }],
    layout: {
      maxContentWidth: 960,
      containers: ["primary-shell"],
      containerSources: ["apps/surface-b/app/page.tsx"],
    },
    motion: [],
  };

  const summary = evaluateContractCompliance(contract, [descriptor]);
  const violations = summary.surfaceReports[0]?.violations ?? [];
  assert.equal(violations.length, 1, "expected one violation");
  const [violation] = violations;
  assert.equal(violation.type, "layout-container-missing");
  assert.deepEqual(violation.details?.requiredContainers, [
    "primary-shell",
    "contract-container",
  ]);
  assert.deepEqual(violation.details?.missingContainers, [
    "contract-container",
  ]);
});

test("captures layout width and motion violations", () => {
  const contract = {
    ...baseContract,
      surfaces: [
        {
          id: "surface-c",
          displayName: "Surface C",
          type: "web",
          requiredSections: ["main.hero"],
          allowedFonts: ["var(--font-c)"],
          allowedColors: ["var(--color-c)"],
          layout: {
            maxContentWidth: 720,
            requiredContainers: [],
          },
        },
      ],
  };

  const descriptor = {
    surfaceId: "surface-c",
    sections: [{ id: "main.hero" }],
    fonts: [{ value: "var(--font-c)" }],
    colors: [{ value: "var(--color-disallowed)" }],
    layout: {
      maxContentWidth: 960,
      containers: [],
    },
    motion: [
      {
        durationMs: 300,
        timingFunction: "ease",
        source: "apps/surface-c/app/globals.css",
      },
    ],
  };

  const report = evaluateSurfaceCompliance(contract, descriptor);
  const violationTypes = report.violations.map((violation) => violation.type);
  assert.deepEqual(
    violationTypes.sort(),
    ["color-not-allowed", "layout-width-exceeded", "motion-duration-not-allowed", "motion-timing-not-allowed"].sort(),
  );
  
  const colorViolation = report.violations.find((v) => v.type === "color-not-allowed");
  assert.ok(colorViolation, "should have color violation");
  assert.equal(colorViolation.details?.color, "var(--color-disallowed)");
});


