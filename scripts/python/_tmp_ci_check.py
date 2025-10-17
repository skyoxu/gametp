import json, sys
from pathlib import Path
import subprocess

def run(cmd):
    print('> ', ' '.join(cmd))
    return subprocess.run(cmd, check=False, capture_output=True, text=True)

app_id='2032160'
key='gametp-ai-bot.2025-10-14.private-key.pem'
owner='skyoxu'
repo='gametp'

py = sys.executable

helper_src = r"""
import requests, json, sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
import jwt

app_id=sys.argv[1]
key_pem=Path(sys.argv[2]).read_text(encoding='utf-8')
owner=sys.argv[3]
repo=sys.argv[4]

now=datetime.now(timezone.utc)
payload={'iat': int((now.timestamp()-60)),'exp': int((now+timedelta(minutes=9)).timestamp()),'iss': int(app_id)}
token=jwt.encode(payload, key_pem, algorithm='RS256')
H={'Authorization': f'Bearer {token}','Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'gametp-ci-helper'}
# installation
r=requests.get(f'https://api.github.com/repos/{owner}/{repo}/installation', headers=H, timeout=30)
inst=r.json()['id']
r2=requests.post(f'https://api.github.com/app/installations/{inst}/access_tokens', headers=H, json={}, timeout=30)
inst_token=r2.json()['token']
H2={'Authorization': f'Bearer {inst_token}','Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'gametp-ci-helper'}
# list workflow runs for ci.yml
r3=requests.get(f'https://api.github.com/repos/{owner}/{repo}/actions/workflows/ci.yml/runs?per_page=1&branch=main', headers=H2, timeout=30)
js=r3.json()
print(json.dumps({'status': r3.status_code, 'id': js['workflow_runs'][0]['id'] if js.get('workflow_runs') else None, 'url': js['workflow_runs'][0]['html_url'] if js.get('workflow_runs') else None}, ensure_ascii=False))
"""

from tempfile import NamedTemporaryFile
with NamedTemporaryFile('w', delete=False, suffix='.py', encoding='utf-8') as tf:
    tf.write(helper_src)
    tmp_path = tf.name

r = run([py, tmp_path, app_id, key, owner, repo])
print(r.stdout)
import json as _json
js=_json.loads(r.stdout)
if js.get('id'):
    rid=str(js['id'])
    run([py,'scripts/python/gh_app_fetch_run_logs.py','--app-id',app_id,'--key-file',key,'--owner',owner,'--repo',repo,'--run-id',rid,'--parse'])
else:
    print('No run id found.')
