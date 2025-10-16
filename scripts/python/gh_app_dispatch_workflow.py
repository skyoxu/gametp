#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Dispatch a GitHub Actions workflow via GitHub App installation token (Windows-friendly).

Usage (Windows):
  py -3 scripts/python/gh_app_dispatch_workflow.py \
     --app-id 2032160 --key-file gametp-ai-bot.2025-10-14.private-key.pem \
     --owner skyoxu --repo gametp --workflow ci.yml --ref main

Writes logs to logs/YYYY-MM-DD/gh-dispatch/. No secrets printed.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
from pathlib import Path
import subprocess
import sys


def ensure(mod: str, pkg: str | None = None):
    try:
        return __import__(mod)
    except Exception:
        py = sys.executable
        try:
            subprocess.run([py, "-m", "pip", "install", "--upgrade", "pip"], check=False,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            pass
        target = pkg or mod
        subprocess.check_call([py, "-m", "pip", "install", target])
        return __import__(mod)


requests = ensure("requests")
jwt = ensure("jwt", pkg="pyjwt[crypto]")


def today_dir() -> Path:
    d = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d")
    p = Path("logs") / d / "gh-dispatch"
    p.mkdir(parents=True, exist_ok=True)
    return p


def make_jwt(app_id: str, key_pem: str) -> str:
    now = dt.datetime.now(dt.timezone.utc)
    payload = {
        "iat": int((now - dt.timedelta(seconds=60)).timestamp()),
        "exp": int((now + dt.timedelta(minutes=9)).timestamp()),
        "iss": int(app_id),
    }
    token: str = jwt.encode(payload, key_pem, algorithm="RS256")  # type: ignore
    return token


def get_installation_token(app_jwt: str, owner: str, repo: str) -> str:
    headers = {
        "Authorization": f"Bearer {app_jwt}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "gametp-gh-app-dispatcher",
    }
    base = "https://api.github.com"
    # Validate
    r = requests.get(f"{base}/app", headers=headers, timeout=30)
    if r.status_code != 200:
        raise RuntimeError(f"JWT /app failed: HTTP {r.status_code}")
    # Resolve installation
    r2 = requests.get(f"{base}/repos/{owner}/{repo}/installation", headers=headers, timeout=30)
    if r2.status_code != 200:
        raise RuntimeError(f"No installation for {owner}/{repo}: HTTP {r2.status_code}")
    inst_id = r2.json().get("id")
    if not inst_id:
        raise RuntimeError("Missing installation id")
    # Create access token
    r3 = requests.post(
        f"{base}/app/installations/{inst_id}/access_tokens",
        headers=headers,
        json={},
        timeout=30,
    )
    if r3.status_code != 201:
        raise RuntimeError(f"Create installation token failed: HTTP {r3.status_code}")
    return str(r3.json().get("token"))


def dispatch(owner: str, repo: str, workflow: str, ref: str, token: str, inputs: dict | None = None) -> dict:
    url = f"https://api.github.com/repos/{owner}/{repo}/actions/workflows/{workflow}/dispatches"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "gametp-gh-app-dispatcher",
    }
    payload = {"ref": ref}
    if inputs:
        payload["inputs"] = inputs
    r = requests.post(url, headers=headers, json=payload, timeout=30)
    return {"status": r.status_code, "ok": r.status_code in (201, 204), "text": r.text[:400]}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--app-id", required=True)
    ap.add_argument("--key-file", required=True)
    ap.add_argument("--owner", required=True)
    ap.add_argument("--repo", required=True)
    ap.add_argument("--workflow", default="ci.yml")
    ap.add_argument("--ref", default="main")
    args = ap.parse_args()

    key_pem = Path(args.key_file).read_text(encoding="utf-8")
    app_jwt = make_jwt(args.app_id, key_pem)
    inst_token = get_installation_token(app_jwt, args.owner, args.repo)
    res = dispatch(args.owner, args.repo, args.workflow, args.ref, inst_token)

    out = today_dir() / f"dispatch-{args.workflow.replace('.', '_')}-{dt.datetime.now(dt.timezone.utc).strftime('%H%M%S')}.json"
    out.write_text(json.dumps(res, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[gh-dispatch] {res['status']} ok={res['ok']} -> {out}")


if __name__ == "__main__":
    main()

