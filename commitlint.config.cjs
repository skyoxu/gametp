module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [0, 'always', []],
    'header-max-length': [2, 'always', 100],
    'scope-enum': [
      2,
      'always',
      [
        'core',
        'renderer',
        'electron',
        'i18n',
        'ci',
        'docs',
        'tests',
        'security',
        'build',
        'deps',
        'infra',
      ],
    ],
    'scope-empty': [2, 'never'],
  },
};
