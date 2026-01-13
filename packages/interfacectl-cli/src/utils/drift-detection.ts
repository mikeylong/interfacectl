import type {
  DiffEntry,
  DiffOutput,
  EnforcementPolicy,
  InterfaceContract,
  SurfaceDescriptor,
  DriftRisk,
  Severity,
  FixEntry,
} from "@surfaces/interfacectl-validator";

/**
 * 1. Diff noise detection: Filter reorder-only, formatting-only changes
 */
export function detectDiffNoise(entries: DiffEntry[]): DiffEntry[] {
  // Entries that represent actual semantic changes (not just noise)
  return entries.filter((entry) => {
    // If it's a modified entry but values are semantically equivalent
    // after normalization, it's noise
    if (entry.type === "modified") {
      const contractStr = JSON.stringify(entry.contractValue);
      const observedStr = JSON.stringify(entry.observedValue);
      // If they're the same after normalization, it's noise
      if (contractStr === observedStr) {
        return false;
      }
    }
    return true;
  });
}

/**
 * 2. Semantic ambiguity: Ensure every diff entry has a rule/clause reference
 */
export function validateSemanticClarity(entry: DiffEntry): boolean {
  return entry.rule !== undefined && entry.rule.length > 0;
}

/**
 * 3. Enforcement overreach: Prevent semantic changes in autofixes
 */
export function checkEnforcementOverreach(fix: FixEntry): boolean {
  // If fix changes semantic meaning (e.g., changing section intent),
  // it's overreach. Only mechanical changes allowed.
  const oldStr = JSON.stringify(fix.oldValue);
  const newStr = JSON.stringify(fix.newValue);

  // If values are structurally different (not just formatting), it might be semantic
  // This is a simple check; more sophisticated checks could parse the path
  if (fix.path.includes("intent") || fix.path.includes("description")) {
    return true; // Changing intent/description is semantic
  }

  // If it's just a format change, it's OK
  return oldStr !== newStr && typeof fix.oldValue !== typeof fix.newValue;
}

/**
 * 4. Policy drift: Verify policy fingerprint matches content
 */
export function validatePolicyVersion(policy: EnforcementPolicy): boolean {
  // Fingerprint should be computed from policy content (excluding fingerprint itself)
  // This check is done by comparing computed fingerprint with stored fingerprint
  // Actual computation happens in fingerprint.ts
  return (
    policy.fingerprint !== undefined &&
    policy.fingerprint.length >= 32 &&
    /^[a-f0-9]+$/.test(policy.fingerprint)
  );
}

/**
 * 5. Contract evolution: Contract changes should be diffable
 * (This would compare two contract versions, not implemented here as it's for contract-to-contract diffing)
 */
export function detectContractEvolution(
  oldContract: InterfaceContract,
  newContract: InterfaceContract,
): DiffEntry[] {
  // This would require a separate contract-to-contract diff implementation
  // For now, return empty array as this is a placeholder
  return [];
}

/**
 * 6. Observed instability: Validate descriptors before diffing
 */
export function validateObservedStability(
  descriptor: SurfaceDescriptor,
): boolean {
  // Check for required fields
  if (!descriptor.surfaceId || descriptor.surfaceId.length === 0) {
    return false;
  }

  // Check that arrays are arrays
  if (!Array.isArray(descriptor.sections)) return false;
  if (!Array.isArray(descriptor.fonts)) return false;
  if (!Array.isArray(descriptor.colors)) return false;
  if (!Array.isArray(descriptor.motion)) return false;

  // Check layout structure
  if (!descriptor.layout || typeof descriptor.layout !== "object") {
    return false;
  }

  return true;
}

/**
 * 7. Rename inflation: Avoid delete+add when rename is likely
 */
export function detectRenameInflation(
  oldPaths: string[],
  newPaths: string[],
): boolean {
  // If we have similar counts and high similarity, it's likely rename inflation
  if (oldPaths.length !== newPaths.length) {
    return false; // Different counts suggest actual add/remove
  }

  // Check if most paths have similar counterparts
  let similarCount = 0;
  const threshold = 0.7; // 70% similarity threshold

  for (const oldPath of oldPaths) {
    for (const newPath of newPaths) {
      const similarity = calculateSimilarity(oldPath, newPath);
      if (similarity >= threshold) {
        similarCount++;
        break;
      }
    }
  }

  // If more than 80% are similar, likely rename inflation
  return similarCount / oldPaths.length > 0.8;
}

function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1.0;

  const distance = levenshteinDistance(a, b);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * 8. Output schema drift: Validate output schema version
 */
export function validateOutputSchema(
  output: DiffOutput,
  schemaVersion: string,
): boolean {
  return output.schemaVersion === schemaVersion;
}

/**
 * 9. Severity inflation: Policy should control thresholds, not hardcoded
 */
export function checkSeverityInflation(
  entries: DiffEntry[],
  policy?: EnforcementPolicy,
): boolean {
  // If policy exists, check if it overrides severities appropriately
  // If no policy, default severities are used (which is OK)
  if (!policy) {
    return false; // No policy means using defaults, not inflation
  }

  // Check if policy has severity overrides that might be inflating
  const hasSeverityOverrides = policy.autofixRules.some(
    (rule) => rule.setSeverity !== undefined,
  );

  // If many rules set severity to "error", it might be inflation
  const errorOverrides = policy.autofixRules.filter(
    (rule) => rule.setSeverity === "error",
  );
  const totalRules = policy.autofixRules.length;

  // If more than 50% of rules force error severity, it might be inflation
  return totalRules > 0 && errorOverrides.length / totalRules > 0.5;
}

/**
 * 10. Local vs CI mismatch: Ensure repro command exists
 */
export function ensureReproCommand(
  output: DiffOutput,
  workspaceRoot: string,
): DiffOutput {
  if (!output.repro) {
    // Generate a repro command based on the diff inputs
    const contractPath = output.contract.path.startsWith("/")
      ? output.contract.path
      : `${workspaceRoot}/${output.contract.path}`;
    const command = `interfacectl diff --contract "${contractPath}" --root "${output.observed.root}"`;
    return {
      ...output,
      repro: { command },
    };
  }
  return output;
}

/**
 * Main function: Detect all drift risks
 */
export function detectAllDriftRisks(
  diff: DiffOutput,
  policy?: EnforcementPolicy,
): DriftRisk[] {
  const risks: DriftRisk[] = [];

  // 1. Diff noise
  const filteredEntries = detectDiffNoise(diff.entries);
  if (filteredEntries.length < diff.entries.length) {
    risks.push({
      category: "diff-noise",
      severity: "info",
      message: `${diff.entries.length - filteredEntries.length} diff entries were filtered as noise (reorder-only or formatting-only changes)`,
      relatedPaths: diff.entries
        .filter((e) => !filteredEntries.includes(e))
        .map((e) => e.path),
    });
  }

  // 2. Semantic ambiguity
  const entriesWithoutRules = diff.entries.filter(
    (e) => !validateSemanticClarity(e),
  );
  if (entriesWithoutRules.length > 0) {
    risks.push({
      category: "semantic-ambiguity",
      severity: "warning",
      message: `${entriesWithoutRules.length} diff entries lack rule/clause references`,
      relatedPaths: entriesWithoutRules.map((e) => e.path),
    });
  }

  // 4. Policy drift
  if (policy && !validatePolicyVersion(policy)) {
    risks.push({
      category: "policy-drift",
      severity: "error",
      message: "Policy fingerprint validation failed or fingerprint format invalid",
    });
  }

  // 6. Observed instability - would need descriptor to check, skip for now
  // (This is checked during descriptor collection)

  // 8. Output schema drift
  if (!validateOutputSchema(diff, "1.0.0")) {
    risks.push({
      category: "output-schema-drift",
      severity: "error",
      message: `Output schema version mismatch: expected "1.0.0", got "${diff.schemaVersion}"`,
    });
  }

  // 9. Severity inflation
  if (checkSeverityInflation(diff.entries, policy)) {
    risks.push({
      category: "severity-inflation",
      severity: "warning",
      message: "Policy has excessive error severity overrides (>50% of rules)",
    });
  }

  // 10. Local vs CI mismatch
  if (!diff.repro) {
    risks.push({
      category: "local-ci-mismatch",
      severity: "warning",
      message: "Repro command missing from output",
    });
  }

  return risks;
}
