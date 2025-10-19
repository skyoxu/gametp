module.exports = {
  // Ignore specific legacy multi-scope header used during template bootstrap
  // and a one-off long header introduced during security/perf hardening
  ignores: [
    (msg) => /;\s*ci\(/i.test(msg),
    (msg) => msg.startsWith('feat(security,perf,ci): '),
  ],
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [0, 'always', []],
    // Increase allowed header length to accommodate detailed CI commit messages
    'header-max-length': [2, 'always', 160],
    // Allow longer lines in body (CI logs / ADR refs often exceed 100 chars)
    'body-max-line-length': [0, 'always'],
    // Align with project history: allow 'deps' (Dependabot) and 'scripts' (infra scripts)
    'type-enum': [
      2,
      'always',
      [
        'build',
        'chore',
        'ci',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test',
        'deps',
        'scripts',
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'core',
        'renderer',
        'electron',
        'i18n',
        'prettier',
        'lint',
        'commitlint',
        'config',
        'scripts',
        'release',
        'actionlint',
        // Allow CI changes targeting workflows directory/naming
        'workflows',
        'quality-gates',
        'validate-workflows',
        'build-and-test',
        'prefx',
        'lint-prefx',
        'ci',
        // Allow CI E2E perf-related commits (main history)
        'e2e-perf',
        'encoding',
        'concurrency',
        'perf-weekly',
        'docs',
        'guide',
        'cleanup',
        'tests',
        'test',
        'e2e',
        'npm-install',
        'security',
        'build',
        'deps',
        'infra',
      ],
    ],
    // Do not fail on empty scope (historical commits & Dependabot often omit scope)
    'scope-empty': [0, 'never'],
  },
};
