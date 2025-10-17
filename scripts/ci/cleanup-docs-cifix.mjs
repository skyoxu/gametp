#!/usr/bin/env node
// One-off cleaner for docs/**: remove or neutralize references to temporary files "cifix*.txt".
// Rules:
// - Replace "cifix*.txt" with "临时建议清单（已清理）"
// - Replace word "cifix" with "临时建议清单" (word-boundary)
// - Replace phrases like "符合cifix.txt Diff N" to "符合优化建议 Diff N"
// Writes changes in-place; prints summary.

import { promises as fs } from 'node:fs';
import path from 'node:path';

async function walk(dir) {
  const acc = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) acc.push(...(await walk(p)));
    else if (e.isFile()) acc.push(p);
  }
  return acc;
}

function transform(content) {
  let next = content;
  // Replace explicit file mentions first
  next = next.replace(/cifix\d*\.txt/gi, '临时建议清单（已清理）');
  // Replace "符合cifix.txt Diff X" → "符合优化建议 Diff X"
  next = next.replace(/符合\s*cifix\.txt\s*Diff\s*/gi, '符合优化建议 Diff ');
  // Replace "所有cifix.txt建议已实施" → "所有优化建议已实施"
  next = next.replace(/所有\s*cifix\.txt\s*建议已实施/gi, '所有优化建议已实施');
  // Generic word replacement for remaining tokens
  next = next.replace(/\bcifix\b/gi, '临时建议清单');
  return next;
}

async function main() {
  const root = path.join(process.cwd(), 'docs');
  try {
    await fs.stat(root);
  } catch {
    console.error('[cleanup-docs-cifix] docs/ not found, nothing to do');
    return;
  }
  const files = (await walk(root)).filter((p) => /\.(md|mdx|txt)$/i.test(p));
  let changed = 0;
  for (const f of files) {
    const before = await fs.readFile(f, 'utf8');
    const after = transform(before);
    if (after !== before) {
      await fs.writeFile(f, after, 'utf8');
      console.log(`[cleanup-docs-cifix] updated: ${path.relative(process.cwd(), f)}`);
      changed++;
    }
  }
  console.log(`[cleanup-docs-cifix] done. files changed: ${changed}`);
}

main().catch((err) => {
  console.error('[cleanup-docs-cifix] error:', err);
  process.exit(1);
});

