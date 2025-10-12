import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const targets = [
  'node_modules/tree-sitter/binding.gyp',
  'node_modules/tree-sitter/lib/binding.gyp',
  'node_modules/tree-sitter/vendor/tree-sitter/lib/binding.gyp',
];

let patchedAny = false;
for (const relative of targets) {
  const filePath = resolve(process.cwd(), relative);
  if (!existsSync(filePath)) {
    continue;
  }

  const original = readFileSync(filePath, 'utf8');
  let updated = original;
  const replacements = [
    { pattern: /\/std:c\+\+17/g, replacement: '/std:c++20' },
    { pattern: /-std=c\+\+17/g, replacement: '-std=c++20' },
  ];

  for (const { pattern, replacement } of replacements) {
    updated = updated.replace(pattern, replacement);
  }

  if (updated !== original) {
    writeFileSync(filePath, updated, 'utf8');
    patchedAny = true;
    console.log(`[patch-tree-sitter] Updated C++ standard flag in ${relative}`);
  }
}

if (!patchedAny) {
  console.log(
    '[patch-tree-sitter] No tree-sitter files required patching (already C++20 or module absent).'
  );
}
