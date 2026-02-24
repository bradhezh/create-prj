import { rm } from "node:fs/promises";
import { join } from "node:path";
import { log, spinner } from "@clack/prompts";
import { format } from "node:util";

import { value } from "./const";
import { regOption, meta, NPM, Conf, Plugin } from "@/registry";
import { setTsOptions, installTmplt, setPkgName, setPkgVers } from "@/command";
import { message as msg } from "@/message";

async function run(this: Plugin, conf: Conf) {
  const s = spinner();
  s.start();
  log.info(format(message.pluginStart, this.label));

  const conf0 = parseConf(conf);

  await reinstall(conf0);

  log.info(format(message.pluginFinish, this.label));
  s.stop();
}

const parseConf = (conf: Conf) => {
  const npm = conf.npm;
  if (npm !== NPM.npm && npm !== NPM.pnpm) {
    throw new Error();
  }
  const name = conf.node!.name;
  if (!name) {
    throw new Error();
  }
  const cwd = conf.type !== meta.plugin.type.monorepo ? "." : name;
  const ts = conf.node!.typescript;
  return { npm, name, cwd, ts };
};

type InstallData = { ts?: string; name: string; npm: NPM; cwd: string };

const reinstall = async ({ ts, name, npm, cwd }: InstallData) => {
  if (ts === value.typescript.nodec) {
    void 0;
  } else if (ts === value.typescript.metadata) {
    await setTsOptions(
      { experimentalDecorators: true, emitDecoratorMetadata: true },
      cwd,
    );
  } else if (ts === meta.plugin.value.none) {
    log.info(message.reinstall);
    for (const replace of replaces) {
      await rm(join(cwd, replace), { recursive: true, force: true });
    }
    await installTmplt(base, { template }, "template", cwd, true);
    await setPkgName(name, npm, cwd);
    await setPkgVers(npm, cwd);
  } else {
    throw new Error();
  }
};

const label = "Typescript for Node.js app" as const;

regOption(
  {
    name: meta.plugin.option.type.typescript,
    label,
    plugin: {
      name: `${meta.plugin.type.node}_${meta.plugin.option.type.typescript}`,
      label,
      run,
    },
    values: [
      {
        name: value.typescript.nodec,
        label: "No decorator",
        skips: [],
        keeps: [],
        requires: [],
      },
      {
        name: value.typescript.metadata,
        label: "Decorator with emitDecoratorMetadata",
        skips: [],
        keeps: [],
        requires: [],
      },
      {
        name: meta.plugin.value.none,
        label: "None",
        skips: [],
        keeps: [],
        requires: [],
      },
    ],
  },
  meta.system.option.category.type,
  meta.plugin.type.node,
);

const base =
  "https://raw.githubusercontent.com/bradhezh/prj-template/master/type/node/js/type.tar" as const;
const template = { name: "type.tar" } as const;

const replaces = ["package.json", "tsconfig.json", "src"] as const;

const message = {
  ...msg,
  reinstall: "Replacing Typescript files with Javascript ones",
} as const;
