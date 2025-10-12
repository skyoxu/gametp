#!/usr/bin/env node
/**
 * Refine placeholder words in comments only (no code/strings touched).
 * - Replaces single-word 'Comment' in comments with 'Note'
 * - Handles line (//) comments, block (JSDoc) comments, and JSX block comments
 * - ASCII-only output; backups and logs to logs/<date>/refine/
 *
 * Usage: node scripts/refine_comment_placeholders.mjs <file> [...files]
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

function dateFolder(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function refineCommentText(text) {
  // replace standalone 'Comment' (with optional surrounding spaces and trailing *)
  const trimmed = text.trim();
  if (trimmed === 'Comment') return 'Note';
  // common JSX pattern: 'Comment*/' pieces are handled by caller structure
  return text;
}

function processSource(src) {
  let i = 0;
  let out = '';
  const n = src.length;
  let inStr = false,
    quote = '';

  while (i < n) {
    const ch = src[i];
    const next = i + 1 < n ? src[i + 1] : '';

    // handle string literals to avoid changes within strings
    if (!inStr && (ch === '"' || ch === "'" || ch === '`')) {
      inStr = true;
      quote = ch;
      out += ch;
      i++;
      continue;
    }
    if (inStr) {
      out += ch;
      if (ch === '\\') {
        // escape next char
        if (i + 1 < n) {
          out += src[i + 1];
          i += 2;
          continue;
        }
      } else if (ch === quote) {
        inStr = false;
        quote = '';
      }
      i++;
      continue;
    }

    // line comment //...
    if (ch === '/' && next === '/') {
      out += '//';
      i += 2;
      const start = i;
      while (i < n && src[i] !== '\n') i++;
      const body = src.slice(start, i);
      // preserve leading spaces
      const m = body.match(/^(\s*)(.*)$/);
      const lead = m ? m[1] : '';
      const text = m ? m[2] : body;
      const refined = refineCommentText(text);
      out += lead + refined;
      continue;
    }

    // block comment /* ... */
    if (ch === '/' && next === '*') {
      out += '/*';
      i += 2;
      let chunk = '';
      while (i < n && !(src[i] === '*' && i + 1 < n && src[i + 1] === '/')) {
        chunk += src[i++];
      }
      // process per-line inside block comment
      const parts = chunk.split(/(\r?\n)/);
      for (let k = 0; k < parts.length; k++) {
        const ln = parts[k];
        if (/^\r?\n$/.test(ln)) {
          out += ln;
          continue;
        }
        const m = ln.match(/^(\s*\*?\s*)(.*)$/);
        if (m) {
          const lead = m[1];
          const text = m[2];
          out += lead + refineCommentText(text);
        } else {
          out += ln;
        }
      }
      if (i < n) {
        out += '*/';
        i += 2;
      }
      continue;
    }

    // default
    out += ch;
    i++;
  }

  // enforce ASCII-only in output
  out = out.replace(/[^\x00-\x7F]/g, '');
  return out;
}

async function main() {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error(
      'Usage: node scripts/refine_comment_placeholders.mjs <file> [...files]'
    );
    process.exit(2);
  }
  const logDir = path.join('logs', dateFolder(), 'refine');
  await fs.mkdir(logDir, { recursive: true });
  const report = [];
  for (const f of files) {
    try {
      const src = await fs.readFile(f, 'utf8');
      const dst = processSource(src);
      if (dst !== src) {
        const bak = path.join(logDir, f.replace(/[\\/]/g, '__') + '.bak');
        await fs.writeFile(bak, src, 'utf8');
        await fs.writeFile(f, dst, 'utf8');
        report.push(`[CHANGED] ${f} | backup=${bak}`);
      } else {
        report.push(`[OK] ${f} (no changes)`);
      }
    } catch (e) {
      report.push(`[ERROR] ${f} => ${String(e)}`);
    }
  }
  const logPath = path.join(logDir, 'refine.log');
  await fs.writeFile(logPath, report.join('\n') + '\n', 'utf8');
  console.log(`Refine report written: ${logPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
