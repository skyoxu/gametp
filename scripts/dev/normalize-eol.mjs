#!/usr/bin/env node
import fs from 'node:fs';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node normalize-eol.mjs <files...>');
  process.exit(1);
}
for (const f of args) {
  try {
    const s = fs.readFileSync(f, 'utf8');
    const n = s.replace(/\r\n?/g, '\n');
    if (n !== s) {
      fs.writeFileSync(f, n);
      console.log(`normalized: ${f}`);
    } else {
      console.log(`unchanged: ${f}`);
    }
  } catch (e) {
    console.error(`error: ${f}: ${e.message}`);
  }
}
