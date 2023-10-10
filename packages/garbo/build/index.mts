/* eslint-env node */
import { Worker } from "worker_threads";
import type { BuildOptions } from "esbuild";
import process from "process";

const watch = process.argv.some((arg) => ["--watch", "-w"].includes(arg));

const script = {
  entryPoints: {
    garbo: "src/index.ts",
  },
  bundle: true,
  platform: "node",
  target: "rhino1.7.14",
  external: ["kolmafia"],
  outdir: "dist/scripts/garbage-collector",
  define: {
    "process.env.GITHUB_SHA": '"CustomBuild"',
    "process.env.GITHUB_REPOSITORY": '"CustomBuild"',
  },
} satisfies BuildOptions;

const relayApi = {
  entryPoints: ["src/relay_garbo.ts"],
  bundle: true,
  platform: "node",
  target: "rhino1.7.14",
  external: ["kolmafia"],
  outdir: "dist/relay",
  define: {
    "process.env.GITHUB_SHA": '"CustomBuild"',
    "process.env.GITHUB_REPOSITORY": '"CustomBuild"',
  },
} satisfies BuildOptions;

const relayClient = {
  bundle: true,
  entryPoints: {
    "garbage-collector": "relay/index.ts",
  },
  outdir: "dist/relay/garbage-collector",
} satisfies BuildOptions;

export type WorkerData = { config: BuildOptions; watch: boolean };

Promise.all(
  [script, relayApi, relayClient].map(
    (config) =>
      new Promise<void>((resolve, reject) => {
        const worker = new Worker("./build/worker.mjs", {
          workerData: { config, watch } satisfies WorkerData,
        });
        worker.on("error", reject);
        worker.on("exit", (code) => {
          if (code !== 0) {
            reject(new Error(`Worker stopped with exit code ${code}`));
          } else {
            resolve();
          }
        });
      }),
  ),
).catch((e) => {
  console.error(e);
  process.exit(1);
});
