import { rm } from "node:fs/promises";

import { value } from "./const";
import { regOption, meta, NPM, Conf } from "@/registry";
import { setTsOptions, installTmplt, setPkgName, setPkgVers } from "@/command";

const run = async (conf: Conf) => {
  const npm = conf.npm;
  const name = conf.node!.name!;
  const cwd = conf.type !== meta.system.type.monorepo ? "." : name;
  const ts = conf.node!.typescript!;

  await reinstall(npm, name, cwd, ts);
};

regOption(
  {
    name: meta.plugin.option.type.common.typescript,
    label: "Typescript",
    plugin: { run },
    values: [
      {
        name: value.typescript.nodec,
        label: "No decorator",
        disables: [],
        enables: [],
      },
      {
        name: value.typescript.metadata,
        label: "Decorator with emitDecoratorMetadata",
        disables: [],
        enables: [],
      },
      {
        name: meta.plugin.value.none,
        label: "None",
        disables: [],
        enables: [],
      },
    ],
  },
  meta.system.option.category.type,
  meta.plugin.type.node,
);

const base =
  "https://raw.githubusercontent.com/bradhezh/prj-template/master/type/node/js/node.tar" as const;
const template = { node: { name: "node.tar" } } as const;
const files = ["package.json", "tsconfig.json", "src"];

const reinstall = async (npm: NPM, name: string, cwd: string, ts: string) => {
  if (ts === value.typescript.nodec) {
    return;
  }
  if (ts === value.typescript.metadata) {
    await setTsOptions(
      { experimentalDecorators: true, emitDecoratorMetadata: true },
      cwd,
    );
    return;
  }
  if (ts !== meta.plugin.value.none) {
    return;
  }
  for (const file of files) {
    await rm(file, { recursive: true, force: true });
  }
  await installTmplt(base, template, meta.plugin.type.node, cwd, true);
  await setPkgName(npm, name, cwd);
  await setPkgVers(npm, cwd);
};
