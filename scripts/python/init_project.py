import argparse
import json
import os
import datetime
from typing import Any, Dict


def load_json(path: str) -> Dict[str, Any]:
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json(path: str, data: Dict[str, Any]) -> None:
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')


def ensure_logs_dir() -> str:
    day = datetime.date.today().isoformat()
    p = os.path.join('logs', day, 'init')
    os.makedirs(p, exist_ok=True)
    return p


def patch_package_json(pkg_path: str, name: str | None, product_name: str | None, description: str | None) -> Dict[str, Any]:
    pkg = load_json(pkg_path)
    before = {k: pkg.get(k) for k in ('name', 'productName', 'description', 'version')}
    if name:
        pkg['name'] = name
    if product_name:
        pkg['productName'] = product_name
    if description:
        pkg['description'] = description
    save_json(pkg_path, pkg)
    after = {k: pkg.get(k) for k in ('name', 'productName', 'description', 'version')}
    return {'file': pkg_path, 'before': before, 'after': after}


def patch_env_placeholders(placeholders: Dict[str, str]) -> Dict[str, Any]:
    touched: Dict[str, Any] = {'files': []}
    # Minimal pass: update README and index.html titles if present
    candidates = [
        'README.md',
        'index.html',
        os.path.join('electron', 'main.ts'),
    ]
    for path in candidates:
        if not os.path.exists(path):
            continue
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        new_content = content
        for src, dst in placeholders.items():
            if src and dst and src in new_content:
                new_content = new_content.replace(src, dst)
        if new_content != content:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            touched['files'].append(path)
    return touched


def main() -> None:
    parser = argparse.ArgumentParser(
        description='Initialize a new project from the template (Windows-friendly, Python-based)'
    )
    parser.add_argument('--name', help='package.json name (e.g. my-game)')
    parser.add_argument('--product-name', help='package.json productName for Electron')
    parser.add_argument('--description', help='package description')
    parser.add_argument('--sentry-dsn', help='Sentry DSN to set via environment placeholder', default='')
    parser.add_argument('--domain-prefix', help='Event domain prefix placeholder value', default='')
    parser.add_argument('--dry-run', action='store_true', help='Do not modify files; print intended changes only')

    args = parser.parse_args()
    logs_dir = ensure_logs_dir()
    summary: Dict[str, Any] = {
        'timestamp': datetime.datetime.now().isoformat(),
        'logs': logs_dir,
        'changes': [],
        'placeholders': {},
    }

    # package.json
    pkg_path = 'package.json'
    if os.path.exists(pkg_path) and not args.dry_run:
        change = patch_package_json(pkg_path, args.name, args.product_name, args.description)
        summary['changes'].append(change)
    else:
        summary['changes'].append({'file': pkg_path, 'skipped': True})

    # Simple placeholder replacements
    placeholders: Dict[str, str] = {}
    if args.product_name:
        # Replace the default product display name if present
        placeholders['Game TP'] = args.product_name
    if args.domain_prefix:
        placeholders['${DOMAIN_PREFIX}'] = args.domain_prefix
    if args.sentry_dsn:
        placeholders['process.env.SENTRY_DSN'] = f'"{args.sentry_dsn}"'

    summary['placeholders'] = placeholders
    if placeholders and not args.dry_run:
        touched = patch_env_placeholders(placeholders)
        summary['changes'].append({'placeholder_applied': touched})

    # Write summary
    with open(os.path.join(logs_dir, 'init-summary.json'), 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    print(os.path.join(logs_dir, 'init-summary.json'))


if __name__ == '__main__':
    main()

