export const option = {
  type: {
    node: "node",
    backend: "backend",
    frontend: "frontend",
    mobile: "mobile",
    fullstack: "fullstack",
    lib: "lib",
    cli: "cli",
  },
  frontend: {
    react: "react",
    next: "next",
  },
  mobile: { expo: "expo" },
  lib: { npmjs: "npmjs" },
  cli: { npmjs: "npmjs" },
  compulsory: {
    node: { volta: "volta" },
    npm: { pnpm: "pnpm" },
    builder: { rspack: "rspack" },
  },
  optional: {
    lint: { eslint: "eslint" },
    test: { jest: "jest" },
    git: { github: "github" },
    cicd: { ghactions: "ghactions" },
    deploy: { render: "render" },
    docker: { docker: "docker" },
    orm: { prisma: "prisma" },
  },
} as const;

export const optional = {
  default: "default",
  manual: "manual",
} as const;

type Option = typeof option;
type ConfFromOpt<T> = T extends object
  ? T[keyof T] extends object
    ? { [K in keyof T]: ConfFromOpt<T[K]> }
    : T[keyof T]
  : T;
type RecursiveWritable<T> = T extends object
  ? { -readonly [K in keyof T]: RecursiveWritable<T[K]> }
  : T;
type RecursivePartial<T> = T extends object
  ? { [K in keyof T]?: RecursivePartial<T[K]> }
  : T;
type Conf0 = RecursiveWritable<ConfFromOpt<Option>>;
export type Conf = { name: string } & Pick<Conf0, "type" | "compulsory"> &
  RecursivePartial<Omit<Conf0, "type" | "compulsory">>;

const flatOpt = (({ compulsory, optional, ...rest }) => ({
  ...rest,
  ...compulsory,
  ...optional,
}))(option);
export type FlatOpt = typeof flatOpt;

export const message = {
  name: {
    q: "Project name?",
    initial: "my-prj",
    validate: "Please enter a name.",
  },
  type: {
    q: "Project type?",
    node: "Node.js",
    backend: "Backend",
    frontend: "Frontend",
    mobile: "Mobile",
    fullstack: "Fullstack",
    lib: "Library",
    cli: "CLI tool",
  },
  frontend: {
    q: "Frontend framework?",
    react: "React",
    next: "Next.js",
  },
  mobile: {
    q: "Mobile framework?",
    expo: "Expo",
  },
  lib: {
    q: "Package registry for library?",
    npmjs: "npmjs",
  },
  cli: {
    q: "Package registry for CLI tool?",
    npmjs: "npmjs",
  },
  node: {
    q: "Node version management?",
    volta: "Volta",
  },
  npm: {
    q: "Node package management?",
    pnpm: "pnpm",
  },
  builder: {
    q: "Builder?",
    rspack: "Rspack",
  },
  lint: {
    q: "Lint?",
    eslint: "ESLint",
  },
  test: {
    q: "Test framework?",
    jest: "Jest",
  },
  git: {
    q: "Git?",
    github: "GitHub",
  },
  cicd: {
    q: "CI/CD?",
    ghactions: "GitHub Actions",
  },
  deploy: {
    q: "Cloud for deployment?",
    render: "Render.com",
  },
  docker: {
    q: "Docker for deployment?",
    docker: "docker.io",
  },
  orm: {
    q: "ORM?",
    prisma: "Prisma",
  },
  optional: {
    q: "Accept optional ones with defaults, or configure them one by one, or none of them?",
    default:
      "Accept defaults (ESLint, Jest, without Git, CI/CD, deployment, and ORM)",
    manual: "Configure manually",
  },
  opCanceled: "Operation cancelled.",
} as const;

const none = {
  value: undefined,
  label: "None",
} as const;

export const prompt = {
  ...(Object.fromEntries(
    (Object.entries(flatOpt) as [keyof FlatOpt, FlatOpt[keyof FlatOpt]][])
      .filter(
        ([k, v]) =>
          typeof v === "object" &&
          (Object.keys(v).length > 1 || k in option.optional),
      )
      .map(([k, v]) => [
        k,
        {
          disable: false,
          selection: {
            message: message[k].q,
            options: [
              ...Object.values(v).map((e) => ({
                value: e,
                label: (message[k] as any)[e],
              })),
              ...(!(k in option.optional) ? [] : [none]),
            ],
          },
        },
      ]),
  ) as {
    [K in keyof FlatOpt]?: {
      disable: boolean;
      selection: {
        message: string;
        options: {
          value: FlatOpt[K][keyof FlatOpt[K]];
          label: string;
        }[];
      };
    };
  }),
  name: {
    message: message.name.q,
    initialValue: message.name.initial,
    validate: (value?: string) => (value ? undefined : message.name.validate),
  },
  fullstack_frontend: {
    message: message.frontend.q,
    options: [
      ...Object.values(option.frontend).map((e) => ({
        value: e,
        label: message.frontend[e],
      })),
      none,
    ],
  },
  fullstack_mobile: {
    message: message.mobile.q,
    options: [
      ...Object.values(option.mobile).map((e) => ({
        value: e,
        label: message.mobile[e],
      })),
      none,
    ],
  },
  optional: {
    message: message.optional.q,
    initialValue: optional.default,
    options: [
      {
        value: optional.default,
        label: message.optional.default,
      },
      {
        value: optional.manual,
        label: message.optional.manual,
      },
      none,
    ],
  },
};
