import { regOption, meta } from "@/registry";

regOption(
  {
    name: meta.plugin.option.deploy,
    label: "Deployment",
    values: [
      {
        name: meta.plugin.value.none,
        label: "None",
        disables: [],
        enables: [],
      },
    ],
  },
  meta.system.option.category.optional,
);
