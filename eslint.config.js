// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    // A forgotten `await` on file or database work fails silently; type-aware lint catches it.
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["scripts/**"],
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: __dirname } },
    rules: { "@typescript-eslint/no-floating-promises": "error" },
  },
  {
    ignores: ["dist/**", ".artifacts/**", "public/**"],
  }
]);
