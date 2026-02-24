import { meta, Conf } from "@/registry";

export const option = { deploySrc: "deploySrc", gitVis: "gitVis" } as const;

export const value = {
  framework: {
    express: "express",
    nest: "nest",
    react: "react",
    next: "next",
    expo: "expo",
  },
  typescript: { nodec: "nodec", metadata: "metadata" },
  deployment: {
    render: "render",
    vercel: "vercel",
    expo: "expo",
    npmjs: "npmjs",
  },
  deploySrc: { dkrhub: "dkrhub", ghcr: "ghcr", repo: "repo" },
  orm: { prisma: "prisma" },
  builder: { rspack: "rspack" },
  test: { jest: "jest" },
  lint: { eslint: "eslint" },
  git: { github: "github", gitlab: "gitlab" },
  gitVis: { public: "public", private: "private" },
  cicd: { gha: "gha", circle: "circle" },
  done: "done",
} as const;

export type RenderValue =
  | { owner: string; service: string; token: string; cred?: string }
  | undefined;
export type CLIDeployValue = { token?: string } | undefined;
export type DkrValue =
  | {
      user: string;
      readToken: string;
      image?: string;
      token?: string;
      registry?: string;
    }
  | undefined;
export type GitSvcValue =
  | { repo?: string; readToken?: string; token?: string }
  | undefined;

export const valid = (conf: Conf[string]) => {
  return !!(
    conf &&
    ((typeof conf === "string" && conf !== meta.plugin.value.none) ||
      (Array.isArray(conf) && conf.length) ||
      typeof conf === "object")
  );
};
