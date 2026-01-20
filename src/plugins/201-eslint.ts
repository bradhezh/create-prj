import { log, spinner } from "@clack/prompts";
import { format } from "node:util";

import { value } from "./const";
import { regValue, meta, Conf } from "@/registry";
import { message } from "@/message";

const label = "ESLint" as const;

const run = async (_conf: Conf) => {
  const s = spinner();
  s.start();
  log.info(format(message.pluginStart, label));

  await Promise.resolve();

  log.info(format(message.pluginFinish, label));
  s.stop();
};

regValue(
  {
    name: value.lint.eslint,
    label,
    plugin: { run },
    disables: [],
    enables: [],
  },
  meta.plugin.option.lint,
  undefined,
  0,
);
