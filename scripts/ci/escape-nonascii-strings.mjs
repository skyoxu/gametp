#!/usr/bin/env node
// Replace non-ASCII chars inside string literals with \uXXXX escapes.
// Preserves content while making files ASCII-only. Does not touch comments.
// Usage: node scripts/ci/escape-nonascii-strings.mjs <file1> <file2> ...

import fs from 'node:fs';

function escapeNonAsciiInStringContent(content) {
  let out = '';
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const code = ch.codePointAt(0);
    if (code > 0x7f) {
      const hex = code.toString(16).padStart(4, '0');
      out += `\\u${hex}`;
    } else {
      out += ch;
    }
  }
  return out;
}

function transform(src) {
  // Replace '...'/"..." string literals
  let out = src.replace(/(["'])((?:\\.|(?!\1).)*)\1/g, (_m, q, content) => {
    return q + escapeNonAsciiInStringContent(content) + q;
  });
  // Replace template literals (keep ${...} intact)
  out = out.replace(/`([^`$]*(?:\$\{[^}]*\}[^`$]*)*)`/g, (_m, content) => {
    let result = '';
    let i = 0;
    while (i < content.length) {
      const idx = content.indexOf('${', i);
      if (idx === -1) {
        result += escapeNonAsciiInStringContent(content.slice(i));
        break;
      }
      result += escapeNonAsciiInStringContent(content.slice(i, idx));
      const end = content.indexOf('}', idx + 2);
      if (end === -1) {
        result += content.slice(idx); // leave as is if malformed
        break;
      }
      result += content.slice(idx, end + 1);
      i = end + 1;
    }
    return '`' + result + '`';
  });
  return out;
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error(
    'Usage: node scripts/ci/escape-nonascii-strings.mjs <files...>'
  );
  process.exit(2);
}

let changed = 0;
for (const f of files) {
  if (!fs.existsSync(f) || !fs.statSync(f).isFile()) continue;
  const src = fs.readFileSync(f, 'utf8');
  const out = transform(src);
  if (out !== src) {
    fs.writeFileSync(f, out, 'utf8');
    changed++;
  }
}
console.log(
  `escape-nonascii-strings: processed=${files.length} changed=${changed}`
);
