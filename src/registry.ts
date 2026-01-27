import { message } from "@/message";

export const meta = {
  plugin: {
    type: {
      backend: "backend",
      frontend: "frontend",
      mobile: "mobile",
      node: "node",
      cli: "cli",
      lib: "lib",
      monorepo: "monorepo",
    },
    option: {
      type: {
        name: "name",
        framework: "framework",
        typescript: "typescript",
        deployment: "deployment",
      },
      builder: "builder",
      test: "test",
      lint: "lint",
      git: "git",
      cicd: "cicd",
      orm: "orm",
    },
    value: { none: "none" },
  },
  system: {
    type: { shared: "shared" },
    option: {
      category: {
        type: "type",
        compulsory: "compulsory",
        optional: "optional",
      },
    },
  },
} as const;

const sysConfKey = { npm: "npm", type: "type" } as const;

type TypeOption = keyof typeof meta.plugin.option.type;
type NonTypeOption = Exclude<keyof typeof meta.plugin.option, "type">;
export type PluginType = keyof typeof meta.plugin.type;
export type PrimeType = Exclude<PluginType, "monorepo">;
export enum NPM {
  npm = "npm",
  pnpm = "pnpm",
}
export type Conf = {
  npm: NPM;
  type: string;
  monorepo?: { name: string; types: string[] };
} & Partial<
  Record<
    PrimeType,
    Partial<Record<TypeOption, string>> &
      Partial<Record<string, string | string[]>>
  >
> &
  Partial<Record<NonTypeOption, string>> &
  Partial<Record<string, string | string[]>>;

export type Category = keyof typeof meta.system.option.category;

export interface IPlugin {
  run: (conf: Conf) => Promise<void>;
}
export type Value = {
  name: string;
  label: string;
  plugin?: IPlugin;
  skips: { option: string; type?: string }[];
  keeps: { option: string; type?: string }[];
  requires: { option: string; type?: string }[];
};
export type Option = {
  name: string;
  label: string;
  plugin?: IPlugin;
  values: Value[];
  multiple?: boolean;
  optional?: boolean;
  initial?: string;
  disabled?: boolean;
  required?: boolean;
};
export type Type = Value & { options: Option[] };
export const options: {
  type: Type[];
  compulsory: Option[];
  optional: Option[];
} = { type: [], compulsory: [], optional: [] };

export const regType = (type: Type, index?: number) => {
  if (Object.keys(meta.system.type).includes(type.name)) {
    throw new Error(message.sysType);
  }
  if (options.type.find((e) => e.name === type.name)) {
    throw new Error(message.typeExist);
  }
  if (index === undefined) {
    options.type.push(type);
    return;
  }
  options.type.splice(index, 0, type);
};

export const useType = (name: string, label: string, index?: number) => {
  if (Object.keys(meta.system.type).includes(name)) {
    throw new Error(message.sysType);
  }
  if (options.type.find((e) => e.name === name)) {
    return;
  }
  if (index === undefined) {
    options.type.push({
      name,
      label,
      options: [],
      skips: [],
      keeps: [],
      requires: [],
    });
    return;
  }
  options.type.splice(index, 0, {
    name,
    label,
    options: [],
    skips: [],
    keeps: [],
    requires: [],
  });
};

export const regOption = (
  option: Option,
  category: Category,
  type?: string,
  replace?: boolean,
  index?: number,
) => {
  const opts = getOptions(category, type, option.name);
  const found = opts.findIndex((e) => e.name === option.name);
  if (found !== -1) {
    if (!replace) {
      throw new Error(message.optionExist);
    }
    opts.splice(found, 1, option);
    return;
  }
  if (index === undefined) {
    opts.push(option);
    return;
  }
  opts.splice(index, 0, option);
};

export const useOption = (
  name: string,
  label: string,
  category: Category,
  type?: string,
  replace?: boolean,
  index?: number,
  multiple?: boolean,
  optional?: boolean,
  initial?: string,
) => {
  const opts = getOptions(category, type, name);
  const found = opts.findIndex((e) => e.name === name);
  if (found !== -1) {
    if (!replace) {
      return;
    }
    opts.splice(found, 1, {
      name,
      label,
      values: [],
      multiple,
      optional,
      initial,
    });
    return;
  }
  if (index === undefined) {
    opts.push({ name, label, values: [], multiple, optional, initial });
    return;
  }
  opts.splice(index, 0, {
    name,
    label,
    values: [],
    multiple,
    optional,
    initial,
  });
};

export const regValue = (
  value: Value,
  option: string,
  type?: string,
  index?: number,
) => {
  const opt = getOption(option, type);
  if (opt.values.find((e) => e.name === value.name)) {
    throw new Error(message.valueExist);
  }
  if (index === undefined) {
    opt.values.push(value);
    return;
  }
  opt.values.splice(index, 0, value);
};

export const adjustOptions = (conf: Conf, value: Value) => {
  for (const { option, type } of value.skips) {
    if (
      keptOrRequiredInTypes(conf, option, type) ||
      keptOrRequiredInOptions(conf, option, type, [
        ...options.compulsory,
        ...options.optional,
      ])
    ) {
      continue;
    }
    const opt = getOption(option, type);
    opt.disabled = true;
  }
  for (const { option, type } of value.keeps) {
    const opt = getOption(option, type);
    opt.disabled = false;
  }
  for (const { option, type } of value.requires) {
    const opt = getOption(option, type);
    opt.disabled = false;
    opt.required = true;
  }
};

export const typeFrmwksSkip = (option: string) => {
  return [
    ...options.type
      .filter((type) => type.skips.find((e) => e.option === option && !e.type))
      .map((type) => type.name),
    ...options.type
      .map((type) => type.options)
      .flat()
      .filter((opt) => opt.name === meta.plugin.option.type.framework)
      .map((opt) => opt.values)
      .flat()
      .filter((v) => v.skips.find((e) => e.option === option && !e.type))
      .map((v) => v.name),
  ];
};

const getOptions = (category: Category, type?: string, option?: string) => {
  if (category === meta.system.option.category.type) {
    if (!type) {
      throw new Error(message.typeRequired);
    }
    const type0 = options.type.find((e) => e.name === type);
    if (!type0) {
      throw new Error(message.typeNotExist);
    }
    return type0.options;
  }
  if (!option) {
    throw new Error(message.optionRequired);
  }
  if (Object.keys(sysConfKey).includes(option)) {
    throw new Error(message.sysConfKey);
  }
  if (
    options.type.find((e) => e.name === option) ||
    (category === meta.system.option.category.compulsory &&
      options.optional.find((e) => e.name === option)) ||
    (category === meta.system.option.category.optional &&
      options.compulsory.find((e) => e.name === option))
  ) {
    throw new Error(message.optionConflict);
  }
  return options[category];
};

const getOption = (name: string, type?: string) => {
  let opts;
  if (!type) {
    opts = [...options.compulsory, ...options.optional];
  } else {
    const type0 = options.type.find((e) => e.name === type);
    if (!type0) {
      throw new Error(message.typeNotExist);
    }
    opts = type0.options;
  }
  const option = opts.find((e) => e.name === name);
  if (!option) {
    throw new Error(message.optionNotExist);
  }
  return option;
};

const keptOrRequiredInTypes = (conf: Conf, option: string, type?: string) => {
  const types = [conf.type, ...(conf.monorepo?.types ?? [])];
  const types0 = options.type.filter((type0) => types.includes(type0.name));
  return (
    types0.find(
      (type0) =>
        type0.keeps.find((e) => e.option === option && e.type === type) ||
        type0.requires.find((e) => e.option === option && e.type === type),
    ) ||
    types0.find((type0) =>
      keptOrRequiredInOptions(conf, option, type, type0.options, type0.name),
    )
  );
};

const keptOrRequiredInOptions = (
  conf: Conf,
  option: string,
  type: string | undefined,
  opts: Option[],
  ofType?: string,
) => {
  const optConf = !ofType ? conf : conf[ofType];
  if (!optConf || typeof optConf !== "object" || Array.isArray(optConf)) {
    return false;
  }
  return opts.find((opt) => {
    const value =
      opt.name in optConf &&
      opt.values.find((v) => v.name === optConf[opt.name]);
    return (
      value &&
      (value.keeps.find((e) => e.option === option && e.type === type) ||
        value.requires.find((e) => e.option === option && e.type === type))
    );
  });
};
