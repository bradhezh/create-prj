import { log, spinner } from "@clack/prompts";
import { format } from "node:util";

import { value } from "./const";
import { regValue, meta, Conf } from "@/registry";
import { message } from "@/message";

const run = async (conf: Conf) => {
  const s = spinner();
  s.start();
  log.info(format(message.pluginStart, `${label} for the backend`));

  const name =
    conf.monorepo?.name ?? conf.backend!.name ?? meta.plugin.type.backend;
  await Promise.resolve(() => name);

  log.info(format(message.pluginFinish, `${label} for the backend`));
  s.stop();
};

const label = "Render.com" as const;

regValue(
  {
    name: value.deployment.render,
    label,
    plugin: { run },
    skips: [],
    keeps: [],
    requires: [
      { option: meta.plugin.option.git },
      { option: meta.plugin.option.cicd },
    ],
  },
  meta.plugin.option.type.deployment,
  meta.plugin.type.backend,
);
