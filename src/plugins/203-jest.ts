import { value } from "./const";
import { regValue, meta, Conf } from "@/registry";

const run = async (conf: Conf) => {
  console.log("jest plugin running...");
  console.log(conf);
  await Promise.resolve();
};

regValue(
  {
    name: value.test.jest,
    label: "Jest",
    plugin: { run },
    disables: [],
    enables: [],
  },
  meta.plugin.option.test,
  undefined,
  0,
);
