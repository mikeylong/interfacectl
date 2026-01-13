import type { DiffEntry, DiffChangeType } from "@surfaces/interfacectl-validator";
import type { NormalizedContract, NormalizedDescriptor } from "./normalize.js";
/**
 * Build a stable JSON Pointer-style path
 */
export declare function buildDiffPath(prefix: string, field: string, index?: number): string;
/**
 * Classify a change based on contract and observed values
 */
export declare function classifyChange(contractVal: unknown, observedVal: unknown): DiffChangeType;
/**
 * Detect potential renames by comparing old and new paths/IDs
 * Returns pairs with confidence scores
 */
export declare function detectRename(oldPaths: string[], newPaths: string[], threshold?: number): Array<{
    old: string;
    new: string;
    confidence: number;
}>;
/**
 * Compare a normalized contract against a normalized descriptor for a specific surface
 */
export declare function compareContractToDescriptor(contract: NormalizedContract, descriptor: NormalizedDescriptor, surfaceId: string): DiffEntry[];
//# sourceMappingURL=compare.d.ts.map