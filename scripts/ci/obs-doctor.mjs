#!/usr/bin/env node
// English-only comments and logs. No emoji.
// Purpose: Quick observability and security baseline doctor for the template.
// References: ADR-0003 (observability & release health), ADR-0002 (Electron security)

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';

function nowStamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function ensureLogPath() {
  const dateDir = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const p = join(process.cwd(), 'logs', dateDir, 'obs');
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
  return p;
}

function safeRead(p) {
  try {
    return readFileSync(p, 'utf8');
  } catch {
    return null;
  }
}

function checkCsp(indexHtml) {
  if (!indexHtml) return { ok: false, hint: 'index.html missing' };
  const hasMeta = /<meta\s+http-equiv="Content-Security-Policy"/i.test(
    indexHtml
  );
  return { ok: hasMeta, hint: hasMeta ? 'CSP meta found' : 'CSP meta missing' };
}

function checkSentryMain(mainTs) {
  if (!mainTs) return { ok: false, hint: 'electron/main.ts missing' };
  const hasImport = /@sentry\/electron|@sentry\/node/.test(mainTs);
  const hasInit = /Sentry\.init\(/.test(mainTs);
  return {
    ok: hasImport && hasInit,
    hint: `import=${hasImport} init=${hasInit}`,
  };
}

function checkRendererSentry() {
  // Check typical shared observability files per template conventions
  const files = [
    'src/shared/observability/sentry-renderer.ts',
    'src/shared/observability/sentry-main.ts',
  ];
  let found = false;
  let imports = 0;
  for (const f of files) {
    const content = safeRead(join(process.cwd(), f));
    if (content) {
      found = true;
      if (/@sentry\//.test(content) && /Sentry\.init\(/.test(content))
        imports++;
    }
  }
  return {
    ok: found && imports > 0,
    hint: `files=${found ? 'present' : 'missing'} imports=${imports}`,
  };
}

function main() {
  const indexHtml = safeRead(join(process.cwd(), 'index.html'));
  const mainTs = safeRead(join(process.cwd(), 'electron', 'main.ts'));

  const csp = checkCsp(indexHtml);
  const sentryMain = checkSentryMain(mainTs);
  const sentryRenderer = checkRendererSentry();

  const passed = csp.ok && sentryMain.ok && sentryRenderer.ok;
  const result = {
    timestamp: new Date().toISOString(),
    checks: { csp, sentryMain, sentryRenderer },
    summary: { passed },
  };

  const logDir = ensureLogPath();
  const outPath = join(logDir, `obs-doctor-${nowStamp()}.json`);
  writeFileSync(outPath, JSON.stringify(result, null, 2));

  console.log(`[obs-doctor] CSP: ${csp.ok} (${csp.hint})`);
  console.log(
    `[obs-doctor] Sentry Main: ${sentryMain.ok} (${sentryMain.hint})`
  );
  console.log(
    `[obs-doctor] Sentry Renderer: ${sentryRenderer.ok} (${sentryRenderer.hint})`
  );
  console.log(`[obs-doctor] Result saved to: ${outPath}`);
  process.exit(passed ? 0 : 1);
}

main();
