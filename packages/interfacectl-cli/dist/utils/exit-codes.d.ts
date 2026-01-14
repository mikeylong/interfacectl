/**
 * Shared utility for determining exit code version across all commands.
 * Prevents divergence between commands and ensures consistent behavior.
 */
export type ExitCodeVersion = "v1" | "v2";
export interface ExitCodeOptions {
    exitCodes?: ExitCodeVersion;
}
/**
 * Get the active exit code version.
 * Priority:
 * 1. options.exitCodes (from CLI flag)
 * 2. INTERFACECTL_EXIT_CODES environment variable
 * 3. Default to "v1"
 */
export declare function getExitCodeVersion(options?: ExitCodeOptions): ExitCodeVersion;
//# sourceMappingURL=exit-codes.d.ts.map