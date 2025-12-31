import { execSync, exec as execAsync } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, rm, writeFile, rename, access } from "node:fs/promises";
import axios from "axios";
import Yaml from "yaml";
import { format } from "util";
import p from "@clack/prompts";
import wrapAnsi from "wrap-ansi";

import { template, cmd, option, allSelfCreated, meta, NPM } from "@/conf";
import type {
  Conf,
  Type,
  NonSelfCreatedType,
  WithMultiplePkgTmplt,
  WithSinglePkgTemplt,
  ConfWithMultiplePkgTmpltVal,
  Spinner,
} from "@/conf";

const exec = promisify(execAsync);
let volta: boolean | undefined;

export const createDirs = async (conf: Conf, s: Spinner) => {
  if (
    conf.type !== option.type.monorepo &&
    !allSelfCreated(conf, [conf.type])
  ) {
    await mkdir(template.src);
    return;
  }

  if (conf.type === option.type.monorepo) {
    const types = conf.monorepo!.types as unknown as Type[];
    for (const type of types.filter((e) => !allSelfCreated(conf, [e]))) {
      await mkdir(`${type}/${template.src}`, { recursive: true });
    }
    if (types.length > 1) {
      await mkdir(`${meta.type.shared}/${template.src}`, { recursive: true });
    }
  }

  s.stop();
  if (conf.frontend?.framework === option.optional.frontend.framework.vite) {
    console.log(template.message.createVite);
    const dir = conf.type !== option.type.monorepo ? "." : option.type.frontend;
    execSync(format(cmd.createVite, conf.npm, dir), { stdio: "inherit" });
    await setPkgVite(conf, dir);
  } else if (
    conf.frontend?.framework === option.optional.frontend.framework.next
  ) {
    console.log(template.message.createNext);
    const dir = conf.type !== option.type.monorepo ? "." : option.type.frontend;
    execSync(format(cmd.createNext, conf.npm, dir), { stdio: "inherit" });
    await setPkgNext(conf, dir);
  }
  if (conf.mobile?.framework === option.optional.mobile.framework.expo) {
    console.log(template.message.createExpo);
    const dir = conf.type !== option.type.monorepo ? "." : option.type.mobile;
    execSync(format(cmd.createExpo, conf.npm, dir), { stdio: "inherit" });
    await setPkgExpo(conf, dir);
    await rm(`${dir}/${template.git}`, { recursive: true, force: true });
  }
  s.start(template.message.proceed);
};

export const createPkgs = async (conf: Conf, s: Spinner) => {
  if (allSelfCreated(conf, [conf.type])) {
    return;
  }

  if (conf.type !== option.type.monorepo) {
    await createPkg(conf, conf.type as NonSelfCreatedType, ".");
    return;
  }

  const types = conf.monorepo!.types as unknown as Type[];
  for (const type of types.filter((e) => !allSelfCreated(conf, [e]))) {
    await createPkg(conf, type as NonSelfCreatedType, type);
  }
  await createMonoPkg(conf);
  await createWkspace(conf, s);
};

export const setPkgs = async (conf: Conf) => {
  await exec(format(cmd.setPkgName, conf.npm, conf.name));
  await setPkgVers(conf);
  if (conf.type === option.type.lib || conf.type === option.type.cli) {
    await setPkgBin(conf);
    return;
  }
  if (conf.type === option.type.monorepo) {
    await setPkgVersMono(conf);
  }
};

const createPkg = async (conf: Conf, type: NonSelfCreatedType, dir: string) => {
  if (!(meta.type.withMultiplePkgTmplts as readonly Type[]).includes(type)) {
    const response = await axios.get(
      `${template.url}/${template.package[type as WithSinglePkgTemplt]}`,
      { responseType: "text" },
    );
    await writeFile(`${dir}/${template.package.name}`, response.data);
    return;
  }
  for (const value of Object.values(
    conf[type as WithMultiplePkgTmplt]!,
  ) as ConfWithMultiplePkgTmpltVal[]) {
    if (value in template.package) {
      const response = await axios.get(
        `${template.url}/${template.package[value]}`,
        { responseType: "text" },
      );
      await writeFile(`${dir}/${template.package.name}`, response.data);
      return;
    }
  }
  throw new Error(
    format(template.message.noTmplt, template.message.type[type]),
  );
};

const createMonoPkg = async (conf: Conf) => {
  const mono = await axios.get(monoPkgTmplt(conf), { responseType: "text" });
  await writeFile(template.package.name, mono.data);
  if (
    !(await access(meta.type.shared)
      .then(() => true)
      .catch(() => false))
  ) {
    return;
  }
  const shared = await axios.get(`${template.url}/${template.package.shared}`, {
    responseType: "text",
  });
  await writeFile(`${meta.type.shared}/${template.package.name}`, shared.data);
};

const setPkgVite = async (conf: Conf, cwd: string) => {
  await exec(
    format(
      cmd.setPkgScripts,
      conf.npm,
      cmd.script.vite.name,
      cmd.script.vite.script,
    ),
    { cwd },
  );
};

const setPkgNext = async (conf: Conf, cwd: string) => {
  await exec(
    format(
      cmd.setPkgDevDeps,
      conf.npm,
      cmd.dep.vercel.name,
      cmd.dep.vercel.version,
    ),
    { cwd },
  );
};

const setPkgExpo = async (conf: Conf, cwd: string) => {
  await exec(
    format(
      cmd.setPkgScripts,
      conf.npm,
      cmd.script.eas.name,
      cmd.script.eas.script,
    ),
    { cwd },
  );
  await exec(
    format(cmd.setPkgDevDeps, conf.npm, cmd.dep.eas.name, cmd.dep.eas.version),
    { cwd },
  );
};

const setPkgVers = async (conf: Conf, cwd?: string) => {
  if (volta === undefined) {
    try {
      await exec(cmd.voltaV);
      volta = true;
    } catch {
      volta = false;
    }
  }
  if (volta) {
    const node = (await exec(cmd.nodeV)).stdout.trim();
    await exec(
      format(
        cmd.setPkgVoltaNode,
        conf.npm,
        !node.startsWith("v") ? node : node.slice(1),
      ),
      { cwd },
    );
    const npm = (await exec(format(cmd.npmV, conf.npm))).stdout.trim();
    await exec(
      format(
        cmd.setPkgVoltaNpm,
        conf.npm,
        conf.npm,
        !npm.startsWith("v") ? npm : npm.slice(1),
      ),
      { cwd },
    );
  }

  if (conf.npm === NPM.pnpm) {
    const pnpm = (await exec(cmd.pnpmV)).stdout.trim();
    await exec(
      format(
        cmd.setPkgPkgMgr,
        NPM.pnpm,
        NPM.pnpm,
        !pnpm.startsWith("v") ? pnpm : pnpm.slice(1),
      ),
      { cwd },
    );
  }
};

const setPkgVersMono = async (conf: Conf) => {
  for (const type of conf.monorepo!.types as unknown as Type[]) {
    if (
      await access(`${type}/${template.package.name}`)
        .then(() => true)
        .catch(() => false)
    ) {
      await setPkgVers(conf, type);
    }
  }
  if (
    await access(`${meta.type.shared}/${template.package.name}`)
      .then(() => true)
      .catch(() => false)
  ) {
    await setPkgVers(conf, meta.type.shared);
  }
};

const setPkgBin = async (conf: Conf) => {
  await exec(
    format(
      cmd.setPkgBin,
      conf.npm,
      !conf.name.includes("/") ? conf.name : conf.name.split("/").pop(),
    ),
  );
};

const monoPkgTmplt = (conf: Conf) => {
  const types = conf.monorepo!.types as unknown as Type[];
  if (!types.includes(option.type.backend)) {
    if (
      types.includes(option.type.frontend) &&
      types.includes(option.type.mobile)
    ) {
      return `${template.url}/${template.package.monoFeMobile}`;
    }
    return `${template.url}/${template.package.monorepo}`;
  }
  if (conf.frontend?.framework === option.optional.frontend.framework.next) {
    if (!types.includes(option.type.mobile)) {
      return `${template.url}/${template.package.monoBeNext}`;
    }
    return `${template.url}/${template.package.monoBeNextMobile}`;
  }
  if (types.includes(option.type.frontend)) {
    if (!types.includes(option.type.mobile)) {
      return `${template.url}/${template.package.monoBeFe}`;
    }
    return `${template.url}/${template.package.monoBeFeMobile}`;
  }
  if (types.includes(option.type.mobile)) {
    return `${template.url}/${template.package.monoBeMobile}`;
  }
  return `${template.url}/${template.package.monorepo}`;
};

const createWkspace = async (conf: Conf, s: Spinner) => {
  const workspace: {
    packages: string[];
    onlyBuiltDependencies: string[];
    nodeLinker?: "hoisted";
  } = { packages: [], onlyBuiltDependencies: [] };

  for (const type of conf.monorepo!.types as unknown as Type[]) {
    if (
      await access(`${type}/${template.package.name}`)
        .then(() => true)
        .catch(() => false)
    ) {
      workspace.packages.push(type);
    }
  }
  if (
    await access(`${meta.type.shared}/${template.package.name}`)
      .then(() => true)
      .catch(() => false)
  ) {
    workspace.packages.push(meta.type.shared);
  }

  if (conf.backend?.framework === option.optional.backend.framework.nest) {
    for (const dep of template.onlyBuiltDeps.nest) {
      workspace.onlyBuiltDependencies.push(dep);
    }
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
  if (
    conf.mobile?.framework === option.optional.mobile.framework.expo &&
    (await access(`${option.type.mobile}/${template.pnpmWkspace}`)
      .then(() => true)
      .catch(() => false))
  ) {
    await rename(
      `${option.type.mobile}/${template.pnpmWkspace}`,
      `${option.type.mobile}/${template.pnpmWkspace}${template.bak}`,
    );
    s.stop();
    p.log.warn(
      wrapAnsi(template.message.expoWkspaceRenamed, template.message.noteWidth),
    );
    s.start(template.message.proceed);

    workspace.nodeLinker = "hoisted";
  }

  await writeFile("pnpm-workspace.yaml", Yaml.stringify(workspace));
};
