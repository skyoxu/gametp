"""
ESLint/Prettier 预修复（Windows 优先，日志统一到 logs/<date>/eslint/）

- 流程：扫描 -> 自动修复（eslint --fix + prettier）-> 复验
- Windows 用法：
    py -3 scripts/python/fix_eslint.py           # 扫描->自动修复->复验
    py -3 scripts/python/fix_eslint.py --scan    # 仅扫描

实现要点（符合本仓库规范）：
- 优先本地 node_modules/.bin 工具，避免 npx 在 CI 上解析失败
- 子进程统一设置超时，防止在 GitHub Actions 上卡死被取消
- 限定扫描范围（src/ tests/ scripts/ electron/），减少耗时与写入面
- 日志输出统一：logs/<date>/eslint/
"""

from __future__ import annotations

import argparse
import datetime
import os
import shutil
import subprocess
import sys
from typing import List, Optional, Tuple


def ensure_dir(p: str) -> None:
    os.makedirs(p, exist_ok=True)


def today_dir(module: str) -> str:
    d = datetime.datetime.now().strftime("%Y-%m-%d")
    out = os.path.join("logs", d, module)
    ensure_dir(out)
    return out


def _timeout_sec(default: int = 120) -> int:
    try:
        v = int(os.environ.get("CI_PREFX_TIMEOUT_SEC", str(default)))
        return max(30, min(v, 600))
    except Exception:
        return default


def _which(cmd: str) -> Optional[str]:
    p = shutil.which(cmd)
    if p:
        return p
    # Windows: also try .cmd
    if os.name == "nt" and not cmd.lower().endswith(".cmd"):
        return shutil.which(cmd + ".cmd")
    return None


def _local_bin(tool: str) -> Optional[str]:
    exe = tool + (".cmd" if os.name == "nt" else "")
    p = os.path.join("node_modules", ".bin", exe)
    return p if os.path.isfile(p) else None


def _split_cmd_if_needed(cmd: List[str]) -> List[str]:
    if cmd and isinstance(cmd[0], str) and (" " in cmd[0] or "\t" in cmd[0]):
        return cmd[0].split(" ") + cmd[1:]
    return cmd


def run(cmd: List[str], cwd: Optional[str] = None, timeout_sec: Optional[int] = None) -> Tuple[int, str]:
    cmd = _split_cmd_if_needed(cmd)
    try:
        proc = subprocess.run(
            cmd,
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
            shell=False,
            timeout=timeout_sec or _timeout_sec(),
        )
        return proc.returncode, proc.stdout
    except subprocess.TimeoutExpired as e:
        try:
            out = (
                (e.stdout or b"").decode("utf-8", "replace")
                if isinstance(e.stdout, (bytes, bytearray))
                else (e.stdout or "")
            )
        except Exception:
            out = ""
        return 124, out + "\n[fix_eslint] timeout expired"
    except FileNotFoundError as e:
        return 127, str(e)


def safe_print(s: str) -> None:
    try:
        print(s)
    except UnicodeEncodeError:
        try:
            sys.stdout.buffer.write(s.encode("utf-8", "replace") + b"\n")
        except Exception:
            pass


def resolve_bins() -> tuple[str, str]:
    eslint_bin = _local_bin("eslint") or _which("eslint")
    prettier_bin = _local_bin("prettier") or _which("prettier")
    # 兜底：尝试通过 npm exec（Node 20+ 自带）
    if not eslint_bin:
        eslint_bin = "npm.cmd exec eslint" if os.name == "nt" else "npm exec eslint"
    if not prettier_bin:
        prettier_bin = "npm.cmd exec prettier" if os.name == "nt" else "npm exec prettier"
    return eslint_bin, prettier_bin


def main() -> int:
    parser = argparse.ArgumentParser(description="ESLint 扫描与自动修复")
    parser.add_argument("--scan", action="store_true", help="仅扫描，不自动修复")
    args = parser.parse_args()

    # 允许从环境快速禁用
    if os.environ.get("CI_PREFX_DISABLE", "").lower() in {"1", "true"}:
        print("[fix_eslint] disabled by CI_PREFX_DISABLE env")
        return 0

    out_dir = today_dir("eslint")

    eslint_bin, prettier_bin = resolve_bins()

    # 限定扫描范围
    default_targets = ["src", "tests", "scripts", "electron"]
    targets = [t for t in default_targets if os.path.exists(t)] or ["."]

    # 初次扫描
    scan_cmd = [eslint_bin, "--ext", ".ts,.tsx,.js,.mjs", "--format", "stylish", *targets]
    code_scan, out_scan = run(scan_cmd)
    with open(os.path.join(out_dir, "eslint-scan.txt"), "w", encoding="utf-8") as f:
        f.write(out_scan)
    safe_print(out_scan)

    if args.scan:
        return code_scan

    # 失败则自动修复（限定目录 + 超时保护）
    if code_scan != 0:
        fix_cmd = [eslint_bin, *targets, "--ext", ".ts,.tsx,.js,.mjs", "--fix"]
        run(fix_cmd)
        # prettier 只格式化关键目录，避免全仓写入导致耗时过长
        prettier_cmd = [prettier_bin, *targets, "--write"]
        run(prettier_cmd)

    # 复验
    final_cmd = [eslint_bin, "--ext", ".ts,.tsx,.js,.mjs", "--format", "stylish", *targets]
    code_final, out_final = run(final_cmd)
    with open(os.path.join(out_dir, "eslint-final.txt"), "w", encoding="utf-8") as f:
        f.write(out_final)
    safe_print(out_final)
    return code_final


if __name__ == "__main__":
    sys.exit(main())

