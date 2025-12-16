import { defineConfig } from "eslint/config";
import garboConfig from "eslint-config-garbo";

export default defineConfig([
  {
    ignores: ["dist", "**/*.js"],
  },
  {
    extends: [garboConfig],
  },
]);
