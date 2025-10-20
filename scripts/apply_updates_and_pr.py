"""
Apply dependency update plan, run gates, and open a PR using GitHub App token (Windows friendly).

Steps:
  1) Ensure latest update plan (invokes generate_dependency_update_plan.py)
  2) Execute update commands sequentially (npm/pnpm/yarn)
  3) Prepare E2E env (npx playwright install) then run: typecheck, lint, unit, e2e
  4) Create a branch, commit lockfile + package.json changes, push via HTTPS using App token
  5) Open PR via GitHub API

Logs:
  - logs/<YYYY-MM-DD>/auto-update/*.log and summary JSON

Notes:
  - No sensitive token written to disk
  - Requires: Node, package manager, and pyjwt installed
  - References: ADR-0005-quality-gates, ADR-0008-deployment-release, ADR-0011-windows-only-platform-and-ci
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


ROOT = Path.cwd()


def _fail(msg: str) -> None:
    print(f"ERROR: {msg}")
    raise SystemExit(2)


def _log_dir() -> Path:
    d = ROOT / "logs" / datetime.now().strftime("%Y-%m-%d") / "auto-update"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _run(cmd: List[str], log_file: Path) -> int:
    with log_file.open("a", encoding="utf-8") as lf:
        lf.write(f"$ {' '.join(cmd)}\n")
        lf.flush()
        proc = subprocess.Popen(cmd, stdout=lf, stderr=lf, cwd=ROOT)
        return proc.wait()


def _git_owner_repo() -> Tuple[str, str]:
    url = subprocess.check_output(["git", "remote", "get-url", "origin"], text=True).strip()
    m = re.search(r"github\.com[:/]([^/]+)/([^\.\s]+)", url)
    if not m:
        _fail("Cannot parse owner/repo from origin")
    return m.group(1), m.group(2)


def _ensure_plan(owner: Optional[str], repo: Optional[str], app: str, inst: str, key: Path, api: str) -> Path:
    cmd = [
        "py", "-3", str(ROOT / "scripts" / "generate_dependency_update_plan.py"),
        "--app-id", app,
        "--installation-id", inst,
        "--key-path", str(key),
        "--api-url", api,
    ]
    if owner:
        cmd += ["--owner", owner]
    if repo:
        cmd += ["--repo", repo]
    out = subprocess.check_output(cmd, text=True)
    m = re.search(r"Logs:\s*(.+update-plan.+\.json)", out)
    if not m:
        _fail("Cannot find update plan JSON path from generator output")
    return Path(m.group(1))


def _read_plan(path: Path) -> List[Dict[str, Any]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    return data.get("entries") or []


def _node_info() -> Dict[str, str]:
    info: Dict[str, str] = {}
    try:
        info["node"] = subprocess.check_output(["node", "-v"], text=True).strip()
    except Exception:
        info["node"] = "missing"
    try:
        info["npm"] = subprocess.check_output(["npm", "-v"], text=True).strip()
    except Exception:
        info["npm"] = "missing"
    return info


def _resolve_npm_cli() -> Optional[str]:
    try:
        # Resolve npm CLI JS via Node
        p = subprocess.check_output(["node", "-p", "require.resolve('npm/bin/npm-cli.js')"], text=True).strip()
        return p if p else None
    except Exception:
        return None


def _run_npm(args: List[str], log_file: Path) -> int:
    """Run npm subcommand using node npm-cli.js to avoid PATH issues for npm on Windows."""
    # Try native npm on PATH first
    try:
        return _run(["npm"] + args, log_file)
    except Exception:
        pass
    # Try npm.cmd alongside node.exe
    npm_cmd = _find_npm_cmd()
    if npm_cmd:
        return _run([npm_cmd] + args, log_file)
    # Fallback to Node's npm CLI resolution
    npm_cli = _resolve_npm_cli()
    if npm_cli:
        return _run(["node", npm_cli] + args, log_file)
    return 9001


def _find_npm_cmd() -> Optional[str]:
    # Attempt to locate npm.cmd in the same folder as node.exe on Windows
    try:
        node_path = subprocess.check_output(["where", "node"], text=True).splitlines()[0].strip()
        p = Path(node_path).parent / "npm.cmd"
        if p.exists():
            return str(p)
    except Exception:
        pass
    # Last resort: common installation path
    for p in (
        Path("C:/Program Files/nodejs/npm.cmd"),
        Path("C:/Program Files (x86)/nodejs/npm.cmd"),
    ):
        if p.exists():
            return str(p)
    return None


def _run_playwright_install(log_file: Path) -> int:
    # Prefer local Playwright CLI
    cli = ROOT / "node_modules" / "playwright" / "cli.js"
    if cli.exists():
        return _run(["node", str(cli), "install"], log_file)
    # Fallback to npx if available
    return _run(["npx", "playwright", "install"], log_file)


def _acquire_token(app: str, inst: str, key: Path, api: str) -> str:
    cmd = [
        "py", "-3", str(ROOT / "scripts" / "github_app_token.py"),
        "--app-id", app,
        "--installation-id", inst,
        "--key-path", str(key),
        "--api-url", api,
        "--print-token",
    ]
    out = subprocess.check_output(cmd, text=True)
    # Token (sensitive):\n<token>
    m = re.search(r"Token \(sensitive\):\s*\r?\n([A-Za-z0-9_\-\.]+)", out)
    if not m:
        _fail("Failed to parse token from github_app_token output")
    return m.group(1)


def _default_branch() -> str:
    # Try reading remote HEAD symbolic ref, fall back to main/master
    try:
        ref = subprocess.check_output(["git", "symbolic-ref", "refs/remotes/origin/HEAD"], text=True).strip()
        m = re.search(r"origin/(.+)$", ref)
        if m:
            return m.group(1)
    except Exception:
        pass
    for name in ("main", "master"):
        try:
            subprocess.check_call(["git", "rev-parse", f"origin/{name}"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return name
        except Exception:
            continue
    return "main"


def main() -> int:
    parser = argparse.ArgumentParser(description="Apply dependency update plan and open a PR")
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

    if not args.app_id or not args.installation_id or not args.key_path:
        _fail("Missing --app-id / --installation-id / --key-path")

    key = Path(str(args.key_path))
    if not key.exists():
        _fail(f"PEM not found: {key}")

    logs_dir = _log_dir()
    cmd_log = logs_dir / "commands.log"
    gates_log = logs_dir / "gates.log"
    summary_json = logs_dir / "summary.json"

    # Plan
    plan_path = _ensure_plan(owner, repo, str(args.app_id), str(args.installation_id), key, str(args.api_url))
    entries = _read_plan(plan_path)
    if not entries:
        print("No entries in plan; nothing to do.")
        summary_json.write_text(json.dumps({"status": "noop", "plan": str(plan_path)}, indent=2), encoding="utf-8")
        return 0

    # Node info
    nodei = _node_info()
    if nodei.get("node") == "missing":
        _fail("Node is not available in PATH")

    # Execute update commands
    for e in entries:
        cmd = e.get("command")
        if not cmd:
            continue
        parts = cmd.split()
        if parts and parts[0] == "npm":
            rc = _run_npm(parts[1:], cmd_log)
        else:
            rc = _run(parts, cmd_log)
        if rc != 0:
            _fail(f"Failed command: {cmd}. See {cmd_log}")

    # Prepare E2E deps and run gates
    _run_playwright_install(gates_log)

    for seq in (
        ["npm", "run", "typecheck"],
        ["npm", "run", "lint"],
        ["npm", "run", "test:unit"],
        ["npm", "run", "test:e2e"],
    ):
        if seq and seq[0] == "npm":
            rc = _run_npm(seq[1:], gates_log)
        else:
            rc = _run(seq, gates_log)
        if rc != 0:
            summary_json.write_text(json.dumps({
                "status": "gates-failed",
                "failed": " ".join(seq),
                "logs": {"commands": str(cmd_log), "gates": str(gates_log)},
                "plan": str(plan_path),
            }, indent=2), encoding="utf-8")
            _fail(f"Gate failed: {' '.join(seq)}. See {gates_log}")

    # Create branch, commit and push
    branch = f"chore/security/deps-update-{datetime.now().strftime('%Y%m%d')}"
    base = _default_branch()
    subprocess.check_call(["git", "checkout", "-B", branch])
    subprocess.check_call(["git", "add", "package.json", "package-lock.json"], cwd=ROOT)
    subprocess.check_call(["git", "config", "user.name", "gametp-bot"])
    subprocess.check_call(["git", "config", "user.email", "gametp-bot@example.com"])

    commit_msg = (
        "chore(deps): security patches via Dependabot plan\n\n"
        "Refs: ADR-0005-quality-gates, ADR-0008-deployment-release\n"
    )
    subprocess.check_call(["git", "commit", "-m", commit_msg], cwd=ROOT)

    token = _acquire_token(str(args.app_id), str(args.installation_id), key, str(args.api_url))
    https_url = f"https://x-access-token:{token}@github.com/{owner}/{repo}.git"
    # Set a temporary remote for pushing
    subprocess.call(["git", "remote", "remove", "bot"], cwd=ROOT)
    subprocess.check_call(["git", "remote", "add", "bot", https_url], cwd=ROOT)
    subprocess.check_call(["git", "push", "-f", "bot", branch], cwd=ROOT)

    # Create PR
    import urllib.request
    req = urllib.request.Request(
        url=f"{str(args.api_url).rstrip('/')}/repos/{owner}/{repo}/pulls",
        method="POST",
        data=json.dumps({
            "title": "chore(deps): security patches via Dependabot plan",
            "head": branch,
            "base": base,
            "body": (
                "Automated dependency updates to reach first patched versions.\n\n"
                "- References: ADR-0005-quality-gates, ADR-0008-deployment-release\n"
                "- Logs are available in repo logs directory (local run).\n"
            ),
            "maintainer_can_modify": True,
            "draft": False,
        }).encode("utf-8"),
    )
    req.add_header("Authorization", f"token {token}")
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("User-Agent", "gametp-auto-update/1.0")
    req.add_header("Content-Type", "application/json")

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:  # noqa: S310
            payload = json.loads(resp.read().decode(resp.headers.get_content_charset() or "utf-8"))
            pr_url = payload.get("html_url")
    except Exception as e:  # noqa: BLE001
        pr_url = None
        err = str(e)
    else:
        err = None

    summary = {
        "status": "ok",
        "owner": owner,
        "repo": repo,
        "base": base,
        "branch": branch,
        "plan": str(plan_path),
        "logs": {"commands": str(cmd_log), "gates": str(gates_log)},
        "pr_url": pr_url,
        "pr_error": err,
    }
    summary_json.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    print(f"Branch: {branch} -> base: {base}")
    print(f"PR: {pr_url or 'creation failed'}")
    print(f"Logs: {cmd_log}, {gates_log}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
