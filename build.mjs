/* eslint-env node */

import { build } from "esbuild";
import babel from "esbuild-plugin-babel";

Promise.all([
  build({
    entryPoints: {
      garbo: "src/index.ts",
      "garbo-combat": "src/combat.ts",
    },
    bundle: true,
    platform: "node",
    target: "rhino1.7.14",
    external: ["kolmafia", "canadv.ash"],
    plugins: [babel()],
    outdir: "KoLmafia/scripts/garbage-collector",
    define: {
      "process.env.GITHUB_SHA": "\"CustomBuild\"",
      "process.env.GITHUB_REPOSITORY": "\"CustomBuild\"",
    },
  }),
  build({
    entryPoints: ["src/relay_garbo.ts"],
    outdir: "KoLmafia/relay",
    platform: "node",
    target: "rhino1.7.14",
    plugins: [babel()],
  }),
  build({
    bundle: true,
    entryPoints: {
      "garbage-collector": "relay/index.ts",
    },
    outdir: "KoLmafia/relay/garbage-collector",
    plugins: [babel()],
  }),
]).catch((e) => {
  console.error(e);
  process.exit(1);
});

export {};
