import os
import sys


TEXT_EXTS = {
    ".ts",
    ".tsx",
    ".js",
    ".mjs",
    ".cjs",
    ".json",
    ".yml",
    ".yaml",
    ".md",
    ".html",
    ".css",
    ".txt",
    ".c",
    ".cpp",
    ".h",
    ".hpp",
}

EXCLUDE_DIRS = {
    "node_modules",
    "dist",
    "dist-electron",
    ".git",
    "coverage",
    "test-results",
}


def strip_bom_in_file(path: str) -> bool:
    try:
        with open(path, "rb") as f:
            data = f.read()
        if data.startswith(b"\xef\xbb\xbf"):
            with open(path, "wb") as f:
                f.write(data[3:])
            print(f"fixed_bom: {path}")
            return True
    except Exception as e:
        print(f"ERR {path} {e}")
    return False


def should_consider(path: str) -> bool:
    _, ext = os.path.splitext(path)
    return ext.lower() in TEXT_EXTS


def main(argv):
    root = os.getcwd()
    changed = 0
    for dirpath, dirs, files in os.walk(root):
        # prune excluded directories
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for name in files:
            p = os.path.join(dirpath, name)
            if should_consider(p):
                if strip_bom_in_file(p):
                    changed += 1
    print(f"bom_files_fixed={changed}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))

