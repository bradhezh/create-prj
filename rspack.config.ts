import { defineConfig } from "@rspack/cli";
import { ExternalItem } from "@rspack/core";
import nodeExternals from "webpack-node-externals";
import { TsCheckerRspackPlugin } from "ts-checker-rspack-plugin";
import { RunScriptWebpackPlugin } from "run-script-webpack-plugin";
import { join } from "node:path";

const dev = process.env.NODE_ENV === "development";

export default defineConfig({
  target: "node",
  mode: !dev ? "production" : "development",

  entry: {
    index: join(__dirname, "src", "index.ts"),
    registry: join(__dirname, "src", "registry.ts"),
  },
  output: { library: { type: "commonjs" }, clean: true },

  resolve: {
    extensions: [".ts", "..."],
    tsConfig: join(__dirname, "tsconfig.json"),
  },

  externals: [
    nodeExternals() as ExternalItem,
    { "@/registry": "./registry.js", "./registry": "./registry.js" },
  ],
  externalsType: "commonjs",

  module: { rules: [{ test: /\.ts$/, use: { loader: "builtin:swc-loader" } }] },

  devServer: { devMiddleware: { writeToDisk: true } },

  plugins: [
    new TsCheckerRspackPlugin(),
    dev && new RunScriptWebpackPlugin({ name: "index.js" }),
  ].filter(Boolean),
});
