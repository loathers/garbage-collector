/* eslint-env node */

import { workerData } from "worker_threads";
import esbuild from "esbuild";

import(workerData.configFile)
  .then((config) => esbuild.context(config.default))
  .then((context) => context.watch())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
