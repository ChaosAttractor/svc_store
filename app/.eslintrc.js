module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'import'],
  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    "camelcase": "off",
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    "no-useless-constructor": "off",
    "dot-notation": "off",
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        "js": "never",
        "jsx": "never",
        "ts": "never",
        "tsx": "never"
      }
    ],
    "indent": "off",
    "import/no-extraneous-dependencies": "warn",
    "import/order":
      [
        1,
        {
          "groups":
            [
              "external",
              "builtin",
              "internal",
              "sibling",
              "parent",
              "index"
            ],
          "pathGroups": [
            {
              "pattern": "components",
              "group": "internal"
            },
            {
              "pattern": "common",
              "group": "internal"
            },
            {
              "pattern": "routes/ **",
              "group": "internal"
            },
            {
              "pattern": "assets/**",
              "group": "internal",
              "position": "after"
            }
          ],
          "pathGroupsExcludedImportTypes":
            ["internal"],
          "alphabetize": {
            "order": "asc",
            "caseInsensitive": true
          }
        }
      ],
  },
  "overrides": [
    {
      "files": "*.model.ts",
      "rules": {
        "import/no-cycle": "off",
      }
    }
  ],
  settings: {
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx"]
    },
    "import/resolver": {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        moduleDirectory: ['node_modules', 'src/'],
      },
    }
  }

};
