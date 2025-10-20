"""
Run npm audit (prod and all) and write JSON outputs under logs/YYYY-MM-DD/security/.

Windows-only friendly; uses Python subprocess to avoid PowerShell quoting pitfalls.
"""

from __future__ import annotations

import json
import os
import subprocess
import shutil
from datetime import datetime
from pathlib import Path


def run(cmd: list[str], timeout_sec: int) -> tuple[int, str, str]:
    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        out, err = proc.communicate(timeout=timeout_sec)
        return proc.returncode, out, err
    except subprocess.TimeoutExpired:
        try:
            proc.kill()
        except Exception:
            pass
        return 124, "", f"timeout after {timeout_sec}s"


def main() -> int:
    root = Path.cwd()
    date_str = datetime.now().strftime("%Y-%m-%d")
    out_dir = root / "logs" / date_str / "security"
    out_dir.mkdir(parents=True, exist_ok=True)

    prod_path = out_dir / "npm-audit-prod.json"
    all_path = out_dir / "npm-audit-all.json"

    npm = shutil.which("npm.cmd") or shutil.which("npm") or "npm"
    timeout = int(os.environ.get("NPM_AUDIT_TIMEOUT_SEC", "120"))
    code1, out1, err1 = run([npm, "audit", "--omit=dev", "--json"], timeout)
    if out1:
        prod_path.write_text(out1, encoding="utf-8")
    else:
        prod_path.write_text(json.dumps({"message": "npm audit prod timed out or failed", "exit_code": code1, "error": err1}), encoding="utf-8")

    code2, out2, err2 = run([npm, "audit", "--json"], timeout)
    if out2:
        all_path.write_text(out2, encoding="utf-8")
    else:
        all_path.write_text(json.dumps({"message": "npm audit all timed out or failed", "exit_code": code2, "error": err2}), encoding="utf-8")

    print("OK")
    print(prod_path.as_posix())
    print(all_path.as_posix())
    # Return 0 regardless; gate is handled elsewhere
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
