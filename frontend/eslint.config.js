import js from "@eslint/js";
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
// import cypress from "eslint-plugin-cypress";

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    rules: {
      // ...cypress.configs.recommended.rules,
    },
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.browser
      }
    }
  }
]