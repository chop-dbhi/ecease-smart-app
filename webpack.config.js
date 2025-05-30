const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require('html-webpack-plugin');

// Set enviroment based on flag passed in to webpack configuration
const environment = process.env.production === "true" ? "production" : "development";

module.exports = {
  optimization: {
    minimize: false,
  },
  entry: {
    "index": "./src/app/index.js",
    "launch": "./src/launch/launch.js"
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
              "@babel/preset-react"
            ]
          }
        }
      },
      {
        test: /\.s?[ac]ss$/i,
        use: [
            "style-loader",
            "css-loader",
            "sass-loader"
        ],
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: "file-loader",
              options: {
                  name: "images/[name].[ext]"
              },
          },
        ],
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      __BUILD_ENVIRONMENT__: JSON.stringify(environment)
    }),
    new HtmlWebpackPlugin({
      title: "eCEASE Clinician Tool",
      template: "./templates/index.html",
      filename: "index.html",
      chunks: ["index"]
    }),
    new HtmlWebpackPlugin({
      title: "eCEASE Launch",
      template: "./templates/launch.html",
      filename: "launch.html",
      chunks: ["launch"]
    })
  ],
  resolve: {
    alias: {
      "Src": path.resolve(__dirname, "src/"),
      "App": path.resolve(__dirname, "src/app/"),
      "Components": path.resolve(__dirname, "src/app/components/"),
      "Conf": path.resolve(__dirname, "src/conf/"),
      "Common": path.resolve(__dirname, "src/app/common/"),
      "Shared": path.resolve(__dirname, "src/shared/"),
    },
  },
  output: {
    filename: "./js/[name].js",
    path: path.resolve(__dirname, "public")
  },
};