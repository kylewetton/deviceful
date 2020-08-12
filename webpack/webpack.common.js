const Path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    app: Path.resolve(__dirname, "../src/scripts/index.js"),
  },
  output: {
    path: Path.join(__dirname, "../dist"),
    filename: "deviceful.min.js",
    library: "Deviceful",
    libraryTarget: "umd",
    libraryExport: "default",
    umdNamedDefine: true,
  },
  optimization: {
    runtimeChunk: false,
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin([
      { from: Path.resolve(__dirname, "../public"), to: "public" },
    ]),
  ],
  resolve: {
    alias: {
      "~": Path.resolve(__dirname, "../src"),
    },
  },
  module: {
    rules: [
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: "javascript/auto",
      },
    ],
  },
};
