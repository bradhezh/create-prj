import { value } from "./const";
import { regValue, meta, Conf } from "@/registry";

const run = async (conf: Conf) => {
  console.log("ghaction plugin running...");
  console.log(conf);
  await Promise.resolve();
};

regValue(
  {
    name: value.cicd.ghaction,
    label: "GitHub Actions",
    plugin: { run },
    disables: [],
    enables: [],
  },
  meta.plugin.option.cicd,
  undefined,
  0,
);
