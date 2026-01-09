import p from "@clack/prompts";
import path from "node:path";
import { format } from "node:util";

import { options, meta, NPM } from "@/registry";
import type {
  Conf,
  Category,
  Option,
  Value,
  IPlugin,
  PlugType,
} from "@/registry";
import { monorepo } from "@/monorepo";
import { message } from "@/message";

export const plugins: {
  type: IPlugin[];
  option: { [K in Category]: IPlugin[] };
  value: IPlugin[];
} = { type: [], option: { type: [], compulsory: [], optional: [] }, value: [] };

const optional = {
  default: { value: "default", label: "Accept defaults" },
  manual: { value: "manual", label: "Configure manually" },
  none: { value: undefined, label: "None" },
} as const;

export const config = async () => {
  const conf: Conf = await init();
  await confTypes(conf);
  await confOptions(
    conf,
    options.compulsory,
    meta.system.option.category.compulsory,
  );
  await confOptional(conf);
  return conf;
};

const init = async () => {
  let npm;
  if (process.env.npm_config_user_agent?.includes(NPM.pnpm)) {
    npm = NPM.pnpm;
  } else if (process.env.npm_config_user_agent?.includes(NPM.npm)) {
    npm = NPM.npm;
  } else {
    throw new Error(message.pmUnsupported);
  }
  const answer = await p.group(
    {
      type: () =>
        p.select({
          message: message.type.label,
          options: [
            ...options.type.map((e) => ({ value: e, label: e.label })),
            { value: monorepo, label: monorepo.label },
          ],
        }),
    },
    { onCancel },
  );
  if (answer.type.name === monorepo.name && npm !== NPM.pnpm) {
    throw new Error(message.pnpmRequired);
  }
  void (answer.type.plugin && plugins.type.push(answer.type.plugin));
  return { npm, type: answer.type.name };
};

const confTypes = async (conf: Conf) => {
  const types: string[] = [];
  if (conf.type !== monorepo.name) {
    types.push(conf.type);
  } else {
    const answer = await p.group(
      {
        name: () =>
          p.text({
            message: message.monorepo.name.label,
            initialValue: path.basename(process.cwd()),
            validate: (value?: string) =>
              value ? undefined : message.validate,
          }),
        types: () =>
          p.multiselect({
            message: message.monorepo.types.label,
            options: options.type.map((e) => ({ value: e, label: e.label })),
          }),
      },
      { onCancel },
    );
    plugins.type.push(
      ...answer.types.filter((e) => e.plugin).map((e) => e.plugin!),
    );
    conf.monorepo = {
      name: answer.name,
      types: answer.types.map((e) => e.name),
    };
    types.push(...conf.monorepo.types);
  }

  for (const type of types) {
    const type0 = options.type.find((e) => e.name === type)!;
    conf[type as PlugType] = {};
    await confOptions(
      conf,
      type0.options,
      meta.system.option.category.type,
      type,
      conf.type === monorepo.name ? monorepo.label : type0.label,
    );
  }
};

const confOptional = async (conf: Conf) => {
  if (!options.optional.length) {
    return;
  }
  const defOpts = options.optional.filter((e) => e.values.length);
  if (!defOpts.length) {
    p.log.info(
      format(
        message.optional.options.hint,
        options.optional.map((e) => e.name).join(),
      ),
    );
  } else {
    p.log.info(
      format(
        message.optional.defaults.hint,
        defOpts.map((e) => e.values[0].name).join(),
      ),
    );
  }

  const answer = await p.group(
    {
      optional: () =>
        p.select({
          message: !defOpts.length
            ? message.optional.options.label
            : message.optional.defaults.label,
          options: [
            ...(!defOpts.length
              ? []
              : [
                  {
                    value: optional.default.value,
                    label: optional.default.label,
                  },
                ]),
            { value: optional.manual.value, label: optional.manual.label },
            { value: optional.none.value, label: optional.none.label },
          ],
        }),
    },
    { onCancel },
  );
  if (answer.optional === optional.none.value) {
    return;
  }
  if (answer.optional === optional.default.value) {
    for (const opt of defOpts) {
      void (opt.plugin && plugins.option.optional.push(opt.plugin));
      const value = opt.values[0];
      void (value.plugin && plugins.value.push(value.plugin));
      conf[opt.name] = !opt.multiple ? value.name : [value.name];
    }
    return;
  }
  await confOptions(
    conf,
    options.optional,
    meta.system.option.category.optional,
  );
};

const confOptions = async (
  conf: Conf,
  opts: Option[],
  category: Category,
  type?: string,
  typeLabel?: string,
) => {
  if (category === meta.system.option.category.type && !(type && typeLabel)) {
    throw new Error(message.typeRequired);
  }
  const conf0 = (
    category !== meta.system.option.category.type ? conf : conf[type!]
  ) as Record<string, string | string[]>;
  for (const opt of opts) {
    const answer = await p.group(
      {
        [opt.name]: () =>
          !opt.values.length
            ? p.text({
                message:
                  category !== meta.system.option.category.type
                    ? opt.label
                    : `${typeLabel} | ${opt.label}`,
                initialValue:
                  opt.initial ??
                  (category !== meta.system.option.category.type ||
                  opt.name !== meta.plugin.option.type.common.name
                    ? undefined
                    : conf.type === monorepo.name
                      ? type
                      : path.basename(process.cwd())),
                validate: opt.optional
                  ? undefined
                  : (value?: string) => (value ? undefined : message.validate),
              })
            : !opt.multiple
              ? p.select({
                  message:
                    category !== meta.system.option.category.type
                      ? opt.label
                      : `${typeLabel} | ${opt.label}`,
                  options: [
                    ...opt.values.map((e) => ({ value: e, label: e.label })),
                    ...(category !== meta.system.option.category.optional
                      ? []
                      : [
                          {
                            value: optional.none.value,
                            label: optional.none.label,
                          },
                        ]),
                  ],
                })
              : p.multiselect({
                  message:
                    category !== meta.system.option.category.type
                      ? opt.label
                      : `${typeLabel} | ${opt.label}`,
                  options: opt.values.map((e) => ({
                    value: e,
                    label: e.label,
                  })),
                }),
      },
      { onCancel },
    );
    if (answer[opt.name] === optional.none.value) {
      continue;
    }
    void (opt.plugin && plugins.option[category].push(opt.plugin));
    if (!opt.values.length) {
      conf0[opt.name] = answer[opt.name] as string;
    } else if (!opt.multiple) {
      const value = answer[opt.name] as Value;
      void (value.plugin && plugins.value.push(value.plugin));
      conf0[opt.name] = value.name;
    } else {
      const values = answer[opt.name] as Value[];
      plugins.value.push(
        ...values.filter((e) => e.plugin).map((e) => e.plugin!),
      );
      conf0[opt.name] = values.map((e) => e.name);
    }
  }
};

const onCancel = () => {
  p.cancel(message.opCanceled);
  process.exit(0);
};
