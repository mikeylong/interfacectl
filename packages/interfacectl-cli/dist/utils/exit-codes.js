/**
 * Shared utility for determining exit code version across all commands.
 * Prevents divergence between commands and ensures consistent behavior.
 */
/**
 * Get the active exit code version.
 * Priority:
 * 1. options.exitCodes (from CLI flag)
 * 2. INTERFACECTL_EXIT_CODES environment variable
 * 3. Default to "v1"
 */
export function getExitCodeVersion(options) {
    // Check CLI flag first
    if (options?.exitCodes === "v1" || options?.exitCodes === "v2") {
        return options.exitCodes;
    }
    // Fall back to environment variable
    const envValue = process.env.INTERFACECTL_EXIT_CODES;
    if (envValue === "v1" || envValue === "v2") {
        return envValue;
    }
    // Default to v1 for backward compatibility
    return "v1";
}
