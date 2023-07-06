import babel from "esbuild-plugin-babel";

export default {
  entryPoints: ["src/relay_garbo.ts"],
  bundle: true,
  platform: "node",
  target: "rhino1.7.14",
  external: ["kolmafia"],
  plugins: [babel()],
  outdir: "KoLmafia/relay",
  define: {
    "process.env.GITHUB_SHA": '"CustomBuild"',
    "process.env.GITHUB_REPOSITORY": '"CustomBuild"',
  },
};
