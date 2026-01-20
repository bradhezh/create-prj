import { execSync } from "node:child_process";
import { rm, rename, access } from "node:fs/promises";
import { join } from "node:path";
import { log, spinner } from "@clack/prompts";
import { format } from "node:util";
import wrapAnsi from "wrap-ansi";

import { value } from "./const";
import { regType, meta, NPM, Conf, PluginType } from "@/registry";
import {
  installTmplt,
  setPkgName,
  setPkgVers,
  setPkgScript,
  getPkgScript,
  addOnlyBuiltDeps,
  setPathAliasWithShared,
} from "@/command";
import { message as msg } from "@/message";

const message = {
  ...msg,
  noTmpltCmd: 'No template or command provided for "%s"',
  nextWkspaceRenamed:
    "%s/pnpm-workspace.yaml has been renamed %s/pnpm-workspace.yaml.bak, please check the content and merge necessary ones into the root workspace.",
} as const;

const run = (type: PluginType) => {
  return async (conf: Conf) => {
    const s = spinner();
    s.start();

    const npm = conf.npm;
    const name = conf[type]!.name!;
    const cwd = conf.type !== meta.system.type.monorepo ? "." : name;
    const key = (conf[type]!.framework as string | undefined) ?? type;
    const shared = (conf.monorepo?.types.length ?? 0) > 1;

    log.info(format(message.pluginStart, name));
    await install(npm, key, cwd, s);

    log.info(message.setPkg);
    await setPkgName(npm, name, cwd);
    await setPkgVers(npm, cwd);
    await setPkgScripts(npm, key, cwd);

    log.info(message.setWkspace);
    await setWkspace(key, cwd);

    log.info(message.setShared);
    await setShared(shared, key, cwd);

    log.info(format(message.pluginFinish, name));
    s.stop();
  };
};

for (const { name, label, frameworks } of [
  {
    name: meta.plugin.type.backend,
    label: "Backend",
    frameworks: [
      {
        name: value.framework.express,
        label: "Express",
        disables: [],
        enables: [
          { option: meta.plugin.option.builder },
          { option: meta.plugin.option.test },
          { option: meta.plugin.option.lint },
        ],
      },
      {
        name: value.framework.nest,
        label: "NestJS",
        disables: [],
        enables: [
          { option: meta.plugin.option.builder },
          { option: meta.plugin.option.test },
          { option: meta.plugin.option.lint },
        ],
      },
    ],
  },
  {
    name: meta.plugin.type.frontend,
    label: "Frontend",
    frameworks: [
      {
        name: value.framework.react,
        label: "React (Vite)",
        disables: [
          { option: meta.plugin.option.builder },
          { option: meta.plugin.option.test },
          { option: meta.plugin.option.lint },
        ],
        enables: [],
      },
      {
        name: value.framework.next,
        label: "Next.js",
        disables: [
          { option: meta.plugin.option.builder },
          { option: meta.plugin.option.test },
          { option: meta.plugin.option.lint },
        ],
        enables: [],
      },
    ],
  },
  {
    name: meta.plugin.type.mobile,
    label: "Mobile",
    frameworks: [
      {
        name: value.framework.expo,
        label: "Expo",
        disables: [
          { option: meta.plugin.option.builder },
          { option: meta.plugin.option.test },
          { option: meta.plugin.option.lint },
        ],
        enables: [],
      },
    ],
  },
]) {
  regType({
    name,
    label,
    plugin: { run: run(name) },
    options: [
      {
        name: meta.plugin.option.type.common.name,
        label: `${label} name`,
        values: [],
      },
      {
        name: meta.plugin.option.type[name].framework,
        label: `${label} framework`,
        values: frameworks.map((e) => ({
          name: e.name,
          label: e.label,
          disables: e.disables,
          enables: e.enables,
        })),
      },
    ],
    disables: [],
    enables: [],
  });
}
for (const { name, label } of [
  { name: meta.plugin.type.node, label: "Node.js app" },
  { name: meta.plugin.type.cli, label: "CLI tool" },
  { name: meta.plugin.type.lib, label: "Library" },
]) {
  regType({
    name,
    label,
    plugin: { run: run(name) },
    options: [
      {
        name: meta.plugin.option.type.common.name,
        label: `${label} name`,
        values: [],
      },
    ],
    disables: [],
    enables: [
      { option: meta.plugin.option.builder },
      { option: meta.plugin.option.test },
      { option: meta.plugin.option.lint },
    ],
  });
}

const command = {
  react: "%s create vite %s --template react-ts",
  next: "%s create next-app %s --ts --no-react-compiler --no-src-dir -app --api --eslint --tailwind --skip-install --disable-git",
  expo: "%s create expo-app %s --no-install",
} as const;
type CmdKey = keyof typeof command;

const base =
  "https://raw.githubusercontent.com/bradhezh/prj-template/master/type" as const;

const template = {
  node: { name: "node.tar", path: "/node/node.tar" },
  cli: { name: "cli.tar", path: "/cli/cli.tar" },
  lib: { name: "lib.tar", path: "/lib/lib.tar" },
  express: { name: "express.tar", path: "/express/express.tar" },
  nest: { name: "nest.tar", path: "/nest/nest.tar" },
} as const;

type Spinner = ReturnType<typeof spinner>;

const install = async (npm: NPM, key: string, cwd: string, s: Spinner) => {
  if (key in template) {
    await installTmplt(base, template, key, cwd, true);
    return;
  }
  if (key in command) {
    await create(npm, command[key as CmdKey], cwd, s);
    return;
  }
  log.warn(format(message.noTmpltCmd, key));
};

const gitDir = ".git" as const;

const create = async (npm: NPM, command: string, cwd: string, s: Spinner) => {
  const cmd = format(command, npm, cwd);
  log.info(wrapAnsi(cmd, message.noteWidth));
  s.stop();
  execSync(cmd, { stdio: "inherit" });
  s.start();
  const git = join(cwd, gitDir);
  if (
    !(await access(git)
      .then(() => true)
      .catch(() => false))
  ) {
    return;
  }
  await rm(git, { recursive: true, force: true });
};

const script = {
  react: [{ name: "start", script: "vite preview" }],
  expo: [
    {
      name: "build",
      script: "eas build --platform android --profile development",
    },
    { name: "dev", script: "expo start" },
  ],
} as const;
type ScriptKey = keyof typeof script;

const nextScript = {
  copyDist: { name: "copy-dist", script: undefined },
  build: {
    name: "build",
    script: "pnpm --filter backend build && pnpm --filter frontend build",
  },
  start: { name: "start:fe", script: "pnpm --filter frontend start" },
} as const;

const setPkgScripts = async (npm: NPM, key: string, cwd: string) => {
  if (key in script) {
    for (const { name, script: s } of script[key as ScriptKey]) {
      await setPkgScript(npm, name, s, cwd);
    }
  }
  if (
    key !== value.framework.next ||
    !(await getPkgScript(npm, nextScript.copyDist.name, "."))
  ) {
    return;
  }
  for (const { name, script: s } of Object.values(nextScript)) {
    await setPkgScript(npm, name, s, ".");
  }
};

const workspace = "pnpm-workspace.yaml" as const;
const bak = ".bak" as const;
const onlyBuiltDep = { nest: ["@nestjs/core"] } as const;
type DepKey = keyof typeof onlyBuiltDep;

const setWkspace = async (key: string, cwd: string) => {
  if (key in onlyBuiltDep) {
    await addOnlyBuiltDeps(onlyBuiltDep[key as DepKey]);
  }
  const wkspace = join(cwd, workspace);
  if (
    key !== value.framework.next ||
    cwd === "." ||
    !(await access(wkspace)
      .then(() => true)
      .catch(() => false))
  ) {
    return;
  }
  await rename(wkspace, `${wkspace}${bak}`);
  log.warn(
    wrapAnsi(format(message.nextWkspaceRenamed, cwd, cwd), message.noteWidth),
  );
};

const patch = {
  express: { name: "patch.tar", path: "/express/patch/patch.tar" },
  nest: { name: "patch.tar", path: "/nest/patch/patch.tar" },
} as const;

const setShared = async (shared: boolean, key: string, cwd: string) => {
  if (!shared) {
    return;
  }
  await setPathAliasWithShared(cwd);
  if (!(key in patch)) {
    return;
  }
  await installTmplt(base, patch, key, cwd, true);
};
