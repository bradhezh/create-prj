import { log, spinner } from "@clack/prompts";
import { format } from "node:util";

import { value } from "./const";
import { regValue, meta, Conf } from "@/registry";
import { message } from "@/message";

const run = async (_conf: Conf) => {
  const s = spinner();
  s.start();
  log.info(format(message.pluginStart, label));

  await Promise.resolve();

  log.info(format(message.pluginFinish, label));
  s.stop();
};

const label = "GitHub Actions" as const;

regValue(
  {
    name: value.cicd.ghaction,
    label,
    plugin: { run },
    skips: [],
    keeps: [],
    requires: [],
  },
  meta.plugin.option.cicd,
  undefined,
  0,
);
