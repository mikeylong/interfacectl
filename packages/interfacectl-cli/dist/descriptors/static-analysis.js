import path from "node:path";
import { readFile, stat } from "node:fs/promises";
import { globby } from "globby";
const SECTION_ATTRIBUTE_REGEX = /data-(?:contract-)?section\s*=\s*(?:"([^"]+)"|'([^']+)'|{`([^`]+)`}|{\s*["'`]([^"'`]+)["'`]\s*})/g;
const CONTAINER_ATTRIBUTE_REGEX = /data-contract-container\s*=\s*(?:"([^"]+)"|'([^']+)'|{`([^`]+)`}|{\s*["'`]([^"'`]+)["'`]\s*})/g;
const CONTRACT_CONTAINER_TOKEN = "contract-container";
const COMMON_GLOBBY_IGNORES = [
    "**/node_modules/**",
    "**/.next/**",
    "**/dist/**",
    "**/.turbo/**",
    "**/__tests__/**",
    "**/?(*.)+(spec|test).[tj]s?(x)",
];
const FONT_VAR_REGEX = /var\((--font-[a-z0-9-]+)\)/gi;
const FONT_FAMILY_REGEX = /font-family\s*:\s*([^;]+);/gi;
const MAX_WIDTH_VAR_REGEX = /--contract-max-width\s*:\s*([0-9.]+)\s*(px|rem|em)/i;
const MOTION_DURATION_VAR_REGEX = /--contract-motion-duration\s*:\s*([0-9.]+)\s*(ms|s)/i;
const MOTION_TIMING_VAR_REGEX = /--contract-motion-timing\s*:\s*([a-z-]+)\s*;/i;
const TRANSITION_DECL_REGEX = /transition[^:]*:\s*([^;]+);/gi;
const DURATION_DECL_REGEX = /(animation|transition)-duration\s*:\s*([^;]+);/gi;
const TIMING_DECL_REGEX = /(animation|transition)-timing-function\s*:\s*([^;]+);/gi;
export async function collectSurfaceDescriptors(options) {
    const structuralDescriptors = [];
    const warnings = [];
    const errors = [];
    for (const surface of options.contract.surfaces) {
        if (options.surfaceFilters.size > 0 &&
            !options.surfaceFilters.has(surface.id)) {
            continue;
        }
        const surfaceRoot = resolveSurfaceRoot(options.workspaceRoot, surface, options.surfaceRootMap);
        if (!(await pathExists(surfaceRoot))) {
            errors.push({
                surfaceId: surface.id,
                code: "surface.missing",
                message: `Surface "${surface.id}" expected at ${surfaceRoot} but directory was not found.`,
                location: surfaceRoot,
            });
            continue;
        }
        const descriptorResult = await extractSurfaceDescriptor(options.workspaceRoot, surfaceRoot, surface.id);
        structuralDescriptors.push(descriptorResult.descriptor);
        warnings.push(...descriptorResult.warnings);
        errors.push(...descriptorResult.errors);
    }
    return { descriptors: structuralDescriptors, warnings, errors };
}
function resolveSurfaceRoot(workspaceRoot, surface, surfaceRootMap) {
    const configuredRoot = surfaceRootMap.get(surface.id);
    if (configuredRoot) {
        return path.resolve(workspaceRoot, configuredRoot);
    }
    return path.join(workspaceRoot, "apps", surface.id);
}
async function extractSurfaceDescriptor(workspaceRoot, surfaceRoot, surfaceId) {
    const warnings = [];
    const errors = [];
    const sectionFiles = await globby(["app/**/*.{ts,tsx,js,jsx}"], {
        cwd: surfaceRoot,
        absolute: true,
        gitignore: true,
        ignore: COMMON_GLOBBY_IGNORES,
    });
    const fileContentCache = new Map();
    const sections = await extractSections(sectionFiles, workspaceRoot, fileContentCache);
    if (sections.length === 0) {
        warnings.push({
            surfaceId,
            code: "sections.none-detected",
            message: `No sections discovered for surface "${surfaceId}". Ensure elements include data-contract-section attributes.`,
        });
    }
    const layoutCssFiles = await globby(["app/**/*.css"], {
        cwd: surfaceRoot,
        absolute: true,
        gitignore: true,
        ignore: COMMON_GLOBBY_IGNORES,
    });
    const layout = await extractLayout(layoutCssFiles, sectionFiles, workspaceRoot, fileContentCache);
    const fonts = await extractFonts(surfaceRoot, sectionFiles, workspaceRoot, fileContentCache);
    if (fonts.length === 0) {
        const globalsPath = path.join(surfaceRoot, "app", "globals.css");
        warnings.push({
            surfaceId,
            code: "fonts.none-detected",
            message: `No fonts detected for surface "${surfaceId}". Verify font variables in layout.tsx or CSS font declarations.`,
            location: (await pathExists(globalsPath))
                ? path.relative(workspaceRoot, globalsPath)
                : undefined,
        });
    }
    const motion = await extractMotion(layoutCssFiles, workspaceRoot, fileContentCache);
    if (motion.length === 0) {
        warnings.push({
            surfaceId,
            code: "motion.none-detected",
            message: `No motion declarations detected for surface "${surfaceId}".`,
        });
    }
    const structuralSurfaceDescriptor = {
        surfaceId,
        sections,
        fonts,
        layout,
        motion,
    };
    return { descriptor: structuralSurfaceDescriptor, warnings, errors };
}
async function extractSections(filePaths, workspaceRoot, fileContentCache) {
    const sections = new Map();
    for (const filePath of filePaths) {
        const source = path.relative(workspaceRoot, filePath);
        const content = await readFileCached(filePath, fileContentCache);
        let match;
        while ((match = SECTION_ATTRIBUTE_REGEX.exec(content)) !== null) {
            const id = match[1] ?? match[2] ?? match[3] ?? match[4] ?? "";
            if (!id) {
                continue;
            }
            if (!sections.has(id)) {
                sections.set(id, {
                    id,
                    source,
                });
            }
        }
    }
    return [...sections.values()].sort((a, b) => a.id.localeCompare(b.id));
}
async function extractFonts(surfaceRoot, sectionFiles, workspaceRoot, fileContentCache) {
    const fontValues = new Map();
    const layoutPath = path.join(surfaceRoot, "app", "layout.tsx");
    if (await pathExists(layoutPath)) {
        const layoutContent = await readFileCached(layoutPath, fileContentCache);
        collectFontsFromContent(layoutContent, path.relative(workspaceRoot, layoutPath), fontValues);
    }
    const globalsPath = path.join(surfaceRoot, "app", "globals.css");
    if (await pathExists(globalsPath)) {
        const globalsContent = await readFileCached(globalsPath, fileContentCache);
        collectFontsFromContent(globalsContent, path.relative(workspaceRoot, globalsPath), fontValues);
    }
    for (const sectionFile of sectionFiles) {
        const content = await readFileCached(sectionFile, fileContentCache);
        collectFontsFromContent(content, path.relative(workspaceRoot, sectionFile), fontValues);
    }
    return [...fontValues.values()].sort((a, b) => a.value.localeCompare(b.value));
}
async function extractLayout(cssFilePaths, sectionFiles, workspaceRoot, fileContentCache) {
    let maxWidth = null;
    let layoutSource;
    for (const cssPath of cssFilePaths) {
        const cssContent = await readFileCached(cssPath, fileContentCache);
        const match = cssContent.match(MAX_WIDTH_VAR_REGEX);
        if (match) {
            const [, value, unit] = match;
            const numericValue = Number.parseFloat(value);
            if (Number.isFinite(numericValue) && unit.toLowerCase() === "px") {
                maxWidth = numericValue;
                layoutSource = path.relative(workspaceRoot, cssPath);
                break;
            }
        }
    }
    const containerSources = new Set();
    const containers = new Set();
    for (const filePath of sectionFiles) {
        const content = await readFileCached(filePath, fileContentCache);
        const detectedContainers = collectContainersFromContent(content);
        if (detectedContainers.size > 0) {
            for (const container of detectedContainers) {
                containers.add(container);
            }
            containerSources.add(path.relative(workspaceRoot, filePath));
        }
    }
    return {
        maxContentWidth: maxWidth,
        containers: [...containers].sort(),
        containerSources: [...containerSources].sort(),
        source: layoutSource,
    };
}
async function extractMotion(cssFilePaths, workspaceRoot, fileContentCache) {
    const motions = new Map();
    const durationVariables = new Map();
    let defaultTiming;
    for (const cssPath of cssFilePaths) {
        const cssContent = await readFileCached(cssPath, fileContentCache);
        const durationVarMatch = cssContent.match(MOTION_DURATION_VAR_REGEX);
        if (durationVarMatch) {
            const [, value, unit] = durationVarMatch;
            const durationMs = parseDurationToMs(value, unit);
            if (durationMs !== null) {
                durationVariables.set("--contract-motion-duration", durationMs);
            }
        }
        const timingVarMatch = cssContent.match(MOTION_TIMING_VAR_REGEX);
        if (timingVarMatch) {
            defaultTiming = timingVarMatch[1];
        }
    }
    for (const cssPath of cssFilePaths) {
        const cssContent = await readFileCached(cssPath, fileContentCache);
        const relative = path.relative(workspaceRoot, cssPath);
        let match;
        while ((match = DURATION_DECL_REGEX.exec(cssContent)) !== null) {
            const [, , value] = match;
            const durations = parseDurationExpressions(value, durationVariables);
            for (const duration of durations) {
                const key = toMotionKey(duration, defaultTiming ?? "linear");
                if (!motions.has(key)) {
                    motions.set(key, {
                        durationMs: duration,
                        timingFunction: defaultTiming ?? "linear",
                        source: relative,
                    });
                }
            }
        }
        while ((match = TRANSITION_DECL_REGEX.exec(cssContent)) !== null) {
            const [, value] = match;
            const durations = parseDurationExpressions(value, durationVariables);
            const timingFunctions = parseTimingFunctions(value, defaultTiming);
            for (const duration of durations) {
                for (const timing of timingFunctions) {
                    const key = toMotionKey(duration, timing);
                    if (!motions.has(key)) {
                        motions.set(key, {
                            durationMs: duration,
                            timingFunction: timing,
                            source: relative,
                        });
                    }
                }
            }
        }
        while ((match = TIMING_DECL_REGEX.exec(cssContent)) !== null) {
            const [, , value] = match;
            const timingFunctions = parseTimingFunctions(value, defaultTiming);
            for (const timing of timingFunctions) {
                const key = toMotionKey(durationVariables.get("--contract-motion-duration") ?? 0, timing);
                if (!motions.has(key)) {
                    motions.set(key, {
                        durationMs: durationVariables.get("--contract-motion-duration") ?? 0,
                        timingFunction: timing,
                        source: relative,
                    });
                }
            }
        }
    }
    return [...motions.values()].filter((motion) => motion.durationMs > 0);
}
function collectFontsFromContent(content, source, fontValues) {
    let match;
    while ((match = FONT_VAR_REGEX.exec(content)) !== null) {
        const variable = `var(${match[1]})`;
        if (!fontValues.has(variable)) {
            fontValues.set(variable, { value: variable, source });
        }
    }
    while ((match = FONT_FAMILY_REGEX.exec(content)) !== null) {
        const families = match[1]
            .split(",")
            .map((token) => token.trim().replace(/^["']|["']$/g, ""))
            .filter(Boolean);
        for (const family of families) {
            if (!fontValues.has(family)) {
                fontValues.set(family, { value: family, source });
            }
        }
    }
}
function collectContainersFromContent(content) {
    const containers = new Set();
    let match;
    while ((match = CONTAINER_ATTRIBUTE_REGEX.exec(content)) !== null) {
        const raw = match[1] ?? match[2] ?? match[3] ?? match[4] ?? "";
        if (!raw) {
            continue;
        }
        for (const token of raw.split(/\s+/).filter(Boolean)) {
            containers.add(token);
        }
    }
    if (content.includes(CONTRACT_CONTAINER_TOKEN)) {
        containers.add(CONTRACT_CONTAINER_TOKEN);
    }
    return containers;
}
async function readFileCached(filePath, cache) {
    const cached = cache.get(filePath);
    if (cached !== undefined) {
        return cached;
    }
    const contents = await readFile(filePath, "utf-8");
    cache.set(filePath, contents);
    return contents;
}
async function pathExists(filePath) {
    try {
        await stat(filePath);
        return true;
    }
    catch {
        return false;
    }
}
function parseDurationToMs(value, unit) {
    const numericValue = Number.parseFloat(value);
    if (!Number.isFinite(numericValue)) {
        return null;
    }
    if (unit.toLowerCase() === "ms") {
        return numericValue;
    }
    if (unit.toLowerCase() === "s") {
        return numericValue * 1000;
    }
    return null;
}
function parseDurationExpressions(expression, durationVariables) {
    const results = [];
    const tokens = expression.split(/[, ]+/).filter(Boolean);
    for (const token of tokens) {
        const variableMatch = token.match(/var\((--[a-z0-9-]+)\)/i);
        if (variableMatch) {
            const variableName = variableMatch[1];
            const value = durationVariables.get(variableName);
            if (value !== undefined) {
                results.push(value);
            }
            continue;
        }
        const directMatch = token.match(/^([0-9.]+)(ms|s)$/i);
        if (directMatch) {
            const [, value, unit] = directMatch;
            const duration = parseDurationToMs(value, unit);
            if (duration !== null) {
                results.push(duration);
            }
        }
    }
    return results;
}
function parseTimingFunctions(expression, fallback) {
    const results = new Set();
    const tokens = expression.split(/[, ]+/).filter(Boolean);
    for (const token of tokens) {
        if (token.startsWith("var(")) {
            continue;
        }
        if (isTimingFunction(token)) {
            results.add(token);
        }
    }
    if (results.size === 0 && fallback) {
        results.add(fallback);
    }
    if (results.size === 0) {
        results.add("linear");
    }
    return [...results];
}
function isTimingFunction(token) {
    return ([
        "linear",
        "ease",
        "ease-in",
        "ease-out",
        "ease-in-out",
        "step-start",
        "step-end",
    ].includes(token) || token.startsWith("cubic-bezier("));
}
function toMotionKey(durationMs, timing) {
    return `${durationMs}:${timing}`;
}
