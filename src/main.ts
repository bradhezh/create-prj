import { readdir } from "node:fs/promises";
import p from "@clack/prompts";

import { config, plugins } from "@/conf";
import { message } from "@/message";

export const main = async () => {
  if ((await readdir(process.cwd())).length) {
    p.log.error(message.cwdNonEmpty);
    return;
  }
  const conf = await config();

  const s = p.spinner();
  s.start(message.createPrj);
  for (const plugin of plugins.type) {
    await plugin.run(conf, s);
  }
  for (const plugin of plugins.option.type) {
    await plugin.run(conf, s);
  }
  for (const plugin of plugins.option.compulsory) {
    await plugin.run(conf, s);
  }
  for (const plugin of plugins.option.optional) {
    await plugin.run(conf, s);
  }
  for (const plugin of plugins.value) {
    await plugin.run(conf, s);
  }
  s.stop(message.prjCreated);
};
