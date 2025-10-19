import os
import sys
import json
import base64
import argparse
from datetime import datetime, timedelta, timezone
from urllib import request, error, parse


API_VERSION = "2022-11-28"
DEFAULT_REPO = "skyoxu/gametp"


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def log_paths() -> tuple[str, str]:
    day = datetime.now().strftime("%Y-%m-%d")
    base = os.path.join("logs", day, "security")
    ensure_dir(base)
    text = os.path.join(base, "fetch_security.log")
    stamp = datetime.now().strftime("%H%M%S")
    combined = os.path.join(base, f"github_security_{stamp}.json")
    return text, combined


def http_get(url: str, token: str | None) -> tuple[int, dict | list | str, dict]:
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": API_VERSION,
        "User-Agent": "codex-cli-agent",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = request.Request(url, headers=headers, method="GET")
    try:
        with request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            ctype = resp.headers.get("Content-Type", "")
            parsed = raw
            if "application/json" in ctype:
                try:
                    parsed = json.loads(raw)
                except Exception:
                    parsed = raw
            return resp.status, parsed, dict(resp.headers)
    except error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        try:
            payload = json.loads(body)
        except Exception:
            payload = body
        return e.code, payload, dict(e.headers or {})
    except Exception as e:
        return 0, str(e), {}


def http_post(url: str, token: str | None, body: dict | None) -> tuple[int, dict | str, dict]:
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": API_VERSION,
        "User-Agent": "codex-cli-agent",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = None
    if body is not None:
        raw = json.dumps(body).encode("utf-8")
        data = raw
        headers["Content-Type"] = "application/json"
    req = request.Request(url, headers=headers, method="POST", data=data)
    try:
        with request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            ctype = resp.headers.get("Content-Type", "")
            parsed = raw
            if "application/json" in ctype:
                try:
                    parsed = json.loads(raw)
                except Exception:
                    parsed = raw
            return resp.status, parsed, dict(resp.headers)
    except error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        try:
            payload = json.loads(body)
        except Exception:
            payload = body
        return e.code, payload, dict(e.headers or {})
    except Exception as e:
        return 0, str(e), {}


def fetch_all(repo: str, token: str | None) -> dict:
    base = f"https://api.github.com/repos/{repo}"
    data: dict[str, object] = {"repo": repo, "timestamp": datetime.now().isoformat()}

    # Basic repo info (public)
    st, body, _ = http_get(base, token)
    data["repo_info"] = {"status": st, "data": body}

    # Dependabot alerts (requires security_events:read)
    dep_url = f"{base}/dependabot/alerts?per_page=100&state=open"
    st, body, _ = http_get(dep_url, token)
    data["dependabot_alerts"] = {"status": st, "data": body}

    # Code scanning alerts (requires repo + code_scanning:read or security_events:read)
    cs_url = f"{base}/code-scanning/alerts?per_page=100&state=open"
    st, body, _ = http_get(cs_url, token)
    data["code_scanning_alerts"] = {"status": st, "data": body}

    # Secret scanning alerts (requires security_events:read)
    ss_url = f"{base}/secret-scanning/alerts?per_page=100&state=open"
    st, body, _ = http_get(ss_url, token)
    data["secret_scanning_alerts"] = {"status": st, "data": body}

    # Security advisories (requires read access)
    adv_url = f"{base}/security-advisories?per_page=100&state=published"
    st, body, _ = http_get(adv_url, token)
    data["security_advisories"] = {"status": st, "data": body}

    return data


def obtain_installation_token(app_id: str, inst_id: str, private_key: str) -> tuple[int, dict | str, dict]:
    try:
        import jwt  # PyJWT
    except Exception as e:
        return 0, {"error": f"PyJWT missing: {e}"}, {}
    now = datetime.now(timezone.utc)
    payload = {
        "iat": int(now.timestamp()) - 60,
        "exp": int((now + timedelta(minutes=9)).timestamp()),
        "iss": app_id,
    }
    try:
        app_jwt = jwt.encode(payload, private_key, algorithm="RS256")
    except Exception as e:
        return 0, {"error": f"JWT encode failed: {e}"}, {}
    url = f"https://api.github.com/app/installations/{inst_id}/access_tokens"
    return http_post(url, app_jwt, body=None)


def diagnose_installation(repo: str, app_id: str, inst_id: str, pk_path: str | None, pk_b64: str | None) -> dict:
    diag: dict[str, object] = {"repo": repo, "app_id": app_id, "installation_id": inst_id}
    # Load private key
    private_key = None
    if pk_path and os.path.exists(pk_path):
        try:
            with open(pk_path, "r", encoding="utf-8") as f:
                private_key = f.read()
        except Exception as e:
            diag["private_key_error"] = str(e)
    elif pk_b64:
        try:
            private_key = base64.b64decode(pk_b64).decode("utf-8")
        except Exception as e:
            diag["private_key_error"] = str(e)

    if not private_key:
        diag["status"] = "no_private_key"
        return diag

    # Step 1: Verify app JWT with /app
    try:
        import jwt  # PyJWT
    except Exception as e:
        diag["jwt_error"] = f"PyJWT missing: {e}"
        return diag
    now = datetime.now(timezone.utc)
    payload = {"iat": int(now.timestamp()) - 60, "exp": int((now + timedelta(minutes=9)).timestamp()), "iss": app_id}
    try:
        app_jwt = jwt.encode(payload, private_key, algorithm="RS256")
    except Exception as e:
        diag["jwt_error"] = f"encode failed: {e}"
        return diag

    st, app_info, _ = http_get("https://api.github.com/app", token=app_jwt)
    diag["app_check"] = {"status": st, "data": app_info}

    # Step 2: Installation details
    inst_url = f"https://api.github.com/app/installations/{inst_id}"
    st, inst_info, _ = http_get(inst_url, token=app_jwt)
    diag["installation_check"] = {"status": st, "data": inst_info}

    # Step 3: Obtain installation token
    st, token_body, _ = obtain_installation_token(app_id, inst_id, private_key)
    diag["access_token_exchange"] = {"status": st, "data": token_body if isinstance(token_body, dict) else str(token_body)}
    inst_token = None
    perms = None
    if st == 201 and isinstance(token_body, dict) and token_body.get("token"):
        inst_token = token_body["token"]
        perms = token_body.get("permissions")
        diag["permissions"] = perms
        diag["token_expires_at"] = token_body.get("expires_at")
    else:
        diag["status"] = "token_exchange_failed"
        return diag

    # Step 4: List repos accessible to installation
    st, repos_body, _ = http_get("https://api.github.com/installation/repositories?per_page=100", token=inst_token)
    diag["installation_repos"] = {"status": st}
    repo_fullnames = []
    if st == 200 and isinstance(repos_body, dict) and isinstance(repos_body.get("repositories"), list):
        repo_fullnames = [r.get("full_name") for r in repos_body["repositories"] if isinstance(r, dict)]
    diag["installation_repo_list"] = repo_fullnames
    diag["repo_in_installation"] = repo in repo_fullnames

    # Step 5: Probe a security endpoint with installation token
    base = f"https://api.github.com/repos/{repo}"
    st_dep, dep_body, _ = http_get(f"{base}/dependabot/alerts?per_page=1", token=inst_token)
    st_cs, cs_body, _ = http_get(f"{base}/code-scanning/alerts?per_page=1", token=inst_token)
    st_ss, ss_body, _ = http_get(f"{base}/secret-scanning/alerts?per_page=1", token=inst_token)
    diag["probe_results"] = {
        "dependabot_alerts": {"status": st_dep, "message": dep_body.get("message") if isinstance(dep_body, dict) else dep_body},
        "code_scanning_alerts": {"status": st_cs, "message": cs_body.get("message") if isinstance(cs_body, dict) else cs_body},
        "secret_scanning_alerts": {"status": st_ss, "message": ss_body.get("message") if isinstance(ss_body, dict) else ss_body},
    }

    diag["status"] = "ok"
    return diag


def summarize(result: dict) -> str:
    lines: list[str] = []
    lines.append("GitHub Security Summary")
    lines.append(f"Repo: {result.get('repo')}")
    lines.append(f"Time: {result.get('timestamp')}")

    def count_if_ok(section: str) -> str:
        sec = result.get(section, {})
        if not isinstance(sec, dict):
            return "n/a"
        st = sec.get("status")
        data = sec.get("data")
        if st == 200 and isinstance(data, list):
            return str(len(data))
        elif isinstance(data, dict) and data.get("message"):
            return f"{st}: {data.get('message')}"
        else:
            return str(st)

    lines.append(f"Dependabot open alerts: {count_if_ok('dependabot_alerts')}")
    lines.append(f"Code scanning open alerts: {count_if_ok('code_scanning_alerts')}")
    lines.append(f"Secret scanning open alerts: {count_if_ok('secret_scanning_alerts')}")
    adv = result.get("security_advisories", {})
    adv_ct = "n/a"
    if isinstance(adv, dict) and adv.get("status") == 200 and isinstance(adv.get("data"), list):
        adv_ct = str(len(adv.get("data")))
    lines.append(f"Security advisories (published): {adv_ct}")
    return "\n".join(lines)


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Fetch GitHub security data")
    parser.add_argument("--repo", default=DEFAULT_REPO, help="owner/repo, default skyoxu/gametp")
    parser.add_argument("--app-id", dest="app_id", help="GitHub App ID")
    parser.add_argument("--installation-id", dest="inst_id", help="GitHub App Installation ID")
    parser.add_argument("--pem", dest="pk_path", help="Path to GitHub App private key (PEM)")
    parser.add_argument("--pem-base64", dest="pk_b64", help="Base64-encoded PEM content")
    parser.add_argument("--diagnose", action="store_true", help="Run installation visibility/permission diagnostics")
    args = parser.parse_args(argv[1:])

    repo = args.repo

    token = os.environ.get("GITHUB_TOKEN")
    text_log, json_path = log_paths()
    with open(text_log, "a", encoding="utf-8", errors="replace") as lf:
        lf.write("==== fetch_github_security start ====" + os.linesep)
        lf.write(f"time: {datetime.now().isoformat()}" + os.linesep)
        lf.write(f"repo: {repo}" + os.linesep)
        app_id = args.app_id or os.environ.get("GITHUB_APP_ID")
        inst_id = args.inst_id or os.environ.get("GITHUB_INSTALLATION_ID")
        pk_path = args.pk_path or os.environ.get("GITHUB_APP_PK_PATH")
        pk_b64 = args.pk_b64 or os.environ.get("GITHUB_APP_PK_BASE64")

        if token:
            lf.write("auth: PAT provided" + os.linesep)
        elif app_id and inst_id and (pk_path or pk_b64):
            # Attempt GitHub App flow
            lf.write("auth: GitHub App credentials provided (will attempt JWT)" + os.linesep)
            try:
                import jwt  # PyJWT
            except Exception:
                msg = (
                    "auth: PyJWT not installed. Please install with:\n"
                    "  py -3 -m pip install pyjwt cryptography\n"
                )
                lf.write(msg)
                print(msg)
                # Continue without token; most endpoints will be unauthorized
            else:
                # Load private key
                private_key = None
                if pk_path:
                    try:
                        with open(pk_path, "r", encoding="utf-8") as f:
                            private_key = f.read()
                    except Exception as e:
                        lf.write(f"auth: failed to read private key file: {e}" + os.linesep)
                elif pk_b64:
                    try:
                        private_key = base64.b64decode(pk_b64).decode("utf-8")
                    except Exception as e:
                        lf.write(f"auth: failed to decode base64 private key: {e}" + os.linesep)

                if private_key:
                    now = datetime.now(timezone.utc)
                    payload = {
                        "iat": int(now.timestamp()) - 60,
                        "exp": int((now + timedelta(minutes=9)).timestamp()),
                        "iss": app_id,
                    }
                    try:
                        app_jwt = jwt.encode(payload, private_key, algorithm="RS256")
                        # Exchange for installation token
                        url = f"https://api.github.com/app/installations/{inst_id}/access_tokens"
                        st, body, _ = http_post(url, app_jwt, body=None)
                        if st == 201 and isinstance(body, dict) and body.get("token"):
                            token = body["token"]
                            lf.write("auth: obtained installation token" + os.linesep)
                            lf.write("auth: installation permissions: " + json.dumps(body.get("permissions", {})) + os.linesep)
                            lf.write("auth: token expires_at: " + str(body.get("expires_at")) + os.linesep)
                        else:
                            lf.write(f"auth: failed to obtain installation token: {st} {body}" + os.linesep)
                    except Exception as e:
                        lf.write(f"auth: JWT generation/exchange failed: {e}" + os.linesep)
        else:
            lf.write("auth: no token provided (most endpoints will be 401/403)" + os.linesep)

        if args.diagnose and (app_id and inst_id and (pk_path or pk_b64)):
            lf.write("== diagnose start ==" + os.linesep)
            diag = diagnose_installation(repo, app_id, inst_id, pk_path, pk_b64)
            print("Diagnosis summary:")
            print(json.dumps(diag, indent=2))
            lf.write(json.dumps(diag, indent=2) + os.linesep)
            lf.write("== diagnose end ==" + os.linesep)

        result = fetch_all(repo, token)
        with open(json_path, "w", encoding="utf-8") as jf:
            json.dump(result, jf, indent=2, ensure_ascii=False)
        summary = summarize(result)
        print(summary)
        lf.write(summary + os.linesep)

        lf.write("==== fetch_github_security end ====" + os.linesep)

    # Return 0 even if some endpoints are unauthorized; the script is informational
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
