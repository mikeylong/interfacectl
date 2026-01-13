export type SurfaceType = "web" | "cli";
export interface ContractSurface {
    id: string;
    displayName: string;
    type: SurfaceType;
    requiredSections: string[];
    allowedFonts: string[];
    allowedColors: string[];
    layout: {
        maxContentWidth: number;
        requiredContainers?: string[];
    };
}
export interface ContractSection {
    id: string;
    intent: string;
    description: string;
}
export interface ContractConstraints {
    motion: {
        allowedDurationsMs: number[];
        allowedTimingFunctions: string[];
    };
}
export interface InterfaceContract {
    contractId: string;
    version: string;
    description?: string;
    surfaces: ContractSurface[];
    sections: ContractSection[];
    constraints: ContractConstraints;
}
export interface SurfaceSectionDescriptor {
    id: string;
    source?: string;
}
export interface SurfaceFontDescriptor {
    value: string;
    source?: string;
}
export interface SurfaceColorDescriptor {
    value: string;
    source?: string;
}
export interface SurfaceMotionDescriptor {
    durationMs: number;
    timingFunction: string;
    source?: string;
}
export interface SurfaceLayoutDescriptor {
    maxContentWidth?: number | null;
    containers?: string[];
    containerSources?: string[];
    source?: string;
}
export interface SurfaceDescriptor {
    surfaceId: string;
    sections: SurfaceSectionDescriptor[];
    fonts: SurfaceFontDescriptor[];
    colors: SurfaceColorDescriptor[];
    layout: SurfaceLayoutDescriptor;
    motion: SurfaceMotionDescriptor[];
}
export type DriftViolationType = "unknown-surface" | "missing-section" | "unknown-section" | "font-not-allowed" | "color-not-allowed" | "layout-width-exceeded" | "layout-width-undetermined" | "layout-container-missing" | "motion-duration-not-allowed" | "motion-timing-not-allowed" | "descriptor-missing" | "descriptor-unused";
export interface DriftViolation {
    surfaceId: string;
    type: DriftViolationType;
    message: string;
    details?: Record<string, unknown>;
}
export interface SurfaceReport {
    surfaceId: string;
    violations: DriftViolation[];
}
export interface ValidationSummary {
    contract: InterfaceContract;
    surfaceReports: SurfaceReport[];
}
export type DiffChangeType = "added" | "removed" | "modified" | "renamed";
export type Severity = "error" | "warning" | "info";
export type SafetyLevel = "safe" | "mechanical" | "semantic";
export type EnforcementMode = "fail" | "fix" | "pr";
export interface DiffEntry {
    surfaceId?: string;
    type: DiffChangeType;
    path: string;
    contractValue?: unknown;
    observedValue?: unknown;
    severity: Severity;
    rule?: string;
    autofixable?: boolean;
    rename?: {
        fromPath: string;
        toPath: string;
        confidence: number;
    };
}
export interface DriftRisk {
    category: "diff-noise" | "semantic-ambiguity" | "enforcement-overreach" | "policy-drift" | "contract-evolution" | "observed-instability" | "rename-inflation" | "output-schema-drift" | "severity-inflation" | "local-ci-mismatch";
    severity: Severity;
    message: string;
    relatedPaths?: string[];
}
export interface DiffOutput {
    schemaVersion: string;
    tool: {
        name: "interfacectl";
        version: string;
    };
    policy?: {
        version: string;
        fingerprint: string;
    };
    contract: {
        path: string;
        version: string;
    };
    observed: {
        root: string;
        captureProfile?: Record<string, unknown>;
    };
    normalization: {
        enabled: boolean;
        reorderedPaths: string[];
        strippedPaths: string[];
    };
    summary: {
        totalChanges: number;
        byType: {
            added: number;
            removed: number;
            modified: number;
            renamed: number;
        };
        bySeverity: {
            error: number;
            warning: number;
            info: number;
        };
    };
    entries: DiffEntry[];
    driftRisks?: DriftRisk[];
    repro?: {
        command: string;
    };
}
export interface AutofixRule {
    id: string;
    pattern: string;
    autofixable: boolean;
    description: string;
    safetyLevel: SafetyLevel;
    setSeverity?: Severity;
}
export interface EnforcementPolicy {
    version: string;
    fingerprint: string;
    extends?: string;
    modes: {
        fail: {
            exitOnAny: boolean;
            severityThreshold: "error" | "warning";
        };
        fix: {
            rules: string[];
            dryRun: boolean;
        };
        pr: {
            patchFormat: "unified" | "json";
            outputPath?: string;
        };
    };
    autofixRules: AutofixRule[];
    budgets?: {
        maxTotalChanges?: number;
        maxBySeverity?: {
            error?: number;
            warning?: number;
            info?: number;
        };
    };
}
export interface FixEntry {
    ruleId: string;
    path: string;
    oldValue: unknown;
    newValue: unknown;
    confidence: number;
    file?: string;
    lineDelta?: number;
}
export interface FixError {
    ruleId: string;
    path: string;
    message: string;
}
export interface FixSummary {
    schemaVersion: string;
    mode: "fix" | "pr";
    policy: {
        version: string;
        fingerprint: string;
    };
    applied: FixEntry[];
    skipped: FixEntry[];
    errors: FixError[];
}
//# sourceMappingURL=types.d.ts.map