import { execSync, exec as execAsync } from "node:child_process";
import { promisify, format } from "node:util";
import { log, spinner } from "@clack/prompts";

import { valid, option, value, CLIDeployValue } from "./const";
import {
  regValue,
  meta,
  PosMode,
  NPM,
  Conf,
  Plugin,
  PrimeType,
} from "@/registry";
import { auth } from "@/command";
import { message as msg } from "@/message";

const run = (type: PrimeType) => {
  return async function (this: Plugin, conf: Conf) {
    const s = spinner();
    s.start();
    log.info(format(message.pluginStart, `${this.label} for the ${type}`));

    const conf0 = parseConf(conf, type);
    if (!conf0) {
      return;
    }

    const auth0 = await authVercel(conf0, s);
    await createVercel({ ...conf0, ...auth0 }, s);
    setValue(conf, { ...conf0, ...auth0 });

    log.info(format(message.pluginFinish, `${this.label} for the ${type}`));
    s.stop();
  };
};

const parseConf = (conf: Conf, type: PrimeType) => {
  const npm = conf.npm;
  if (npm !== NPM.npm && npm !== NPM.pnpm) {
    throw new Error();
  }
  const deploy = parseDeploy(conf, type);
  if (!deploy) {
    return;
  }
  const cicd = parseCicd(conf);
  return { type, npm, ...deploy, ...cicd };
};

const parseDeploy = (conf: Conf, type: PrimeType) => {
  if (type !== meta.plugin.type.frontend || !valid(conf.git)) {
    throw new Error();
  }
  if (!conf[conf.git!]) {
    log.warn(message.noGit);
    return;
  }
  const cwd = conf.type !== meta.plugin.type.monorepo ? "." : conf[type]?.name;
  if (!cwd) {
    throw new Error();
  }
  return { cwd };
};

const parseCicd = (conf: Conf) => {
  const forToken = valid(conf.cicd);
  return { forToken };
};

type AuthData = { forToken: boolean };

const authVercel = async ({ forToken }: AuthData, s: Spinner) => {
  const { token } = await auth(
    { ...(forToken && { token: tokenPath }) },
    {},
    message.token,
    tokenUrl,
    s,
  );
  if (forToken && !token) {
    throw new Error();
  }
  return { token };
};

type VercelData = { npm: NPM; cwd: string };

const createVercel = async ({ npm, cwd }: VercelData, s: Spinner) => {
  log.info(
    "todo: install vercel CLI, using it to create the project on Vercel and link to it.",
  );
  await Promise.resolve({ execSync, exec, command, npm, cwd, s });
};

type Value = { type: PrimeType } & NonNullable<CLIDeployValue>;

const setValue = (conf: Conf, { type, token }: Value) => {
  (conf[type]![value.deployment.vercel] as CLIDeployValue) = { token };
};

const label = "Vercel" as const;

regValue(
  {
    name: value.deployment.vercel,
    label,
    skips: [
      { type: meta.plugin.type.frontend, option: option.deploySrc },
      {
        type: meta.plugin.type.lib,
        option: meta.plugin.option.type.deployment,
      },
      {
        type: meta.plugin.type.cli,
        option: meta.plugin.option.type.deployment,
      },
    ],
    keeps: [],
    requires: [{ option: meta.plugin.option.git }],
    plugin: {
      name: `${meta.plugin.type.frontend}_${meta.plugin.option.type.deployment}_${value.deployment.vercel}`,
      label,
      pos: {
        mode: PosMode.after,
        refs: [meta.plugin.option.git],
      },
      run: run(meta.plugin.type.frontend),
    },
  },
  meta.plugin.option.type.deployment,
  meta.plugin.type.frontend,
);

const exec = promisify(execAsync);

type Spinner = ReturnType<typeof spinner>;

const command = {
  install: "%s add -D vercel",
  login: "%s vercel login",
  link: "%s vercel link",
} as const;

const tokenPath = "vercel.token" as const;
const tokenUrl = "" as const;

const message = {
  ...msg,
  noGit:
    "Cannot work as expected because the plugin for the Git option has not run successfully.",
  token:
    "Token needed for automated integration.\nPress [ENTER] to open your browser and create a read-write token for CI/CD...\n",
} as const;
