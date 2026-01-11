import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadDefaultPolicy,
  computePolicyFingerprint,
  verifyPolicyFingerprint,
} from "../dist/utils/policy.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("loadDefaultPolicy returns valid policy", async () => {
  const policy = loadDefaultPolicy();
  assert.equal(typeof policy.version, "string");
  assert.equal(typeof policy.fingerprint, "string");
  assert(policy.fingerprint.length >= 32, "Fingerprint should be at least 32 hex chars");
  assert.equal(typeof policy.modes, "object");
  assert.equal(typeof policy.autofixRules, "object");
});

test("verifyPolicyFingerprint validates correct fingerprint", () => {
  const policy = {
    version: "1.0.0",
    fingerprint: "placeholder",
    modes: {
      fail: { exitOnAny: true, severityThreshold: "error" },
      fix: { rules: [], dryRun: true },
      pr: { patchFormat: "json" },
    },
    autofixRules: [],
  };
  const computed = computePolicyFingerprint(policy);
  policy.fingerprint = computed;
  assert.equal(verifyPolicyFingerprint(policy), true, "Correct fingerprint should verify");
});

test("verifyPolicyFingerprint rejects incorrect fingerprint", () => {
  const policy = {
    version: "1.0.0",
    fingerprint: "wrong-fingerprint",
    modes: {
      fail: { exitOnAny: true, severityThreshold: "error" },
      fix: { rules: [], dryRun: true },
      pr: { patchFormat: "json" },
    },
    autofixRules: [],
  };
  assert.equal(verifyPolicyFingerprint(policy), false, "Incorrect fingerprint should fail verification");
});
