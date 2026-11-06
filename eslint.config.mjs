// @ts-check
import path from "node:path";
import { fileURLToPath } from "node:url";

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import sonarjs from "eslint-plugin-sonarjs";
import security from "eslint-plugin-security";
import globals from "globals";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  {
    ignores: ["build/**", "dist/**", "reports/**", "coverage/**", ".stryker-tmp/**", "node_modules/**", "**/*.d.ts", "eslint.config.mjs"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  sonarjs.configs.recommended,
  security.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.node },
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: dirname,
      },
    },
    rules: {
      eqeqeq: ["error", "always"],
      "no-var": "error",
      "prefer-const": "error",
      // Size and style findings are reported but do not fail the build.
      complexity: ["warn", 10],
      "max-depth": ["warn", 4],
      "sonarjs/cognitive-complexity": ["warn", 15],
      "sonarjs/pseudo-random": "warn",
      "sonarjs/slow-regex": "warn",
      "sonarjs/no-dead-store": "warn",
      "no-useless-assignment": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
  {
    files: ["tests/**/*.ts"],
    rules: {
      "sonarjs/no-floating-point-equality": "off",
      "sonarjs/no-alphabetical-sort": "off",
      "sonarjs/void-use": "off",
      "security/detect-non-literal-fs-filename": "off",
      "security/detect-object-injection": "off",
    },
  },
);
