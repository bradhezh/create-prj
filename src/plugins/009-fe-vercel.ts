import { execSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import Json from "comment-json";
import { log, spinner } from "@clack/prompts";
import { format } from "node:util";

import { valid, option, value, VercelValue } from "./const";
import { regValue, meta, NPM, Conf, Plugin, PrimeType } from "@/registry";
import { installTmplt, auth } from "@/command";
import { message as msg } from "@/message";

const run = (type: PrimeType) => {
  return async function (this: Plugin, conf: Conf) {
    const s = spinner();
    s.start();
    log.info(format(message.pluginStart, `${this.label} for the ${type}`));

    const conf0 = parseConf(conf, type);

    await install();
    const auth0 = await authVercel(conf0, s);
    const vercel = await createVercel({ ...conf0, ...auth0 }, s);
    setValue(conf, { ...conf0, ...auth0, ...vercel });

    log.info(format(message.pluginFinish, `${this.label} for the ${type}`));
    s.stop();
  };
};

const parseConf = (conf: Conf, type: PrimeType) => {
  const npm = conf.npm;
  if (npm !== NPM.npm && npm !== NPM.pnpm) {
    throw new Error();
  }
  if (type !== meta.plugin.type.frontend) {
    throw new Error();
  }
  const cicd = parseCicd(conf);
  return { type, npm, ...cicd };
};

const parseCicd = (conf: Conf) => {
  const forPrjToken = valid(conf.cicd);
  return { forPrjToken };
};

const install = async () => {
  await installTmplt(base, { template }, "template");
};

type AuthData = { forPrjToken: boolean };

const authVercel = async ({ forPrjToken }: AuthData, s: Spinner) => {
  const { token } = await auth(
    { ...(forPrjToken && { token: tokenPath }) },
    {},
    message.token,
    tokenUrl,
    s,
  );
  if (forPrjToken && !token) {
    throw new Error();
  }
  return { token };
};

type VercelData = { npm: NPM; forPrjToken: boolean };

const createVercel = async ({ npm, forPrjToken }: VercelData, s: Spinner) => {
  const link = npm === NPM.npm ? command.npmLink : command.pnpmLink;
  log.info(link);
  s.stop();
  execSync(link, { stdio: "inherit" });
  s.start();
  if (forPrjToken) {
    const doc = Json.parse(
      await readFile(join(cfgDir, config), "utf-8").catch(() => "{}"),
    );
    if (
      typeof doc !== "object" ||
      doc === null ||
      Array.isArray(doc) ||
      typeof doc.orgId !== "string" ||
      typeof doc.projectId !== "string"
    ) {
      throw new Error();
    }
    return { org: doc.orgId, project: doc.projectId };
  }
};

type Value = { type: PrimeType } & NonNullable<VercelValue>;

const setValue = (conf: Conf, { type, org, project, token }: Value) => {
  (conf[type]![value.deployment.vercel] as VercelValue) = {
    org,
    project,
    token,
  };
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
    requires: [],
    plugin: {
      name: `${meta.plugin.type.frontend}_${meta.plugin.option.type.deployment}_${value.deployment.vercel}`,
      label,
      run: run(meta.plugin.type.frontend),
    },
  },
  meta.plugin.option.type.deployment,
  meta.plugin.type.frontend,
);

type Spinner = ReturnType<typeof spinner>;

const base =
  "https://raw.githubusercontent.com/bradhezh/prj-template/master/vcl/vercel.json" as const;
const template = { name: "vercel.json" } as const;

const command = {
  npmLink: "npx vercel link",
  pnpmLink: "pnpm dlx vercel link",
} as const;

const tokenPath = "vercel.token" as const;
const tokenUrl = "https://vercel.com/account/settings/tokens" as const;
const cfgDir = ".vercel" as const;
const config = "project.json" as const;

const message = {
  ...msg,
  token:
    "Token needed for automated integration. Press [ENTER] to open your browser and create a read-write token for CI/CD...",
} as const;
