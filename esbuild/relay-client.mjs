import babel from "esbuild-plugin-babel";

export default {
  bundle: true,
  entryPoints: {
    "garbage-collector": "relay/index.ts",
  },
  outdir: "KoLmafia/relay/garbage-collector",
  plugins: [babel()],
};
