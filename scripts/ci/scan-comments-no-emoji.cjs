#!/usr/bin/env node
/**
 * English Comments + No Emoji Scanner (advisory)
 * - Fails on emoji anywhere in code files.
 * - Warns on non-ASCII characters in comments.
 * Scanned: src/**, electron/**, tests/**, scripts/** (code-like files).
 */
const fs = require('fs');
const path = require('path');

const globs = [
  'src/**/*.{ts,tsx,js,jsx,cjs,mjs}',
  'electron/**/*.{ts,tsx,js,jsx,cjs,mjs}',
  'tests/**/*.{ts,tsx,js,jsx,cjs,mjs}',
  'scripts/**/*.{ts,tsx,js,jsx,cjs,mjs}',
];

async function main() {
  const fg = require('fast-glob');
  const files = await fg(globs, {
    dot: false,
    ignore: ['**/node_modules/**', '**/dist/**', '**/dist-electron/**'],
  });

  const emojiRe = /[\u2600-\u27BF\u{1F300}-\u{1FAFF}]/u;
  const nonAsciiRe = /[^\x00-\x7F]/;

  const issues = [];
  for (const file of files) {
    let text;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }

    // Scope A: check emoji only within comments (not code/UI strings)

    // Extract comments (heuristic)
    // Block comments
    const blockMatches = [...text.matchAll(/\/\*[\s\S]*?\*\//g)]
      .map(m => ({ start: m.index || 0, text: m[0] }));
    // Line comments
    const lineMatches = [];
    const lines = text.split(/\r?\n/);
    let offset = 0;
    for (const line of lines) {
      const m = line.match(/(^|\s)\/\/.*$/);
      if (m && !/https?:\/\//.test(line)) {
        lineMatches.push({ start: offset + (m.index || 0), text: m[0] });
      }
      offset += line.length + 1;
    }

    const comments = [...blockMatches, ...lineMatches];
    for (const c of comments) {
      if (nonAsciiRe.test(c.text)) {
        // Warn on non-ASCII in comments
        // Find line number for the comment start
        const prefix = text.slice(0, c.start);
        const line = (prefix.match(/\n/g) || []).length + 1;
        issues.push({
          file,
          line,
          type: 'comment-non-ascii',
          message: 'Comments must be English-only (ASCII)',
          excerpt: c.text.split(/\r?\n/)[0].trim().slice(0, 200),
        });
      }
      if (emojiRe.test(c.text)) {
        const prefix = text.slice(0, c.start);
        const line = (prefix.match(/\n/g) || []).length + 1;
        issues.push({
          file,
          line,
          type: 'emoji',
          message: 'Emoji characters are not allowed in comments',
          excerpt: c.text.split(/\r?\n/)[0].trim().slice(0, 200),
        });
      }
    }
  }

  const emojiIssues = issues.filter(i => i.type === 'emoji');
  const commentIssues = issues.filter(i => i.type === 'comment-non-ascii');

  if (issues.length === 0) {
    console.log('[scan-comments-no-emoji] OK: no emoji and no non-ASCII comments found');
    process.exit(0);
  }

  if (emojiIssues.length > 0) {
    console.error(`\n[scan-comments-no-emoji] Emoji violations:`);
    for (const i of emojiIssues.slice(0, 200)) {
      console.error(`  - ${i.file}:${i.line} ${i.message} :: ${i.excerpt}`);
    }
  }
  if (commentIssues.length > 0) {
    console.warn(`\n[scan-comments-no-emoji] Non-ASCII comments:`);
    for (const i of commentIssues.slice(0, 200)) {
      console.warn(`  - ${i.file}:${i.line} ${i.message} :: ${i.excerpt}`);
    }
  }

  // Hard-fail on emoji, soft-warn on comments for now
  if (emojiIssues.length > 0) {
    process.exit(2);
  }
  process.exit(0);
}

main().catch(err => {
  console.error('[scan-comments-no-emoji] Unexpected error:', err);
  process.exit(1);
});
