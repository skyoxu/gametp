"""
Scan zero-byte script files and write a report to logs/YYYY-MM-DD/scripts/.

Notes:
- This tool scans the `scripts/` directory if it exists; otherwise it scans the repository root.
- Only typical script extensions are considered.
- The report is written in English (code/logs requirement).
"""

from __future__ import annotations

import os
from pathlib import Path
from datetime import datetime
from typing import Iterable, List


SCRIPT_EXTS = {
    ".js",
    ".mjs",
    ".cjs",
    ".ts",
    ".mts",
    ".cts",
    ".sh",
    ".ps1",
    ".psm1",
    ".cmd",
    ".bat",
    ".py",
}

EXCLUDE_DIRS = {
    ".git",
    "node_modules",
    "dist",
    "dist-electron",
    "logs",
    "coverage",
    "reports",
}


def should_exclude(path: Path) -> bool:
    return any(part in EXCLUDE_DIRS for part in path.parts)


def collect_script_files(base: Path) -> List[Path]:
    files: List[Path] = []
    for p in base.rglob("*"):
        if not p.is_file():
            continue
        if p.suffix.lower() in SCRIPT_EXTS:
            if base.name == "scripts":
                # When scanning scripts/, do not exclude anything inside it
                files.append(p)
            else:
                if not should_exclude(p):
                    files.append(p)
    return files


def main() -> int:
    root = Path.cwd()
    scripts_dir = root / "scripts"

    if scripts_dir.exists() and scripts_dir.is_dir():
        scan_base = scripts_dir
        scope = "scripts/"
    else:
        scan_base = root
        scope = ". (repo root)"

    files = collect_script_files(scan_base)
    zero = [f for f in files if f.stat().st_size == 0]

    date_str = datetime.now().strftime("%Y-%m-%d")
    log_dir = root / "logs" / date_str / "scripts"
    log_dir.mkdir(parents=True, exist_ok=True)
    log_file = log_dir / "zero-byte-scan.txt"

    with log_file.open("w", encoding="utf-8") as fh:
        fh.write(f"[INFO] Scan scope: {scope}\n")
        fh.write(f"[INFO] Total script files scanned: {len(files)}\n")
        fh.write(f"[INFO] Zero-byte files found: {len(zero)}\n")
        for z in zero:
            # Use POSIX-style paths for portability in logs
            fh.write(f"[ZERO] {z.as_posix()}\n")

    print("SCAN_OK")
    print(log_file.as_posix())
    for z in zero:
        print(z.as_posix())

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

