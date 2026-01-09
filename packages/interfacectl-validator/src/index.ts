import AjvModule, { type ErrorObject } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  InterfaceContract,
  SurfaceDescriptor,
  SurfaceReport,
  ValidationSummary,
  DriftViolation,
  ContractSection,
  ContractSurface,
} from "./types.js";
import bundledSchema from "./schema/surfaces.web.contract.schema.json" with {
  type: "json",
};

const frozenBundledSchema = Object.freeze(bundledSchema) as object;

export function getBundledContractSchema(): object {
  return frozenBundledSchema;
}

export interface ContractStructureValidation {
  ok: boolean;
  errors: string[];
  contract?: InterfaceContract;
}

export function validateContractStructure(
  contractData: unknown,
  schema: object,
): ContractStructureValidation {
  const ajv = new (AjvModule as unknown as new (
    options?: Record<string, unknown>,
  ) => import("ajv").default)({
    allErrors: true,
    strict: false,
  });

  (addFormats as unknown as (ajv: import("ajv").default) => void)(ajv);

  const validate = ajv.compile<InterfaceContract>(schema);
  const valid = validate(contractData);

  if (!valid) {
    return {
      ok: false,
      errors: formatAjvErrors(validate.errors),
    };
  }

  return {
    ok: true,
    errors: [],
    contract: contractData as InterfaceContract,
  };
}

export function evaluateSurfaceCompliance(
  contract: InterfaceContract,
  descriptor: SurfaceDescriptor,
): SurfaceReport {
  const surface = findSurface(contract.surfaces, descriptor.surfaceId);
  const violations: DriftViolation[] = [];

  if (!surface) {
    violations.push({
      surfaceId: descriptor.surfaceId,
      type: "unknown-surface",
      message: `Surface "${descriptor.surfaceId}" is not defined in the contract.`,
    });
    return {
      surfaceId: descriptor.surfaceId,
      violations,
    };
  }

  const contractSections = buildSectionIndex(contract.sections);
  const descriptorSectionIds = new Set(
    descriptor.sections.map((section) => section.id),
  );

  for (const requiredSection of surface.requiredSections) {
    if (!descriptorSectionIds.has(requiredSection)) {
      violations.push({
        surfaceId: descriptor.surfaceId,
        type: "missing-section",
        message: `Required section "${requiredSection}" is missing for surface "${descriptor.surfaceId}".`,
        details: {
          sectionId: requiredSection,
          requiredSections: surface.requiredSections,
        },
      });
    }
  }

  for (const section of descriptor.sections) {
    if (!contractSections.has(section.id)) {
      violations.push({
        surfaceId: descriptor.surfaceId,
        type: "unknown-section",
        message: `Section "${section.id}" implemented by surface "${descriptor.surfaceId}" is not present in the contract.`,
        details: { sectionId: section.id, source: section.source },
      });
    }
  }

  const allowedFonts = new Set(surface.allowedFonts);
  for (const font of descriptor.fonts) {
    if (!allowedFonts.has(font.value)) {
      violations.push({
        surfaceId: descriptor.surfaceId,
        type: "font-not-allowed",
        message: `Font "${font.value}" is not allowed for surface "${descriptor.surfaceId}".`,
        details: {
          font: font.value,
          source: font.source,
          allowedFonts: [...allowedFonts],
        },
      });
    }
  }

  const allowedColors = new Set(surface.allowedColors);
  for (const color of descriptor.colors) {
    if (!allowedColors.has(color.value)) {
      violations.push({
        surfaceId: descriptor.surfaceId,
        type: "color-not-allowed",
        message: `Color "${color.value}" is not allowed for surface "${descriptor.surfaceId}".`,
        details: {
          color: color.value,
          source: color.source,
          allowedColors: [...allowedColors],
        },
      });
    }
  }

  const reportedWidth = descriptor.layout.maxContentWidth;
  if (reportedWidth === null || reportedWidth === undefined) {
    violations.push({
      surfaceId: descriptor.surfaceId,
      type: "layout-width-undetermined",
      message: `Max content width is not provided for surface "${descriptor.surfaceId}".`,
      details: {
        expectedMaxWidth: surface.layout.maxContentWidth,
        source: descriptor.layout.source,
      },
    });
  } else if (reportedWidth > surface.layout.maxContentWidth) {
    violations.push({
      surfaceId: descriptor.surfaceId,
      type: "layout-width-exceeded",
      message: `Max content width ${reportedWidth}px exceeds the contract limit of ${surface.layout.maxContentWidth}px for surface "${descriptor.surfaceId}".`,
      details: {
        reportedWidth,
        allowedWidth: surface.layout.maxContentWidth,
        source: descriptor.layout.source,
      },
    });
  }

  const configuredContainers = surface.layout.requiredContainers;
  const requiredContainers =
    configuredContainers === undefined
      ? ["contract-container"]
      : configuredContainers;

  if (requiredContainers.length > 0) {
    const descriptorContainers = new Set(descriptor.layout.containers ?? []);
    const missingContainers = requiredContainers.filter(
      (container) => !descriptorContainers.has(container),
    );

    if (missingContainers.length > 0) {
      violations.push({
        surfaceId: descriptor.surfaceId,
        type: "layout-container-missing",
        message: `Surface "${descriptor.surfaceId}" is missing required container(s): ${missingContainers
          .map((container) => `"${container}"`)
          .join(", ")}.`,
        details: {
          requiredContainers,
          missingContainers,
          containerSources: descriptor.layout.containerSources ?? [],
        },
      });
    }
  }

  const allowedDurations = new Set(
    contract.constraints.motion.allowedDurationsMs,
  );
  const allowedTimingFunctions = new Set(
    contract.constraints.motion.allowedTimingFunctions,
  );

  for (const motion of descriptor.motion) {
    if (!allowedDurations.has(motion.durationMs)) {
      violations.push({
        surfaceId: descriptor.surfaceId,
        type: "motion-duration-not-allowed",
        message: `Motion duration ${motion.durationMs}ms is not allowed for surface "${descriptor.surfaceId}".`,
        details: {
          durationMs: motion.durationMs,
          allowedDurations: [...allowedDurations],
          source: motion.source,
        },
      });
    }

    if (!allowedTimingFunctions.has(motion.timingFunction)) {
      violations.push({
        surfaceId: descriptor.surfaceId,
        type: "motion-timing-not-allowed",
        message: `Motion timing function "${motion.timingFunction}" is not allowed for surface "${descriptor.surfaceId}".`,
        details: {
          timingFunction: motion.timingFunction,
          allowedTimingFunctions: [...allowedTimingFunctions],
          source: motion.source,
        },
      });
    }
  }

  return {
    surfaceId: descriptor.surfaceId,
    violations,
  };
}

export function evaluateContractCompliance(
  contract: InterfaceContract,
  descriptors: SurfaceDescriptor[],
): ValidationSummary {
  const descriptorMap = new Map(
    descriptors.map((descriptor) => [descriptor.surfaceId, descriptor]),
  );

  const reports: SurfaceReport[] = contract.surfaces.map((surface) => {
    const descriptor = descriptorMap.get(surface.id);
    if (!descriptor) {
      return {
        surfaceId: surface.id,
        violations: [
          {
            surfaceId: surface.id,
            type: "descriptor-missing",
            message: `No descriptor provided for surface "${surface.id}".`,
            details: { requiredSections: surface.requiredSections },
          },
        ],
      };
    }
    return evaluateSurfaceCompliance(contract, descriptor);
  });

  for (const descriptor of descriptors) {
    const definedSurface = contract.surfaces.some(
      (surface) => surface.id === descriptor.surfaceId,
    );
    if (!definedSurface) {
      reports.push({
        surfaceId: descriptor.surfaceId,
        violations: [
          {
            surfaceId: descriptor.surfaceId,
            type: "descriptor-unused",
            message: `Descriptor provided for surface "${descriptor.surfaceId}" which is not present in the contract.`,
          },
        ],
      });
    }
  }

  return {
    contract,
    surfaceReports: reports,
  };
}

function formatAjvErrors(errors: ErrorObject[] | null | undefined): string[] {
  if (!errors) {
    return [];
  }

  return errors.map((error) => {
    const dataPath = error.instancePath || error.schemaPath;
    const baseMessage = error.message ?? "Validation error";
    if (error.params && Object.keys(error.params).length > 0) {
      return `${dataPath}: ${baseMessage} (${JSON.stringify(error.params)})`;
    }
    return `${dataPath}: ${baseMessage}`;
  });
}

function buildSectionIndex(
  sections: readonly ContractSection[],
): Set<string> {
  return new Set(sections.map((section) => section.id));
}

function findSurface(
  surfaces: readonly ContractSurface[],
  surfaceId: string,
): ContractSurface | undefined {
  return surfaces.find((surface) => surface.id === surfaceId);
}

export type {
  InterfaceContract,
  ContractSurface,
  ContractSection,
  ContractConstraints,
  SurfaceDescriptor,
  SurfaceSectionDescriptor,
  SurfaceFontDescriptor,
  SurfaceColorDescriptor,
  SurfaceMotionDescriptor,
  SurfaceLayoutDescriptor,
  SurfaceReport,
  DriftViolation,
  ValidationSummary,
  DriftViolationType,
} from "./types.js";

