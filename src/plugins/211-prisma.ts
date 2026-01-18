import { value } from "./const";
import { regValue, meta, Conf } from "@/registry";

const run = async (conf: Conf) => {
  console.log("prisma plugin running...");
  console.log(conf);
  await Promise.resolve();
};

regValue(
  {
    name: value.orm.prisma,
    label: "Prisma",
    plugin: { run },
    disables: [],
    enables: [],
  },
  meta.plugin.option.orm,
  undefined,
  0,
);
