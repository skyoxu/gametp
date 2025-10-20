"""
Scan repository for zero-byte important files (workflows, scripts, tests, TS).

Categories scanned:
  - GitHub Workflows: .github/workflows/**/*.yml|yaml
  - Scripts: scripts/**/*.(mjs|js|ts|py|ps1)
  - Tests: tests/**/*.(ts|tsx|js|mjs)
  - TS Source: src/**/*.(ts|tsx)
  - Electron: electron/**/*.(ts|tsx)

Outputs:
  - Writes JSON and text summary under logs/<YYYY-MM-DD>/repo-scan/
  - Prints a concise summary to stdout

Notes:
  - Code and messages are in English to comply with repository rules.
  - Minimum Python version: 3.8+

References:
  - ADR-0005-quality-gates (quality checks in CI)
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from datetime import datetime
from typing import List, Dict


ROOT = Path.cwd()


def collect_candidates() -> List[Dict[str, str]]:
    candidates: List[Dict[str, str]] = []

    def add_if_match(base: Path, exts: set[str], category: str) -> None:
        if not base.exists():
            return
        for p in base.rglob("*"):
            if p.is_file() and p.suffix.lower() in exts:
                candidates.append({"path": str(p.relative_to(ROOT)), "category": category})

    # Workflows
    add_if_match(ROOT / ".github" / "workflows", {".yml", ".yaml"}, "workflow")

    # Scripts
    add_if_match(ROOT / "scripts", {".mjs", ".js", ".ts", ".py", ".ps1"}, "script")

    # Tests (unit/e2e/perf)
    add_if_match(ROOT / "tests", {".ts", ".tsx", ".js", ".mjs"}, "test")

    # TS sources
    add_if_match(ROOT / "src", {".ts", ".tsx"}, "ts-src")

    # Electron
    add_if_match(ROOT / "electron", {".ts", ".tsx"}, "electron")

    return candidates


def find_zero_bytes(candidates: List[Dict[str, str]]) -> List[Dict[str, str]]:
    results: List[Dict[str, str]] = []
    for item in candidates:
        rel = item["path"]
        p = ROOT / rel
        try:
            size = p.stat().st_size
        except FileNotFoundError:
            # Skip files that vanished mid-scan
            continue
        if size == 0:
            results.append({"path": rel, "category": item["category"], "size": size})
    return results


def ensure_log_dir() -> Path:
    today = datetime.now().strftime("%Y-%m-%d")
    out_dir = ROOT / "logs" / today / "repo-scan"
    out_dir.mkdir(parents=True, exist_ok=True)
    return out_dir


def write_logs(results: List[Dict[str, str]]) -> Dict[str, str]:
    out_dir = ensure_log_dir()
    timestamp = datetime.now().strftime("%H%M%S")
    json_path = out_dir / f"zero-byte-files-{timestamp}.json"
    txt_path = out_dir / f"zero-byte-files-{timestamp}.txt"

    with json_path.open("w", encoding="utf-8") as jf:
        json.dump({"count": len(results), "files": results}, jf, indent=2)

    with txt_path.open("w", encoding="utf-8") as tf:
        if not results:
            tf.write("No zero-byte important files found.\n")
        else:
            tf.write("Zero-byte important files (path | category)\n")
            for r in results:
                tf.write(f"{r['path']} | {r['category']}\n")

    return {"json": str(json_path.relative_to(ROOT)), "txt": str(txt_path.relative_to(ROOT))}


def main() -> int:
    candidates = collect_candidates()
    zeroes = find_zero_bytes(candidates)
    out_paths = write_logs(zeroes)

    if not zeroes:
        print("OK: No zero-byte important files found.")
        print(f"Logs: {out_paths['json']}, {out_paths['txt']}")
        return 0

    print("Found zero-byte important files:")
    for r in zeroes:
        print(f" - {r['path']} [{r['category']}] (size={r['size']})")
    print(f"Logs: {out_paths['json']}, {out_paths['txt']}")
    return 2  # non-zero to signal attention if used in CI


if __name__ == "__main__":
    raise SystemExit(main())
