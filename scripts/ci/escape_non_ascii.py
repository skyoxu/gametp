import os
import sys


def escape_non_ascii(s: str) -> str:
    out = []
    for ch in s:
        code = ord(ch)
        if code < 128:
            out.append(ch)
        else:
            out.append(f"\\u{code:04x}")
    return "".join(out)


def process_file(path: str) -> bool:
    try:
        with open(path, "r", encoding="utf-8", errors="strict") as f:
            original = f.read()
    except Exception:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            original = f.read()
    escaped = escape_non_ascii(original)
    if escaped != original:
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            f.write(escaped)
        print(f"escaped: {path}")
        return True
    return False


def main(argv: list[str]) -> int:
    targets = argv[1:]
    if not targets:
        targets = [
            os.path.join("src", "shared", "observability"),
            os.path.join("src", "shared", "contracts"),
        ]
    changed = 0
    for t in targets:
        if os.path.isdir(t):
            for dirpath, _, files in os.walk(t):
                for f in files:
                    if f.endswith((".ts", ".tsx", ".js", ".mjs")):
                        p = os.path.join(dirpath, f)
                        if process_file(p):
                            changed += 1
        elif os.path.isfile(t):
            if process_file(t):
                changed += 1
    print(f"files_changed={changed}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))

