import { regOption, meta } from "@/registry";

regOption(
  {
    name: meta.plugin.option.cicd,
    label: "CI/CD",
    values: [
      {
        name: meta.plugin.value.none,
        label: "None",
        disables: [{ option: meta.plugin.option.deploy }],
        enables: [],
      },
    ],
  },
  meta.system.option.category.optional,
);
