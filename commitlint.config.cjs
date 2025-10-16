module.exports = {
  // Ignore specific legacy multi-scope header used during template bootstrap
  ignores: [msg => /;\s*ci\(/i.test(msg)],
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [0, 'always', []],
    // Increase allowed header length to accommodate detailed CI commit messages
    'header-max-length': [2, 'always', 160],
    // Allow longer lines in body (CI logs / ADR refs often exceed 100 chars)
    'body-max-line-length': [0, 'always'],
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
        'scripts',
        'release',
        'actionlint',
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
    // Warn on empty scope to avoid breaking historical commits in template
    'scope-empty': [1, 'never'],
  },
};
