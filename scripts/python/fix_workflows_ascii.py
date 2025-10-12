"""
扫描并修复 .github/workflows 下的 YAML 工作流中的非 ASCII 字符与常见编码/EOL问题。

Windows 使用示例：
  py -3 scripts/python/fix_workflows_ascii.py           # 修复模式（默认）
  py -3 scripts/python/fix_workflows_ascii.py --scan    # 仅扫描，不写回

行为：
- 遍历 .github/workflows/**/*.yml|yaml
- 统一 EOL 为 LF，去除 BOM
- 修复常见非 ASCII 字符（—、–、…、智能引号、NBSP等）
- 去除行尾空白与制表符（TAB→两个空格）
- 输出日志到 logs/<date>/ascii/
"""

from __future__ import annotations

import argparse
import datetime
import os
import sys
import unicodedata
from typing import List, Tuple


WORKFLOWS_DIR = os.path.join('.github', 'workflows')


def ensure_dir(p: str) -> None:
    os.makedirs(p, exist_ok=True)


def today_dir(module: str) -> str:
    d = datetime.datetime.now().strftime('%Y-%m-%d')
    out = os.path.join('logs', d, module)
    ensure_dir(out)
    return out


REPLACEMENTS = {
    '\u2013': '-',  # en dash
    '\u2014': '-',  # em dash
    '\u2212': '-',  # minus sign
    '\u00A0': ' ',  # nbsp
    '\u2018': "'",  # left single quote
    '\u2019': "'",  # right single quote
    '\u201C': '"',  # left double quote
    '\u201D': '"',  # right double quote
    '\u2026': '...',  # ellipsis
    '\u00B7': '*',  # middle dot
    '\u200B': '',   # zero width space
    '\uFEFF': '',   # BOM if present in content
}


def ascii_sanitize(s: str) -> Tuple[str, int, int]:
    """Return (text, replaced_count, removed_count)."""
    replaced = 0
    removed = 0
    # fast path if ascii only
    if all(ord(ch) < 128 for ch in s):
        return s, 0, 0

    # replace common chars
    out = []
    for ch in s:
        code = ord(ch)
        if code < 128:
            out.append(ch)
            continue
        repl = REPLACEMENTS.get(ch)
        if repl is not None:
            out.append(repl)
            if repl != ch:
                replaced += 1
            continue
        # fallback: NFKD normalize then strip non-ascii
        norm = unicodedata.normalize('NFKD', ch)
        try:
            ascii_bytes = norm.encode('ascii', 'ignore')
            if ascii_bytes:
                out.append(ascii_bytes.decode('ascii'))
                replaced += 1
            else:
                removed += 1
        except Exception:
            removed += 1
    return ''.join(out), replaced, removed


def normalize_lines(text: str) -> Tuple[str, int, int, int]:
    """Convert CRLF->LF, strip trailing spaces, convert TAB to two spaces.
    Returns (new_text, eol_fixed, trailing_trimmed, tabs_converted)
    """
    eol_fixed = 0
    trailing_trimmed = 0
    tabs_converted = 0

    # Normalize EOL to LF
    if '\r\n' in text:
        text = text.replace('\r\n', '\n')
        eol_fixed = 1

    lines = text.split('\n')
    new_lines: List[str] = []
    for line in lines:
        orig = line
        # replace tabs
        if '\t' in line:
            line = line.replace('\t', '  ')
            tabs_converted += 1
        # strip trailing spaces
        if line.rstrip() != line:
            line = line.rstrip()
            trailing_trimmed += 1
        new_lines.append(line)
    return '\n'.join(new_lines), eol_fixed, trailing_trimmed, tabs_converted


def process_file(path: str, write_back: bool) -> dict:
    raw = open(path, 'rb').read()
    # strip BOM if present
    if raw.startswith(b'\xef\xbb\xbf'):
        raw = raw[3:]
    try:
        text = raw.decode('utf-8', errors='replace')
    except Exception:
        text = raw.decode('utf-8', errors='replace')

    # sanitize ascii
    text2, replaced, removed = ascii_sanitize(text)
    # normalize whitespace/EOL
    text3, eol_fixed, trailing_trimmed, tabs_conv = normalize_lines(text2)

    changed = text3 != text
    if changed and write_back:
        with open(path, 'w', encoding='utf-8', newline='\n') as f:
            f.write(text3)

    return {
        'path': path,
        'changed': changed and write_back,
        'wouldChange': changed and not write_back,
        'replaced': replaced,
        'removed': removed,
        'eolFixed': eol_fixed,
        'trimmed': trailing_trimmed,
        'tabsConverted': tabs_conv,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description='Fix ASCII/EOL issues in GitHub workflows')
    parser.add_argument('--scan', action='store_true', help='仅扫描，不写回')
    args = parser.parse_args()

    out_dir = today_dir('ascii')
    results = []
    for root, _, files in os.walk(WORKFLOWS_DIR):
        for name in files:
            if not name.lower().endswith(('.yml', '.yaml')):
                continue
            p = os.path.join(root, name)
            r = process_file(p, write_back=not args.scan)
            results.append(r)

    # write summary
    import json
    with open(os.path.join(out_dir, 'ascii-fix-summary.json'), 'w', encoding='utf-8') as f:
        json.dump({'results': results}, f, indent=2, ensure_ascii=False)

    changed = [r for r in results if r.get('changed')]
    would = [r for r in results if r.get('wouldChange')]
    print(f"Processed {len(results)} workflow files. changed={len(changed)} wouldChange={len(would)}")
    return 0


if __name__ == '__main__':
    sys.exit(main())

