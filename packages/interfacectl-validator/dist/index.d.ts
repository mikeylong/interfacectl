import { InterfaceContract, SurfaceDescriptor, SurfaceReport, ValidationSummary } from "./types.js";
export declare function getBundledContractSchema(): object;
export interface ContractStructureValidation {
    ok: boolean;
    errors: string[];
    contract?: InterfaceContract;
}
export declare function validateContractStructure(contractData: unknown, schema: object): ContractStructureValidation;
export declare function evaluateSurfaceCompliance(contract: InterfaceContract, descriptor: SurfaceDescriptor): SurfaceReport;
export declare function evaluateContractCompliance(contract: InterfaceContract, descriptors: SurfaceDescriptor[]): ValidationSummary;
export type { InterfaceContract, ContractSurface, ContractSection, ContractConstraints, SurfaceDescriptor, SurfaceSectionDescriptor, SurfaceFontDescriptor, SurfaceMotionDescriptor, SurfaceLayoutDescriptor, SurfaceReport, DriftViolation, ValidationSummary, DriftViolationType, } from "./types.js";
//# sourceMappingURL=index.d.ts.map