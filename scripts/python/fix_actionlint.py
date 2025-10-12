"""
扫描并修复（可自动修复范围内的）GitHub Actions 工作流格式问题，并运行 actionlint 校验。

注意：actionlint 本身不提供 --fix；本脚本仅做安全格式修复：
- 调用 fix_workflows_ascii.py：统一为 UTF-8 + LF，移除非 ASCII、BOM、TAB 与行尾空白
- 再次遍历去除多余尾随空行，保证以单个换行结尾
- 调用 npx actionlint 扫描，结果写入 logs/<date>/actionlint/

Windows 使用：
  py -3 scripts/python/fix_actionlint.py --scan   # 只扫描
  py -3 scripts/python/fix_actionlint.py --fix    # 格式修复 + 扫描（默认）
"""

from __future__ import annotations

import argparse
import datetime
import os
import subprocess
import sys


WORKFLOWS_DIR = os.path.join('.github', 'workflows')


def ensure_dir(p: str) -> None:
    os.makedirs(p, exist_ok=True)


def today_dir(module: str) -> str:
    d = datetime.datetime.now().strftime('%Y-%m-%d')
    out = os.path.join('logs', d, module)
    ensure_dir(out)
    return out


def run(cmd: list[str], cwd: str | None = None) -> tuple[int, str]:
    try:
        proc = subprocess.run(
            cmd,
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding='utf-8',
            errors='replace',
            shell=False,
        )
        if proc.returncode == 127 and cmd and cmd[0] in ('npm', 'npx'):
            proc2 = subprocess.run([cmd[0] + '.cmd', *cmd[1:]], cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', errors='replace', shell=False)
            return proc2.returncode, proc2.stdout
        return proc.returncode, proc.stdout
    except FileNotFoundError as e:
        if cmd and cmd[0] in ('npm', 'npx'):
            try:
                proc2 = subprocess.run([cmd[0] + '.cmd', *cmd[1:]], cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', errors='replace', shell=False)
                return proc2.returncode, proc2.stdout
            except FileNotFoundError as e2:
                return 127, str(e2)
        return 127, str(e)


def safe_print(s: str) -> None:
    try:
        print(s)
    except UnicodeEncodeError:
        try:
            sys.stdout.buffer.write(s.encode('utf-8', 'replace') + b"\n")
        except Exception:
            pass


def trim_tail_and_ensure_newline(p: str) -> bool:
    try:
        text = open(p, 'r', encoding='utf-8', errors='replace').read()
    except FileNotFoundError:
        return False
    # 去除多余结尾空行，只保留一个换行
    stripped = text.rstrip('\n') + '\n'
    if stripped != text:
        open(p, 'w', encoding='utf-8', newline='\n').write(stripped)
        return True
    return False


def fix_ascii() -> None:
    # 调用同仓库 ASCII 修复脚本
    run([sys.executable, 'scripts/python/fix_workflows_ascii.py'])


def fix_formatting() -> int:
    changed = 0
    for root, _, files in os.walk(WORKFLOWS_DIR):
        for name in files:
            if not name.lower().endswith(('.yml', '.yaml')):
                continue
            p = os.path.join(root, name)
            if trim_tail_and_ensure_newline(p):
                changed += 1
    return changed


def main() -> int:
    parser = argparse.ArgumentParser(description='actionlint 扫描与安全格式修复')
    parser.add_argument('--scan', action='store_true', help='仅扫描（不修复）')
    parser.add_argument('--fix', action='store_true', help='修复 + 扫描（默认）')
    args = parser.parse_args()

    mode_fix = args.fix or not args.scan
    out_dir = today_dir('actionlint')

    if mode_fix:
        fix_ascii()
        cnt = fix_formatting()
        with open(os.path.join(out_dir, 'format-fix.txt'), 'w', encoding='utf-8') as f:
            f.write(f'files_tail_normalized={cnt}\n')

    code, out = run(['npx', 'actionlint', '-color'])
    with open(os.path.join(out_dir, 'actionlint.txt'), 'w', encoding='utf-8') as f:
        f.write(out)
    safe_print(out)

    # Fallback: 本地 npx 无法执行 actionlint（二进制未暴露），改用仓库自带校验脚本
    if code != 0 and ('could not determine executable to run' in out.lower() or 'not found' in out.lower()):
        fb_code, fb_out = run(['node', 'scripts/ci/validate-all-workflows.cjs'])
        with open(os.path.join(out_dir, 'actionlint-fallback.txt'), 'w', encoding='utf-8') as f:
            f.write(fb_out)
        safe_print('\n[actionlint fallback] validate-all-workflows.cjs result:')
        safe_print(fb_out)
        return fb_code

    return code


if __name__ == '__main__':
    sys.exit(main())
