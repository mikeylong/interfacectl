import { createHash } from "node:crypto";

/**
 * Canonicalizes an object for fingerprinting by:
 * 1. Sorting all object keys alphabetically
 * 2. Recursively sorting nested objects and arrays
 * 3. Producing deterministic JSON string
 */
export function canonicalizeForFingerprint(obj: unknown): string {
  if (obj === null || obj === undefined) {
    return JSON.stringify(obj);
  }

  if (typeof obj === "string" || typeof obj === "number" || typeof obj === "boolean") {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    const canonicalized = obj.map(canonicalizeForFingerprint);
    return `[${canonicalized.join(",")}]`;
  }

  if (typeof obj === "object") {
    const sortedKeys = Object.keys(obj).sort();
    const entries = sortedKeys.map((key) => {
      const value = (obj as Record<string, unknown>)[key];
      // Skip fingerprint field itself when computing fingerprint
      if (key === "fingerprint") {
        return null;
      }
      return `"${key}":${canonicalizeForFingerprint(value)}`;
    });
    const filteredEntries = entries.filter((entry) => entry !== null);
    return `{${filteredEntries.join(",")}}`;
  }

  return JSON.stringify(obj);
}

/**
 * Computes SHA-256 fingerprint of a policy object.
 * The policy's own fingerprint field is excluded from the hash computation.
 */
export function fingerprintPolicy(policy: { fingerprint?: string; [key: string]: unknown }): string {
  const canonical = canonicalizeForFingerprint(policy);
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

/**
 * Computes SHA-256 fingerprint of a diff output object.
 */
export function fingerprintDiffOutput(output: Record<string, unknown>): string {
  const canonical = canonicalizeForFingerprint(output);
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}
