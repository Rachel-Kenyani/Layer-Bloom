import js from '@eslint/js';
import sonarjs from 'eslint-plugin-sonarjs';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['node_modules', 'plugin/dist'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  sonarjs.configs.recommended,
  {
    languageOptions: {
      globals: { figma: 'readonly', __html__: 'readonly', console: 'readonly' },
    },
  },
  {
    files: ['plugin/build.mjs', 'plugin/tools/*.mjs'],
    languageOptions: { globals: { process: 'readonly' } },
  },
  {
    files: ['plugin/tests/**'],
    rules: { 'sonarjs/no-nested-functions': 'off' },
  },
);
