/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { NagMessageLevel } from "cdk-nag";
import * as fs from "fs-extra";
import * as Mustache from "mustache";
import { PackName, RuleMetadata } from "../../src/packs/aws-prototyping-rules";

RuleMetadata.forEach((x) => {
  x.info = x.info.replace("\n\n", "<br /><br />");
  x.explanation = x.explanation.replace("\n\n", "<br /><br />");
});

const renderedMarkdown = Mustache.render(
  fs
    .readFileSync(
      `${__dirname}/templates/markdown/awsprototypingrules-readme.mustache`
    )
    .toString(),
  {
    packName: PackName,
    sections: [
      {
        sectionTitle: "Errors",
        rules: RuleMetadata.filter((r) => r.level === NagMessageLevel.ERROR),
      },
      {
        sectionTitle: "Warnings",
        rules: RuleMetadata.filter((r) => r.level === NagMessageLevel.WARN),
      },
    ],
  }
);

fs.writeFileSync(`${__dirname}/../../src/packs/README.md`, renderedMarkdown);
