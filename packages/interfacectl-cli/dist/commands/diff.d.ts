type OutputFormat = "text" | "json";
export interface DiffCommandOptions {
    contractPath?: string;
    schemaPath?: string;
    workspaceRoot?: string;
    surfaceFilters?: string[];
    outputFormat?: OutputFormat;
    outputPath?: string;
    configPath?: string;
    configProvided?: boolean;
    normalize?: boolean;
    renameThreshold?: number;
    policyPath?: string;
}
export declare function runDiffCommand(options: DiffCommandOptions): Promise<number>;
export {};
//# sourceMappingURL=diff.d.ts.map