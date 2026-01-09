import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { main } from "@/main";

const dynamicImport = new Function("specifier", "return import(specifier)");

void (async () => {
  const dir = path.join(__dirname, "plugins");
  for (const file of (await readdir(dir)).filter((e) => e.endsWith(".js"))) {
    await dynamicImport(pathToFileURL(path.join(dir, file)).href);
  }
  await main();
})();
