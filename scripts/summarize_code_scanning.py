"""
Summarize latest code scanning alerts from logs/<date>/security/security-alerts-*.json
and write a simple remediation plan to logs/<date>/security/.

Outputs:
  - Prints a concise list: index, severity, rule_id, path, start_line
  - Writes logs/<YYYY-MM-DD>/security/code-scanning-summary-<HHMMSS>.txt
"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List


ROOT = Path.cwd()


def _latest_security_json() -> Path | None:
    d = ROOT / "logs" / datetime.now().strftime("%Y-%m-%d") / "security"
    if not d.exists():
        return None
    files = sorted(d.glob("security-alerts-*.json"))
    return files[-1] if files else None


def main() -> int:
    j = _latest_security_json()
    if not j or not j.exists():
        print("No security alerts JSON found for today. Run scripts/fetch_security_alerts.py first.")
        return 1
    data = json.loads(j.read_text(encoding="utf-8"))
    code: List[Dict[str, Any]] = data.get("code_scanning") or []
    ts = datetime.now().strftime("%H%M%S")
    out = j.parent / f"code-scanning-summary-{ts}.txt"
    lines: List[str] = []
    lines.append(f"Code scanning alerts: {len(code)}\n")
    for idx, r in enumerate(code, 1):
        lines.append(
            f"{idx}. sev={r.get('severity')} rule={r.get('rule_id')} path={r.get('path')} line={r.get('start_line')}"
        )
    lines.append("\nRemediation hints (generic):")
    lines.append("- Input validation/escaping for taint-sources; prefer safe APIs.")
    lines.append("- Avoid eval/new Function; use safe parsers.")
    lines.append("- Use parameterized queries; avoid string SQL concatenation.")
    lines.append("- Sanitize filesystem and process inputs; whitelist allowed values.")
    lines.append("- Strengthen Electron preload validations per ADR-0002.")
    out.write_text("\n".join(lines), encoding="utf-8")
    print("\n".join(lines))
    print(f"\nSummary: {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

