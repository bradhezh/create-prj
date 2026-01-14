export const option = {
  gitVis: "gitVis",
} as const;

export const value = {
  backend: { framework: { express: "express", nest: "nest" } },
  frontend: { framework: { react: "react", next: "next" } },
  mobile: { framework: { expo: "expo" } },
  typescript: { nodec: "nodec", metadata: "metadata" },
  builder: { rspack: "rspack" },
  test: { jest: "jest", none: "none" },
  lint: { eslint: "eslint", none: "none" },
  orm: { prisma: "prisma", none: "none" },
  git: { github: "github", none: "none" },
  gitVis: { public: "public", private: "private" },
} as const;
