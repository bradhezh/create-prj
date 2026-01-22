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

const label = "Jest" as const;

regValue(
  { name: value.test.jest, label, plugin: { run }, disables: [], enables: [] },
  meta.plugin.option.test,
  undefined,
  0,
);
