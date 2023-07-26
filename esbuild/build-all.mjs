/* eslint-env node */

import { Worker } from "worker_threads";
import process from "process";

const watch = process.argv.some((arg) => ["--watch", "-w"].includes(arg));

Promise.all(
  ["./executable.mjs", "./relay-api.mjs", "./relay-client.mjs"].map(
    (configFile) =>
      new Promise((resolve, reject) => {
        const worker = new Worker(watch ? "./esbuild/watch.mjs" : "./esbuild/build.mjs", {
          workerData: { configFile },
        });
        worker.on("error", reject);
        worker.on("exit", (code) => {
          if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
          else resolve();
        });
      }),
  ),
).catch((e) => {
  console.error(e);
  process.exit(1);
});
