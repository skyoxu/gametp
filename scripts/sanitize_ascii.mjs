#!/usr/bin/env node
/**
 * Sanitize non-ASCII characters in given files (ASCII-only output)
 * - Intended for comment/log/message cleanup in security/middleware modules
 * - Windows-friendly (Node.js script)
 *
 * References: ADR-0004, ADR-0002 (code change links only via comments)
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

function toDateFolder(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function basicAsciiSanitize(text) {
  // light canonicalization for common full-width punctuation before stripping
  const mapped = text
    .replace(/：/g, ':')
    .replace(/，/g, ', ')
    .replace(/[（﹙]/g, '(')
    .replace(/[）﹚]/g, ')')
    .replace(/[“”]/g, '"')
    .replace(/。/g, '.')
    .replace(/；/g, ';')
    .replace(/、/g, ', ')
    .replace(/【/g, '[')
    .replace(/】/g, ']')
    .replace(/—/g, '-')
    .replace(/…/g, '...');

  // remove remaining non-ASCII
  let sanitized = mapped.replace(/[^\x00-\x7F]/g, '');
  // cleanup excessive spaces introduced by removals
  sanitized = sanitized.replace(/[ \t]+/g, ' ');
  sanitized = sanitized.replace(/[ \t]+$/gm, '');
  return sanitized;
}

async function main() {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error(
      'Usage: node scripts/sanitize_ascii.mjs <file> [more files...]'
    );
    process.exit(2);
  }

  const dateFolder = toDateFolder();
  const logDir = path.join('logs', dateFolder, 'sanitizer');
  await fs.mkdir(logDir, { recursive: true });

  const report = [];
  for (const file of files) {
    try {
      const src = await fs.readFile(file, 'utf8');
      const sanitized = basicAsciiSanitize(src);
      if (sanitized !== src) {
        const backupPath = path.join(
          logDir,
          file.replace(/[\\/]/g, '__') + '.bak'
        );
        await fs.writeFile(backupPath, src, 'utf8');
        await fs.writeFile(file, sanitized, 'utf8');
        report.push({ file, changed: true, backup: backupPath });
      } else {
        report.push({ file, changed: false });
      }
    } catch (e) {
      report.push({ file, error: String(e) });
    }
  }

  const logPath = path.join(logDir, 'sanitize.log');
  const lines = report.map(r =>
    r.error
      ? `[ERROR] ${r.file}: ${r.error}`
      : `[OK] ${r.file}: ${r.changed ? 'changed' : 'no-op'}${r.backup ? ` | backup=${r.backup}` : ''}`
  );
  await fs.writeFile(logPath, lines.join('\n') + '\n', 'utf8');
  console.log(`Sanitize report written: ${logPath}`);
}

main().catch(err => {
  console.error('sanitize_ascii failed:', err);
  process.exit(1);
});
