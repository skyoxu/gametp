#!/usr/bin/env node
/**
 * Run commitlint for a commit range, sanitizing BOMs (\uFEFF) that may be
 * introduced by tools or shells in commit subjects. This preserves commitlint
 * strictness while avoiding false failures due to encoding artifacts.
 *
 * Usage:
 *   node scripts/ci/commitlint-range-sanitized.mjs --from HEAD~20 --to HEAD
 *   node scripts/ci/commitlint-range-sanitized.mjs --from HEAD~1 --to HEAD
 */

import { execSync } from 'node:child_process';
import process from 'node:process';

let from = 'HEAD~20';
let to = 'HEAD';
for (let i = 2; i < process.argv.length; i += 1) {
  const a = process.argv[i];
  const b = process.argv[i + 1];
  if (a === '--from' && b) from = b;
  if (a === '--to' && b) to = b;
}

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function listShas(range) {
  try {
    const out = sh(`git rev-list ${range}`);
    return out ? out.split(/\r?\n/).filter(Boolean) : [];
  } catch (e) {
    console.error(`[commitlint-range] Failed to list commits for range ${range}:`, e.message);
    return [];
  }
}

function readMessage(sha) {
  try {
    return sh(`git show --no-patch --pretty=%B ${sha}`);
  } catch (e) {
    console.error(`[commitlint-range] Cannot read commit message for ${sha}:`, e.message);
    return '';
  }
}

function stripBomLines(text) {
  // Remove leading BOM from any line (U+FEFF)
  return text.replace(/^\uFEFF+/gm, '');
}

const lint = (await import('@commitlint/lint')).default;
const load = (await import('@commitlint/load')).default;
const loaded = await load();

const range = `${from}..${to}`;
const shas = listShas(range);
if (!shas.length) {
  console.log(`[commitlint-range] No commits in range ${range}.`);
  process.exit(0);
}

let failures = 0;
for (const sha of shas) {
  const raw = readMessage(sha);
  const msg = stripBomLines(raw);
const res = await lint(msg, loaded.rules || {}, {
  parserOpts: loaded.parserPreset && loaded.parserPreset.parserOpts ? loaded.parserPreset.parserOpts : {},
  plugins: loaded.plugins || {},
  // Respect project-specific ignore rules declared in commitlint config
  ignores: Array.isArray(loaded.ignores) ? loaded.ignores : [],
  defaultIgnores: true,
});
  if (!res.valid) {
    failures += 1;
    console.log(`\n\x1b[31m✖\x1b[0m commit ${sha} failed commitlint:`);
    for (const p of res.errors) {
      console.log(`  - ${p.name || 'rule'}: ${p.message}`);
    }
  } else {
    console.log(`\x1b[32m✔\x1b[0m commit ${sha} passed`);
  }
}

if (failures > 0) {
  console.error(`\n[commitlint-range] ${failures} commit(s) failed in ${range}.`);
  process.exit(1);
}

console.log(`\n[commitlint-range] All ${shas.length} commit(s) passed in ${range}.`);
process.exit(0);
