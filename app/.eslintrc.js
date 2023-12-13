module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'import'],
  extends: ['airbnb-base', 'plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  root: true,
  env: {
    node: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    camelcase: 'off',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'import/prefer-default-export': 'off',
    'no-useless-constructor': 'off',
    'dot-notation': 'off',
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
    indent: 'off',
    'import/no-extraneous-dependencies': 'warn',
    'import/order': [
      1,
      {
        groups: ['external', 'builtin', 'internal', 'sibling', 'parent', 'index'],
        pathGroups: [
          {
            pattern: 'components',
            group: 'internal',
          },
          {
            pattern: 'common',
            group: 'internal',
          },
          {
            pattern: 'routes/ **',
            group: 'internal',
          },
          {
            pattern: 'assets/**',
            group: 'internal',
            position: 'after',
          },
        ],
        pathGroupsExcludedImportTypes: ['internal'],
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    '@typescript-eslint/no-var-requires': 'off',
    'no-param-reassign': ['error', { ignorePropertyModificationsFor: ['interaction'] }],
  },
  overrides: [
    {
      files: '*.model.ts',
      rules: {
        'import/no-cycle': 'off',
      },
    },
  ],
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        moduleDirectory: ['node_modules', 'src/'],
      },
    },
  },
};
