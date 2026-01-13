import type { EnforcementPolicy } from "@surfaces/interfacectl-validator";
import { type ValidationResult } from "@surfaces/interfacectl-validator";
export interface PolicyLoadResult {
    ok: boolean;
    policy?: EnforcementPolicy;
    error?: string;
}
/**
 * Load and validate a policy file
 */
export declare function loadPolicy(policyPath: string, workspaceRoot: string): Promise<PolicyLoadResult>;
/**
 * Load default policy
 */
export declare function loadDefaultPolicy(): EnforcementPolicy;
/**
 * Validate policy structure
 */
export declare function validatePolicyStructure(policy: unknown): ValidationResult;
/**
 * Compute policy fingerprint
 */
export declare function computePolicyFingerprint(policy: EnforcementPolicy): string;
/**
 * Verify policy fingerprint matches content
 */
export declare function verifyPolicyFingerprint(policy: EnforcementPolicy): boolean;
/**
 * Resolve policy extends chain
 */
export declare function resolvePolicyExtends(base: string, workspaceRoot: string): Promise<EnforcementPolicy>;
//# sourceMappingURL=policy.d.ts.map