import { execSync, exec as execAsync } from "node:child_process";
import { promisify, format } from "node:util";
import { rm } from "node:fs/promises";
import p from "@clack/prompts";

import { meta, useType, useOption, regValue, Conf, Spinner } from "@/registry";
import { command as cmd, setPkgVers } from "@/command";
import { message as msg } from "@/message";

const exec = promisify(execAsync);

useType(meta.plugin.type.mobile, "Mobile");
useOption(
  meta.plugin.option.type.common.name,
  "Mobile name",
  meta.system.option.category.type,
  meta.plugin.type.mobile,
);
useOption(
  meta.plugin.option.type.mobile.framework,
  "Mobile framework",
  meta.system.option.category.type,
  meta.plugin.type.mobile,
);

const command = {
  ...cmd,
  createExpo: "%s create expo-app %s --no-install",
} as const;

const message = {
  ...msg,
  createExpo: "create-expo-app ...",
  wkspaceRenamed:
    'pnpm-workspace.yaml of Expo has been renamed pnpm-workspace.yaml.bak and "nodeLinker: hoisted" has been merged into the root one, please check other configurations.',
} as const;

const run = async (conf: Conf, s: Spinner) => {
  const cwd =
    conf.type !== meta.system.type.monorepo ? "." : conf.mobile!.name!;
  p.log.info(message.createExpo);
  s.stop();
  execSync(format(command.createExpo, conf.npm, cwd), { stdio: "inherit" });
  s.start(message.proceed);
  await rm(`${cwd}/.git`, { recursive: true, force: true });
  await setPkgExpo(conf, cwd);
  await setPkgVers(conf, cwd);
  if (conf.type === meta.system.type.monorepo) {
    await setWkspace();
  }
  await exec(format(command.setPkgName, conf.npm, conf.mobile!.name), { cwd });
};

regValue(
  { name: "expo", label: "Expo", plugin: { run } },
  meta.plugin.option.type.mobile.framework,
  meta.plugin.type.mobile,
);

const script = {
  eas: {
    name: "build",
    script: "eas build --platform android --profile development",
  },
} as const;

const dep = { eas: { name: "eas-cli", version: "^16" } } as const;

const setPkgExpo = async (conf: Conf, cwd: string) => {
  await exec(
    format(command.setPkgScripts, conf.npm, script.eas.name, script.eas.script),
    { cwd },
  );
  await exec(
    format(command.setPkgDevDeps, conf.npm, dep.eas.name, dep.eas.version),
    { cwd },
  );
};

const setWkspace = async () => {
  await Promise.resolve();
  /*
  if (
    conf.mobile?.framework === option.optional.mobile.framework.expo &&
    (await access(`${option.type.mobile}/${template.pnpmWkspace}`)
      .then(() => true)
      .catch(() => false))
  ) {
    workspace.nodeLinker = "hoisted";
    await rename(
      `${option.type.mobile}/${template.pnpmWkspace}`,
      `${option.type.mobile}/${template.pnpmWkspace}${template.bak}`,
    );
    s.stop();
    p.log.warn(
      wrapAnsi(template.message.expoWkspaceRenamed, template.message.noteWidth),
    );
    s.start(template.message.proceed);
  }

  if (
    conf.frontend?.framework === option.optional.frontend.framework.next &&
    (await access(`${option.type.frontend}/${template.pnpmWkspace}`)
      .then(() => true)
      .catch(() => false))
  ) {
    await rename(
      `${option.type.frontend}/${template.pnpmWkspace}`,
      `${option.type.frontend}/${template.pnpmWkspace}${template.bak}`,
    );
    s.stop();
    p.log.warn(
      wrapAnsi(template.message.nextWkspaceRenamed, template.message.noteWidth),
    );
    s.start(template.message.proceed);
  }
  */
};
