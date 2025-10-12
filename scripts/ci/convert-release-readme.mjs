#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'scripts', 'release', 'README.md');
let txt = '';
try {
  txt = fs.readFileSync(file, 'utf8');
} catch (e) {
  console.error('Cannot read file:', file, e.message);
  process.exit(1);
}

// Replace heading
txt = txt.replace(
  '### 1. Shell 脚本集成',
  '### 1. PowerShell 脚本集成（Windows-only）'
);

// Replace first ```bash fenced block with PowerShell example
const start = txt.indexOf('```bash');
if (start >= 0) {
  const end = txt.indexOf('```', start + 3);
  if (end > start) {
    const psBlock = [
      '```powershell',
      "$ErrorActionPreference = 'Stop'",
      "$VERSION = '1.2.3'",
      "$PREV_VERSION = '1.1.0'",
      '',
      'npm run release:stage:5',
      'Start-Sleep -Seconds 600',
      'if (-not (npm run release:health-check)) {',
      '  npm run release:rollback:to-version -- dist/latest.yml artifacts/manifest.json $PREV_VERSION',
      '  exit 1',
      '}',
      'npm run release:stage:25',
      '```',
      '',
    ].join('\n');
    txt = txt.slice(0, start) + psBlock + txt.slice(end + 3);
  }
}

try {
  fs.writeFileSync(file, txt, 'utf8');
  console.log('Converted bash example to PowerShell in', file);
} catch (e) {
  console.error('Cannot write file:', e.message);
  process.exit(1);
}
