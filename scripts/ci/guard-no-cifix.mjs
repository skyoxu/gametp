#!/usr/bin/env node
// Guard: disallow any dependency on temporary files "cifix*.*"
// Scans only .github/workflows, scripts, tests
// Logs results under logs/<date>/guards/no-cifix-scan.txt

import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Recursively walk a directory and return file paths.
 * @param {string} dir
 * @returns {Promise<string[]>}
 */
async function walk(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      // Skip common folders that don't matter inside target roots
      if (e.name === '.git' || e.name === 'node_modules' || e.name === 'dist') continue;
      out.push(...(await walk(p)));
    } else if (e.isFile()) {
      out.push(p);
    }
  }
  return out;
}

/**
 * Write scan results to logs directory with date bucket.
 * @param {string[]} matches
 * @returns {Promise<string>} absolute log file path
 */
async function writeLog(matches) {
  const today = new Date();
  const yyyy = today.getUTCFullYear();
  const mm = String(today.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(today.getUTCDate()).padStart(2, '0');
  const dir = path.join(process.cwd(), 'logs', `${yyyy}-${mm}-${dd}`, 'guards');
  await fs.mkdir(dir, { recursive: true });
  const logFile = path.join(dir, 'no-cifix-scan.txt');
  const header = [
    '# Guard: No cifix* dependency',
    `Timestamp(UTC): ${today.toISOString()}`,
    'Scopes: .github/workflows, scripts, tests',
    '',
  ].join('\n');
  const body = matches.length
    ? ['Found references:', ...matches].join('\n')
    : 'No references found.';
  await fs.writeFile(logFile, `${header}\n${body}\n`, 'utf8');
  return logFile;
}

async function main() {
  const roots = ['.github/workflows', 'scripts', 'tests'];
  const targets = [];
  for (const r of roots) {
    try {
      const stat = await fs.stat(r);
      if (!stat.isDirectory()) continue;
      targets.push(...(await walk(r)));
    } catch {
      // ignore missing roots
    }
  }

  const matches = [];
  // Detect explicit file references like "cifix.txt", "cifix1.txt", "cifix-foo.log"
  const fileRefRe = /\bcifix(?:\d+|[-_][\w.-]+)?\.[a-z0-9]+\b/i;
  for (const file of targets) {
    try {
      const content = await fs.readFile(file, 'utf8');
      // Ignore scanning self file
      if (path.normalize(file).endsWith(path.normalize('scripts/ci/guard-no-cifix.mjs'))) continue;
      // Scan line by line to allow exemptions
      const lines = content.split(/\r?\n/);
      let flagged = false;
      for (const line of lines) {
        if (!fileRefRe.test(line)) continue;
        // Allow explicit reference to the guard script itself
        if (/guard-no-cifix\.mjs/i.test(line)) continue;
        flagged = true;
        break;
      }
      if (flagged) matches.push(`${file}`);
    } catch {
      // binary or unreadable file, skip
    }
  }

  const logPath = await writeLog(matches);
  if (matches.length > 0) {
    console.error('[guard-no-cifix] Found forbidden references to "cifix"');
    for (const m of matches) console.error(` - ${m}`);
    console.error(`[guard-no-cifix] Log written: ${logPath}`);
    process.exit(1);
  } else {
    console.log('[guard-no-cifix] OK: no references found.');
    console.log(`[guard-no-cifix] Log written: ${logPath}`);
  }
}

main().catch((err) => {
  console.error('[guard-no-cifix] Unexpected error:', err);
  process.exit(1);
});
