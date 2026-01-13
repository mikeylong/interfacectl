import type { InterfaceContract, SurfaceDescriptor } from "@surfaces/interfacectl-validator";
export interface NormalizationMetadata {
    reorderedPaths: string[];
    strippedPaths: string[];
}
export interface NormalizedContract {
    contract: InterfaceContract;
    metadata: NormalizationMetadata;
}
export interface NormalizedDescriptor {
    descriptor: SurfaceDescriptor;
    metadata: NormalizationMetadata;
}
/**
 * Sort a set-like array (treats array as a set, sorts for determinism)
 */
export declare function normalizeSetField<T>(arr: T[]): T[];
/**
 * Strip ephemeral fields from an object (only for observed artifacts)
 * Returns a new object without the ephemeral fields
 */
export declare function stripEphemeralFields(obj: unknown, pathPrefix?: string, strippedPaths?: string[]): {
    result: unknown;
    strippedPaths: string[];
};
/**
 * Normalize a contract to canonical form
 * - Sorts set-like arrays
 * - Does NOT strip ephemeral fields (contracts are source of truth)
 */
export declare function normalizeContract(contract: InterfaceContract): NormalizedContract;
/**
 * Normalize a descriptor to canonical form
 * - Sorts set-like arrays
 * - Strips ephemeral fields (source, containerSources, etc.)
 */
export declare function normalizeDescriptor(descriptor: SurfaceDescriptor): NormalizedDescriptor;
/**
 * Canonicalize JSON for deterministic serialization
 * Sorts keys and ensures consistent formatting
 */
export declare function canonicalizeJson(value: unknown): string;
//# sourceMappingURL=normalize.d.ts.map