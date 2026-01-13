import type {
  DiffEntry,
  AutofixRule,
  FixEntry,
  SafetyLevel,
} from "@surfaces/interfacectl-validator";

/**
 * Check if a diff entry can be autofixed based on a rule
 */
export function canAutofix(entry: DiffEntry, rule: AutofixRule): boolean {
  if (!rule.autofixable) {
    return false;
  }

  // Only safe and mechanical fixes are allowed
  if (rule.safetyLevel === "semantic") {
    return false;
  }

  // Check if rule pattern matches entry path
  if (!matchRulePattern(entry.path, rule.pattern)) {
    return false;
  }

  return true;
}

/**
 * Match a path against a rule pattern
 * Supports simple glob patterns: * for any, ** for recursive
 */
export function matchRulePattern(path: string, pattern: string): boolean {
  // Convert glob pattern to regex
  // * matches any single segment
  // ** matches any number of segments
  // Escape special regex chars
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "___DOUBLE_STAR___")
    .replace(/\*/g, "[^/]*")
    .replace(/___DOUBLE_STAR___/g, ".*");
  const regex = new RegExp(`^${escaped}$`);
  return regex.test(path);
}

/**
 * Apply a fix based on a diff entry and rule
 * Returns the fix entry or null if fix cannot be applied
 */
export function applyFix(
  entry: DiffEntry,
  rule: AutofixRule,
): FixEntry | null {
  if (!canAutofix(entry, rule)) {
    return null;
  }

  // Generate fix based on entry type
  let newValue: unknown;
  let confidence = 1.0;

  switch (entry.type) {
    case "added":
      // For added entries, remove the value (set to undefined/null)
      newValue = entry.contractValue ?? null;
      confidence = 0.9;
      break;
    case "removed":
      // For removed entries, add the value from contract
      newValue = entry.contractValue;
      confidence = 0.95;
      break;
    case "modified":
      // For modified entries, use contract value
      newValue = entry.contractValue;
      confidence = 0.85;
      break;
    case "renamed":
      // For renamed entries, use the original path/value
      if (entry.rename) {
        newValue = entry.contractValue;
        confidence = entry.rename.confidence;
      } else {
        return null;
      }
      break;
    default:
      return null;
  }

  const fix: FixEntry = {
    ruleId: rule.id,
    path: entry.path,
    oldValue: entry.observedValue,
    newValue,
    confidence,
  };

  if (!validateFix(fix)) {
    return null;
  }

  return fix;
}

/**
 * Validate that a fix is reversible and mechanical
 */
export function validateFix(fix: FixEntry): boolean {
  // Fix must have both old and new values
  if (fix.oldValue === undefined || fix.newValue === undefined) {
    return false;
  }

  // Confidence must be in valid range
  if (fix.confidence < 0 || fix.confidence > 1) {
    return false;
  }

  // Old and new values must be different
  const oldStr = JSON.stringify(fix.oldValue);
  const newStr = JSON.stringify(fix.newValue);
  if (oldStr === newStr) {
    return false; // No change, not a valid fix
  }

  return true;
}

/**
 * Compute fix confidence score
 */
export function computeFixConfidence(fix: FixEntry): number {
  // Base confidence from fix entry
  let confidence = fix.confidence;

  // Adjust based on value types
  const oldType = typeof fix.oldValue;
  const newType = typeof fix.newValue;

  // Type mismatch reduces confidence
  if (oldType !== newType) {
    confidence *= 0.7;
  }

  // String values get slightly lower confidence (more semantic)
  if (oldType === "string" && newType === "string") {
    const oldStr = fix.oldValue as string;
    const newStr = fix.newValue as string;
    // Similar strings get higher confidence
    const similarity = calculateStringSimilarity(oldStr, newStr);
    confidence *= 0.8 + similarity * 0.2;
  }

  return Math.min(1.0, Math.max(0.0, confidence));
}

function calculateStringSimilarity(a: string, b: string): number {
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
