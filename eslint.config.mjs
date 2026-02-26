import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";
import pluginQuery from "@tanstack/eslint-plugin-query";
import reactCompiler from "eslint-plugin-react-compiler";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...pluginQuery.configs["flat/recommended"],
  reactCompiler.configs.recommended,
  {
    rules: {
      "react-compiler/react-compiler": "warn",
    },
  },
  prettierConfig,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Auto-generated ATProto lexicon types — not linted by design:
    "lexicons/**",
  ]),
]);

export default eslintConfig;
