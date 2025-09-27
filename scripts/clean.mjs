#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const targets = [
  'dist',
  'dist-electron',
  'electron-dist',
  'build',
  'coverage',
  'logs',
  'reports',
  'test-results',
];

function rmrf(p) {
  const full = path.join(root, p);
  if (fs.existsSync(full)) {
    fs.rmSync(full, { recursive: true, force: true });
    console.log(`removed: ${p}`);
  }
}

targets.forEach(rmrf);
console.log('clean completed');

