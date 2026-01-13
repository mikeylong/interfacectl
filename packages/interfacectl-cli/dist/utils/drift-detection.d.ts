import type { DiffEntry, DiffOutput, EnforcementPolicy, InterfaceContract, SurfaceDescriptor, DriftRisk, FixEntry } from "@surfaces/interfacectl-validator";
/**
 * 1. Diff noise detection: Filter reorder-only, formatting-only changes
 */
export declare function detectDiffNoise(entries: DiffEntry[]): DiffEntry[];
/**
 * 2. Semantic ambiguity: Ensure every diff entry has a rule/clause reference
 */
export declare function validateSemanticClarity(entry: DiffEntry): boolean;
/**
 * 3. Enforcement overreach: Prevent semantic changes in autofixes
 */
export declare function checkEnforcementOverreach(fix: FixEntry): boolean;
/**
 * 4. Policy drift: Verify policy fingerprint matches content
 */
export declare function validatePolicyVersion(policy: EnforcementPolicy): boolean;
/**
 * 5. Contract evolution: Contract changes should be diffable
 * (This would compare two contract versions, not implemented here as it's for contract-to-contract diffing)
 */
export declare function detectContractEvolution(oldContract: InterfaceContract, newContract: InterfaceContract): DiffEntry[];
/**
 * 6. Observed instability: Validate descriptors before diffing
 */
export declare function validateObservedStability(descriptor: SurfaceDescriptor): boolean;
/**
 * 7. Rename inflation: Avoid delete+add when rename is likely
 */
export declare function detectRenameInflation(oldPaths: string[], newPaths: string[]): boolean;
/**
 * 8. Output schema drift: Validate output schema version
 */
export declare function validateOutputSchema(output: DiffOutput, schemaVersion: string): boolean;
/**
 * 9. Severity inflation: Policy should control thresholds, not hardcoded
 */
export declare function checkSeverityInflation(entries: DiffEntry[], policy?: EnforcementPolicy): boolean;
/**
 * 10. Local vs CI mismatch: Ensure repro command exists
 */
export declare function ensureReproCommand(output: DiffOutput, workspaceRoot: string): DiffOutput;
/**
 * Main function: Detect all drift risks
 */
export declare function detectAllDriftRisks(diff: DiffOutput, policy?: EnforcementPolicy): DriftRisk[];
//# sourceMappingURL=drift-detection.d.ts.map