import AjvModule from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import diffSchema from "./schema/interfacectl.diff.schema.json" with { type: "json" };
import policySchema from "./schema/interfacectl.policy.schema.json" with { type: "json" };
import fixSummarySchema from "./schema/interfacectl.fix-summary.schema.json" with { type: "json" };
const frozenDiffSchema = Object.freeze(diffSchema);
const frozenPolicySchema = Object.freeze(policySchema);
const frozenFixSummarySchema = Object.freeze(fixSummarySchema);
function createAjvValidator() {
    const ajv = new AjvModule({
        allErrors: true,
        strict: false,
    });
    addFormats(ajv);
    return ajv;
}
function formatAjvErrors(errors) {
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
export function getBundledDiffSchema() {
    return frozenDiffSchema;
}
export function getBundledPolicySchema() {
    return frozenPolicySchema;
}
export function getBundledFixSummarySchema() {
    return frozenFixSummarySchema;
}
export function validateDiffOutput(data, schema = frozenDiffSchema) {
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
export function validatePolicy(data, schema = frozenPolicySchema) {
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
export function validateFixSummary(data, schema = frozenFixSummarySchema) {
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
