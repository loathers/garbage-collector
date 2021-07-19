/* eslint-env node */

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const sharedConfig = {
  mode: "production",
  optimization: {
    minimize: false,
  },
  performance: {
    hints: false,
  },
  devtool: false,
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json"],
  },
  module: {
    rules: [
      {
        // Include ts, tsx, js, and jsx files.
        test: /\.(ts|js)x?$/,
        // exclude: /node_modules/,
        loader: "babel-loader",
        options: { presets: ["@babel/env", "@babel/preset-react"] },
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
    ],
  },
  plugins: [new MiniCssExtractPlugin()],
  externals: {
    "canadv.ash": "commonjs canadv.ash",
    kolmafia: "commonjs kolmafia",
  },
};

const scriptsConfig = Object.assign(
  {
    entry: {
      garbo: "./src/index.ts",
      "garbo-combat": "./src/combat.ts",
    },
    output: {
      path: path.resolve(__dirname, "KoLmafia", "scripts", "garbage-collector"),
      filename: "[name].js",
      libraryTarget: "commonjs",
    },
  },
  sharedConfig
);

// handle the file creating the garbo UI html file
const otherRelayConfig = Object.assign(
  {
    entry: "./src/relay_garbo.ts",
    output: {
      path: path.resolve(__dirname, "KoLmafia", "relay"),
      filename: "relay_garbo.js",
      libraryTarget: "commonjs",
    },
  },
  sharedConfig
);

// handle the react files used in the garbo html file
const relayConfig = Object.assign(
  {
    entry: "./src/relay/index.tsx",
    output: {
      path: path.resolve(__dirname, "KoLmafia/relay/garbage-collector/"),
      filename: "garbage-collector.js",
      libraryTarget: "commonjs",
    },
  },
  sharedConfig
);

module.exports = [scriptsConfig, relayConfig, otherRelayConfig];
