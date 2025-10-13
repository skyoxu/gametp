#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Parse a GitHub Actions run logs ZIP (downloaded via fetch_run_logs_with_token.py)
and print a concise failure-oriented summary to stdout and $GITHUB_STEP_SUMMARY.

Heuristics:
- Show file list
- For each *.txt log inside ZIP: tail last 200 lines
- Extract lines with common error markers (npm ERR!, ERROR, Error:, failed, EBUSY, ELIFECYCLE)
"""
import argparse
import os
import re
import sys
import zipfile
from pathlib import Path


def today_dirs(base: Path) -> list[Path]:
    logs = base.glob("*/gh-logs")
    return sorted(logs)


def find_zip(base: Path, run_id: str | None) -> Path | None:
    if run_id:
        for p in base.glob(f"*/gh-logs/run-{run_id}.zip"):
            return p
    # fallback to latest
    candidates = sorted(base.glob("*/gh-logs/run-*.zip"))
    return candidates[-1] if candidates else None


def tail(lines: list[str], n: int) -> list[str]:
    return lines[-n:] if len(lines) > n else lines


def parse_zip(zpath: Path) -> tuple[list[str], dict[str, list[str]], list[str]]:
    files = []
    tails: dict[str, list[str]] = {}
    errors: list[str] = []
    markers = re.compile(r"(npm ERR!|ERROR|Error:|ELIFECYCLE|EBUSY|failed|FAIL|Traceback)")
    with zipfile.ZipFile(zpath, "r") as zf:
        for name in zf.namelist():
            files.append(name)
            if not name.lower().endswith(".txt"):
                continue
            try:
                content = zf.read(name).decode("utf-8", errors="replace")
            except Exception:
                continue
            ls = content.splitlines()
            tails[name] = tail(ls, 200)
            for ln in ls[-1000:]:  # recent window
                if markers.search(ln):
                    errors.append(f"{name}: {ln}")
    return files, tails, errors


def write_summary(text: str):
    out = os.environ.get("GITHUB_STEP_SUMMARY")
    if not out:
        return
    try:
        with open(out, "a", encoding="utf-8") as f:
            f.write(text)
            if not text.endswith("\n"):
                f.write("\n")
    except Exception:
        pass


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--zip", dest="zip_path", default="")
    ap.add_argument("--run-id", dest="run_id", default="")
    args = ap.parse_args()

    base = Path("logs")
    zpath = Path(args.zip_path) if args.zip_path else find_zip(base, args.run_id or None)
    if not zpath or not zpath.exists():
        print("[parse] ZIP not found. Provide --zip or ensure logs/*/gh-logs/run-<id>.zip exists.")
        sys.exit(2)

    files, tails, errors = parse_zip(zpath)
    header = f"\n## Parsed run logs: {zpath.name}\n"
    print(header)
    write_summary(header)

    # File list
    flines = ["### Files", *[f"- {n}" for n in files[:50]]]
    print("\n".join(flines))
    write_summary("\n".join(flines))

    # Errors
    if errors:
        elines = ["\n### Error markers (last ~1000 lines per log)"]
        elines.extend([f"- {ln}" for ln in errors[:100]])
        print("\n".join(elines))
        write_summary("\n".join(elines))

    # Tails
    print("\n### Log tails (last 200 lines per *.txt)\n")
    write_summary("\n### Log tails (last 200 lines per *.txt)\n")
    count = 0
    for name, tail_lines in tails.items():
        count += 1
        hdr = f"\n#### {name}\n"
        print(hdr)
        write_summary(hdr)
        chunk = "\n".join(tail_lines)
        # Avoid flooding summary; still print to console for raw logs
        print(chunk)
        # Summary truncation: only first 80 lines per file
        write_summary("\n".join(tail_lines[:80]))

    print(f"\n[parse] Done. Files={len(files)}, txt={len(tails)}, errors~={len(errors)}")


if __name__ == "__main__":
    main()

