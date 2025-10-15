#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fetch GitHub Actions run logs using the GITHUB_TOKEN (same-repo only).
- Windows-friendly; writes to logs/YYYY-MM-DD/gh-logs/
- Prefer this in CI (no App secret required).

Usage (workflow/locally):
  py -3 scripts/python/fetch_run_logs_with_token.py --run-url https://github.com/<owner>/<repo>/actions/runs/<run_id>
  py -3 scripts/python/fetch_run_logs_with_token.py --run-id 18447537905

Env:
  GITHUB_TOKEN  (provided automatically in Actions)
  GITHUB_REPOSITORY (owner/repo; auto-provided in Actions)
"""
import argparse
import datetime as dt
import os
import re
import sys
import zipfile
from pathlib import Path


def ensure_requests():
    try:
        import requests  # type: ignore
        return requests
    except Exception:
        # Best-effort install
        py = sys.executable
        os.system(f"{py} -m pip install --upgrade pip >NUL 2>&1")
        code = os.system(f"{py} -m pip install requests")
        if code != 0:
            print("[fetch_run_logs_with_token] Cannot import/install requests.")
            sys.exit(1)
        import requests  # type: ignore
        return requests


requests = ensure_requests()


def parse_run_url(url: str):
    m = re.match(r"https://github.com/([^/]+)/([^/]+)/actions/runs/(\d+)", url)
    if not m:
        print(f"[fetch] Invalid run URL: {url}")
        sys.exit(2)
    owner, repo, run_id = m.group(1), m.group(2), m.group(3)
    return owner, repo, run_id


def today_dir() -> Path:
    d = dt.datetime.utcnow().strftime("%Y-%m-%d")
    p = Path("logs") / d / "gh-logs"
    p.mkdir(parents=True, exist_ok=True)
    return p


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--run-url", dest="run_url", default="")
    ap.add_argument("--run-id", dest="run_id", default="")
    ap.add_argument("--owner", dest="owner", default="")
    ap.add_argument("--repo", dest="repo", default="")
    args = ap.parse_args()

    if args.run_url:
        owner, repo, run_id = parse_run_url(args.run_url)
    else:
        run_id = args.run_id
        if not run_id:
            print("[fetch] --run-id or --run-url is required")
            sys.exit(2)
        owner_repo = args.owner + "/" + args.repo if args.owner and args.repo else os.environ.get("GITHUB_REPOSITORY", "")
        if not owner_repo or "/" not in owner_repo:
            print("[fetch] Missing owner/repo; set --owner/--repo or GITHUB_REPOSITORY")
            sys.exit(2)
        owner, repo = owner_repo.split("/", 1)

    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        print("[fetch] GITHUB_TOKEN is required (in Actions this is set automatically)")
        sys.exit(2)

    url = f"https://api.github.com/repos/{owner}/{repo}/actions/runs/{run_id}/logs"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
    }
    print(f"[fetch] Downloading logs: {owner}/{repo} run_id={run_id}")
    r = requests.get(url, headers=headers, allow_redirects=True, timeout=60)
    if r.status_code != 200:
        msg = f"[fetch] Failed to download logs (status={r.status_code}). Logs may be expired or inaccessible."
        print(msg)
        # Write advisory to step summary but do not fail the workflow
        out = os.environ.get("GITHUB_STEP_SUMMARY")
        if out:
            try:
                with open(out, "a", encoding="utf-8") as f:
                    f.write(f"\n### Fetch Run Logs\n{msg}\n")
            except Exception:
                pass
        return 0

    out_dir = today_dir()
    out_zip = out_dir / f"run-{run_id}.zip"
    out_zip.write_bytes(r.content)
    print(f"[fetch] Saved: {out_zip}")

    # Write a file list for quick scan
    try:
        with zipfile.ZipFile(out_zip, "r") as zf:
            names = zf.namelist()
            (out_dir / f"run-{run_id}-filelist.txt").write_text("\n".join(names), encoding="utf-8")
    except zipfile.BadZipFile:
        pass


if __name__ == "__main__":
    main()
