#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

// Simple args parser: --name=xxx --productName=yyy --appId=zzz --dry-run --interactive --no-clean --rename-scope=acme
const args = Object.fromEntries(
  process.argv.slice(2).map(arg => {
    const m = arg.match(/^--([^=]+)=(.*)$/);
    if (m) return [m[1], m[2]];
    if (arg.startsWith('--')) return [arg.replace(/^--/, ''), true];
    return [arg, true];
  })
);

const root = process.cwd();
const pkgPath = path.join(root, 'package.json');
const ebYamlPath = path.join(root, 'electron-builder.yml');

function loadJSON(p) {
  const raw = fs.readFileSync(p, 'utf8');
  const text = raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw;
  return JSON.parse(text);
}

function saveJSON(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
}

function ensureElectronBuilderYaml(appId, productName) {
  if (fs.existsSync(ebYamlPath)) return;
  const yaml = [
    `appId: ${appId}`,
    `productName: ${productName}`,
    'directories:',
    '  output: dist-electron',
    'files:',
    '  - dist/**',
    '  - dist-electron/**',
    'win:',
    '  target: nsis',
  ].join('\n');
  fs.writeFileSync(ebYamlPath, yaml + '\n');
  console.log(`created ${path.basename(ebYamlPath)}`);
}

function cleanArtifacts() {
  const targets = ['dist', 'dist-electron', 'electron-dist', 'coverage', 'logs', 'reports'];
  for (const t of targets) {
    const full = path.join(root, t);
    if (fs.existsSync(full)) {
      fs.rmSync(full, { recursive: true, force: true });
      console.log(`removed: ${t}`);
    }
  }
}

async function run() {
  const dry = !!args['dry-run'];
  const updates = [];

  const pkg = loadJSON(pkgPath);
  let nextName = args.name || pkg.name;
  let nextProduct = args.productName || pkg.productName || pkg.name;
  const sanitize = (s) => (s || 'app').replace(/[^a-zA-Z0-9.-]/g, '');
  const renameScope = args['rename-scope'] ? String(args['rename-scope']).replace(/[^a-zA-Z0-9.-]/g, '') : '';
  let nextAppId = args.appId || `${renameScope ? `com.${renameScope}` : 'com.example'}.${sanitize(nextName)}`;

  // Interactive prompts (optional)
  if (args['interactive']) {
    try {
      const { default: prompts } = await import('prompts');
      const answers = await prompts([
        {
          type: 'text',
          name: 'name',
          message: 'Package name',
          initial: nextName,
          validate: v => (!!v && /^[a-z0-9-_.]+$/.test(v)) || 'use lowercase, digits, - _ .',
        },
        {
          type: 'text',
          name: 'productName',
          message: 'Product name (human readable)',
          initial: nextProduct,
        },
        {
          type: 'text',
          name: 'appId',
          message: 'Electron appId (reverse-DNS)',
          initial: nextAppId,
          validate: v => (!!v && /^[a-zA-Z0-9.-]+$/.test(v)) || 'alnum, dot and hyphen only',
        },
      ]);
      nextName = answers.name || nextName;
      nextProduct = answers.productName || nextProduct;
      nextAppId = answers.appId || nextAppId;
    } catch {
      console.log('prompts not installed; continue non-interactive');
    }
  }

  if (args.name && args.name !== pkg.name) {
    pkg.name = args.name;
    updates.push(`package.json:name -> ${args.name}`);
  }
  if (args.productName && args.productName !== pkg.productName) {
    pkg.productName = args.productName;
    updates.push(`package.json:productName -> ${args.productName}`);
  }

  if (!dry && updates.length) {
    saveJSON(pkgPath, pkg);
    console.log('updated package.json:', updates.join(', '));
  } else if (updates.length) {
    console.log('DRY-RUN package.json updates:', updates.join(', '));
  }

  if (!dry) {
    ensureElectronBuilderYaml(nextAppId, nextProduct);
    if (!args['no-clean']) cleanArtifacts();
  } else {
    console.log(`DRY-RUN would create ${path.basename(ebYamlPath)} and clean artifacts`);
  }

  // Optional git init (best-effort)
  try {
    if (!dry) {
      const { spawnSync } = await import('node:child_process');
      const res = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], { stdio: 'ignore' });
      if (res.status !== 0) {
        spawnSync('git', ['init'], { stdio: 'inherit' });
        console.log('initialized git repository');
      }
    }
  } catch {}

  console.log('template initialization complete');
  console.log('- Next steps:');
  console.log('  1) Update productName/appId if needed');
  console.log('  2) Build: npm run build:win:dir');
  console.log('  3) Apply fuses: npm run security:fuses:prod');
  if (renameScope) {
    console.log(`  (scope) Applied rename-scope: ${renameScope}`);
  }
}

run();
