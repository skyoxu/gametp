import os
import sys
import json
import glob
from datetime import datetime


SEV_WEIGHT = {
    "critical": 100,
    "high": 80,
    "moderate": 50,
    "medium": 50,
    "low": 20,
    None: 0,
}


def find_latest_json() -> str | None:
    candidates = glob.glob(os.path.join("logs", "*", "security", "github_security_*.json"))
    if not candidates:
        return None
    candidates.sort(key=lambda p: os.path.getmtime(p), reverse=True)
    return candidates[0]


def load_json(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def norm_sev(x: str | None) -> str:
    if not x:
        return "unknown"
    x = str(x).lower()
    if x == "moderate":
        return "medium"
    return x


def plan_dependabot(alerts: list[dict]) -> list[dict]:
    items = []
    for a in alerts:
        try:
            dep = (a.get("dependency") or {})
            pkg = ((dep.get("package") or {}).get("name")) or "<unknown>"
            ecosystem = ((dep.get("package") or {}).get("ecosystem")) or "npm"
            scope = dep.get("scope") or "runtime"
            manifest = a.get("manifest_path") or a.get("manifest") or "package.json"
            adv = a.get("security_advisory") or {}
            sev = norm_sev(adv.get("severity"))
            vuln = a.get("security_vulnerability") or {}
            patched = ((vuln.get("first_patched_version") or {}).get("identifier"))
            summary = adv.get("summary") or adv.get("description") or a.get("advisory_summary") or ""
            score = SEV_WEIGHT.get(sev, 0)
            if scope == "runtime":
                score += 10
            if manifest.endswith("package.json"):
                score += 10
            if patched:
                score += 5
            items.append({
                "pkg": pkg,
                "ecosystem": ecosystem,
                "scope": scope,
                "severity": sev,
                "manifest": manifest,
                "patched": patched,
                "summary": summary,
                "score": score,
                "id": a.get("number") or a.get("ghsa_id") or a.get("id"),
            })
        except Exception:
            continue
    items.sort(key=lambda x: x["score"], reverse=True)
    return items


def plan_code_scanning(alerts: list[dict]) -> list[dict]:
    items = []
    for a in alerts:
        try:
            rule = a.get("rule") or {}
            ssev = norm_sev(rule.get("security_severity_level") or a.get("severity"))
            name = rule.get("name") or rule.get("id") or a.get("rule_id")
            msg = ((a.get("most_recent_instance") or {}).get("message") or a.get("message") or {}).get("text") if isinstance((a.get("most_recent_instance") or {}).get("message") or a.get("message") or {}, dict) else ((a.get("most_recent_instance") or {}).get("message") or a.get("message") or "")
            loc = ((a.get("most_recent_instance") or {}).get("location") or a.get("location") or {})
            path = loc.get("path") or "<unknown>"
            line = loc.get("start_line") or loc.get("startLine")
            score = SEV_WEIGHT.get(ssev, 0)
            items.append({
                "rule": name,
                "severity": ssev,
                "message": msg if isinstance(msg, str) else str(msg),
                "path": path,
                "line": line,
                "score": score,
                "url": a.get("html_url") or a.get("url"),
                "id": a.get("number") or a.get("id"),
            })
        except Exception:
            continue
    items.sort(key=lambda x: x["score"], reverse=True)
    return items


def main() -> int:
    jpath = find_latest_json()
    if not jpath:
        print("No security JSON found. Run fetch_github_security.py first.")
        return 1
    data = load_json(jpath)
    dep_section = data.get("dependabot_alerts", {})
    cs_section = data.get("code_scanning_alerts", {})
    dep_items = plan_dependabot(dep_section.get("data") if isinstance(dep_section.get("data"), list) else [])
    cs_items = plan_code_scanning(cs_section.get("data") if isinstance(cs_section.get("data"), list) else [])

    print("Remediation Plan (prioritized)")
    print(f"Source JSON: {jpath}")
    print("")

    # Code scanning first: high impact vulnerabilities
    print("1) Code Scanning (High→Low)")
    top_cs = cs_items[:10]
    if not top_cs:
        print("  - No open alerts")
    else:
        for i, it in enumerate(top_cs, 1):
            loc = f"{it['path']}:{it['line'] or ''}".rstrip(":")
            print(f"  {i}. [{it['severity']}] {it['rule']} — {loc}")
            msg = it['message']
            if len(msg) > 120:
                msg = msg[:117] + "..."
            print(f"     Hint: {msg}")
    print("")

    # Dependabot next: direct runtime deps with available patch
    print("2) Dependabot (Runtime, Direct, High→Low)")
    shown = 0
    for it in dep_items:
        if it["scope"] != "runtime":
            continue
        # Treat manifest at project root as direct
        direct_like = it["manifest"].endswith("package.json")
        if not direct_like:
            continue
        shown += 1
        patched = f" -> upgrade to {it['patched']}" if it.get("patched") else ""
        print(f"  - [{it['severity']}] {it['pkg']} ({it['manifest']}){patched}")
        if shown >= 10:
            break
    if shown == 0:
        print("  - No direct runtime alerts or unable to infer directness")

    print("")
    print("Recommended Order")
    print("  A. Fix all code scanning: high/critical first, then medium; run lint/tests after each change.")
    print("  B. Bump runtime direct deps with patches available; prefer minimal bump (patch/minor).")
    print("  C. Address remaining transitive/dev deps via `npm audit fix` or targeted overrides.")
    print("")

    print("Suggested Commands (validate per item)")
    print("  - For code fixes: open the file shown and apply the rule’s recommendation.")
    print("  - For deps: npm i <pkg>@<fixed> && npm run guard:ci")
    print("  - For transitive: consider `npm audit fix` or `npm dedupe`.\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())

