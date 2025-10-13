#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fetch GitHub Actions run logs using a GitHub App (JWT → installation token).
- Windows-only friendly; uses Python 3 and writes logs under logs/YYYY-MM-DD/gh-logs/
- Inputs: --run-url or --run-id/--owner/--repo
- Auth: GH App (env GH_APP_ID + private key via env GH_APP_PRIVATE_KEY or file path)

Usage (Windows):
  py -3 scripts/python/gh_fetch_logs.py --run-url https://github.com/<owner>/<repo>/actions/runs/<run_id>
  py -3 scripts/python/gh_fetch_logs.py --run-id 123456789 --owner skyoxu --repo gametp

Env (one of以下两种):
  GH_APP_ID=2032160 和 GH_APP_PRIVATE_KEY_PATH=gametp-ai-bot.2025-10-10.private-key.pem
  或 GH_APP_ID=2032160 和 GH_APP_PRIVATE_KEY='<PEM content>'
"""

import argparse
import base64
import datetime as dt
import json
import os
import re
import sys
import zipfile
from pathlib import Path

# Lazy-install third-party deps if absent (PyJWT, cryptography, requests)

def ensure_deps():
    try:
        import jwt  # type: ignore
        import requests  # type: ignore
        return
    except Exception:
        pass
    # Try pip install into user site
    py = sys.executable
    os.system(f"{py} -m pip install --upgrade pip >NUL 2>&1")
    code = os.system(f"{py} -m pip install pyjwt cryptography requests")
    if code != 0:
        print("[gh_fetch_logs] Failed to install dependencies (pyjwt/cryptography/requests)")
        sys.exit(1)


ensure_deps()
import jwt  # type: ignore
import requests  # type: ignore

GITHUB_API = os.environ.get("GITHUB_API_URL", "https://api.github.com")


def b64url(s: bytes) -> str:
    return base64.urlsafe_b64encode(s).decode("ascii").rstrip("=")


def read_private_key() -> str:
    pem = os.environ.get("GH_APP_PRIVATE_KEY")
    if pem:
        return pem
    p = os.environ.get("GH_APP_PRIVATE_KEY_PATH", "gametp-ai-bot.2025-10-10.private-key.pem")
    path = Path(p)
    if not path.exists():
        print(f"[gh_fetch_logs] Private key not found at {p}")
        sys.exit(2)
    return path.read_text(encoding="utf-8")


def make_app_jwt(app_id: str, private_key_pem: str) -> str:
    now = int(dt.datetime.utcnow().timestamp())
    payload = {
        "iat": now - 60,  # backdate 60s for clock skew
        "exp": now + 9 * 60,  # 9 minutes
        "iss": app_id,
    }
    token = jwt.encode(payload, private_key_pem, algorithm="RS256")
    if isinstance(token, bytes):
        token = token.decode("ascii")
    return token


def parse_run_url(url: str):
    m = re.match(r"https://github.com/([^/]+)/([^/]+)/actions/runs/(\d+)", url)
    if not m:
        print(f"[gh_fetch_logs] Invalid run URL: {url}")
        sys.exit(2)
    owner, repo, run_id = m.group(1), m.group(2), m.group(3)
    return owner, repo, run_id


def today_dir() -> Path:
    d = dt.datetime.utcnow().strftime("%Y-%m-%d")
    p = Path("logs") / d / "gh-logs"
    p.mkdir(parents=True, exist_ok=True)
    return p


def get_installation_token(app_jwt: str, owner: str, repo: str) -> str:
    headers = {"Authorization": f"Bearer {app_jwt}", "Accept": "application/vnd.github+json"}
    # find installation for repo
    r = requests.get(f"{GITHUB_API}/repos/{owner}/{repo}/installation", headers=headers, timeout=30)
    if r.status_code != 200:
        print(f"[gh_fetch_logs] Cannot resolve installation for {owner}/{repo}: {r.status_code} {r.text}")
        sys.exit(3)
    inst_id = r.json()["id"]
    r2 = requests.post(
        f"{GITHUB_API}/app/installations/{inst_id}/access_tokens",
        headers=headers,
        json={},
        timeout=30,
    )
    if r2.status_code not in (200, 201):
        print(f"[gh_fetch_logs] Cannot create installation token: {r2.status_code} {r2.text}")
        sys.exit(3)
    token = r2.json().get("token")
    return token


def download_run_logs(owner: str, repo: str, run_id: str, inst_token: str) -> Path:
    headers = {"Authorization": f"token {inst_token}", "Accept": "application/vnd.github+json"}
    # Download run logs zip
    url = f"{GITHUB_API}/repos/{owner}/{repo}/actions/runs/{run_id}/logs"
    r = requests.get(url, headers=headers, allow_redirects=True, timeout=60)
    if r.status_code != 200:
        print(f"[gh_fetch_logs] Failed to get logs (status={r.status_code}): {r.text[:200]}")
        sys.exit(4)
    out_dir = today_dir()
    out_zip = out_dir / f"run-{run_id}.zip"
    out_zip.write_bytes(r.content)
    # Extract file list
    try:
        with zipfile.ZipFile(out_zip, "r") as zf:
            names = zf.namelist()
            if names:
                summary_txt = out_dir / f"run-{run_id}-filelist.txt"
                summary_txt.write_text("\n".join(names), encoding="utf-8")
    except zipfile.BadZipFile:
        pass
    return out_zip


def main():
    ap = argparse.ArgumentParser(description="Fetch GH Actions run logs via GitHub App")
    ap.add_argument("--run-url", dest="run_url", default="")
    ap.add_argument("--run-id", dest="run_id", default="")
    ap.add_argument("--owner", dest="owner", default="")
    ap.add_argument("--repo", dest="repo", default="")
    ap.add_argument("--app-id", dest="app_id", default=os.environ.get("GH_APP_ID", ""))
    args = ap.parse_args()

    if not args.run_url and not (args.run_id and args.owner and args.repo):
        print("Usage: --run-url <url> OR --run-id <id> --owner <o> --repo <r>")
        sys.exit(2)

    if args.run_url:
        owner, repo, run_id = parse_run_url(args.run_url)
    else:
        owner, repo, run_id = args.owner, args.repo, args.run_id

    app_id = args.app_id or os.environ.get("GH_APP_ID", "")
    if not app_id:
        print("[gh_fetch_logs] Missing GH_APP_ID (e.g., 2032160)")
        sys.exit(2)

    private_pem = read_private_key()
    app_jwt = make_app_jwt(app_id, private_pem)
    inst_token = get_installation_token(app_jwt, owner, repo)
    out_zip = download_run_logs(owner, repo, run_id, inst_token)

    out_dir = today_dir()
    meta = {
        "owner": owner,
        "repo": repo,
        "run_id": run_id,
        "zip": str(out_zip),
        "when": dt.datetime.utcnow().isoformat() + "Z",
    }
    (out_dir / f"run-{run_id}.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"[gh_fetch_logs] Saved logs to: {out_zip}")


if __name__ == "__main__":
    main()

