"""
Generate a GitHub App installation access token on Windows using Python.

Inputs (flags or env fallbacks):
  --app-id / GITHUB_APP_ID
  --installation-id / GITHUB_INSTALLATION_ID
  --key-path / GITHUB_APP_KEY_PATH (PEM file; do not commit)
  --api-url (optional, default: https://api.github.com)
  --print-token (optional, print token to stdout; default: masked only)

Behavior:
  - Creates a short-lived JWT (10 min) for the GitHub App.
  - Exchanges it for an installation token via GitHub API.
  - Writes a redacted JSON summary to logs/<YYYY-MM-DD>/github-app/.
  - Does NOT write the token or private key to disk.

Windows usage examples:
  py -3 -m pip install "pyjwt[crypto]"
  py -3 scripts/github_app_token.py --app-id 2032160 --installation-id 87937917 --key-path C:\\secrets\\gametp-ai-bot.pem

References:
  - ADR-0008-deployment-release (CI/CD and automation guardrails)
  - ADR-0011-windows-only-platform-and-ci (Windows-only environment)
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict


def _fail(msg: str) -> None:
    print(f"ERROR: {msg}")
    raise SystemExit(2)


def _ensure_pyjwt() -> None:
    try:
        import jwt  # type: ignore
    except Exception as exc:  # noqa: BLE001
        _fail(
            "PyJWT is required. Install with: py -3 -m pip install \"pyjwt[crypto]\"\n"
            f"Details: {exc}"
        )


def _generate_jwt(app_id: str, pem_path: Path) -> str:
    import jwt  # type: ignore

    pem = pem_path.read_text(encoding="utf-8")
    now = int(time.time())
    payload = {
        "iat": now - 60,  # backdate slightly to allow clock skew
        "exp": now + 600,  # 10 minutes as recommended by GitHub
        "iss": app_id,
    }
    token = jwt.encode(payload, pem, algorithm="RS256")
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    return token


def _http_json(method: str, url: str, headers: Dict[str, str], data: Dict[str, Any] | None) -> Dict[str, Any]:
    import urllib.request
    import urllib.error

    req = urllib.request.Request(url=url, method=method)
    for k, v in headers.items():
        req.add_header(k, v)
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        req.data = body
        if "Content-Type" not in headers:
            req.add_header("Content-Type", "application/json")

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:  # noqa: S310
            charset = resp.headers.get_content_charset() or "utf-8"
            text = resp.read().decode(charset)
            return json.loads(text) if text else {}
    except urllib.error.HTTPError as e:  # noqa: PERF203
        try:
            text = e.read().decode("utf-8", errors="ignore")
        except Exception:  # noqa: BLE001
            text = str(e)
        _fail(f"HTTP {e.code} calling {url}: {text}")
    except urllib.error.URLError as e:
        _fail(f"Network error calling {url}: {e}")


def _ensure_log_dir() -> Path:
    root = Path.cwd()
    today = datetime.now().strftime("%Y-%m-%d")
    out = root / "logs" / today / "github-app"
    out.mkdir(parents=True, exist_ok=True)
    return out


def _mask_token(token: str) -> str:
    if len(token) <= 8:
        return "***"
    return token[:4] + "..." + token[-4:]


def main() -> int:
    _ensure_pyjwt()

    parser = argparse.ArgumentParser(description="Generate GitHub App installation token (Windows friendly)")
    parser.add_argument("--app-id", default=os.getenv("GITHUB_APP_ID"), required=False)
    parser.add_argument("--installation-id", default=os.getenv("GITHUB_INSTALLATION_ID"), required=False)
    parser.add_argument("--key-path", default=os.getenv("GITHUB_APP_KEY_PATH"), required=False)
    parser.add_argument("--api-url", default=os.getenv("GITHUB_API_URL", "https://api.github.com"))
    parser.add_argument("--print-token", action="store_true", help="Print the installation token to stdout")

    args = parser.parse_args()

    if not args.app_id:
        _fail("Missing --app-id or env GITHUB_APP_ID")
    if not args.installation_id:
        _fail("Missing --installation-id or env GITHUB_INSTALLATION_ID")
    if not args.key_path:
        _fail("Missing --key-path or env GITHUB_APP_KEY_PATH (PEM file)")

    pem_path = Path(str(args.key_path))
    if not pem_path.exists():
        _fail(f"PEM not found: {pem_path}")

    jwt_token = _generate_jwt(str(args.app_id), pem_path)

    # Create installation access token
    url = f"{args.api_url.rstrip('/')}/app/installations/{args.installation_id}/access_tokens"
    headers = {
        "Authorization": f"Bearer {jwt_token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "gametp-github-app-setup/1.0",
    }
    resp = _http_json("POST", url, headers, data={})

    token = resp.get("token")
    if not token:
        _fail("No token in GitHub response. Check App ID / Installation ID / key.")

    expires_at = resp.get("expires_at")
    permissions = resp.get("permissions")
    repo_selection = resp.get("repository_selection")

    # Verify token by listing accessible repositories (redacted)
    verify_url = f"{args.api_url.rstrip('/')}/installation/repositories"
    verify_headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "gametp-github-app-setup/1.0",
    }
    v = _http_json("GET", verify_url, verify_headers, None)
    repo_names = [r.get("full_name") for r in (v.get("repositories") or []) if r.get("full_name")]

    # Logs (redacted)
    out_dir = _ensure_log_dir()
    ts = datetime.now().strftime("%H%M%S")
    out_json = out_dir / f"install-token-{ts}.json"
    summary = {
        "installation_id": str(args.installation_id),
        "expires_at": expires_at,
        "permissions": permissions,
        "repository_selection": repo_selection,
        "token_masked": _mask_token(token),
        "repo_count": len(repo_names),
        "repos": repo_names[:50],  # cap list
    }
    out_json.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    print("GitHub App installation token acquired.")
    print(f"Installation: {args.installation_id} | Expires: {expires_at}")
    print(f"Accessible repos: {len(repo_names)}")
    print(f"Logs: {out_json}")
    if args.print_token:
        print("Token (sensitive):")
        print(token)
    else:
        print(f"Token (masked): {_mask_token(token)}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

