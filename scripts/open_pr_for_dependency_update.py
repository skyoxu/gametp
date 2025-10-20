"""
Open a draft PR for dependency updates even if gates failed.

Actions:
  - Create/checkout a branch
  - Commit package.json and package-lock.json only
  - Push via HTTPS using GitHub App installation token
  - Create a Draft PR with context (E2E perf failure note if present)

Inputs:
  --app-id, --installation-id, --key-path, [--api-url]
  [--owner], [--repo], [--branch], [--base]

References: ADR-0005-quality-gates, ADR-0008-deployment-release
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple

ROOT = Path.cwd()


def _fail(msg: str) -> None:
    print(f"ERROR: {msg}")
    raise SystemExit(2)


def _git_owner_repo() -> Tuple[str, str]:
    url = subprocess.check_output(["git", "remote", "get-url", "origin"], text=True).strip()
    m = re.search(r"github\.com[:/]([^/]+)/([^\.\s]+)", url)
    if not m:
        _fail("Cannot parse owner/repo from origin")
    return m.group(1), m.group(2)


def _default_branch() -> str:
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


def _acquire_token(app: str, inst: str, key: Path, api: str) -> str:
    out = subprocess.check_output([
        "py", "-3", str(ROOT / "scripts" / "github_app_token.py"),
        "--app-id", app,
        "--installation-id", inst,
        "--key-path", str(key),
        "--api-url", api,
        "--print-token",
    ], text=True)
    m = re.search(r"Token \(sensitive\):\s*\r?\n([A-Za-z0-9_\-\.]+)", out)
    if not m:
        _fail("Failed to parse token from github_app_token output")
    return m.group(1)


def _read_perf_note() -> str:
    # Best effort: read last lines from auto-update gates log
    d = ROOT / "logs" / datetime.now().strftime("%Y-%m-%d") / "auto-update" / "gates.log"
    if not d.exists():
        return ""
    text = d.read_text(encoding="utf-8", errors="ignore")
    m = re.search(r"p95\:.*?\n.*?threshold:.*?\n", text, re.IGNORECASE | re.DOTALL)
    if not m:
        return ""
    return m.group(0)


def main() -> int:
    parser = argparse.ArgumentParser(description="Open a draft PR for dependency updates")
    parser.add_argument("--owner", default=os.getenv("GH_OWNER"))
    parser.add_argument("--repo", default=os.getenv("GH_REPO"))
    parser.add_argument("--branch", default=f"chore/security/deps-update-{datetime.now().strftime('%Y%m%d')}"
                        )
    parser.add_argument("--base", default=None)
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

    base = args.base or _default_branch()
    branch = args.branch

    # Prepare commit (only package.json and lock)
    subprocess.check_call(["git", "checkout", "-B", branch])
    subprocess.check_call(["git", "add", "package.json", "package-lock.json"])
    subprocess.check_call(["git", "config", "user.name", "gametp-bot"])
    subprocess.check_call(["git", "config", "user.email", "gametp-bot@example.com"])
    subprocess.check_call([
        "git", "commit", "-m",
        (
            "chore(deps): security patches via Dependabot plan\n\n"
            "Refs: ADR-0005-quality-gates, ADR-0008-deployment-release\n"
        ),
    ])

    token = _acquire_token(str(args.app_id), str(args.installation_id), key, str(args.api_url))
    https_url = f"https://x-access-token:{token}@github.com/{owner}/{repo}.git"
    subprocess.call(["git", "remote", "remove", "bot"])
    subprocess.check_call(["git", "remote", "add", "bot", https_url])
    subprocess.check_call(["git", "push", "-f", "bot", branch])

    # PR body
    perf_note = _read_perf_note()
    body = (
        "Automated dependency updates to reach first patched versions.\n\n"
        "- References: ADR-0005-quality-gates, ADR-0008-deployment-release\n"
    )
    if perf_note:
        body += f"- E2E perf gate failed in local run:\n\n````\n{perf_note}````\n\n"

    # Create draft PR
    import urllib.request
    req = urllib.request.Request(
        url=f"{str(args.api_url).rstrip('/')}/repos/{owner}/{repo}/pulls",
        method="POST",
        data=json.dumps({
            "title": "chore(deps): security patches via Dependabot plan",
            "head": branch,
            "base": base,
            "body": body,
            "maintainer_can_modify": True,
            "draft": True,
        }).encode("utf-8"),
    )
    req.add_header("Authorization", f"token {token}")
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("User-Agent", "gametp-open-pr/1.0")
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=30) as resp:  # noqa: S310
        payload = json.loads(resp.read().decode(resp.headers.get_content_charset() or "utf-8"))
        print(payload.get("html_url"))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

