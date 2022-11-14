#!/usr/bin/env ts-node
/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "node:path";
import * as fs from "fs-extra";
import execa = require("execa");

/** ts-graphviz package name */
const TS_GRAPHVIZ = "ts-graphviz";

// JSII does not support typescript versions > 3.9 and ts-graphviz is 4.2 so we need to downlevel it to 3.9
// https://github.com/aws/jsii/issues/3609

(async () => {
  console.info("patching ts-graphviz typescript version to support 3.9")
  const tsGraphvizDir = require.resolve(TS_GRAPHVIZ).replace(new RegExp(`${TS_GRAPHVIZ}\/.*`), TS_GRAPHVIZ);
  const tsGraphvizPkgPath = path.join(tsGraphvizDir, "package.json");
  const tsGraphvizPkg = await fs.readJson(tsGraphvizPkgPath);

  if (tsGraphvizPkg.typesVersions == null) {
    console.debug({
      tsGraphvizDir,
      tsGraphvizPkgPath,
      tsGraphvizPkg: `${tsGraphvizPkg.name}@${tsGraphvizPkg.version}`,
    })

    await execa.command("npx downlevel-dts . ts3.9 --to=3.9", {
      cwd: tsGraphvizDir,
      stdio: "inherit",
      shell: true,
    });

    const typesVersions = {
      ...tsGraphvizPkg.typesVersions,
      "<4.0": { "*": ["ts3.9/*"] }
    }

    tsGraphvizPkg.typesVersions = typesVersions;

    console.debug("typesVersions:", typesVersions);

    await fs.writeFile(tsGraphvizPkgPath, JSON.stringify(tsGraphvizPkg, null, 2), { encoding: "utf-8" });

    console.info("ts-graphvis has been patched")
  } else {
    console.info("ts-graphvis already patched")
  }

})();
