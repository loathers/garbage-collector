import { defineConfig } from "eslint/config";
import { createConfig } from "eslint-config-garbo";

const garboConfig = await createConfig();

export default defineConfig([
  {
    ignores: ["dist", "**/*.js"],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    extends: [garboConfig],
  },
]);
