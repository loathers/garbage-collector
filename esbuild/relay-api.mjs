import babel from "esbuild-plugin-babel";

export default {
  entryPoints: ["src/relay_garbo.ts"],
  outdir: "KoLmafia/relay",
  platform: "node",
  target: "rhino1.7.14",
  plugins: [babel()],
};
