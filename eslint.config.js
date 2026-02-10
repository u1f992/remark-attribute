// @ts-check

import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

/**
 * @see https://typescript-eslint.io/getting-started
 */
const eslintConfig = defineConfig(
  {
    ignores: [
      "**/dist/",
      "packages/micromark-extension-attribute/src/factory-attributes.js",
    ],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
);

export default eslintConfig;
