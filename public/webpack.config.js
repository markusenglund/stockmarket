const path = require("path")
const webpack = require("webpack")

module.exports = {
  entry: "./src/javascripts/app.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
    publicPath: "/dist"
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          "style-loader",
          "css-loader" //Could use sass-loader here
        ]
      },
      {
        test: /\.js$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["react", "es2015"]
          }
        }
      }
    ]
  }
}
