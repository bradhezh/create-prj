import { execSync } from "node:child_process";
import { rm, rename, access } from "node:fs/promises";
import { join } from "node:path";
import { log, spinner } from "@clack/prompts";
import { format } from "node:util";
import wrapAnsi from "wrap-ansi";

import { value, FrmwkValue } from "./const";
import { regType, meta, NPM, Conf, PluginType } from "@/registry";
import {
  installTmplt,
  setPkgName,
  setPkgVers,
  setPkgScript,
  getPkgScript,
  setPkgScripts,
  setWkspaceBuiltDeps,
  setPathAliasWithShared,
} from "@/command";
import { message as msg } from "@/message";

const run = (type: PluginType) => {
  return async (conf: Conf) => {
    const s = spinner();
    s.start();

    const npm = conf.npm;
    const name = conf[type]?.name ?? type;
    const cwd = conf.type !== meta.system.type.monorepo ? "." : name;
    const typeFrmwk = (conf[type]?.framework ?? type) as TypeFrmwk;
    const shared = (conf.monorepo?.types.length ?? 0) > 1;

    log.info(format(message.pluginStart, `"${name}"`));
    await install(npm, typeFrmwk, cwd, s);

    log.info(message.setPkg);
    await setPkgName(npm, name, cwd);
    await setPkgVers(npm, cwd);
    await typeSetPkgScripts(npm, typeFrmwk, cwd);

    log.info(message.setWkspace);
    await setWkspace(typeFrmwk, cwd);

    log.info(message.setShared);
    await setShared(shared, typeFrmwk, cwd);

    log.info(format(message.pluginFinish, `"${name}"`));
    s.stop();
  };
};

const install = async (
  npm: NPM,
  typeFrmwk: TypeFrmwk,
  cwd: string,
  s: Spinner,
) => {
  if (await installTmplt(base, template, typeFrmwk, cwd, true)) {
    return;
  }
  if (!(typeFrmwk in command)) {
    log.warn(format(message.noTmpltCmd, typeFrmwk));
    return;
  }
  await create(npm, command[typeFrmwk]!, cwd, s);
};

const create = async (npm: NPM, command: string, cwd: string, s: Spinner) => {
  const cmd = format(command, npm, cwd);
  log.info(wrapAnsi(cmd, message.noteWidth));
  s.stop();
  execSync(cmd, { stdio: "inherit" });
  s.start();
  const gitDir = join(cwd, git);
  if (
    !(await access(gitDir)
      .then(() => true)
      .catch(() => false))
  ) {
    return;
  }
  await rm(gitDir, { recursive: true, force: true });
};

const typeSetPkgScripts = async (
  npm: NPM,
  typeFrmwk: TypeFrmwk,
  cwd: string,
) => {
  await setPkgScripts(npm, scripts, typeFrmwk, cwd);
  if (
    typeFrmwk !== value.framework.next ||
    !(await getPkgScript(npm, nextScript.copyDist.name, "."))
  ) {
    return;
  }
  for (const { name, script } of Object.values(nextScript)) {
    await setPkgScript(npm, name, script, ".");
  }
};

const setWkspace = async (typeFrmwk: TypeFrmwk, cwd: string) => {
  await setWkspaceBuiltDeps(builtDeps, typeFrmwk);
  const wkspace = join(cwd, workspace);
  if (
    typeFrmwk !== value.framework.next ||
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

const setShared = async (
  shared: boolean,
  typeFrmwk: TypeFrmwk,
  cwd: string,
) => {
  if (!shared) {
    return;
  }
  await setPathAliasWithShared(cwd);
  await installTmplt(base, patchTmplt, typeFrmwk, cwd, true);
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

type TypeFrmwk = PluginType | NonNullable<FrmwkValue>;
type Spinner = ReturnType<typeof spinner>;

const base =
  "https://raw.githubusercontent.com/bradhezh/prj-template/master/type" as const;

const template = {
  node: { name: "node.tar", path: "/node/node.tar" },
  cli: { name: "cli.tar", path: "/cli/cli.tar" },
  lib: { name: "lib.tar", path: "/lib/lib.tar" },
  express: { name: "express.tar", path: "/express/express.tar" },
  nest: { name: "nest.tar", path: "/nest/nest.tar" },
} as const;

const patchTmplt = {
  express: { name: "patch.tar", path: "/express/patch/patch.tar" },
  nest: { name: "patch.tar", path: "/nest/patch/patch.tar" },
} as const;

const command: Partial<Record<TypeFrmwk, string>> = {
  react: "%s create vite %s --template react-ts",
  next: "%s create next-app %s --ts --no-react-compiler --no-src-dir -app --api --eslint --tailwind --skip-install --disable-git",
  expo: "%s create expo-app %s --no-install",
} as const;

const scripts = {
  react: [{ name: "start", script: "vite preview" }],
  expo: [
    {
      name: "build",
      script: "eas build --platform android --profile development",
    },
    { name: "dev", script: "expo start" },
  ],
} as const;

const nextScript = {
  copyDist: { name: "copy-dist", script: undefined },
  build: {
    name: "build",
    script: "pnpm --filter backend build && pnpm --filter frontend build",
  },
  start: { name: "start:fe", script: "pnpm --filter frontend start" },
} as const;

const builtDeps = { nest: ["@nestjs/core"] } as const;

const git = ".git" as const;
const workspace = "pnpm-workspace.yaml" as const;
const bak = ".bak" as const;

const message = {
  ...msg,
  noTmpltCmd: 'No template or command provided for "%s"',
  nextWkspaceRenamed:
    "%s/pnpm-workspace.yaml has been renamed %s/pnpm-workspace.yaml.bak, please check the content and merge necessary ones into the root workspace.",
} as const;
