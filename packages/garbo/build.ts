import esbuild, { Plugin } from "esbuild";

// @ts-expect-error No types for this module
const babel = (await import("esbuild-plugin-babel")) as () => Plugin;

const watch = process.argv.some((arg) => ["--watch", "-w"].includes(arg));

const context = await esbuild.context({
  bundle: true,
  platform: "node",
  target: "rhino1.8.0",
  external: ["kolmafia"],
  define: {
    "process.env.GITHUB_SHA": `"${
      process.env?.["GITHUB_SHA"] ?? "CustomBuild"
    }"`,
    "process.env.GITHUB_REF_NAME": `"${
      process.env?.["GITHUB_REF_NAME"] ?? "CustomBuild"
    }"`,
    "process.env.GITHUB_REPOSITORY": `"${
      process.env?.["GITHUB_REPOSITORY"] ?? "CustomBuild"
    }"`,
  },
  entryPoints: {
    "scripts/garbage-collector/garbo": "src/index.ts",
    "relay/relay_garbo": "src/relay_garbo.ts",
  },
  entryNames: "[dir]/[name]",
  outdir: "dist",
  plugins: [babel()],
});

await context.rebuild();

if (watch) {
  await context.watch();
} else {
  context.dispose();
}
