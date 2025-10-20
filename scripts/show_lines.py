"""
Print file excerpt (context around a 1-based line number).
Usage (Windows):
  py -3 scripts/show_lines.py --file <path> --line 150 --context 6
"""

from __future__ import annotations

import argparse
from pathlib import Path


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--file", required=True)
    p.add_argument("--line", type=int, required=True)
    p.add_argument("--context", type=int, default=6)
    args = p.parse_args()

    fp = Path(args.file)
    data = fp.read_text(encoding="utf-8", errors="ignore").splitlines()
    i = max(1, args.line - args.context)
    j = min(len(data), args.line + args.context)
    for n in range(i, j + 1):
        prefix = "->" if n == args.line else "  "
        s = data[n - 1]
        out = f"{prefix}{n:6d}: {s}"
        try:
            print(out)
        except UnicodeEncodeError:
            print(out.encode("utf-8", errors="ignore").decode("utf-8", errors="ignore"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
