import { value } from "./const";
import { regValue, meta, Conf } from "@/registry";

const run = async (conf: Conf) => {
  console.log("eslint plugin running...");
  console.log(conf);
  await Promise.resolve();
};

regValue(
  {
    name: value.lint.eslint,
    label: "ESLint",
    plugin: { run },
    disables: [],
    enables: [],
  },
  meta.plugin.option.lint,
  undefined,
  0,
);
