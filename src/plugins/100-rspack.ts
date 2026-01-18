import { value } from "./const";
import { useOption, regValue, meta, Conf } from "@/registry";

const run = async (conf: Conf) => {
  console.log("rspack plugin running...");
  console.log(conf);
  await Promise.resolve();
};

useOption(
  meta.plugin.option.builder,
  "Builder",
  meta.system.option.category.compulsory,
);
regValue(
  {
    name: value.builder.rspack,
    label: "Rspack",
    plugin: { run },
    disables: [],
    enables: [],
  },
  meta.plugin.option.builder,
);
