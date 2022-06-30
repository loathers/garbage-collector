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
    outdir: "KoLmafia2/scripts/garbage-collector",
    define: {
      "process.env.GITHUB_SHA": "CustomBuild",
      "process.env.GITHUB_REPOSITORY": "CustomBuild",
    },
  }),
  build({
    entryPoints: ["src/relay_garbo.ts"],
    outdir: "KoLmafia2/relay",
    platform: "node",
    target: "rhino1.7.14",
    plugins: [babel()],
  }),
  build({
    bundle: true,
    entryPoints: ["relay/index.ts"],
    loader: { ".tsx": "tsx" },
    outfile: "KoLmafia2/relay/garbage-collector/garbage-collector.js",
    plugins: [babel()],
  }),
]).catch((e) => {
  console.error(e);
  process.exit(1);
});

export {};
