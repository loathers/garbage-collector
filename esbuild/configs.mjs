import babel from "esbuild-plugin-babel";

export default [
  {
    entryPoints: {
      garbo: "src/index.ts",
    },
    bundle: true,
    platform: "node",
    target: "rhino1.7.14",
    external: ["kolmafia"],
    plugins: [babel()],
    outdir: "KoLmafia/scripts/garbage-collector",
    define: {
      "process.env.GITHUB_SHA": '"CustomBuild"',
      "process.env.GITHUB_REPOSITORY": '"CustomBuild"',
    },
  },
  {
    entryPoints: ["src/relay_garbo.ts"],
    outdir: "KoLmafia/relay",
    platform: "node",
    target: "rhino1.7.14",
    plugins: [babel()],
  },
  {
    bundle: true,
    entryPoints: {
      "garbage-collector": "relay/index.ts",
    },
    outdir: "KoLmafia/relay/garbage-collector",
    plugins: [babel()],
  },
];
