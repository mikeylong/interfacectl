import AjvModule, { type ErrorObject } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import diffSchema from "./schema/interfacectl.diff.schema.json" with { type: "json" };
import policySchema from "./schema/interfacectl.policy.schema.json" with { type: "json" };
import fixSummarySchema from "./schema/interfacectl.fix-summary.schema.json" with { type: "json" };

const frozenDiffSchema = Object.freeze(diffSchema) as object;
const frozenPolicySchema = Object.freeze(policySchema) as object;
const frozenFixSummarySchema = Object.freeze(fixSummarySchema) as object;

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

function createAjvValidator() {
  const ajv = new (AjvModule as unknown as new (
    options?: Record<string, unknown>,
  ) => import("ajv").default)({
    allErrors: true,
    strict: false,
  });
  (addFormats as unknown as (ajv: import("ajv").default) => void)(ajv);
  return ajv;
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

export function getBundledDiffSchema(): object {
  return frozenDiffSchema;
}

export function getBundledPolicySchema(): object {
  return frozenPolicySchema;
}

export function getBundledFixSummarySchema(): object {
  return frozenFixSummarySchema;
}

export function validateDiffOutput(
  data: unknown,
  schema: object = frozenDiffSchema,
): ValidationResult {
  const ajv = createAjvValidator();
  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (!valid) {
    return {
      ok: false,
      errors: formatAjvErrors(validate.errors),
    };
  }

  return {
    ok: true,
    errors: [],
  };
}

export function validatePolicy(
  data: unknown,
  schema: object = frozenPolicySchema,
): ValidationResult {
  const ajv = createAjvValidator();
  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (!valid) {
    return {
      ok: false,
      errors: formatAjvErrors(validate.errors),
    };
  }

  return {
    ok: true,
    errors: [],
  };
}

export function validateFixSummary(
  data: unknown,
  schema: object = frozenFixSummarySchema,
): ValidationResult {
  const ajv = createAjvValidator();
  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (!valid) {
    return {
      ok: false,
      errors: formatAjvErrors(validate.errors),
    };
  }

  return {
    ok: true,
    errors: [],
  };
}
