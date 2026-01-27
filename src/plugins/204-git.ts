import { option, value } from "./const";
import { regOption, meta } from "@/registry";

regOption(
  {
    name: meta.plugin.option.git,
    label: "Git",
    values: [
      {
        name: meta.plugin.value.none,
        label: "None",
        skips: [{ option: option.gitVis }, { option: meta.plugin.option.cicd }],
        keeps: [],
        requires: [],
      },
    ],
  },
  meta.system.option.category.optional,
);
regOption(
  {
    name: option.gitVis,
    label: "Git repository visibility",
    values: [
      {
        name: value.gitVis.public,
        label: "Public",
        skips: [],
        keeps: [],
        requires: [],
      },
      {
        name: value.gitVis.private,
        label: "Private",
        skips: [],
        keeps: [],
        requires: [],
      },
    ],
  },
  meta.system.option.category.optional,
);
