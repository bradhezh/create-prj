import { execSync, exec as execAsync } from "node:child_process";
import { promisify, format } from "node:util";
import { log, spinner } from "@clack/prompts";

import { valid, value, CLIDeployValue } from "./const";
import { regValue, meta, NPM, Conf, Plugin, PrimeType } from "@/registry";
import { auth } from "@/command";
import { message as msg } from "@/message";

const run = (type: PrimeType) => {
  return async function (this: Plugin, conf: Conf) {
    const s = spinner();
    s.start();
    log.info(format(message.pluginStart, `${this.label} for the ${type}`));

    const conf0 = parseConf(conf, type);

    const auth0 = await authExpo(conf0, s);
    await createExpo({ ...conf0, ...auth0 }, s);
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
  const cicd = parseCicd(conf);
  return { type, npm, ...deploy, ...cicd };
};

const parseDeploy = (conf: Conf, type: PrimeType) => {
  if (type !== meta.plugin.type.mobile) {
    throw new Error();
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

const authExpo = async ({ forToken }: AuthData, s: Spinner) => {
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

type ExpoData = { npm: NPM; cwd: string };

const createExpo = async ({ npm, cwd }: ExpoData, s: Spinner) => {
  log.info(
    "todo: install eas CLI, using it to create the project on Expo and link to it.",
  );
  await Promise.resolve({ execSync, exec, command, npm, cwd, s });
};

type Value = { type: PrimeType } & NonNullable<CLIDeployValue>;

const setValue = (conf: Conf, { type, token }: Value) => {
  (conf[type]![value.deployment.expo] as CLIDeployValue) = { token };
};

const label = "Expo" as const;

regValue(
  {
    name: value.deployment.expo,
    label,
    skips: [
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
    requires: [],
    plugin: {
      name: `${meta.plugin.type.mobile}_${meta.plugin.option.type.deployment}_${value.deployment.expo}`,
      label,
      run: run(meta.plugin.type.mobile),
    },
  },
  meta.plugin.option.type.deployment,
  meta.plugin.type.mobile,
);

const exec = promisify(execAsync);

type Spinner = ReturnType<typeof spinner>;

const command = {
  install: "%s add -D eas-cli",
  login: "%s eas login",
  link: "%s eas build:configure",
} as const;

const tokenPath = "expo.token" as const;
const tokenUrl = "" as const;

const message = {
  ...msg,
  token:
    "Token needed for automated integration.\nPress [ENTER] to open your browser and create a read-write token for CI/CD...\n",
} as const;
