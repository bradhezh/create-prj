import p from "@clack/prompts";

import { Conf, FlatOpt, option, optional, prompt, message } from "@/conf";

const onCancel = () => {
  p.cancel(message.opCanceled);
  process.exit(0);
};

(async () => {
  const answer = await p.group(
    {
      name: () => p.text(prompt.name),
      type: () => p.select(prompt.type!.selection),
    },
    { onCancel },
  );
  const conf: Conf = {
    ...answer,
    compulsory: Object.fromEntries(
      Object.entries(option.compulsory).map(([k, v]) => [
        k,
        Object.values(v)[0],
      ]),
    ) as Conf["compulsory"],
  };

  if (conf.type === option.type.fullstack) {
    const answer = await p.group(
      {
        frontend: () => p.select(prompt.fullstack_frontend),
        mobile: () => p.select(prompt.fullstack_mobile),
      },
      { onCancel },
    );
    conf.frontend = answer.frontend;
    conf.mobile = answer.mobile;
  } else if (conf.type in option) {
    const type = conf.type as keyof FlatOpt;
    (conf as any)[type] = Object.values(option[type as keyof typeof option])[0];
    if (type in prompt && !prompt[type]!.disable) {
      const answer = await p.group(
        { selection: () => p.select(prompt[type]!.selection) },
        { onCancel },
      );
      (conf as any)[type] = answer.selection;
    }
  }
  if (
    conf.type !== option.type.fullstack &&
    (conf.frontend === option.frontend.next ||
      conf.mobile === option.mobile.expo)
  ) {
    void (prompt.builder && (prompt.builder.disable = true));
    void (prompt.lint && (prompt.lint.disable = true));
    void (prompt.test && (prompt.test.disable = true));
  }

  for (const key in option.compulsory) {
    const k = key as keyof FlatOpt;
    if (k in prompt && !prompt[k]!.disable) {
      const answer = await p.group(
        { selection: () => p.select(prompt[k]!.selection) },
        { onCancel },
      );
      (conf.compulsory as any)[k] = answer.selection;
    }
  }

  const optionalAnswer = await p.group(
    { selection: () => p.select(prompt.optional) },
    { onCancel },
  );
  if (!optionalAnswer.selection) {
    console.log(conf);
    return;
  }
  if (optionalAnswer.selection === optional.default) {
    conf.optional = {
      lint: option.optional.lint.eslint,
      test: option.optional.test.jest,
    };
    console.log(conf);
    return;
  }
  if (optionalAnswer.selection === optional.manual) {
    for (const key in option.optional) {
      const k = key as keyof FlatOpt;
      if (k in prompt && !prompt[k]!.disable) {
        const answer = await p.group(
          { selection: () => p.select(prompt[k]!.selection) },
          { onCancel },
        );
        if (!answer.selection) {
          continue;
        }
        if (!conf.optional) {
          conf.optional = {};
        }
        (conf.optional as any)[k] = answer.selection;
      }
    }
  }

  console.log(conf);
})();
