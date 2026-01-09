#!/usr/bin/env node
import { Command } from "commander";
import { runValidateCommand } from "./commands/validate.js";
import pkg from "../package.json" with { type: "json" };
const program = new Command();
program
    .name("interfacectl")
    .description("Interface contract tooling for Surfaces")
    .version(pkg.version ?? "0.0.0");
program
    .command("validate")
    .description("Validate configured surfaces against the shared interface contract")
    .option("--contract <path>", "Path to the contract JSON file")
    .option("--schema <path>", "Optional path to the contract schema JSON file")
    .option("--config <path>", "Optional path to the interfacectl config JSON file (defaults to interfacectl.config.json)")
    .option("--root <path>", "Project root (defaults to current working directory)")
    .option("--workspace-root <path>", "Workspace root (defaults to current working directory)")
    .option("--surface <id...>", "Limit validation to the provided surface identifiers")
    .option("--json", "Emit machine-readable JSON instead of human-readable text output")
    .option("--format <format>", "Output format (text|json)")
    .option("--out <path>", "Write output to the provided file path instead of stdout")
    .action(async (options) => {
    const env = process.env;
    const requestedRoot = options.root ?? options.workspaceRoot ?? env.SURFACES_ROOT;
    const workspaceRoot = typeof requestedRoot === "string" && requestedRoot.length > 0
        ? requestedRoot
        : undefined;
    const requestedContract = options.contract ?? env.SURFACES_CONTRACT ?? undefined;
    const contractPath = typeof requestedContract === "string" && requestedContract.length > 0
        ? requestedContract
        : "contracts/surfaces.web.contract.json";
    const requestedConfig = options.config ?? env.SURFACES_CONFIG ?? undefined;
    const formatInput = (options.format ?? (options.json ? "json" : undefined))?.toLowerCase();
    const outputFormat = formatInput === "json" ? "json" : formatInput === "text" ? "text" : "text";
    if (formatInput &&
        formatInput !== "text" &&
        formatInput !== "json") {
        console.error(`Invalid format "${options.format}". Expected "text" or "json".`);
        process.exitCode = 1;
        return;
    }
    const exitCode = await runValidateCommand({
        contractPath,
        schemaPath: options.schema,
        workspaceRoot,
        surfaceFilters: options.surface ?? [],
        outputFormat,
        outputPath: options.out,
        configPath: requestedConfig,
        configProvided: Boolean(requestedConfig),
    });
    process.exitCode = exitCode;
});
program.parseAsync(process.argv).catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
