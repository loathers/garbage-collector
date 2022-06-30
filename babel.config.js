/* eslint-env node */

module.exports = function (api) {
  api.cache(true);
  return {
    exclude: ["App.css"],
    presets: [
      "@babel/preset-typescript",
      "@babel/preset-react",
      [
        "@babel/preset-env",
        {
          targets: { rhino: "1.7.13" },
        },
      ],
    ],
    plugins: [
      "@babel/plugin-proposal-class-properties",
      "@babel/plugin-proposal-object-rest-spread",
      "babel-plugin-transform-scss",
    ],
  };
};
