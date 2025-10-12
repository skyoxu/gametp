# Security Policy

## Supported Versions

- main branch: actively maintained
- previous tags: best‑effort only

## Reporting a Vulnerability

- Please email security reports to: security@vitagamestudio.example
- Include: steps to reproduce, impact, affected versions/commits
- We will acknowledge within 72 hours and provide a remediation ETA.

## Disclosure

- We prefer coordinated disclosure. Do not create a public issue for sensitive reports.
- If you already opened an issue, please convert it to private and email us.

## Hardening Checklist (Electron)

- Enforce `sandbox`, `contextIsolation`, `nodeIntegration=false`
- Register CSP headers and deny navigation to external domains
- Apply Electron fuses for releases (run in CI)
- Keep secrets out of the repo (`.env`, CI secrets)
