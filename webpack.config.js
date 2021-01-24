const path = require("path");

module.exports = {
  entry: {
    garbo: "./src/index.js",
    "garbo-combat": "./src/combat.js",
  },
  mode: "development",
  devtool: false,
  output: {
    path: path.resolve(__dirname, "KoLmafia", "scripts", "garbage-collector"),
    filename: "[name].js",
    libraryTarget: "commonjs",
  },
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
      },
    ],
  },
  plugins: [],
  externals: {
    kolmafia: "commonjs kolmafia",
  },
};
