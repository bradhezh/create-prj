import { execSync, exec as execAsync } from "node:child_process";
import { promisify, format } from "node:util";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { log, spinner } from "@clack/prompts";

import { option, value } from "./const";
import { regValue, meta, Conf, ConfType } from "@/registry";
import { installTmplt } from "@/command";
import { message as msg } from "@/message";

const exec = promisify(execAsync);

const message = {
  ...msg,
  noGit: 'No "git" installed to create the repository.',
  noGh: 'No "gh" installed to create the repository on GitHub.',
  scopeRequired:
    '"admin:repo_hook" required in scopes to set branch protection rules for the public repository.',
  noPubScope:
    'no "admin:repo_hook" selected, no branch protection rules will be set.',
} as const;

const label = "GitHub" as const;

const run = async (conf: Conf) => {
  const s = spinner();
  s.start();
  log.info(format(message.pluginStart, label));

  if (await init()) {
    const name = conf[conf.type as ConfType]?.name ?? conf.type;
    const vis = conf[option.gitVis] as string;

    const user = await checkAuth(vis, s);
    const scopes = await checkScopes(vis, s);
    await createGh(user, name, vis);
    await setGh(user, name, vis, scopes);
  }

  log.info(format(message.pluginFinish, label));
  s.stop();
};

regValue(
  { name: value.git.github, label, plugin: { run }, disables: [], enables: [] },
  meta.plugin.option.git,
  undefined,
  0,
);

const command = {
  git: "git --version",
  init: "git init",
  add: "git add .",
  ciInit: 'git commit -m "init"',
  ciCodeowner: 'git commit -m "CODEOWNERS added"',
  gh: "gh --version",
  auth: "gh auth status",
  user: "gh api user --jq .login",
  login: "gh auth login",
  loginPubRule: 'gh auth login --scopes "admin:repo_hook,repo"',
  refresh: "gh auth refresh --scopes admin:repo_hook",
  createGh: "gh repo create %s --%s",
  rename: "git branch -M master",
  remote: "git remote add origin https://github.com/%s/%s.git",
  pushu: "git push -u origin master",
  push: "git push",
  pubRule:
    "gh api --method PUT /repos/%s/%s/branches/master/protection --input -",
} as const;

const base =
  "https://raw.githubusercontent.com/bradhezh/prj-template/master/git/gitignore" as const;
const template = { git: { name: ".gitignore" } } as const;

const init = async () => {
  if (
    !(await exec(command.git)
      .then(() => true)
      .catch(() => false))
  ) {
    log.warn(message.noGit);
    return false;
  }
  await installTmplt(base, template, meta.plugin.option.git);
  log.info(command.init);
  await exec(command.init);
  log.info(command.add);
  await exec(command.add);
  log.info(command.ciInit);
  await exec(command.ciInit);
  if (
    await exec(command.gh)
      .then(() => true)
      .catch(() => false)
  ) {
    return true;
  }
  log.warn(message.noGh);
  return false;
};

type Spinner = ReturnType<typeof spinner>;

const checkAuth = async (vis: string, s: Spinner) => {
  try {
    return (await exec(command.user)).stdout.trim();
  } catch {
    const cmd =
      vis !== value.gitVis.public ? command.login : command.loginPubRule;
    log.info(cmd);
    s.stop();
    execSync(cmd, { stdio: "inherit" });
    s.start();
    return (await exec(command.user)).stdout.trim();
  }
};

const pubScope = "admin:repo_hook" as const;

const checkScopes = async (vis: string, s: Spinner) => {
  let scopes = await getScopes();
  if (vis !== value.gitVis.public || scopes.includes(pubScope)) {
    return scopes;
  }
  log.warn(message.scopeRequired);
  log.info(command.refresh);
  s.stop();
  execSync(command.refresh, { stdio: "inherit" });
  s.start();
  scopes = await getScopes();
  if (!scopes.includes(pubScope)) {
    log.warn(message.noPubScope);
  }
  return scopes;
};

const createGh = async (user: string, name: string, vis: string) => {
  const create = format(command.createGh, name, vis);
  log.info(create);
  await exec(create);
  log.info(command.rename);
  await exec(command.rename);
  const remote = format(command.remote, user, name);
  log.info(remote);
  await exec(remote);
  log.info(command.pushu);
  await exec(command.pushu);
};

const githubDir = ".github" as const;
const codeowners = "CODEOWNERS" as const;

const setGh = async (
  user: string,
  name: string,
  vis: string,
  scopes: string[],
) => {
  if (vis !== value.gitVis.public || !scopes.includes(pubScope)) {
    return;
  }
  const rule = {
    required_pull_request_reviews: {
      required_approving_review_count: 1,
      require_code_owner_reviews: true,
    },
    required_status_checks: { strict: true, contexts: [] },
    enforce_admins: false,
    restrictions: null,
  };
  const cmd = format(command.pubRule, user, name);
  log.info(cmd);
  const exe = exec(cmd);
  exe.child.stdin!.write(JSON.stringify(rule));
  exe.child.stdin!.end();
  await exe;

  await mkdir(githubDir);
  const text = `* @${user}
`;
  await writeFile(join(githubDir, codeowners), text);
  await exec(command.add);
  await exec(command.ciCodeowner);
  await exec(command.push);
};

const scopesPattern = /Token scopes: (.*)/i;

const getScopes = async () => {
  return (await exec(command.auth)).stdout
    .match(scopesPattern)![1]
    .split(",")
    .map((e) => e.replace(/['"]/g, "").trim());
};
