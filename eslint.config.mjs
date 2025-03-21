import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";


export default [
  {files: ["**/*.{js,mjs,cjs,ts}"]},
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "no-console": "off",
      "no-debugger": "off",
      "no-unused-vars": "off",
      "no-undef": "off",
      "no-unused-expressions": "off",
      "no-unused-labels": "off",
      "no-unreachable": "off",
      "semi": ["warn", "always"],
    }
  }
];