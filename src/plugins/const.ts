export const option = {
  gitVis: "gitVis",
} as const;

export const value = {
  framework: {
    express: "express",
    nest: "nest",
    react: "react",
    next: "next",
    expo: "expo",
  },
  typescript: { nodec: "nodec", metadata: "metadata" },
  builder: { rspack: "rspack" },
  test: { jest: "jest" },
  lint: { eslint: "eslint" },
  orm: { prisma: "prisma" },
  git: { github: "github" },
  gitVis: { public: "public", private: "private" },
  cicd: { ghaction: "ghaction" },
  deploy: { render: "render" },
} as const;
