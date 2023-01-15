/* eslint-env node */

import process from "process";
import esbuild from "esbuild";

import configs from "./configs.mjs";

const watch = process.argv.some((arg) => ["--watch", "-w"].includes(arg));

Promise.all(
  configs.map(async (config) => {
    if (watch) {
      const context = await esbuild.context(config);
      await context.watch();
    } else {
      await esbuild.build(config);
    }
  })
).catch((e) => {
  console.error(e);
  process.exit(1);
});

export {};
