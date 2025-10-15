#!/usr/bin/env node
/**
 * Guard release environment; print advisories to Step Summary and stdout.
 * - Ensures DOCS_ONLY/SENTRY_DISABLED not enabled in release pipelines
 * - Optionally checks SENTRY secrets presence when REQUIRE_SENTRY='true'
 *
 * This script is advisory by default: it never exits non-zero.
 * (We prefer logging and letting the pipeline proceed.)
 */
import fs from 'node:fs';

function writeSummary(lines) {
  try {
    const p = process.env.GITHUB_STEP_SUMMARY;
    if (p) fs.appendFileSync(p, lines.join('\n') + '\n', 'utf8');
  } catch {}
}

const DOCS_ONLY = String(process.env.DOCS_ONLY || '').toLowerCase();
const SENTRY_DISABLED = String(process.env.SENTRY_DISABLED || '').toLowerCase();
const REQUIRE_SENTRY = String(process.env.REQUIRE_SENTRY || '').toLowerCase() === 'true';
const SENTRY_ORG = process.env.SENTRY_ORG || '';
const SENTRY_PROJECT = process.env.SENTRY_PROJECT || '';

const out = [];
out.push('## Release Guards (advisory)');

if (DOCS_ONLY === 'true' || SENTRY_DISABLED === 'true') {
  const msg = 'DOCS_ONLY/SENTRY_DISABLED detected; release path not recommended.';
  console.warn(msg);
  out.push(`- WARNING: ${msg}`);
}

if (REQUIRE_SENTRY) {
  if (!SENTRY_ORG || !SENTRY_PROJECT) {
    const msg = 'SENTRY_ORG/SENTRY_PROJECT not configured; skipping Sentry release checks.';
    console.warn(msg);
    out.push(`- WARNING: ${msg}`);
  } else {
    out.push('- Sentry secrets present: OK');
  }
}

writeSummary(out);
console.log(out.join('\n'));
process.exit(0);

