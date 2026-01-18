import { exec as execAsync } from "node:child_process";
import { promisify, format } from "node:util";
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import axios from "axios";
import Json from "comment-json";
import Yaml from "yaml";

import { meta, NPM } from "@/registry";

const exec = promisify(execAsync);

const command = {
  volta: "volta -v",
  node: "node -v",
  npm: `%s -v`,
  pnpm: "pnpm -v",
  setPkgName: '%s pkg set name="%s"',
  setPkgVoltaNode: '%s pkg set "volta.node"="%s"',
  setPkgVoltaNpm: '%s pkg set "volta.%s"="%s"',
  setPkgPkgMgr: '%s pkg set packageManager="%s@%s"',
  setPkgScripts: '%s pkg set "scripts.%s"="%s"',
  setPkgDeps: '%s pkg set "dependencies.%s"="%s"',
  setPkgDevDeps: '%s pkg set "devDependencies.%s"="%s"',
  setPkgBin: '%s pkg set "bin.%s"="%s"',
  tar: "tar -xvf %s",
} as const;

export const setPkgName = async (npm: NPM, name: string, cwd?: string) => {
  await exec(format(command.setPkgName, npm, name), { cwd });
};

let volta: boolean | undefined;

export const setPkgVers = async (npm: NPM, cwd?: string) => {
  void (
    volta !== undefined ||
    (volta = await exec(command.volta)
      .then(() => true)
      .catch(() => false))
  );
  if (volta) {
    const node = (await exec(command.node)).stdout.trim();
    await exec(
      format(
        command.setPkgVoltaNode,
        npm,
        !node.startsWith("v") ? node : node.slice(1),
      ),
      { cwd },
    );
    const npmV = (await exec(format(command.npm, npm))).stdout.trim();
    await exec(
      format(
        command.setPkgVoltaNpm,
        npm,
        npm,
        !npmV.startsWith("v") ? npmV : npmV.slice(1),
      ),
      { cwd },
    );
  }

  if (npm !== NPM.pnpm) {
    return;
  }
  const pnpm = (await exec(command.pnpm)).stdout.trim();
  await exec(
    format(
      command.setPkgPkgMgr,
      NPM.pnpm,
      NPM.pnpm,
      !pnpm.startsWith("v") ? pnpm : pnpm.slice(1),
    ),
    { cwd },
  );
};

export const setPkgScript = async (
  npm: NPM,
  name: string,
  script: string,
  cwd?: string,
) => {
  await exec(format(command.setPkgScripts, npm, name, script), { cwd });
};

export const setPkgDep = async (
  npm: NPM,
  name: string,
  version: string,
  cwd?: string,
) => {
  await exec(format(command.setPkgDeps, npm, name, version), { cwd });
};

export const setPkgDevDep = async (
  npm: NPM,
  name: string,
  version: string,
  cwd?: string,
) => {
  await exec(format(command.setPkgDevDeps, npm, name, version), { cwd });
};

export const setPkgBin = async (
  npm: NPM,
  name: string,
  cwd?: string,
  script?: string,
) => {
  await exec(
    format(
      command.setPkgBin,
      npm,
      !name.includes("/") ? name : name.split("/").pop(),
      script ?? "dist/index.js",
    ),
    { cwd },
  );
};

const workspace = "pnpm-workspace.yaml" as const;

export const createWkspace = async (pkgs: readonly string[]) => {
  const packages = pkgs.length <= 1 ? pkgs : [...pkgs, meta.system.type.shared];
  for (const pkg of packages) {
    await mkdir(pkg);
  }
  await writeFile(workspace, Yaml.stringify({ packages }));
};

export const addPkgInWkspace = async (pkg: string) => {
  const doc = Yaml.parse(await readFile(workspace, "utf8"));
  void (doc.packages || (doc.packages = []));
  doc.packages.push(pkg);
  await writeFile(workspace, Yaml.stringify(doc));
};

export const addOnlyBuiltDeps = async (deps: readonly string[]) => {
  const doc = Yaml.parse(await readFile(workspace, "utf8"));
  void (doc.onlyBuiltDependencies || (doc.onlyBuiltDependencies = []));
  doc.onlyBuiltDependencies.push(...deps);
  await writeFile(workspace, Yaml.stringify(doc));
};

const tsconfig = "tsconfig.json" as const;

export const setTsOptions = async (options: object, cwd?: string) => {
  const file = path.join(cwd ?? "", tsconfig);
  const doc = Json.parse(await readFile(file, "utf8")) as any;
  void (doc.compilerOptions || (doc.compilerOptions = {}));
  doc.compilerOptions = { ...doc.compilerOptions, ...options };
  const text =
    Json.stringify(doc, null, 2).replace(/\[\s+"([^"]+)"\s+\]/g, '["$1"]') +
    "\n";
  await writeFile(file, text);
};

type PathAlias = Record<string, readonly string[]>;

export const setPathAlias = async (
  base: string,
  pathAlias: PathAlias,
  cwd?: string,
) => {
  const file = path.join(cwd ?? "", tsconfig);
  const doc = Json.parse(await readFile(file, "utf8")) as any;
  void (doc.compilerOptions || (doc.compilerOptions = {}));
  doc.compilerOptions.baseUrl = base;
  doc.compilerOptions.paths = pathAlias;
  const text =
    Json.stringify(doc, null, 2).replace(/\[\s+"([^"]+)"\s+\]/g, '["$1"]') +
    "\n";
  await writeFile(file, text);
};

export const addPathAlias = async (
  name: string,
  paths: readonly string[],
  cwd?: string,
) => {
  const file = path.join(cwd ?? "", tsconfig);
  const doc = Json.parse(await readFile(file, "utf8")) as any;
  void (doc.compilerOptions || (doc.compilerOptions = {}));
  void (doc.compilerOptions.paths || (doc.compilerOptions.paths = {}));
  doc.compilerOptions.paths[name] = paths;
  const text =
    Json.stringify(doc, null, 2).replace(/\[\s+"([^"]+)"\s+\]/g, '["$1"]') +
    "\n";
  await writeFile(file, text);
};

const pathAliasWithShared = {
  "@/*": ["%s/src/*"],
  "@shared/*": ["shared/src/*"],
};

export const setPathAliasWithShared = async (cwd: string) => {
  pathAliasWithShared["@/*"][0] = format(pathAliasWithShared["@/*"][0], cwd);
  await setPathAlias("..", pathAliasWithShared, cwd);
};

type Template = Record<string, { name: string; path?: string }>;

export const installTmplt = async (
  base: string,
  template: Template,
  key: string,
  cwd?: string,
  tar?: boolean,
) => {
  const file = path.join(cwd ?? "", template[key].name);
  await writeFile(
    file,
    (
      await axios.get(`${base}${template[key].path ?? ""}`, {
        responseType: !tar ? "text" : "arraybuffer",
      })
    ).data,
  );
  if (!tar) {
    return;
  }
  await exec(format(command.tar, template[key].name), { cwd });
  await rm(file, { force: true });
};
