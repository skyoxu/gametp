#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const summaryPath = process.env.GITHUB_STEP_SUMMARY;

function runJSON() {
  const res = spawnSync('npx', ['--no-install', 'size-limit', '--json'], {
    encoding: 'utf-8',
    shell: process.platform === 'win32',
  });
  if (res.status !== 0) return null;
  try { return JSON.parse(res.stdout); } catch { return null; }
}

const data = runJSON();
let out = '# Bundle Size Summary\n';
if (data && Array.isArray(data)) {
  for (const item of data) {
    const name = item.name || 'bundle';
    const size = item.size; // e.g., "120 KB"
    const limit = item.limit || '';
    const passed = item.passed;
    // Try to compute ratio if both are in KB/MB strings
    const toBytes = (s) => {
      if (!s) return NaN;
      const m = String(s).trim().match(/([\d.]+)\s*(KB|MB|B)/i);
      if (!m) return NaN;
      const v = parseFloat(m[1]);
      const u = m[2].toUpperCase();
      if (u === 'MB') return v * 1024 * 1024;
      if (u === 'KB') return v * 1024;
      return v;
    };
    const ratio = Math.round((toBytes(size) / toBytes(limit)) * 100);
    const near = isFinite(ratio) && ratio >= 90 && ratio < 100;
    const flag = passed ? (near ? '⚠️ NEAR LIMIT' : '✅') : '❌ OVER LIMIT';
    out += `\n- ${name}: ${size} (limit: ${limit}) — ${flag}${isFinite(ratio) ? ` [${ratio}%]` : ''}`;
  }
} else {
  out += '\n(size-limit JSON output not available)';
}

console.log(out);
if (summaryPath) fs.writeFileSync(summaryPath, out + '\n', { flag: 'a' });
