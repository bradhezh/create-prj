import { rm } from "node:fs/promises";
import { join } from "node:path";
import { log, spinner } from "@clack/prompts";
import { format } from "node:util";

import { value } from "./const";
import { regOption, meta, NPM, Conf } from "@/registry";
import { setTsOptions, installTmplt, setPkgName, setPkgVers } from "@/command";
import { message as msg } from "@/message";

const message = {
  ...msg,
  pluginStart: "Configuring Typescript for %s",
  reinstall: "Replacing Typescript files with Javascript ones",
  pluginFinish: "Typescript for %s completed!",
} as const;

const run = async (conf: Conf) => {
  const s = spinner();
  s.start();

  const npm = conf.npm;
  const name = conf.node!.name!;
  const cwd = conf.type !== meta.system.type.monorepo ? "." : name;
  const ts = conf.node!.typescript!;

  log.info(format(message.pluginStart, name));
  await reinstall(npm, name, cwd, ts);

  log.info(format(message.pluginFinish, name));
  s.stop();
};

regOption(
  {
    name: meta.plugin.option.type.common.typescript,
    label: "Typescript for Node.js app",
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
  log.info(message.reinstall);
  for (const file of files) {
    await rm(join(cwd, file), { recursive: true, force: true });
  }
  await installTmplt(base, template, meta.plugin.type.node, cwd, true);
  await setPkgName(npm, name, cwd);
  await setPkgVers(npm, cwd);
};
