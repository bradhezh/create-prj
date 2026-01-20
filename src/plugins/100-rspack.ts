import { log, spinner } from "@clack/prompts";
import { format } from "node:util";

import { value } from "./const";
import { useOption, regValue, meta, Conf } from "@/registry";
import { message } from "@/message";

const label = "Rspack" as const;

const run = async (_conf: Conf) => {
  const s = spinner();
  s.start();
  log.info(format(message.pluginStart, label));

  await Promise.resolve();

  log.info(format(message.pluginFinish, label));
  s.stop();
};

useOption(
  meta.plugin.option.builder,
  "Builder",
  meta.system.option.category.compulsory,
);
regValue(
  {
    name: value.builder.rspack,
    label,
    plugin: { run },
    disables: [],
    enables: [],
  },
  meta.plugin.option.builder,
);
