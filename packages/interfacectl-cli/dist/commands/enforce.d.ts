import { EnforcementMode } from "@surfaces/interfacectl-validator";
type OutputFormat = "text" | "json";
export interface EnforceCommandOptions {
    mode?: EnforcementMode;
    strict?: boolean;
    policyPath?: string;
    contractPath?: string;
    workspaceRoot?: string;
    surfaceFilters?: string[];
    outputFormat?: OutputFormat;
    outputPath?: string;
    configPath?: string;
    configProvided?: boolean;
    dryRun?: boolean;
}
export declare function runEnforceCommand(options: EnforceCommandOptions): Promise<number>;
export {};
//# sourceMappingURL=enforce.d.ts.map