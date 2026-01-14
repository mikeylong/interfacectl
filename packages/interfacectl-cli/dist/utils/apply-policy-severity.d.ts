import type { DiffEntry, EnforcementPolicy } from "@surfaces/interfacectl-validator";
/**
 * Apply policy severity overrides to diff entries.
 * This function is deterministic and MUST run before noise filtering.
 *
 * Order: generate entries → apply policy overrides → filter noise → compute exit code.
 *
 * Match semantics: Last match wins (iterate through all rules, later rules override earlier ones).
 * Severity overrides: Allow both upgrades and downgrades (error→warning→info and reverse).
 */
export declare function applyPolicySeverityOverrides(entries: DiffEntry[], policy?: EnforcementPolicy): DiffEntry[];
//# sourceMappingURL=apply-policy-severity.d.ts.map