import { regOption, meta } from "@/registry";

regOption(
  {
    name: meta.plugin.option.type.deployment,
    label: "Backend deployment",
    values: [
      {
        name: meta.plugin.value.none,
        label: "None",
        skips: [],
        keeps: [],
        requires: [],
      },
    ],
  },
  meta.system.option.category.type,
  meta.plugin.type.backend,
);
