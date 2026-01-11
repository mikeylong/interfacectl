import path from "node:path";
import { readFile } from "node:fs/promises";
import type { EnforcementPolicy } from "@surfaces/interfacectl-validator";
import { validatePolicy, type ValidationResult } from "@surfaces/interfacectl-validator";
import { fingerprintPolicy } from "./fingerprint.js";
import defaultPolicyRaw from "../policies/default.json" with { type: "json" };

export interface PolicyLoadResult {
  ok: boolean;
  policy?: EnforcementPolicy;
  error?: string;
}

/**
 * Load and validate a policy file
 */
export async function loadPolicy(
  policyPath: string,
  workspaceRoot: string,
): Promise<PolicyLoadResult> {
  try {
    const fullPath = path.isAbsolute(policyPath)
      ? policyPath
      : path.resolve(workspaceRoot, policyPath);
    const raw = await readFile(fullPath, "utf-8");
    const parsed = JSON.parse(raw) as unknown;

    const validation = validatePolicy(parsed);
    if (!validation.ok) {
      return {
        ok: false,
        error: `Policy validation failed: ${validation.errors.join(", ")}`,
      };
    }

    const policy = parsed as EnforcementPolicy;
    return { ok: true, policy };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        ok: false,
        error: `Policy file not found at ${policyPath}`,
      };
    }
    return {
      ok: false,
      error: `Failed to load policy: ${(error as Error).message}`,
    };
  }
}

/**
 * Load default policy
 */
export function loadDefaultPolicy(): EnforcementPolicy {
  const policy = defaultPolicyRaw as EnforcementPolicy;
  // Compute fingerprint at load time
  const computedFingerprint = fingerprintPolicy(policy as unknown as { fingerprint?: string; [key: string]: unknown });
  return {
    ...policy,
    fingerprint: computedFingerprint,
  };
}

/**
 * Validate policy structure
 */
export function validatePolicyStructure(
  policy: unknown,
): ValidationResult {
  return validatePolicy(policy);
}

/**
 * Compute policy fingerprint
 */
export function computePolicyFingerprint(policy: EnforcementPolicy): string {
  return fingerprintPolicy(policy as unknown as { fingerprint?: string; [key: string]: unknown });
}

/**
 * Verify policy fingerprint matches content
 */
export function verifyPolicyFingerprint(policy: EnforcementPolicy): boolean {
  const computed = computePolicyFingerprint(policy);
  return computed === policy.fingerprint;
}

/**
 * Resolve policy extends chain
 */
export async function resolvePolicyExtends(
  base: string,
  workspaceRoot: string,
): Promise<EnforcementPolicy> {
  // For now, just load the base policy
  // TODO: Implement extends resolution with merging
  const result = await loadPolicy(base, workspaceRoot);
  if (!result.ok || !result.policy) {
    throw new Error(`Failed to resolve policy extends: ${result.error}`);
  }
  return result.policy;
}
