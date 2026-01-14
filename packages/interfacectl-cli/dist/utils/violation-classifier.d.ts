import type { DriftViolationType, DiffEntry, Severity } from "@surfaces/interfacectl-validator";
import type { ExitCodeVersion } from "./exit-codes.js";
export type ViolationCategory = "E0" | "E1" | "E2" | "E3";
/**
 * Classify a violation type into E1 (Token Policy) or E2 (Interface Contract).
 * E0 is handled separately in commands (artifact invalid).
 * E3 is determined by severity in diff command (all entries are info).
 */
export declare function classifyViolationType(type: DriftViolationType): "E1" | "E2";
/**
 * Get exit code for a violation category and version.
 */
export declare function getExitCodeForCategory(category: ViolationCategory, version: ExitCodeVersion): number;
/**
 * Get the maximum severity from diff entries.
 * Returns null if no entries.
 */
export declare function getMaxSeverity(entries: DiffEntry[]): Severity | null;
//# sourceMappingURL=violation-classifier.d.ts.map