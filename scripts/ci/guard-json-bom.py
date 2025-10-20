"""
Guard: Detect UTF-8 BOM in JSON files and log results.

Usage (Windows):
  - Detect only:  py -3 scripts/ci/guard-json-bom.py
  - Auto-fix BOM: py -3 scripts/ci/guard-json-bom.py --fix

Behavior:
  - Scans repo for *.json excluding common build/output dirs.
  - Writes report to logs/YYYY-MM-DD/guards/json-bom-scan.txt
  - Exit code: 0 if no BOM; 1 if BOM found (and not fixed); 0 if fixed with --fix.

Notes:
  - Logs and code output are in English per repository rules.
  - This script is Windows-only friendly and uses Python.
"""

from __future__ import annotations

import argparse
from datetime import datetime
from pathlib import Path
from typing import List


EXCLUDE_DIRS = {
    ".git",
    "node_modules",
    "dist",
    "dist-electron",
    "coverage",
    "reports",
    "logs",
}


def is_excluded(p: Path) -> bool:
    return any(part in EXCLUDE_DIRS for part in p.parts)


def find_json_files(root: Path) -> List[Path]:
    files: List[Path] = []
    for p in root.rglob("*.json"):
        if p.is_file() and not is_excluded(p):
            files.append(p)
    return files


def has_bom(path: Path) -> bool:
    try:
        with path.open("rb") as fh:
            head = fh.read(3)
            return head == b"\xEF\xBB\xBF"
    except Exception:
        return False


def strip_bom(path: Path) -> bool:
    try:
        with path.open("rb") as fh:
            data = fh.read()
        if data.startswith(b"\xEF\xBB\xBF"):
            data = data[3:]
            with path.open("wb") as fw:
                fw.write(data)
            return True
        return False
    except Exception:
        return False


def write_log(log_path: Path, scanned: int, bad: List[Path], fixed: List[Path]) -> None:
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with log_path.open("w", encoding="utf-8") as fh:
        fh.write("# Guard: JSON UTF-8 BOM scan\n")
        fh.write(f"Timestamp(UTC): {datetime.utcnow().isoformat()}\n")
        fh.write(f"Scanned JSON files: {scanned}\n")
        fh.write(f"Files with BOM: {len(bad)}\n")
        if bad:
            fh.write("-- BOM Files --\n")
            for b in bad:
                fh.write(f"{b.as_posix()}\n")
        if fixed:
            fh.write("-- Fixed Files --\n")
            for f in fixed:
                fh.write(f"{f.as_posix()}\n")


def main() -> int:
    parser = argparse.ArgumentParser(description="Detect UTF-8 BOM in JSON files")
    parser.add_argument("paths", nargs="*", help="Optional paths to scan (files or directories)")
    parser.add_argument("--fix", action="store_true", help="Remove BOM in-place for detected files")
    args = parser.parse_args()

    root = Path.cwd()
    targets: List[Path] = []
    if args.paths:
        for raw in args.paths:
            p = Path(raw)
            if p.is_dir():
                targets.extend(find_json_files(p))
            elif p.is_file() and p.suffix.lower() == ".json":
                targets.append(p)
    else:
        targets = find_json_files(root)

    bad: List[Path] = []
    fixed: List[Path] = []
    for f in targets:
        if has_bom(f):
            bad.append(f)
            if args.fix and strip_bom(f):
                fixed.append(f)

    date_str = datetime.now().strftime("%Y-%m-%d")
    log_path = root / "logs" / date_str / "guards" / "json-bom-scan.txt"
    write_log(log_path, scanned=len(targets), bad=bad, fixed=fixed)

    print("SCAN_OK")
    print(log_path.as_posix())
    if bad and not args.fix:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

