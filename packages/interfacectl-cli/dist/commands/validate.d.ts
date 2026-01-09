type OutputFormat = "text" | "json";
export interface ValidateCommandOptions {
    contractPath?: string;
    schemaPath?: string;
    workspaceRoot?: string;
    surfaceFilters?: string[];
    outputFormat?: OutputFormat;
    outputPath?: string;
    configPath?: string;
    configProvided?: boolean;
}
export declare function runValidateCommand(options: ValidateCommandOptions): Promise<number>;
export {};
//# sourceMappingURL=validate.d.ts.map