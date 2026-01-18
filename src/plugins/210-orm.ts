import { regOption, meta } from "@/registry";

regOption(
  {
    name: meta.plugin.option.orm,
    label: "ORM",
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
