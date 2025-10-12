# Dependency Security Policy

This repo enforces dependency security via two complementary tools:

- Snyk (license + known vulnerabilities)
- audit-ci (npm audit wrapper with CI-friendly gating)

## Gates and Behavior

- On `main` branch, both Snyk and audit-ci are blocking (fail the pipeline on high/critical issues).
- On PRs/feature branches, they warn but do not block (reports are uploaded as artifacts).

## Allowlisting (temporary exceptions)

Use `audit-ci.json` at the repo root to add temporary allowlist entries.

Example:

```
{
  "allowlist": [
    "GHSA-xxxx-xxxx-xxxx",
    "npm:some-package@1.2.3"
  ]
}
```

Guidelines:

- Prefer upgrading dependencies over allowlisting.
- Include a PR note explaining the rationale, scope, and removal plan.
- Keep allowlist minimal and time-bound; remove once upstream is fixed.

## Local Verification

- Run `npm audit` to see advisories.
- Run `npx audit-ci --high --critical -c audit-ci.json` to mirror CI behavior.
- Run `SNYK_TOKEN=… node scripts/ci/run-snyk-scan.mjs` to generate `snyk-report.json` locally.
