import { exec as execAsync } from "node:child_process";
import { promisify, format } from "node:util";
import { mkdir, writeFile } from "node:fs/promises";
import axios from "axios";
import Yaml from "yaml";

import { meta, Conf, PlugType } from "@/registry";
import { command, setPkgVers } from "@/command";

const exec = promisify(execAsync);

const template = {
  url: "https://raw.githubusercontent.com/bradhezh/prj-template/master",
  name: "package.json",
  monoFeMobile: "package/package-mono-fe-mobile.json",
  monoBeFe: "package/package-mono-be-fe.json",
  monoBeFeMobile: "package/package-mono-be-fe-mobile.json",
  monoBeMobile: "package/package-mono-be-mobile.json",
  shared: "package/package-shared.json",
  default: "package/package-mono.json",
} as const;

const workspace = "pnpm-workspace.yaml" as const;

const run = async (conf: Conf) => {
  for (const type of conf.monorepo!.types) {
    await mkdir(conf[type as PlugType]!.name ?? type);
  }
  if (conf.monorepo!.types.length > 1) {
    await mkdir(meta.system.type.shared);
    const shared = await axios.get(`${template.url}/${template.shared}`, {
      responseType: "text",
    });
    await writeFile(`${meta.system.type.shared}/${template.name}`, shared.data);
    await setPkgVers(conf, meta.system.type.shared);
  }

  const mono = await axios.get(monoPkgTmplt(conf), { responseType: "text" });
  await writeFile(template.name, mono.data);
  await setPkgVers(conf);
  await exec(format(command.setPkgName, conf.npm, conf.monorepo!.name));
  await createWkspace(conf);
};

export const monorepo = {
  name: meta.system.type.monorepo,
  label: "Monorepo",
  plugin: { run },
  options: [],
};

const monoPkgTmplt = (conf: Conf) => {
  if (!conf.monorepo!.types.includes(meta.plugin.type.backend)) {
    if (
      conf.monorepo!.types.includes(meta.plugin.type.frontend) &&
      conf.monorepo!.types.includes(meta.plugin.type.mobile)
    ) {
      return `${template.url}/${template.monoFeMobile}`;
    }
    return `${template.url}/${template.default}`;
  }
  if (conf.monorepo!.types.includes(meta.plugin.type.frontend)) {
    if (conf.monorepo!.types.includes(meta.plugin.type.mobile)) {
      return `${template.url}/${template.monoBeFeMobile}`;
    }
    return `${template.url}/${template.monoBeFe}`;
  }
  if (conf.monorepo!.types.includes(meta.plugin.type.mobile)) {
    return `${template.url}/${template.monoBeMobile}`;
  }
  return `${template.url}/${template.default}`;
};

const createWkspace = async (conf: Conf) => {
  const packages: string[] = [];
  for (const type of conf.monorepo!.types) {
    packages.push(conf[type as PlugType]!.name ?? type);
  }
  if (conf.monorepo!.types.length > 1) {
    packages.push(meta.system.type.shared);
  }
  await writeFile(workspace, Yaml.stringify({ packages }));
};
