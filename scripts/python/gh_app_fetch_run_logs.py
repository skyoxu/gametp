#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fetch GitHub Actions run logs using a GitHub App private key (JWT -> installation token).

Windows friendly. Saves to logs/YYYY-MM-DD/gh-logs/run-<id>.zip and optionally parses.

Usage:
  py -3 scripts/python/gh_app_fetch_run_logs.py --app-id 2032160 \
     --key-file gametp-ai-bot.2025-10-14.private-key.pem \
     --owner skyoxu --repo gametp --run-id 18559832945 --parse

Notes:
  - Installs dependencies (pyjwt, cryptography, requests) if missing.
  - Never prints secret material; only prints filenames and statuses.
  - Logs live under logs/<date>/gh-logs/ per repo standards.
"""
from __future__ import annotations

import argparse
import base64
import datetime as dt
import io
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Tuple


def ensure(mod: str, pkg: str | None = None):
    """Import module or install via pip and import again."""
    try:
        return __import__(mod)
    except Exception:
        py = sys.executable
        # Upgrade pip silently (best-effort)
        try:
            subprocess.run([py, "-m", "pip", "install", "--upgrade", "pip"], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            pass
        target = pkg or mod
        subprocess.check_call([py, "-m", "pip", "install", target])
        return __import__(mod)


requests = ensure("requests")
jwt = ensure("jwt", pkg="pyjwt[crypto]")


def today_dir() -> Path:
    d = dt.datetime.utcnow().strftime("%Y-%m-%d")
    p = Path("logs") / d / "gh-logs"
    p.mkdir(parents=True, exist_ok=True)
    return p


def make_jwt(app_id: str, key_pem: str) -> str:
    now = dt.datetime.utcnow()
    payload = {
        "iat": int((now - dt.timedelta(seconds=60)).timestamp()),
        "exp": int((now + dt.timedelta(minutes=9)).timestamp()),
        "iss": app_id,
    }
    token: str = jwt.encode(payload, key_pem, algorithm="RS256")  # type: ignore
    return token


def get_installation_token(app_jwt: str, owner: str, repo: str) -> Tuple[str, int, str]:
    """Return (installation_id, expires_in_seconds, token)."""
    headers = {
        "Authorization": f"Bearer {app_jwt}",
        "Accept": "application/vnd.github+json",
    }
    # Find installation for this repository
    install_resp = requests.get(f"https://api.github.com/repos/{owner}/{repo}/installation", headers=headers, timeout=30)
    if install_resp.status_code != 200:
        raise RuntimeError(f"Cannot resolve installation for {owner}/{repo} (HTTP {install_resp.status_code})")
    install = install_resp.json()
    installation_id = install.get("id")
    if not installation_id:
        raise RuntimeError("Installation id not found in response")

    # Create access token
    tok_resp = requests.post(
        f"https://api.github.com/app/installations/{installation_id}/access_tokens",
        headers=headers,
        json={},
        timeout=30,
    )
    if tok_resp.status_code != 201:
        raise RuntimeError(f"Cannot create installation token (HTTP {tok_resp.status_code})")
    tok = tok_resp.json()
    token = tok.get("token")
    expires_at = tok.get("expires_at") or ""
    # Compute seconds to expiry (rough)
    exp_sec = 3600
    try:
        if expires_at:
            exp_dt = dt.datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
            exp_sec = int((exp_dt - dt.datetime.now(dt.timezone.utc)).total_seconds())
    except Exception:
        pass
    if not token:
        raise RuntimeError("Empty installation token")
    return str(installation_id), exp_sec, str(token)


def fetch_run_logs(owner: str, repo: str, run_id: str, token: str, out_dir: Path) -> Path:
    url = f"https://api.github.com/repos/{owner}/{repo}/actions/runs/{run_id}/logs"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "gametp-gh-app-fetcher",
    }
    r = requests.get(url, headers=headers, allow_redirects=True, timeout=60)
    if r.status_code != 200:
        raise RuntimeError(f"Failed to download logs (HTTP {r.status_code}). Logs may be expired.")
    out_zip = out_dir / f"run-{run_id}.zip"
    out_zip.write_bytes(r.content)
    # Also write a text file listing entries (lazy; parse script does this too)
    try:
        import zipfile

        with zipfile.ZipFile(io.BytesIO(r.content)) as zf:
            names = zf.namelist()
        (out_dir / f"run-{run_id}-filelist.txt").write_text("\n".join(names), encoding="utf-8")
    except Exception:
        pass
    return out_zip


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--app-id", required=True)
    ap.add_argument("--key-file", required=True)
    ap.add_argument("--owner", required=True)
    ap.add_argument("--repo", required=True)
    ap.add_argument("--run-id", dest="run_id", default="")
    ap.add_argument("--run-url", dest="run_url", default="")
    ap.add_argument("--parse", action="store_true")
    args = ap.parse_args()

    if not args.run_id and not args.run_url:
        print("[gh-app] Provide --run-id or --run-url")
        sys.exit(2)

    run_id = args.run_id
    if not run_id:
        import re

        m = re.search(r"/runs/(\d+)", args.run_url)
        if not m:
            print(f"[gh-app] Invalid run URL: {args.run_url}")
            sys.exit(2)
        run_id = m.group(1)

    key_path = Path(args.key_file)
    if not key_path.exists():
        print(f"[gh-app] Private key file not found: {key_path}")
        sys.exit(2)
    key_pem = key_path.read_text(encoding="utf-8")

    out_dir = today_dir()
    meta_path = out_dir / f"run-{run_id}-meta.json"

    try:
        app_jwt = make_jwt(args.app_id, key_pem)
        installation_id, expires_in, install_token = get_installation_token(app_jwt, args.owner, args.repo)
        zpath = fetch_run_logs(args.owner, args.repo, run_id, install_token, out_dir)
        meta = {
            "owner": args.owner,
            "repo": args.repo,
            "run_id": run_id,
            "installation_id": installation_id,
            "token_expires_in_sec": expires_in,
            "zip": str(zpath),
        }
        meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"[gh-app] Saved logs: {zpath}")
        print(f"[gh-app] Meta: {meta_path}")
    except Exception as e:
        print(f"[gh-app] ERROR: {e}")
        sys.exit(1)

    if args.parse:
        # Best-effort parse using existing parser
        parser = Path("scripts/python/parse_gh_run_zip.py")
        if parser.exists():
            try:
                cmd = [sys.executable, str(parser), "--run-id", run_id]
                print("[gh-app] Parsing logs with parse_gh_run_zip.py ...")
                subprocess.run(cmd, check=False)
            except Exception:
                pass


if __name__ == "__main__":
    main()

