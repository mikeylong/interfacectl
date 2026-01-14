import type {
  DiffEntry,
  EnforcementPolicy,
  Severity,
} from "@surfaces/interfacectl-validator";
import { matchRulePattern } from "./autofix.js";

/**
 * Apply policy severity overrides to diff entries.
 * This function is deterministic and MUST run before noise filtering.
 *
 * Order: generate entries → apply policy overrides → filter noise → compute exit code.
 *
 * Match semantics: Last match wins (iterate through all rules, later rules override earlier ones).
 * Severity overrides: Allow both upgrades and downgrades (error→warning→info and reverse).
 */
export function applyPolicySeverityOverrides(
  entries: DiffEntry[],
  policy?: EnforcementPolicy,
): DiffEntry[] {
  if (!policy) {
    return entries;
  }

  // Abstract implementation: Read from generic policy.rules if it exists,
  // otherwise fall back to policy.autofixRules
  // This keeps the door open for policy.rules governing severity separate
  // from policy.autofixRules governing fixes
  const rules =
    "rules" in policy && Array.isArray((policy as { rules?: unknown }).rules)
      ? (policy as { rules: Array<{ pattern: string; setSeverity?: Severity }> })
          .rules
      : policy.autofixRules;

  // Create a map of entries with their overridden severities
  // Last match wins - iterate through all rules
  const entrySeverities = new Map<number, Severity>();

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    let matchedSeverity: Severity | undefined;

    // Check all rules (last match wins)
    for (const rule of rules) {
      if (matchRulePattern(entry.path, rule.pattern)) {
        if (rule.setSeverity !== undefined) {
          matchedSeverity = rule.setSeverity;
        }
      }
    }

    if (matchedSeverity !== undefined) {
      entrySeverities.set(i, matchedSeverity);
    }
  }

  // Apply overrides to entries
  return entries.map((entry, index) => {
    const overrideSeverity = entrySeverities.get(index);
    if (overrideSeverity !== undefined) {
      return {
        ...entry,
        severity: overrideSeverity,
      };
    }
    return entry;
  });
}
