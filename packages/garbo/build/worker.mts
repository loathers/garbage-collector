/* eslint-env node */
import { workerData } from "worker_threads";
import esbuild from "esbuild";
import babel from "esbuild-plugin-babel";

import type { WorkerData } from "./index.mjs";

const { watch, config } = workerData as WorkerData;

const context = await esbuild.context({
  ...workerData.config,
  ...(config.platform === "node" ? { plugins: [babel()] } : {}),
});

await context.rebuild();

if (watch) {
  await context.watch();
} else {
  context.dispose();
}
