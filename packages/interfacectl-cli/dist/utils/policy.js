import path from "node:path";
import { readFile } from "node:fs/promises";
import { validatePolicy } from "@surfaces/interfacectl-validator";
import { fingerprintPolicy } from "./fingerprint.js";
import defaultPolicyRaw from "../policies/default.json" with { type: "json" };
/**
 * Load and validate a policy file
 */
export async function loadPolicy(policyPath, workspaceRoot) {
    try {
        const fullPath = path.isAbsolute(policyPath)
            ? policyPath
            : path.resolve(workspaceRoot, policyPath);
        const raw = await readFile(fullPath, "utf-8");
        const parsed = JSON.parse(raw);
        const validation = validatePolicy(parsed);
        if (!validation.ok) {
            return {
                ok: false,
                error: `Policy validation failed: ${validation.errors.join(", ")}`,
            };
        }
        const policy = parsed;
        return { ok: true, policy };
    }
    catch (error) {
        if (error.code === "ENOENT") {
            return {
                ok: false,
                error: `Policy file not found at ${policyPath}`,
            };
        }
        return {
            ok: false,
            error: `Failed to load policy: ${error.message}`,
        };
    }
}
/**
 * Load default policy
 */
export function loadDefaultPolicy() {
    const policy = defaultPolicyRaw;
    // Compute fingerprint at load time
    const computedFingerprint = fingerprintPolicy(policy);
    return {
        ...policy,
        fingerprint: computedFingerprint,
    };
}
/**
 * Validate policy structure
 */
export function validatePolicyStructure(policy) {
    return validatePolicy(policy);
}
/**
 * Compute policy fingerprint
 */
export function computePolicyFingerprint(policy) {
    return fingerprintPolicy(policy);
}
/**
 * Verify policy fingerprint matches content
 */
export function verifyPolicyFingerprint(policy) {
    const computed = computePolicyFingerprint(policy);
    return computed === policy.fingerprint;
}
/**
 * Resolve policy extends chain
 */
export async function resolvePolicyExtends(base, workspaceRoot) {
    // For now, just load the base policy
    // TODO: Implement extends resolution with merging
    const result = await loadPolicy(base, workspaceRoot);
    if (!result.ok || !result.policy) {
        throw new Error(`Failed to resolve policy extends: ${result.error}`);
    }
    return result.policy;
}
