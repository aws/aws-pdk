/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as fs from "fs";

/**
 * https://github.com/aws/jsii/pull/4030
 * TODO: Remove this awful hack once the JSII PR has been merged!
 */
const main = () => {
  const fileToPatch = require.resolve("jsii-pacmak/lib/packaging");

  let contents = fs.readFileSync(fileToPatch, "utf-8");
  contents = contents.replace(
    "await fs.copy(this.moduleDirectory, tmpdir);",
    "await fs.copy(this.moduleDirectory, tmpdir, { dereference: true });"
  );
  fs.writeFileSync(fileToPatch, contents);
};

main();
