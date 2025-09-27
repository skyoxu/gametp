#!/usr/bin/env node
/**
 * Safe englishify for observability area (Windows-friendly).
 * - TS/TSX: transform ONLY comments; never touch code/tokens.
 * - Docs (md/mdx/txt): transform full text.
 * - No code rewriting by default.
 * - Writes report to logs/ci/<date>/englishify-report.json
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src', 'shared', 'observability');
const DAY = new Date().toISOString().slice(0, 10);
const REPORT_DIR = path.join(ROOT, 'logs', 'ci', DAY);

// Minimal dictionary (extend as needed). Literal Chinese kept to avoid encoding drift.
const DICT = new Map([
  ['游戏指标定义与分类', 'Game metric definition'],
  ['预定义的游戏指标', 'Predefined game metrics'],
  ['关卡相关指标', 'Level-related metrics'],
  ['战斗相关指标', 'Battle metrics'],
  ['UI相关指标', 'UI metrics'],
  ['资源相关指标', 'Resource metrics'],
  ['会话时长', 'Session duration'],
  ['可观测性门禁', 'Observability gatekeeper'],
  ['生成摘要', 'Generate summary'],
  ['检查超时', 'check timed out'],
]);

function englishifyText(text) {
  let out = text;
  for (const [from, to] of DICT.entries()) {
    if (!from) continue;
    if (out.includes(from)) out = out.split(from).join(to);
  }
  return out;
}

function collectTargets(dir) {
  const res = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    if (!d) continue;
    let entries = [];
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (/\.(ts|tsx|md|mdx|txt)$/i.test(e.name)) res.push(p);
    }
  }
  return res;
}

// Comment-only transformation for TS/TSX
function commentRanges(text) {
  const ranges = [];
  let i = 0;
  const n = text.length;
  let inS = false,
    inD = false,
    inT = false,
    esc = false;
  while (i < n) {
    const ch = text[i];
    const next = i + 1 < n ? text[i + 1] : '';
    if (inS || inD || inT) {
      if (esc) {
        esc = false;
        i++;
        continue;
      }
      if (ch === '\\') {
        esc = true;
        i++;
        continue;
      }
      if (inS && ch === "'") {
        inS = false;
        i++;
        continue;
      }
      if (inD && ch === '"') {
        inD = false;
        i++;
        continue;
      }
      if (inT && ch === '`') {
        inT = false;
        i++;
        continue;
      }
      i++;
      continue;
    }
    if (ch === "'") {
      inS = true;
      i++;
      continue;
    }
    if (ch === '"') {
      inD = true;
      i++;
      continue;
    }
    if (ch === '`') {
      inT = true;
      i++;
      continue;
    }
    if (ch === '/' && next === '/') {
      const start = i;
      i += 2;
      while (i < n && text[i] !== '\n' && text[i] !== '\r') i++;
      const end = i;
      ranges.push({ start, end });
      continue;
    }
    if (ch === '/' && next === '*') {
      const start = i;
      i += 2;
      while (i < n && !(text[i] === '*' && text[i + 1] === '/')) i++;
      i = Math.min(n, i + 2);
      const end = i;
      ranges.push({ start, end });
      continue;
    }
    i++;
  }
  return ranges;
}

function processTsTsx(file, text) {
  const ranges = commentRanges(text);
  if (ranges.length === 0) return text;
  let out = '';
  let last = 0;
  for (const { start, end } of ranges) {
    out += text.slice(last, start);
    const block = text.slice(start, end);
    out += englishifyText(block);
    last = end;
  }
  out += text.slice(last);
  return out;
}

function processText(text) {
  return englishifyText(text);
}

function run() {
  if (!fs.existsSync(SRC_DIR)) {
    console.log('[englishify] observability dir not found, skip');
    return { changed: 0, changes: [] };
  }
  const targets = collectTargets(SRC_DIR);
  const changes = [];
  for (const file of targets) {
    const before = fs.readFileSync(file, 'utf8');
    let after = before;
    if (/\.(ts|tsx)$/i.test(file)) after = processTsTsx(file, before);
    else after = processText(before);
    if (after !== before) {
      fs.writeFileSync(file, after, 'utf8');
      changes.push({ file, bytes: after.length - before.length });
    }
  }
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(REPORT_DIR, 'englishify-report.json'),
    JSON.stringify({ changed: changes.length, changes }, null, 2),
    'utf8'
  );
  console.log(`[englishify] safe changes: ${changes.length}`);
  return { changed: changes.length, changes };
}

run();
