import type { FixEntry } from "@surfaces/interfacectl-validator";
export interface FileMutationResult {
    path: string;
    success: boolean;
    error?: string;
}
/**
 * Apply fixes to files
 * Note: This is a placeholder - actual file mutation would require
 * parsing and modifying source files, which is complex and requires
 * more context about file structure
 */
export declare function applyFixesToFiles(fixes: FixEntry[], workspaceRoot: string): Promise<FileMutationResult[]>;
/**
 * Generate unified diff format
 */
export declare function generateUnifiedPatch(fixes: FixEntry[], workspaceRoot: string): string;
/**
 * Generate JSON Patch format (RFC 6902)
 */
export declare function generateJsonPatch(fixes: FixEntry[]): unknown;
//# sourceMappingURL=file-mutator.d.ts.map