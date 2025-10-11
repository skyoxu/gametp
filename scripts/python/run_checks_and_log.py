"""
Windows-only helper to run quick checks and write logs to logs/<date>/refine/.
Usage (Windows):
  py -3 scripts/python/run_checks_and_log.py

Notes:
- Per repo rules, use Python (not PowerShell) to orchestrate.
- Minimum Python version: 3.8+
"""

import datetime
import json
import os
import subprocess
import sys


def run(cmd: list[str], cwd: str | None = None) -> tuple[int, str]:
    """Run a command and capture output. On Windows, fallback to npm.cmd/npx.cmd if needed."""
    try:
        proc = subprocess.run(
            cmd,
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding='utf-8',
            errors='replace',
            shell=False,
        )
        code = proc.returncode
        out = proc.stdout
        # Fallback for npm on Windows
        if code == 127 and cmd and cmd[0] in ('npm', 'npx'):
            proc2 = subprocess.run(
                [cmd[0] + '.cmd', *cmd[1:]],
                cwd=cwd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding='utf-8',
                errors='replace',
                shell=False,
            )
            return proc2.returncode, proc2.stdout
        return code, out
    except FileNotFoundError as e:
        if cmd and cmd[0] in ('npm', 'npx'):
            try:
                proc2 = subprocess.run(
                    [cmd[0] + '.cmd', *cmd[1:]],
                    cwd=cwd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    encoding='utf-8',
                    errors='replace',
                    shell=False,
                )
                return proc2.returncode, proc2.stdout
            except FileNotFoundError as e2:
                return 127, str(e2)
        return 127, str(e)


def ensure_dir(p: str) -> None:
    os.makedirs(p, exist_ok=True)


def main() -> int:
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    today = datetime.datetime.now().strftime('%Y-%m-%d')
    out_dir = os.path.join(root, 'logs', today, 'refine')
    ensure_dir(out_dir)

    summary = {
        'date': today,
        'steps': [],
    }

    # Typecheck
    code, out = run(['npm', 'run', 'typecheck'], cwd=root)
    with open(os.path.join(out_dir, 'typecheck.txt'), 'w', encoding='utf-8') as f:
        f.write(out)
    summary['steps'].append({'name': 'typecheck', 'exitCode': code})

    # Unit tests (vitest)
    code_tests, out_tests = run(['npm', 'run', 'test:unit'], cwd=root)
    with open(os.path.join(out_dir, 'unit-tests.txt'), 'w', encoding='utf-8') as f:
        f.write(out_tests)
    summary['steps'].append({'name': 'test:unit', 'exitCode': code_tests})

    # Focused E2E smoke for i18n (optional; ignore failures in summary but record exitCode)
    code_e2e, out_e2e = run(
        ['npx', 'playwright', 'test', '-c', 'playwright.config.ts', 'tests/e2e/smoke/i18n-language.smoke.spec.ts'],
        cwd=root,
    )
    # Fallback to npx.cmd if needed is handled in run()
    with open(os.path.join(out_dir, 'e2e-i18n-smoke.txt'), 'w', encoding='utf-8') as f:
        f.write(out_e2e)
    summary['steps'].append({'name': 'test:e2e:i18n-smoke', 'exitCode': code_e2e})

    # Settings overlay language switch E2E
    code_e2e_settings, out_e2e_settings = run(
        ['npx', 'playwright', 'test', '-c', 'playwright.config.ts', 'tests/e2e/smoke/i18n-settings.smoke.spec.ts'],
        cwd=root,
    )
    with open(os.path.join(out_dir, 'e2e-i18n-settings.txt'), 'w', encoding='utf-8') as f:
        f.write(out_e2e_settings)
    summary['steps'].append({'name': 'test:e2e:i18n-settings', 'exitCode': code_e2e_settings})

    # Summary
    with open(os.path.join(out_dir, 'summary.json'), 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2)

    # Print short status to stdout
    print(json.dumps(summary))
    return 0 if code == 0 and code_tests == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
