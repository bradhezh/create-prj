import { regOption, meta } from "@/registry";

regOption(
  {
    name: meta.plugin.option.lint,
    label: "Lint",
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
