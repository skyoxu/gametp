#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const errors = [];
const warnings = [];

function checkNodeVersion() {
  const v = process.versions.node;
  const major = parseInt(v.split('.')[0], 10);
  if (!(major >= 20 && major < 21)) {
    errors.push(`Node version ${v} not in engines range (>=20 <21)`);
  }
}

function checkDeps() {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
    );
    const dev = { ...(pkg.devDependencies || {}), ...(pkg.dependencies || {}) };
    if (!dev.electron) warnings.push('electron not found in dependencies');
    if (!dev['@playwright/test'])
      warnings.push('@playwright/test not found in dependencies');
  } catch {
    errors.push('package.json not found or invalid');
  }
}

function checkBuilder() {
  if (!fs.existsSync(path.join(process.cwd(), 'electron-builder.yml'))) {
    warnings.push('electron-builder.yml missing (init:template will create)');
  }
}

function guardArtifacts() {
  const git = spawnSync('git', ['ls-files', '--', 'dist', 'dist-electron'], {
    encoding: 'utf-8',
  });
  if (git.status === 0 && git.stdout && git.stdout.trim()) {
    errors.push(
      'Tracked build artifacts detected under dist/ or dist-electron/'
    );
  }
}

function checkEnv() {
  if (!process.env.SENTRY_DSN)
    warnings.push('SENTRY_DSN not set (OK for local/PR)');
}

checkNodeVersion();
checkDeps();
checkBuilder();
guardArtifacts();
checkEnv();

console.log('Template Doctor Report');
console.log('=======================');
console.log(`Node: ${process.versions.node}`);
if (errors.length) {
  console.log('\nErrors:');
  for (const e of errors) console.log(`- ${e}`);
}
if (warnings.length) {
  console.log('\nWarnings:');
  for (const w of warnings) console.log(`- ${w}`);
}

if (errors.length) process.exit(1);
console.log('\nOK');
