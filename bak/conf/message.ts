export const message = {
  name: {
    q: "Project name?",
    initial: "my-prj",
    validate: "Please enter a name.",
  },
  type: {
    q: "Project type?",
    node: "Node.js",
    cli: "CLI tool",
    lib: "Library",
    backend: "Backend",
    frontend: "Frontend",
    mobile: "Mobile",
    monorepo: "Monorepo",
  },
  typescript: {
    q: "TypeScript decorator?",
    nodecorator: "No decorator",
    decorator: "Decorator with emitDecoratorMetadata",
  },
  builder: { q: "Builder?", rspack: "Rspack" },
  cli: { registry: { q: "CLI tool package registry?", npmjs: "npmjs" } },
  lib: { registry: { q: "Library package registry?", npmjs: "npmjs" } },
  backend: {
    framework: { q: "Backend framework?", express: "Express", nest: "NestJS" },
  },
  frontend: {
    framework: { q: "Frontend framework?", vite: "Vite", next: "Next.js" },
  },
  mobile: { framework: { q: "Mobile framework?", expo: "Expo" } },
  monorepo: {
    types: {
      q: "Types in monorepo?",
      backend: "Backend",
      frontend: "Frontend",
      mobile: "Mobile",
    },
  },
  defaults: {
    q: "Accept defaults, or configure them one by one, or choose none of them?",
    default:
      "Accept defaults (Jest, ESLint, Prisma, GitHub, GitHub Actions, Render.com, and Docker if applicable)",
    manual: "Configure manually",
  },
  test: { q: "Test framework?", jest: "Jest" },
  lint: { q: "Lint?", eslint: "ESLint" },
  orm: { q: "ORM?", prisma: "Prisma" },
  git: { q: "Git?", github: "GitHub" },
  cicd: { q: "CI/CD?", ghactions: "GitHub Actions" },
  deploy: { q: "Cloud for deployment?", render: "Render.com" },
  docker: { q: "Docker for deployment?", docker: "docker.io" },

  opCanceled: "Operation cancelled.",
  cwdNonEmpty: "The current work directory must be empty.",
  pmUnsupported: "The tool can only support npm or pnpm for now.",
  pnpmForMono: "The tool can only support pnpm monorepo for now.",
  createPrj: "Creating projects",
  createVite: "create-vite ...",
  createNext: "create-next-app ...",
  createExpo: "create-expo-app ...",
  noSelfCreateCmd: "No CLI for creation of %s.",
  nextWkspaceRenamed:
    "frontend/pnpm-workspace.yaml has been renamed frontend/pnpm-workspace.yaml.bak, please check the content and merge it into the root one.",
  expoWkspaceRenamed:
    'mobile/pnpm-workspace.yaml has been renamed mobile/pnpm-workspace.yaml.bak and "nodeLinker: hoisted" has been merged into the root one, please check whether there are other configurations to be merged into the root one.',
  proceed: "Proceeding",
  prjCreated: "Creation completed!",
} as const;
