"""
Generate dependency update plan based on Dependabot alerts and local lock versions.

Features:
  - Reads latest alerts via scripts/fetch_security_alerts.py (auto-run)
  - Resolves local versions from lock files (npm/pnpm/yarn) and package.json
  - Proposes per-package update command for Windows (npm/pnpm/yarn)
  - Classifies impact (major/minor/patch) relative to local version
  - Writes results to logs/<YYYY-MM-DD>/update-plan/

Notes:
  - Code prints/logs are in English. Token/key are never persisted.
  - References: ADR-0008-deployment-release, ADR-0011-windows-only-platform-and-ci
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
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


def _impact(local: str, target: str) -> str:
    la, lb, lc = _semver_tuple(local)
    ta, tb, tc = _semver_tuple(target)
    if ta > la:
        return "major-bump"
    if tb > lb:
        return "minor"
    if tc > lc:
        return "patch"
    return "none"


def _load_pkg_json() -> Dict[str, Any]:
    pkg = ROOT / "package.json"
    return json.loads(pkg.read_text(encoding="utf-8")) if pkg.exists() else {}


def _resolve_local_versions() -> Tuple[Dict[str, str], str]:
    # npm lock
    versions: Dict[str, str] = {}
    lock = ROOT / "package-lock.json"
    if lock.exists():
        data = json.loads(lock.read_text(encoding="utf-8"))
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
        deps = data.get("dependencies", {})
        if isinstance(deps, dict):
            for n, meta in deps.items():
                if isinstance(meta, dict) and meta.get("version"):
                    versions.setdefault(n, meta["version"])
        return versions, "package-lock.json"

    # pnpm
    plock = ROOT / "pnpm-lock.yaml"
    if plock.exists():
        for line in plock.read_text(encoding="utf-8", errors="ignore").splitlines():
            m = re.match(r"\s{2,}/([^@/]+)@([0-9]+\.[0-9]+\.[0-9]+):\s*$", line)
            if m:
                versions.setdefault(m.group(1), m.group(2))
        return versions, "pnpm-lock.yaml"

    # yarn
    ylock = ROOT / "yarn.lock"
    if ylock.exists():
        name: Optional[str] = None
        for line in ylock.read_text(encoding="utf-8", errors="ignore").splitlines():
            if line.endswith(":") and not line.startswith("  "):
                m = re.match(r"^\"?([^@\"]+)@.+:\"?$", line.strip())
                name = m.group(1) if m else None
            elif line.strip().startswith("version "):
                m = re.search(r'"([0-9]+\.[0-9]+\.[0-9]+)"', line)
                if name and m:
                    versions[name] = m.group(1)
        return versions, "yarn.lock"

    # package.json ranges (fallback)
    pkg = _load_pkg_json()
    for key in ("dependencies", "devDependencies", "optionalDependencies", "peerDependencies"):
        deps = pkg.get(key) or {}
        if isinstance(deps, dict):
            for n, rng in deps.items():
                versions.setdefault(n, str(rng))
    return versions, "package.json (ranges)"


def _detect_manager() -> str:
    if (ROOT / "pnpm-lock.yaml").exists():
        return "pnpm"
    if (ROOT / "yarn.lock").exists():
        return "yarn"
    return "npm"


def _cmd_for(manager: str, name: str, spec: str, dev: bool) -> str:
    if manager == "pnpm":
        return f"pnpm add {'-D ' if dev else ''}{name}@{spec}"
    if manager == "yarn":
        return f"yarn add {'-D ' if dev else ''}{name}@{spec}"
    # npm default
    return f"npm install {'-D ' if dev else ''}{name}@{spec}"


def _specifier(local: str, patched: str) -> Tuple[str, str]:
    la, _, _ = _semver_tuple(local)
    pa, _, _ = _semver_tuple(patched)
    if la == pa:
        return f"^{patched}", "within-same-major"
    # different major -> be conservative
    return patched, "major-bump"


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate dependency update plan from Dependabot alerts")
    parser.add_argument("--owner", default=os.getenv("GH_OWNER"))
    parser.add_argument("--repo", default=os.getenv("GH_REPO"))
    parser.add_argument("--app-id", default=os.getenv("GITHUB_APP_ID"))
    parser.add_argument("--installation-id", default=os.getenv("GITHUB_INSTALLATION_ID"))
    parser.add_argument("--key-path", default=os.getenv("GITHUB_APP_KEY_PATH"))
    parser.add_argument("--api-url", default=os.getenv("GITHUB_API_URL", "https://api.github.com"))

    args = parser.parse_args()

    owner, repo = args.owner, args.repo
    if not owner or not repo:
        o, r = _git_owner_repo()
        owner = owner or o
        repo = repo or r
    if not owner or not repo:
        _fail("Cannot determine owner/repo; pass --owner and --repo")

    if not args.app_id or not args.installation_id or not args.key_path:
        _fail("Missing --app-id / --installation-id / --key-path")
    pem = Path(str(args.key_path))
    if not pem.exists():
        _fail(f"PEM not found: {pem}")

    alerts_path = _run_fetch(owner, repo, str(args.app_id), str(args.installation_id), pem, str(args.api_url))
    data = json.loads(Path(alerts_path).read_text(encoding="utf-8"))
    dep_alerts: List[Dict[str, Any]] = data.get("dependabot") or []

    local_versions, source = _resolve_local_versions()
    manager = _detect_manager()
    pkg_json = _load_pkg_json()
    deps = pkg_json.get("dependencies", {}) or {}
    dev_deps = pkg_json.get("devDependencies", {}) or {}

    plan: List[Dict[str, Any]] = []
    for a in dep_alerts:
        if (a.get("ecosystem") or "").lower() != "npm":
            continue
        name = a.get("dependency") or ""
        if not name:
            continue
        patched = a.get("first_patched") or ""
        local = local_versions.get(name)
        if not local or not patched:
            continue
        spec, spec_note = _specifier(local, patched)
        impact = _impact(local, patched)
        dev = name in dev_deps and name not in deps
        cmd = _cmd_for(manager, name, spec, dev)
        plan.append({
            "package": name,
            "local_version": local,
            "first_patched": patched,
            "vulnerable_range": a.get("vulnerable_range"),
            "manifest": a.get("manifest"),
            "impact": impact,
            "specifier": spec,
            "specifier_note": spec_note,
            "dev": dev,
            "command": cmd,
            "advisory_id": a.get("advisory_id"),
        })

    out_dir = ROOT / "logs" / datetime.now().strftime("%Y-%m-%d") / "update-plan"
    out_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%H%M%S")
    out_json = out_dir / f"dependency-update-plan-{ts}.json"
    out_txt = out_dir / f"dependency-update-plan-{ts}.txt"

    summary = {
        "owner": owner,
        "repo": repo,
        "package_manager": manager,
        "version_source": source,
        "entries": plan,
    }
    out_json.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    with out_txt.open("w", encoding="utf-8") as tf:
        tf.write(f"Repo: {owner}/{repo}\n")
        tf.write(f"Package manager: {manager}\n")
        tf.write(f"Version source: {source}\n")
        tf.write("\nUpdate commands (ordered by impact):\n")
        for entry in sorted(plan, key=lambda e: {"major-bump": 2, "minor": 1, "patch": 0}.get(e.get("impact", "patch"), 3), reverse=True):
            tf.write(
                f" - {entry['command']}    # {entry['package']} {entry['local_version']} -> {entry['specifier']} ({entry['impact']})\n"
            )

    print(f"Repo: {owner}/{repo}")
    print(f"Manager: {manager} | Version source: {source}")
    print(f"Planned entries: {len(plan)}")
    print(f"Logs: {out_json}, {out_txt}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

