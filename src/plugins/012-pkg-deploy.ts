import { value } from "./const";
import { regOption, meta, PosMode } from "@/registry";

for (const { type, label, skips } of [
  {
    type: meta.plugin.type.lib,
    label: "Library publishing",
    skips: [
      {
        type: meta.plugin.type.cli,
        option: meta.plugin.option.type.deployment,
      },
    ],
  },
  { type: meta.plugin.type.cli, label: "CLI publishing", skips: [] },
]) {
  regOption(
    {
      name: meta.plugin.option.type.deployment,
      label,
      values: [
        {
          name: value.deployment.npmjs,
          label:
            "npmjs\n|    Note: For CI/CD to work, you need to publish the package locally first.\n|    e.g.\n|    $ npm build\n|    $ npm login\n|    $ npm publish --access public\n|    And then set the CI/CD as the trusted publisher on npmjs.",
          skips,
          keeps: [],
          requires: [],
        },
        {
          name: meta.plugin.value.none,
          label: "None",
          pos: { mode: PosMode.last },
          skips: [],
          keeps: [],
          requires: [],
        },
      ],
    },
    meta.system.option.category.type,
    type,
  );
}
