import os
import sys


def iter_files(root_dirs):
    for base in root_dirs:
        for dirpath, _, files in os.walk(base):
            for f in files:
                if f.endswith((".ts", ".tsx", ".js", ".mjs")):
                    yield os.path.join(dirpath, f)


def has_non_ascii(s: str) -> bool:
    return any(ord(c) > 127 for c in s)


def main(argv: list[str]) -> int:
    roots = argv[1:] or [
        os.path.join("src", "shared", "observability"),
        os.path.join("src", "shared", "contracts"),
    ]
    total = 0
    for p in iter_files(roots):
        try:
            with open(p, "r", encoding="utf-8", errors="replace") as fh:
                for i, line in enumerate(fh, 1):
                    if has_non_ascii(line):
                        print(f"{p}:{i}:{line.rstrip()[:160]}")
                        total += 1
                        if total > 1000:
                            print("... (truncated)")
                            print(f"TOTAL>1000; stopping early.")
                            return 0
        except Exception as e:
            print(f"ERR {p} {e}")
    print(f"TOTAL lines with non-ascii: {total}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))

