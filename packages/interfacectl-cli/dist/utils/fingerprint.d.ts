/**
 * Canonicalizes an object for fingerprinting by:
 * 1. Sorting all object keys alphabetically
 * 2. Recursively sorting nested objects and arrays
 * 3. Producing deterministic JSON string
 */
export declare function canonicalizeForFingerprint(obj: unknown): string;
/**
 * Computes SHA-256 fingerprint of a policy object.
 * The policy's own fingerprint field is excluded from the hash computation.
 */
export declare function fingerprintPolicy(policy: {
    fingerprint?: string;
    [key: string]: unknown;
}): string;
/**
 * Computes SHA-256 fingerprint of a diff output object.
 */
export declare function fingerprintDiffOutput(output: Record<string, unknown>): string;
//# sourceMappingURL=fingerprint.d.ts.map