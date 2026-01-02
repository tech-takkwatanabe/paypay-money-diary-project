import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import type { Linter } from "eslint";

export default [
  // Next.js specific configs (includes TypeScript support)
  ...nextVitals,
  ...nextTs,
  // Custom rules and overrides
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // Shared rules from @paypay-money-diary/eslint-config
      "no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  {
    ignores: [
      // Default ignores of eslint-config-next:
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // Generated API files (orval) - allow lint warnings
      "src/api/generated/**",
      "src/api/models/**",
    ],
  },
] as Linter.Config[];
