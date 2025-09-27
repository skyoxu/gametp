#!/usr/bin/env node
// Sanitize non-ASCII content in code comments (and optionally string literals).
// Default: dry-run (report only). Use --write to apply changes.
// Windows-friendly; logs to logs/ci/YYYY-MM-DD/sanitize-ascii-*.log
//
// Usage (PowerShell):
//   node scripts/sanitize-ascii.mjs --targets "tests/**/*.ts,src/shared/observability/**/*.ts,electron/main.ts" --write
//   node scripts/sanitize-ascii.mjs --targets "tests/unit/**/*.ts" --write --strings=false
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2).reduce((acc, cur) => {
  const [k, v] = cur.includes('=') ? cur.split('=') : [cur, true];
  acc[k.replace(/^--/, '')] = v === undefined ? true : v;
  return acc;
}, {});

const write = String(args.write || 'false').toLowerCase() === 'true';
const targets = String(
  args.targets ||
    'tests/**/*.ts,src/shared/observability/**/*.ts,electron/main.ts'
)
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const sanitizeStrings =
  String(args.strings ?? 'false').toLowerCase() === 'true';

// Tiny glob: expand only **/*.ts and exact files to keep dependencies minimal
function listFiles(pattern) {
  if (!pattern.includes('**')) {
    return fs.existsSync(pattern) ? [pattern] : [];
  }
  const [base, suffix] = pattern.split('**');
  const root = base || '.';
  const ext = suffix.replace(/^[\/\\]/, '');
  const results = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (p.endsWith(ext)) results.push(p);
    }
  }
  if (fs.existsSync(root)) walk(root);
  return results;
}

const now = new Date();
const yyyy = now.getUTCFullYear();
const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
const dd = String(now.getUTCDate()).padStart(2, '0');
const hh = String(now.getUTCHours()).padStart(2, '0');
const mi = String(now.getUTCMinutes()).padStart(2, '0');
const ss = String(now.getUTCSeconds()).padStart(2, '0');
const logDir = path.join('logs', 'ci', `${yyyy}-${mm}-${dd}`);
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, `sanitize-ascii-${hh}${mi}${ss}Z.log`);
const log = s => fs.appendFileSync(logFile, s + '\n', 'utf8');

function sanitizeContent(src) {
  let removed = 0;
  let fixed = 0;
  let out = src;

  // Replace common full-width punctuation with ASCII (comments only)
  const punctMap = {
    '\uFF0C': ',', // ，
    '\u3002': '.', // 。
    '\uFF1B': ';', // ；
    '\uFF1A': ':', // ：
    '\uFF08': '(', // （
    '\uFF09': ')', // ）
    '\u3010': '[', // 【
    '\u3011': ']', // 】
    '\uFF01': '!', // ！
    '\uFF1F': '?', // ？
    '\u201C': '"', // “
    '\u201D': '"', // ”
    '\u3001': ',', // 、
  };
  const punctRegex =
    /[\uFF0C\u3002\uFF1B\uFF1A\uFF08\uFF09\u3010\u3011\uFF01\uFF1F\u201C\u201D\u3001]/g;

  // Sanitize block comments
  out = out.replace(/\/\*[\s\S]*?\*\//g, block => {
    const replaced = block
      .replace(punctRegex, ch => {
        fixed += 1;
        return punctMap[ch] || '';
      })
      .replace(/[\u0100-\uFFFF]/g, _ => {
        removed += 1;
        return '';
      });
    return replaced;
  });

  // Sanitize line comments, including inline trailing comments
  out = out.replace(/(^|[^:])\/\/.*$/gm, m => {
    const head = m.startsWith('//') ? '' : m.slice(0, 1);
    const body = m.startsWith('//') ? m : m.slice(1);
    const cleaned = body
      .replace(punctRegex, ch => {
        fixed += 1;
        return punctMap[ch] || '';
      })
      .replace(/[\u0100-\uFFFF]/g, _ => {
        removed += 1;
        return '';
      });
    return head + cleaned;
  });

  if (sanitizeStrings) {
    // Optional: sanitize non-ASCII in string literals as well (single/double/backtick)
    // 1) Single/Double quotes
    out = out.replace(/(["'])((?:\\.|(?!\1).)*)\1/g, (_m, q, content) => {
      const cleaned = String(content)
        .replace(punctRegex, ch => {
          fixed += 1;
          return punctMap[ch] || '';
        })
        .replace(/[\u0100-\uFFFF]/g, _ => {
          removed += 1;
          return '';
        });
      return q + cleaned + q;
    });
    // 2) Template literals (best-effort, keep expressions intact)
    out = out.replace(/`([^`$]*(?:\$\{[^}]*\}[^`$]*)*)`/g, (_m, content) => {
      // Replace only outside of ${...}
      const parts = [];
      let i = 0;
      while (i < content.length) {
        const start = content.indexOf('${', i);
        if (start === -1) {
          const seg = content
            .slice(i)
            .replace(punctRegex, ch => {
              fixed += 1;
              return punctMap[ch] || '';
            })
            .replace(/[\u0100-\uFFFF]/g, _ => {
              removed += 1;
              return '';
            });
          parts.push(seg);
          break;
        }
        const seg = content
          .slice(i, start)
          .replace(punctRegex, ch => {
            fixed += 1;
            return punctMap[ch] || '';
          })
          .replace(/[\u0100-\uFFFF]/g, _ => {
            removed += 1;
            return '';
          });
        parts.push(seg);
        const end = content.indexOf('}', start + 2);
        if (end === -1) {
          parts.push(content.slice(start));
          break;
        }
        parts.push(content.slice(start, end + 1));
        i = end + 1;
      }
      return '`' + parts.join('') + '`';
    });
  }

  // Remove sequences of many '?' often introduced by encoding glitches
  out = out.replace(/(^|\s)\?{2,}(?=\s|$)/gm, s => {
    removed += s.length;
    return ' ';
  });

  return { out, removed, fixed };
}

let totalFiles = 0,
  changedFiles = 0,
  totalRemoved = 0,
  totalFixed = 0;
for (const pat of targets) {
  for (const file of listFiles(pat)) {
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) continue;
    totalFiles++;
    const src = fs.readFileSync(file, 'utf8');
    const { out, removed, fixed } = sanitizeContent(src);
    if (src !== out) {
      changedFiles++;
      totalRemoved += removed;
      totalFixed += fixed;
      log(
        `${file}: removed=${removed} fixed=${fixed}${write ? ' [written]' : ''}`
      );
      if (write) fs.writeFileSync(file, out, 'utf8');
    }
  }
}

log(
  `Summary: files=${totalFiles} changed=${changedFiles} removed=${totalRemoved} fixed=${totalFixed}`
);
console.log(`Sanitize report -> ${logFile}`);
if (!write && changedFiles > 0) {
  console.log('Dry-run mode: rerun with --write to apply changes.');
}
