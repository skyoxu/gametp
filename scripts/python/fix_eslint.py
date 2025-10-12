"""
扫描并修复 ESLint 格式问题（先扫描，失败则自动执行 --fix 和 Prettier，再复验），日志写入 logs/<date>/eslint/。

Windows 使用：
  py -3 scripts/python/fix_eslint.py           # 扫描->自动修复->复验
  py -3 scripts/python/fix_eslint.py --scan    # 仅扫描
"""

from __future__ import annotations

import argparse
import datetime
import os
import subprocess
import sys


def ensure_dir(p: str) -> None:
    os.makedirs(p, exist_ok=True)


def today_dir(module: str) -> str:
    import datetime
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


def main() -> int:
    parser = argparse.ArgumentParser(description='ESLint 扫描与自动修复')
    parser.add_argument('--scan', action='store_true', help='仅扫描，不自动修复')
    args = parser.parse_args()

    out_dir = today_dir('eslint')

    # 初次扫描
    code_scan, out_scan = run(['npx', 'eslint', '.', '--ext', '.ts,.tsx,.js,.mjs', '--format', 'stylish'])
    with open(os.path.join(out_dir, 'eslint-scan.txt'), 'w', encoding='utf-8') as f:
        f.write(out_scan)
    print(out_scan)

    if args.scan:
        return code_scan

    # 失败则自动修复
    if code_scan != 0:
        run(['npx', 'eslint', 'src', 'tests', 'scripts', '--ext', '.ts,.tsx,.js,.mjs', '--fix'])
        run(['npx', 'prettier', '.', '--write'])

    # 复验
    code_final, out_final = run(['npx', 'eslint', '.', '--ext', '.ts,.tsx,.js,.mjs', '--format', 'stylish'])
    with open(os.path.join(out_dir, 'eslint-final.txt'), 'w', encoding='utf-8') as f:
        f.write(out_final)
    print(out_final)
    return code_final


if __name__ == '__main__':
    sys.exit(main())

