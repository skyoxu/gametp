"""
Fetch Dependabot and Code Scanning alerts for the current repo using a GitHub App installation token.

Inputs (flags or env fallbacks):
  --owner / GH_OWNER (optional; autodetect from git remote)
  --repo / GH_REPO  (optional; autodetect from git remote)
  --app-id / GITHUB_APP_ID
  --installation-id / GITHUB_INSTALLATION_ID
  --key-path / GITHUB_APP_KEY_PATH
  --api-url (default: https://api.github.com)

Outputs:
  - logs/<YYYY-MM-DD>/security/security-alerts-<HHMMSS>.json (full JSON)
  - logs/<YYYY-MM-DD>/security/security-alerts-<HHMMSS>.txt  (summary)

Notes:
  - Sensitive token is not written to disk.
  - Requires permissions: dependabot alerts (read), code scanning alerts (read).

References:
  - ADR-0008-deployment-release (CI/CD automation)
  - ADR-0011-windows-only-platform-and-ci (Windows only)
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


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


def _git_remote_origin() -> Optional[str]:
    try:
        out = subprocess.check_output(["git", "remote", "get-url", "origin"], text=True).strip()
        return out or None
    except Exception:
        return None


def _parse_owner_repo(remote_url: str) -> Optional[Tuple[str, str]]:
    # Supports git@github.com:owner/repo.git and https URLs
    m = re.search(r"github\.com[:/](?P<owner>[^/]+)/(?P<repo>[^.\s]+)(?:\.git)?", remote_url)
    if not m:
        return None
    return m.group("owner"), m.group("repo")


def _generate_jwt(app_id: str, pem_path: Path) -> str:
    import jwt  # type: ignore
    import time

    pem = pem_path.read_text(encoding="utf-8")
    now = int(time.time())
    payload = {"iat": now - 60, "exp": now + 600, "iss": app_id}
    token = jwt.encode(payload, pem, algorithm="RS256")
    return token if isinstance(token, str) else token.decode("utf-8")


def _http_json(method: str, url: str, headers: Dict[str, str]) -> Tuple[Dict[str, Any], Dict[str, str]]:
    import urllib.request
    import urllib.error

    req = urllib.request.Request(url=url, method=method)
    for k, v in headers.items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:  # noqa: S310
            hdrs = {k.lower(): v for k, v in resp.headers.items()}
            data = resp.read()
            text = data.decode(resp.headers.get_content_charset() or "utf-8")
            return (json.loads(text) if text else {}), hdrs
    except urllib.error.HTTPError as e:
        try:
            text = e.read().decode("utf-8", errors="ignore")
        except Exception:  # noqa: BLE001
            text = str(e)
        _fail(f"HTTP {e.code} calling {url}: {text}")
    except urllib.error.URLError as e:
        _fail(f"Network error calling {url}: {e}")


def _post_json(url: str, headers: Dict[str, str], body: Dict[str, Any]) -> Dict[str, Any]:
    import urllib.request
    import urllib.error

    req = urllib.request.Request(url=url, method="POST", data=json.dumps(body).encode("utf-8"))
    for k, v in headers.items():
        req.add_header(k, v)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:  # noqa: S310
            text = resp.read().decode(resp.headers.get_content_charset() or "utf-8")
            return json.loads(text) if text else {}
    except urllib.error.HTTPError as e:
        try:
            text = e.read().decode("utf-8", errors="ignore")
        except Exception:  # noqa: BLE001
            text = str(e)
        _fail(f"HTTP {e.code} calling {url}: {text}")
    except urllib.error.URLError as e:
        _fail(f"Network error calling {url}: {e}")


def _acquire_installation_token(api_url: str, app_id: str, installation_id: str, pem_path: Path) -> str:
    jwt_token = _generate_jwt(app_id, pem_path)
    url = f"{api_url.rstrip('/')}/app/installations/{installation_id}/access_tokens"
    headers = {"Authorization": f"Bearer {jwt_token}", "Accept": "application/vnd.github+json", "User-Agent": "gametp-security-fetch/1.0"}
    resp = _post_json(url, headers, {})
    token = resp.get("token")
    if not token:
        _fail("No token field in response. Check app permissions and installation.")
    return token


def _paginate(url: str, token: str) -> List[Dict[str, Any]]:
    all_items: List[Dict[str, Any]] = []
    next_url: Optional[str] = url
    while next_url:
        data, hdrs = _http_json("GET", next_url, {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github+json",
            "User-Agent": "gametp-security-fetch/1.0",
        })
        if isinstance(data, list):
            all_items.extend(data)
        else:
            # Some endpoints wrap items differently; normalize to list when possible
            items = data.get("alerts") or data.get("items") or []
            if isinstance(items, list):
                all_items.extend(items)
        link = hdrs.get("link", "")
        m = re.search(r"<([^>]+)>; rel=\"next\"", link)
        next_url = m.group(1) if m else None
        if not m:
            break
    return all_items


def _normalize_dependabot(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    norm: List[Dict[str, Any]] = []
    for it in items:
        adv = (it.get("security_advisory") or {})
        vul = (it.get("security_vulnerability") or {})
        dep = (it.get("dependency") or {})
        pkg = (dep.get("package") or {})
        norm.append({
            "number": it.get("number"),
            "state": it.get("state"),
            "severity": adv.get("severity"),
            "dependency": pkg.get("name"),
            "manifest": dep.get("manifest_path"),
            "ecosystem": pkg.get("ecosystem"),
            "vulnerable_range": vul.get("vulnerable_version_range"),
            "first_patched": ((vul.get("first_patched_version") or {}).get("identifier")),
            "advisory_id": adv.get("ghsa_id") or adv.get("cve_id"),
            "created_at": it.get("created_at"),
            "updated_at": it.get("updated_at"),
            "dismissed_reason": (it.get("dismissed_reason") or None),
            "html_url": it.get("html_url"),
        })
    return norm


def _normalize_code_scanning(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    norm: List[Dict[str, Any]] = []
    for it in items:
        rule = it.get("rule") or {}
        most = it.get("most_recent_instance") or {}
        norm.append({
            "number": it.get("number"),
            "state": it.get("state"),
            "severity": rule.get("severity") or it.get("severity"),
            "rule_id": rule.get("id"),
            "tool": (it.get("tool") or {}).get("name"),
            "path": (most.get("location") or {}).get("path"),
            "start_line": (most.get("location") or {}).get("start_line"),
            "html_url": it.get("html_url"),
            "created_at": it.get("created_at"),
            "updated_at": it.get("updated_at"),
        })
    return norm


def _ensure_log_dir() -> Path:
    root = Path.cwd()
    today = datetime.now().strftime("%Y-%m-%d")
    out = root / "logs" / today / "security"
    out.mkdir(parents=True, exist_ok=True)
    return out


def main() -> int:
    _ensure_pyjwt()
    parser = argparse.ArgumentParser(description="Fetch Dependabot and Code Scanning alerts for repo")
    parser.add_argument("--owner", default=os.getenv("GH_OWNER"))
    parser.add_argument("--repo", default=os.getenv("GH_REPO"))
    parser.add_argument("--app-id", default=os.getenv("GITHUB_APP_ID"))
    parser.add_argument("--installation-id", default=os.getenv("GITHUB_INSTALLATION_ID"))
    parser.add_argument("--key-path", default=os.getenv("GITHUB_APP_KEY_PATH"))
    parser.add_argument("--api-url", default=os.getenv("GITHUB_API_URL", "https://api.github.com"))

    args = parser.parse_args()

    # Owner/repo autodetect
    if not args.owner or not args.repo:
        remote = _git_remote_origin()
        if not remote:
            _fail("Cannot determine origin remote URL; pass --owner and --repo")
        parsed = _parse_owner_repo(remote)
        if not parsed:
            _fail(f"Cannot parse owner/repo from remote: {remote}")
        owner, repo = parsed
    else:
        owner, repo = args.owner, args.repo

    if not args.app_id or not args.installation_id or not args.key_path:
        _fail("Missing --app-id / --installation-id / --key-path")

    pem_path = Path(str(args.key_path))
    if not pem_path.exists():
        _fail(f"PEM not found: {pem_path}")

    token = _acquire_installation_token(args.api_url, str(args.app_id), str(args.installation_id), pem_path)

    # Fetch Dependabot alerts (open state)
    dep_url = f"{args.api_url.rstrip('/')}/repos/{owner}/{repo}/dependabot/alerts?state=open&per_page=100"
    dep_items = _paginate(dep_url, token)
    dep_norm = _normalize_dependabot(dep_items)

    # Fetch Code scanning alerts (open state)
    cs_url = f"{args.api_url.rstrip('/')}/repos/{owner}/{repo}/code-scanning/alerts?state=open&per_page=100"
    cs_items = _paginate(cs_url, token)
    cs_norm = _normalize_code_scanning(cs_items)

    out_dir = _ensure_log_dir()
    ts = datetime.now().strftime("%H%M%S")
    out_json = out_dir / f"security-alerts-{ts}.json"
    out_txt = out_dir / f"security-alerts-{ts}.txt"

    summary = {
        "owner": owner,
        "repo": repo,
        "dependabot_open": len(dep_norm),
        "code_scanning_open": len(cs_norm),
        "dependabot": dep_norm,
        "code_scanning": cs_norm,
    }
    out_json.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    with out_txt.open("w", encoding="utf-8") as tf:
        tf.write(f"Repo: {owner}/{repo}\n")
        tf.write(f"Dependabot (open): {len(dep_norm)}\n")
        tf.write(f"Code scanning (open): {len(cs_norm)}\n")
        if dep_norm:
            tf.write("\nDependabot (top 10):\n")
            for r in dep_norm[:10]:
                tf.write(f" - [{r.get('severity')}] {r.get('dependency')} @ {r.get('manifest')} | {r.get('state')}\n")
        if cs_norm:
            tf.write("\nCode scanning (top 10):\n")
            for r in cs_norm[:10]:
                tf.write(f" - [{r.get('severity')}] {r.get('rule_id')} {r.get('path')} | {r.get('state')}\n")

    print(f"Repo: {owner}/{repo}")
    print(f"Dependabot (open): {len(dep_norm)}")
    print(f"Code scanning (open): {len(cs_norm)}")
    print(f"Logs: {out_json}, {out_txt}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
