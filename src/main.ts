import { readdir } from "node:fs/promises";
import { log } from "@clack/prompts";

import { config, plugins } from "@/conf";
import { message } from "@/message";

export const main = async () => {
  if ((await readdir(process.cwd())).length) {
    log.error(message.cwdNonEmpty);
    return;
  }
  const conf = await config();

  for (const plugin of plugins.type) {
    await plugin.run(conf);
  }
  for (const plugin of plugins.option.type) {
    await plugin.run(conf);
  }
  for (const plugin of plugins.option.compulsory) {
    await plugin.run(conf);
  }
  for (const plugin of plugins.option.optional) {
    await plugin.run(conf);
  }
  for (const plugin of plugins.value) {
    await plugin.run(conf);
  }
};
