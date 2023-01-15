/* eslint-env node */

import process from "process";
import esbuild from "esbuild";

import executable from "./executable.mjs";
import relayApi from "./relay-api.mjs";
import relayClient from "./relay-client.mjs";

const watch = process.argv.some((arg) => ["--watch", "-w"].includes(arg));

Promise.all(
  [executable, relayApi, relayClient].map(async (config) => {
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
