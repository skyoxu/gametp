from __future__ import annotations

import json
from pathlib import Path


RISKY = {
    'minimist','minimatch','semver','braces','glob-parent','tough-cookie','node-forge','qs',
    'jsonwebtoken','yargs-parser','http-proxy-agent','set-value','kind-of','ansi-regex',
    'nth-check','css-what','merge','underscore','lodash','debug','path-to-regexp'
}


def main() -> int:
    lock = Path('package-lock.json')
    if not lock.exists():
        print('NO_LOCK')
        return 1
    data = json.loads(lock.read_text(encoding='utf-8'))
    seen: dict[str, str] = {}
    if 'packages' in data:
        for k, v in data['packages'].items():
            if isinstance(v, dict) and 'version' in v:
                name = v.get('name') or Path(k).name
                ver = v.get('version')
                if name in RISKY and ver:
                    seen.setdefault(name, ver)
    elif 'dependencies' in data:
        for name, v in data['dependencies'].items():
            ver = v.get('version') if isinstance(v, dict) else None
            if name in RISKY and ver:
                seen.setdefault(name, ver)
    for name in sorted(seen):
        print(f"{name}@{seen[name]}")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

