import { log, spinner } from "@clack/prompts";
import { format } from "node:util";

import { meta, NPM, Conf, PluginType } from "@/registry";
import {
  installTmplt,
  setPkgName,
  setPkgVers,
  setPkgScript,
  createWkspace,
} from "@/command";
import { message } from "@/message";

const base =
  "https://raw.githubusercontent.com/bradhezh/prj-template/master/type/monorepo" as const;

const template = {
  monorepo: { name: "package.json", path: "/package.json" },
  shared: { name: "shared.tar", path: "/shared/shared.tar" },
  sharedJs: { name: "shared.tar", path: "/shared/js/shared.tar" },
} as const;

const run = async (conf: Conf) => {
  const s = spinner();
  s.start();
  log.info(format(message.pluginStart, monorepo.label));

  const npm = conf.npm;
  const types = conf.monorepo!.types as PluginType[];
  const defType = types[0];
  const defTypeConf = conf[defType];
  const monoName = conf.monorepo!.name;
  const beName = conf.backend?.name ?? meta.plugin.type.backend;
  const feName = conf.frontend?.name ?? meta.plugin.type.frontend;
  const mName = conf.mobile?.name ?? meta.plugin.type.mobile;
  const packages = types.map((e) => conf[e]?.name ?? e);
  const jsTypes = types.filter(
    (e) => conf[e]?.typescript === meta.plugin.value.none,
  );

  await installTmplt(base, template, meta.system.type.monorepo);

  log.info(message.setPkg);
  await setPkgName(npm, monoName);
  await setPkgVers(npm);
  await setPkgScripts(npm, types, defType, defTypeConf, beName, feName, mName);

  log.info(message.setWkspace);
  await createWkspace(packages);

  log.info(message.setShared);
  await createShared(npm, types, jsTypes);

  log.info(format(message.pluginFinish, monorepo.label));
  s.stop();
};

export const monorepo = {
  name: meta.system.type.monorepo,
  label: "Monorepo",
  plugin: { run },
  options: [],
  disables: [],
  enables: [],
};

const script = {
  build: {
    name: "build",
    script: "pnpm --filter %s build",
    fullstack:
      "pnpm --filter %s build && pnpm --filter %s build && pnpm copy-dist",
  },
  dev: { name: "dev", script: "pnpm --filter %s dev" },
  start: { name: "start", script: "pnpm --filter %s start" },
  copyDist: {
    name: "copy-dist",
    script: 'pnpm dlx rimraf %s/dist && pnpm dlx cpx "%s/dist/**/*" %s/dist',
  },
  frontend: { suffix: ":fe" },
  mobile: { suffix: ":m" },
} as const;

const setPkgScripts = async (
  npm: NPM,
  types: PluginType[],
  defType: PluginType,
  defTypeConf: Conf[PluginType],
  beName: string,
  feName: string,
  mName: string,
) => {
  let defName, defIsMobile;
  if (types.includes(meta.plugin.type.backend)) {
    defName = beName;
  } else if (types.includes(meta.plugin.type.frontend)) {
    defName = feName;
  } else if (types.length === 1) {
    defName = defTypeConf?.name ?? defType;
    if (defType === meta.plugin.type.mobile) {
      defIsMobile = true;
    }
  }
  await setBuild(npm, types, beName, feName, mName, defName);
  await setDev(npm, types, feName, mName, defName);
  await setStart(npm, defName, defIsMobile);
};

const setBuild = async (
  npm: NPM,
  types: PluginType[],
  beName: string,
  feName: string,
  mName: string,
  defName?: string,
) => {
  if (
    types.includes(meta.plugin.type.backend) &&
    types.includes(meta.plugin.type.frontend)
  ) {
    await setPkgScript(
      npm,
      script.copyDist.name,
      format(script.copyDist.script, beName, feName, beName),
    );
    await setPkgScript(
      npm,
      script.build.name,
      format(script.build.fullstack, beName, feName),
    );
  } else if (defName) {
    await setPkgScript(
      npm,
      script.build.name,
      format(script.build.script, defName),
    );
  }

  if (!types.includes(meta.plugin.type.mobile) || mName === defName) {
    return;
  }
  await setPkgScript(
    npm,
    `${script.build.name}${script.mobile.suffix}`,
    format(script.build.script, mName),
  );
};

const setDev = async (
  npm: NPM,
  types: PluginType[],
  feName: string,
  mName: string,
  defName?: string,
) => {
  void (
    defName &&
    (await setPkgScript(
      npm,
      script.dev.name,
      format(script.dev.script, defName),
    ))
  );
  if (types.includes(meta.plugin.type.frontend) && feName !== defName) {
    await setPkgScript(
      npm,
      `${script.dev.name}${script.frontend.suffix}`,
      format(script.dev.script, feName),
    );
  }
  if (types.includes(meta.plugin.type.mobile) && mName !== defName) {
    await setPkgScript(
      npm,
      `${script.dev.name}${script.mobile.suffix}`,
      format(script.dev.script, mName),
    );
  }
};

const setStart = async (npm: NPM, defName?: string, defIsMobile?: boolean) => {
  if (!defName || defIsMobile) {
    return;
  }
  await setPkgScript(
    npm,
    script.start.name,
    format(script.start.script, defName),
  );
};

const tmpltKey = { sharedJs: "sharedJs" } as const;

const createShared = async (
  npm: NPM,
  types: PluginType[],
  jsTypes: PluginType[],
) => {
  if (types.length <= 1) {
    return;
  }
  await installTmplt(
    base,
    template,
    types.filter((e) => !jsTypes.includes(e)).length > 1
      ? meta.system.type.shared
      : tmpltKey.sharedJs,
    meta.system.type.shared,
    true,
  );
  await setPkgVers(npm, meta.system.type.shared);
};
