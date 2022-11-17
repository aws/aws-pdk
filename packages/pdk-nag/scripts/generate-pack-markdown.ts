/*********************************************************************************************************************
 Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License").
 You may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 ******************************************************************************************************************** */
import { NagMessageLevel } from "cdk-nag";
import * as fs from "fs-extra";
import * as Mustache from "mustache";
import { PackName, RuleMetadata } from "../src/packs/aws-prototyping-rules";

const renderedMarkdown = Mustache.render(
  fs.readFileSync(`${__dirname}/readme-template.mustache`).toString(),
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

fs.writeFileSync(`${__dirname}/../src/packs/README.md`, renderedMarkdown);
