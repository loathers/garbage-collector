import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import libram, { verifyConstantsSinceRevision } from "eslint-plugin-libram";
import { defineConfig } from "eslint/config";

await verifyConstantsSinceRevision(28804);

export default defineConfig(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...libram.configs.recommended,
  prettier,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.mjs", "*.js"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "block-scoped-var": "error",
      curly: ["error", "multi-line"],
      "eol-last": "error",
      eqeqeq: "error",
      "no-trailing-spaces": "error",
      "no-var": "error",
      "prefer-arrow-callback": "error",
      "prefer-const": "error",
      "prefer-template": "error",
      "sort-imports": [
        "error",
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
        },
      ],
      "spaced-comment": "error",

      // This one needs a fix because TS's rules are different?
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-non-null-assertion": "error",

      // eslint-plugin-libram
      "libram/verify-constants": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.property.name='reduce'][arguments.length<2]",
          message: "Provide initialValue to .reduce().",
        },
      ],
    },
  },
);
