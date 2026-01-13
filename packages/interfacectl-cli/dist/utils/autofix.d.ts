import type { DiffEntry, AutofixRule, FixEntry } from "@surfaces/interfacectl-validator";
/**
 * Check if a diff entry can be autofixed based on a rule
 */
export declare function canAutofix(entry: DiffEntry, rule: AutofixRule): boolean;
/**
 * Match a path against a rule pattern
 * Supports simple glob patterns: * for any, ** for recursive
 */
export declare function matchRulePattern(path: string, pattern: string): boolean;
/**
 * Apply a fix based on a diff entry and rule
 * Returns the fix entry or null if fix cannot be applied
 */
export declare function applyFix(entry: DiffEntry, rule: AutofixRule): FixEntry | null;
/**
 * Validate that a fix is reversible and mechanical
 */
export declare function validateFix(fix: FixEntry): boolean;
/**
 * Compute fix confidence score
 */
export declare function computeFixConfidence(fix: FixEntry): number;
//# sourceMappingURL=autofix.d.ts.map