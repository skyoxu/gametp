import sys
from pathlib import Path
import datetime


def normalize_to_utf8_no_bom(file_path: Path) -> dict:
    # Read with utf-8-sig to strip BOM if present
    text = file_path.read_text(encoding="utf-8-sig")
    # Normalize line endings to LF
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Write back as utf-8 (no BOM)
    file_path.write_text(text, encoding="utf-8", newline="\n")
    return {"path": str(file_path), "bytes": len(text.encode("utf-8"))}


def main(argv: list[str]) -> int:
    if not argv:
        print("Usage: python remove_bom.py <file> [<file> ...]", file=sys.stderr)
        return 2
    date = datetime.datetime.now().strftime("%Y-%m-%d")
    log_dir = Path("logs") / date / "encoding"
    log_dir.mkdir(parents=True, exist_ok=True)
    results = []
    for arg in argv:
        p = Path(arg)
        if not p.exists():
            print(f"skip: {p} (not found)")
            continue
        info = normalize_to_utf8_no_bom(p)
        results.append(info)
        print(f"normalized: {info['path']} ({info['bytes']} bytes utf-8)")
    # write summary
    (log_dir / "remove_bom_summary.txt").write_text(
        "\n".join([f"normalized {r['path']} -> {r['bytes']} bytes" for r in results]),
        encoding="utf-8",
    )
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

