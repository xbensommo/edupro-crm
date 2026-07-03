/**
 * @file functions/.eslintrc.cjs
 * @description ESLint config for Firebase Functions only.
 * This prevents ESLint from inheriting the Vue frontend config from the project root.
 */

module.exports = {
  root: true,

  env: {
    es2022: true,
    node: true,
  },

  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },

  extends: ['eslint:recommended'],

  ignorePatterns: [
    'node_modules/',
    'lib/',
    'dist/',
    'coverage/',
    '.firebase/',
  ],

  rules: {
    'no-console': 'off',
    'no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
  },
}