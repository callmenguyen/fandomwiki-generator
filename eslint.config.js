import js from '@eslint/js';
import globals from 'globals';
export default [
  { ignores: ['node_modules/**', 'dist/**', 'coverage/**', 'playwright-report/**', 'test-results/**'] },
  js.configs.recommended,
  { languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.node, ...globals.browser } }, rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }] } },
];
