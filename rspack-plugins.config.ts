import { defineConfig } from "@rspack/cli";
import { ExternalItem } from "@rspack/core";
import nodeExternals from "webpack-node-externals";
import { TsCheckerRspackPlugin } from "ts-checker-rspack-plugin";
import { RunScriptWebpackPlugin } from "run-script-webpack-plugin";
import path from "node:path";
import { readdirSync } from "node:fs";

const dev = process.env.NODE_ENV === "development";

export default defineConfig({
  target: "node",
  mode: !dev ? "production" : "development",

  entry: {
    ...Object.fromEntries(
      readdirSync(path.join(__dirname, "src", "plugins"))
        .filter((e) => e.endsWith(".ts"))
        .map((e) => [
          path.join("plugins", path.basename(e, ".ts")),
          path.join(__dirname, "src", "plugins", e),
        ]),
    ),
  },

  resolve: {
    extensions: [".ts", "..."],
    tsConfig: path.join(__dirname, "tsconfig.json"),
  },

  externals: [
    nodeExternals() as ExternalItem,
    { "@/registry": "../registry.js" },
  ],
  externalsType: "commonjs",

  module: { rules: [{ test: /\.ts$/, use: { loader: "builtin:swc-loader" } }] },

  devServer: { devMiddleware: { writeToDisk: true } },

  plugins: [
    new TsCheckerRspackPlugin(),
    dev && new RunScriptWebpackPlugin({ name: "index.js" }),
  ].filter(Boolean),
});
