#!/usr/bin/env python3
"""
Download GitHub Actions run logs using a GitHub App.

Requires:
 - App ID (integer)
 - App private key (PEM file path)
 - Repository owner/name
 - Run ID

Examples:
  python scripts/tools/ghapp_download_logs.py \
    --app-id 2032160 \
    --key-file gametp-ai-bot.2025-10-10.private-key.pem \
    --owner skyoxu --repo gametp --run-id 18412530982 --unzip

This script attempts to install its Python dependencies (pyjwt, cryptography, requests)
if they are missing. It prints a short error summary after download.
"""
import argparse
import base64
import json
import os
import subprocess
import sys
import time
from pathlib import Path


def ensure_deps():
    try:
        import jwt  # noqa: F401
        import requests  # noqa: F401
    except Exception:
        # Install quietly; fall back to non-quiet if needed
        pkgs = ["pyjwt", "cryptography", "requests"]
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-q"] + pkgs)
        except subprocess.CalledProcessError:
            subprocess.check_call([sys.executable, "-m", "pip", "install"] + pkgs)


def b64u(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def make_jwt(app_id: str, pem_path: Path) -> str:
    import jwt  # type: ignore

    private_key = pem_path.read_text(encoding="utf-8")
    now = int(time.time())
    payload = {
        "iat": now - 60,  # allow clock skew
        "exp": now + 9 * 60,  # 9 minutes
        "iss": app_id,
    }
    token = jwt.encode(payload, private_key, algorithm="RS256")
    if isinstance(token, bytes):
        token = token.decode("ascii")
    return token


def github_get(url: str, headers: dict) -> tuple[int, dict, bytes]:
    import requests  # type: ignore

    resp = requests.get(url, headers=headers)
    try:
        js = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
    except Exception:
        js = {}
    return resp.status_code, js, resp.content


def github_post(url: str, headers: dict, data: dict | None = None) -> tuple[int, dict, bytes]:
    import requests  # type: ignore

    resp = requests.post(url, headers=headers, json=data or {})
    try:
        js = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
    except Exception:
        js = {}
    return resp.status_code, js, resp.content


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--app-id", required=True)
    parser.add_argument("--key-file", required=True)
    parser.add_argument("--owner", required=True)
    parser.add_argument("--repo", required=True)
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--out", default=None)
    parser.add_argument("--unzip", action="store_true")
    args = parser.parse_args()

    ensure_deps()

    pem_path = Path(args.key_file)
    if not pem_path.exists():
        print(f"[ERR] Private key not found: {pem_path}", file=sys.stderr)
        return 2

    jwt_token = make_jwt(args.app_id, pem_path)

    # 1) Find installation for the repo
    api = "https://api.github.com"
    repo_install_url = f"{api}/repos/{args.owner}/{args.repo}/installation"
    gh_headers_jwt = {
        "Authorization": f"Bearer {jwt_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    sc, js, _ = github_get(repo_install_url, gh_headers_jwt)
    if sc != 200:
        print(f"[ERR] Failed to resolve installation (HTTP {sc}): {js}", file=sys.stderr)
        return 3
    inst_id = js.get("id")
    if not inst_id:
        print("[ERR] No installation id in response", file=sys.stderr)
        return 3

    # 2) Create installation token
    tok_url = f"{api}/app/installations/{inst_id}/access_tokens"
    sc, js, _ = github_post(tok_url, gh_headers_jwt, data={})
    if sc != 201:
        print(f"[ERR] Failed to create installation token (HTTP {sc}): {js}", file=sys.stderr)
        return 4
    inst_token = js.get("token")
    if not inst_token:
        print("[ERR] No token in installation token response", file=sys.stderr)
        return 4

    # 3) Download run logs zip
    logs_url = f"{api}/repos/{args.owner}/{args.repo}/actions/runs/{args.run_id}/logs"
    gh_headers_run = {
        "Authorization": f"Bearer {inst_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    import requests  # type: ignore

    resp = requests.get(logs_url, headers=gh_headers_run, stream=True)
    if resp.status_code != 200:
        try:
            js = resp.json()
        except Exception:
            js = {"raw": resp.text[:200]}
        print(f"[ERR] Download logs failed (HTTP {resp.status_code}): {js}", file=sys.stderr)
        return 5

    out = args.out or f"run-{args.run_id}.zip"
    with open(out, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)
    print(f"[OK] Logs downloaded: {out}")

    if args.unzip:
        try:
            import zipfile
            dest = Path(f"logs-{args.run_id}")
            if dest.exists():
                # Do not delete automatically; write into existing
                pass
            with zipfile.ZipFile(out, "r") as z:
                z.extractall(dest)
            print(f"[OK] Logs extracted to: {dest}")

            # Heuristic error summary
            err_lines = []
            for p in dest.rglob("*.txt"):
                try:
                    for ln in p.read_text(encoding="utf-8", errors="ignore").splitlines():
                        low = ln.lower()
                        if any(k in low for k in (" error ", "error:", "failed", "traceback", "exception")):
                            err_lines.append((p.name, ln.strip()))
                            if len(err_lines) >= 60:
                                break
                    if len(err_lines) >= 60:
                        break
                except Exception:
                    continue
            if err_lines:
                print("\n[Error Summary, top matches]:")
                for name, ln in err_lines[:40]:
                    print(f"  [{name}] {ln}")
            else:
                print("[Info] No obvious error lines found in extracted logs.")
        except Exception as e:
            print(f"[WARN] Unzip/summary failed: {e}")

    return 0


if __name__ == "__main__":
    sys.exit(main())

