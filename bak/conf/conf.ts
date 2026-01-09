import {
  ConfFromOption,
  Optional,
  Flatten,
  DeepWritable,
  DeepReadonly,
  AllKeys,
  AllVals,
} from "@/types";

const option = {
  type: {
    node: "node",
    cli: "cli",
    lib: "lib",
    backend: "backend",
    frontend: "frontend",
    mobile: "mobile",
    monorepo: "monorepo",
  },
  typescript: { nodecorator: "nodecorator", decorator: "decorator" },
  builder: { rspack: "rspack" },
  optional: {
    cli: { registry: { npmjs: "npmjs" } },
    lib: { registry: { npmjs: "npmjs" } },
    backend: { framework: { express: "express", nest: "nest" } },
    frontend: { framework: { vite: "vite", next: "next" } },
    mobile: { framework: { expo: "expo" } },
    monorepo: { types: ["backend", "frontend", "mobile"] },
    test: { jest: "jest" },
    lint: { eslint: "eslint" },
    orm: { prisma: "prisma" },
    git: { github: "github" },
    cicd: { ghactions: "ghactions" },
    deploy: { render: "render" },
    docker: { docker: "docker" },
  },
} as const;

type IType = Record<string, string> & { monorepo: "monorepo" };
type CType = Record<string, string> & { monorepo: "monorepo" };
type IOptional = Record<string, object> & {
  monorepo: Record<string, object> & { types: [string, ...string[]] };
};
export type IOption = DeepReadonly<Record<string, object>> &
  DeepReadonly<{
    type: IType;
    optional: IOptional;
  }>;

export const getOption = (): IOption => {
  return option;
};

const npm = { npm: "npm", pnpm: "pnpm" } as const;
type NPM = keyof typeof npm;
type Option = typeof option;
/*
export type Conf = { name: string; npm: NPM } & Flatten<
  Optional<DeepWritable<ConfFromOption<IOption>>, "optional">,
  "optional"
>;
*/

const defaults = {
  value: {
    test: option.optional.test.jest,
    lint: option.optional.lint.eslint,
    orm: option.optional.orm.prisma,
    git: option.optional.git.github,
    cicd: option.optional.cicd.ghactions,
    deploy: option.optional.deploy.render,
    docker: option.optional.docker.docker,
  },
  option: { default: "default", manual: "manual" },
} as const;

export type IDefaults = {
  value: Record<string, string>;
  option: Record<string, string>;
};

export const getDefs = (): IDefaults => {
  return defaults;
};

const type = {
  selfCreateds: [
    {
      name: option.type.frontend,
      framework: [
        option.optional.frontend.framework.vite,
        option.optional.frontend.framework.next,
      ],
    },
    option.type.mobile,
  ],
  withMultipleTmplts: [option.type.backend],
  shared: "shared",
} as const;

type SelfCreatedObj = Exclude<(typeof type.selfCreateds)[number], Type>;
type SelfCreatedObjKey = AllKeys<SelfCreatedObj>;
type SelfCreatedObjVal = AllVals<SelfCreatedObj>;
type SelfCreatedObjValNonName = Exclude<
  SelfCreatedObjVal,
  SelfCreatedObj["name"]
>[number][];

export const allSelfCreated = (conf: Conf, types: Type[]) => {
  return !types.filter(
    (e) =>
      !type.selfCreateds.filter((e0) =>
        typeof e0 === "string"
          ? e0 === e
          : e0.name === e &&
            (
              Object.entries(e0) as [SelfCreatedObjKey, SelfCreatedObjVal][]
            ).filter(
              ([k, v]) =>
                k !== "name" &&
                conf[e] &&
                (v as SelfCreatedObjValNonName).includes((conf[e] as any)[k]),
            ).length,
      ).length,
  ).length;
};
