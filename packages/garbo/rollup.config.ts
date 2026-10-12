import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import { defineConfig } from "rollup";

const extensions = [".js", ".ts"];

// KoLmafia loads every script on its own, so each one is a separate build with
// no shared chunks.
const scripts = [
  { input: "src/index.ts", file: "dist/scripts/garbage-collector/garbo.js" },
  { input: "src/relay_garbo.ts", file: "dist/relay/relay_garbo.js" },
  {
    input: "src/price_garbo.ts",
    file: "dist/scripts/garbage-collector/garbo-price.js",
  },
];

export default scripts.map(({ input, file }) =>
  defineConfig({
    input,
    external: ["kolmafia"],
    output: { file, format: "cjs", exports: "auto" },
    plugins: [
      replace({
        preventAssignment: true,
        values: {
          "process.env.GITHUB_SHA": JSON.stringify(
            process.env["GITHUB_SHA"] ?? "CustomBuild",
          ),
          "process.env.GITHUB_REF_NAME": JSON.stringify(
            process.env["GITHUB_REF_NAME"] ?? "CustomBuild",
          ),
          "process.env.GITHUB_REPOSITORY": JSON.stringify(
            process.env["GITHUB_REPOSITORY"] ?? "CustomBuild",
          ),
        },
      }),
      resolve({ extensions }),
      commonjs(),
      babel({
        babelHelpers: "bundled",
        extensions,
        babelrc: false,
        presets: [
          ["@babel/preset-env", { targets: { rhino: "1.9.1" } }],
          "@babel/preset-typescript",
        ],
      }),
    ],
    watch: { clearScreen: false },
  }),
);
