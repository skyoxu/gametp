"""
Verify whether some remote security alerts appear fixed in the local workspace.

Scope:
  - Dependabot (npm): compare local locked versions against first patched version.
  - Code scanning: mark alerts whose file path no longer exists locally.

Inputs (flags or env fallbacks):
  --owner / GH_OWNER (optional; auto from git remote)
  --repo / GH_REPO  (optional; auto from git remote)
  --app-id / GITHUB_APP_ID
  --installation-id / GITHUB_INSTALLATION_ID
  --key-path / GITHUB_APP_KEY_PATH
  --api-url (default: https://api.github.com)

Behavior:
  - Calls scripts/fetch_security_alerts.py to refresh latest JSON.
  - Parses local lock files (npm/yarn/pnpm best-effort) to resolve versions.
  - Writes results into logs/<YYYY-MM-DD>/security-verify/.

Notes:
  - No secrets or tokens are written to disk.
  - Semver comparison is simplified (major.minor.patch only; pre-release ignored).

References:
  - ADR-0008-deployment-release, ADR-0011-windows-only-platform-and-ci
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


ROOT = Path.cwd()


def _fail(msg: str) -> None:
    print(f"ERROR: {msg}")
    raise SystemExit(2)


def _run_fetch(owner: Optional[str], repo: Optional[str], app_id: str, installation_id: str, key_path: Path, api_url: str) -> Path:
    cmd = [
        "py", "-3", str(ROOT / "scripts" / "fetch_security_alerts.py"),
        "--app-id", str(app_id),
        "--installation-id", str(installation_id),
        "--key-path", str(key_path),
        "--api-url", api_url,
    ]
    if owner:
        cmd += ["--owner", owner]
    if repo:
        cmd += ["--repo", repo]

    out = subprocess.check_output(cmd, text=True)
    m = re.search(r"Logs:\s*(.+security-alerts-\d+\.json)", out)
    if not m:
        _fail("Cannot find JSON log path from fetch script output.")
    return Path(m.group(1))


def _latest_security_json() -> Optional[Path]:
    today_dir = ROOT / "logs" / datetime.now().strftime("%Y-%m-%d") / "security"
    if not today_dir.exists():
        return None
    cands = sorted(today_dir.glob("security-alerts-*.json"))
    return cands[-1] if cands else None


def _git_owner_repo() -> Tuple[Optional[str], Optional[str]]:
    try:
        url = subprocess.check_output(["git", "remote", "get-url", "origin"], text=True).strip()
    except Exception:
        return None, None
    m = re.search(r"github\.com[:/]([^/]+)/([^\.\s]+)", url)
    if not m:
        return None, None
    return m.group(1), m.group(2)


def _semver_tuple(v: str) -> Tuple[int, int, int]:
    m = re.match(r"(\d+)\.(\d+)\.(\d+)", v or "0.0.0")
    if not m:
        return 0, 0, 0
    return int(m.group(1)), int(m.group(2)), int(m.group(3))


def _semver_gte(a: str, b: str) -> bool:
    return _semver_tuple(a) >= _semver_tuple(b)


def _load_pkg_lock_versions() -> Dict[str, str]:
    versions: Dict[str, str] = {}
    lock = ROOT / "package-lock.json"
    if not lock.exists():
        return versions
    data = json.loads(lock.read_text(encoding="utf-8"))
    # npm v7+ structure
    pkgs = data.get("packages", {})
    if isinstance(pkgs, dict):
        for k, v in pkgs.items():
            if not isinstance(v, dict):
                continue
            name = v.get("name")
            if not name and k.startswith("node_modules/"):
                name = k.split("/", 1)[1]
            ver = v.get("version")
            if name and ver:
                versions.setdefault(name, ver)
    # fallback to dependencies tree
    deps = data.get("dependencies", {})
    if isinstance(deps, dict):
        for name, meta in deps.items():
            if isinstance(meta, dict) and meta.get("version"):
                versions.setdefault(name, meta["version"])
    return versions


def _load_yarn_lock_versions() -> Dict[str, str]:
    versions: Dict[str, str] = {}
    lock = ROOT / "yarn.lock"
    if not lock.exists():
        return versions
    name: Optional[str] = None
    for line in lock.read_text(encoding="utf-8", errors="ignore").splitlines():
        if line.endswith(":") and not line.startswith("  "):
            # e.g., "pkg@^1.2.3:"
            m = re.match(r"^\"?([^@\"]+)@.+:\"?$", line.strip())
            name = m.group(1) if m else None
        elif line.strip().startswith("version "):
            m = re.search(r'"([0-9]+\.[0-9]+\.[0-9]+)"', line)
            if name and m:
                versions[name] = m.group(1)
    return versions


def _load_pnpm_lock_versions() -> Dict[str, str]:
    versions: Dict[str, str] = {}
    lock = ROOT / "pnpm-lock.yaml"
    if not lock.exists():
        return versions
    # Best-effort regex parse entries like: "/pkg@1.2.3":
    for line in lock.read_text(encoding="utf-8", errors="ignore").splitlines():
        m = re.match(r"\s{2,}/([^@/]+)@([0-9]+\.[0-9]+\.[0-9]+):\s*$", line)
        if m:
            versions.setdefault(m.group(1), m.group(2))
    return versions


def _load_pkg_json_ranges() -> Dict[str, str]:
    versions: Dict[str, str] = {}
    pkg = ROOT / "package.json"
    if not pkg.exists():
        return versions
    data = json.loads(pkg.read_text(encoding="utf-8"))
    for key in ("dependencies", "devDependencies", "optionalDependencies", "peerDependencies"):
        deps = data.get(key) or {}
        if isinstance(deps, dict):
            for n, rng in deps.items():
                versions.setdefault(n, str(rng))
    return versions


def _resolve_local_versions() -> Tuple[Dict[str, str], str]:
    # Priority: package-lock.json > pnpm-lock.yaml > yarn.lock > package.json
    src = ""
    versions = _load_pkg_lock_versions()
    if versions:
        src = "package-lock.json"
        return versions, src
    versions = _load_pnpm_lock_versions()
    if versions:
        src = "pnpm-lock.yaml"
        return versions, src
    versions = _load_yarn_lock_versions()
    if versions:
        src = "yarn.lock"
        return versions, src
    versions = _load_pkg_json_ranges()
    if versions:
        src = "package.json (ranges)"
    return versions, src


def _ensure_log_dir() -> Path:
    d = ROOT / "logs" / datetime.now().strftime("%Y-%m-%d") / "security-verify"
    d.mkdir(parents=True, exist_ok=True)
    return d


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify local fixes vs remote security alerts")
    parser.add_argument("--owner", default=os.getenv("GH_OWNER"))
    parser.add_argument("--repo", default=os.getenv("GH_REPO"))
    parser.add_argument("--app-id", default=os.getenv("GITHUB_APP_ID"))
    parser.add_argument("--installation-id", default=os.getenv("GITHUB_INSTALLATION_ID"))
    parser.add_argument("--key-path", default=os.getenv("GITHUB_APP_KEY_PATH"))
    parser.add_argument("--api-url", default=os.getenv("GITHUB_API_URL", "https://api.github.com"))

    args = parser.parse_args()

    owner, repo = args.owner, args.repo
    if not owner or not repo:
        auto_owner, auto_repo = _git_owner_repo()
        owner = owner or auto_owner
        repo = repo or auto_repo
    if not owner or not repo:
        _fail("Cannot determine owner/repo; pass --owner and --repo")

    if not args.app_id or not args.installation_id or not args.key_path:
        _fail("Missing --app-id / --installation-id / --key-path")

    pem = Path(str(args.key_path))
    if not pem.exists():
        _fail(f"PEM not found: {pem}")

    # Refresh alerts and get JSON path
    json_path = _run_fetch(owner, repo, str(args.app_id), str(args.installation_id), pem, str(args.api_url))

    data = json.loads(Path(json_path).read_text(encoding="utf-8"))
    dep_alerts: List[Dict[str, Any]] = data.get("dependabot") or []
    code_alerts: List[Dict[str, Any]] = data.get("code_scanning") or []

    local_versions, source = _resolve_local_versions()

    results: List[Dict[str, Any]] = []
    fixed_count = 0
    unknown_count = 0
    still_count = 0

    for a in dep_alerts:
        if (a.get("ecosystem") or "").lower() != "npm":
            continue
        name = a.get("dependency") or ""
        patched = a.get("first_patched") or ""
        local_ver = local_versions.get(name)
        status = "unknown"
        if local_ver and patched:
            status = "fixed-locally" if _semver_gte(local_ver, patched) else "still-vulnerable"
        elif local_ver and not patched:
            status = "unknown"

        if status == "fixed-locally":
            fixed_count += 1
        elif status == "still-vulnerable":
            still_count += 1
        else:
            unknown_count += 1

        results.append({
            "dependency": name,
            "local_version": local_ver,
            "first_patched": patched,
            "vulnerable_range": a.get("vulnerable_range"),
            "status": status,
            "manifest": a.get("manifest"),
            "severity": a.get("severity"),
            "advisory_id": a.get("advisory_id"),
        })

    code_results: List[Dict[str, Any]] = []
    code_fixed_by_absence = 0
    for c in code_alerts:
        path = c.get("path")
        exists = bool(path) and (ROOT / str(path)).exists()
        status = "present-unknown" if exists else "file-missing-possibly-fixed"
        if not exists:
            code_fixed_by_absence += 1
        code_results.append({
            "path": path,
            "rule_id": c.get("rule_id"),
            "severity": c.get("severity"),
            "status": status,
        })

    out_dir = _ensure_log_dir()
    ts = datetime.now().strftime("%H%M%S")
    out_json = out_dir / f"security-local-verify-{ts}.json"
    out_txt = out_dir / f"security-local-verify-{ts}.txt"

    summary = {
        "owner": owner,
        "repo": repo,
        "version_source": source or "unknown",
        "dependabot": {
            "fixed_locally": fixed_count,
            "still_vulnerable": still_count,
            "unknown": unknown_count,
            "results": results,
        },
        "code_scanning": {
            "file_missing": code_fixed_by_absence,
            "results": code_results,
        },
    }
    out_json.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    with out_txt.open("w", encoding="utf-8") as tf:
        tf.write(f"Repo: {owner}/{repo}\n")
        tf.write(f"Version source: {source or 'unknown'}\n")
        tf.write("\nDependabot (local status):\n")
        tf.write(f" - fixed-locally: {fixed_count}\n")
        tf.write(f" - still-vulnerable: {still_count}\n")
        tf.write(f" - unknown: {unknown_count}\n")
        if results:
            tf.write("\nTop entries:\n")
            for r in results[:10]:
                tf.write(f" - {r['dependency']} local={r['local_version']} patched={r['first_patched']} | {r['status']}\n")
        tf.write("\nCode scanning (local presence):\n")
        tf.write(f" - file-missing-possibly-fixed: {code_fixed_by_absence}\n")

    print(f"Repo: {owner}/{repo}")
    print(f"Version source: {source or 'unknown'}")
    print(f"Dependabot fixed-locally: {fixed_count} | still: {still_count} | unknown: {unknown_count}")
    print(f"Code scanning file-missing: {code_fixed_by_absence}")
    print(f"Logs: {out_json}, {out_txt}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

