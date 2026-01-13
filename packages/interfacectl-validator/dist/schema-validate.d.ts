export interface ValidationResult {
    ok: boolean;
    errors: string[];
}
export declare function getBundledDiffSchema(): object;
export declare function getBundledPolicySchema(): object;
export declare function getBundledFixSummarySchema(): object;
export declare function validateDiffOutput(data: unknown, schema?: object): ValidationResult;
export declare function validatePolicy(data: unknown, schema?: object): ValidationResult;
export declare function validateFixSummary(data: unknown, schema?: object): ValidationResult;
//# sourceMappingURL=schema-validate.d.ts.map