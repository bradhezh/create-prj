import { value } from "./const";
import { regValue, meta, Conf } from "@/registry";

const run = async (conf: Conf) => {
  console.log("render plugin running...");
  console.log(conf);
  await Promise.resolve();
};

regValue(
  {
    name: value.deploy.render,
    label: "Render.com",
    plugin: { run },
    disables: [],
    enables: [],
  },
  meta.plugin.option.deploy,
  undefined,
  0,
);
