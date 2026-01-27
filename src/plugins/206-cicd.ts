import { regOption, meta } from "@/registry";

regOption(
  {
    name: meta.plugin.option.cicd,
    label: "CI/CD",
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
  meta.system.option.category.optional,
);
