import pluginVue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import parserTs from '@typescript-eslint/parser';

export default [
  {
    files: ['src/**/*.vue'],
    ignores: ['node_modules', 'dist', '.git'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: vueParser,
      parserOptions: {
        parser: parserTs
      },
      globals: {
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        fetch: 'readonly'
      }
    },
    plugins: {
      vue: pluginVue
    },
    rules: {
      ...pluginVue.configs.base.rules,
      ...pluginVue.configs['vue3-essential'].rules,
      'vue/comment-directive': 'off',
      'vue/no-side-effects-in-computed-properties': 'off',
      'no-unused-vars': 'off',
      'no-undef': 'off'
    }
  },
  {
    files: ['src/**/*.ts'],
    ignores: ['node_modules', 'dist', '.git'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: parserTs,
      globals: {
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        vi: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        MockInstance: 'readonly',
        Mock: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off'
    }
  }
];