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

import { SynthUtils } from "@aws-cdk/assert";
import { Aspects, CfnResource, Stack } from "aws-cdk-lib";
import { NagMessageLevel, IApplyRule } from "cdk-nag";
import { AwsPrototypingChecks } from "../src/packs/aws-prototyping";

const expectedWarnings = ["AwsPrototyping-S3BucketDefaultLockEnabled"];
const expectedErrors = [
  "AwsPrototyping-S3BucketLevelPublicAccessProhibited",
  "AwsPrototyping-LambdaFunctionUrlAuth",
];

describe("Check NagPack Details", () => {
  describe("AwsPrototyping-CDK", () => {
    class AwsPrototypingChecksExtended extends AwsPrototypingChecks {
      actualWarnings = new Array<string>();
      actualErrors = new Array<string>();
      applyRule(params: IApplyRule): void {
        const ruleSuffix = params.ruleSuffixOverride
          ? params.ruleSuffixOverride
          : params.rule.name;
        const ruleId = `${pack.readPackName}-${ruleSuffix}`;
        if (params.level === NagMessageLevel.WARN) {
          this.actualWarnings.push(ruleId);
        } else {
          this.actualErrors.push(ruleId);
        }
      }
    }
    const pack = new AwsPrototypingChecksExtended();
    test("Pack Name is correct", () => {
      expect(pack.readPackName).toStrictEqual("AwsPrototyping");
    });

    test("Pack contains expected warning and error rules", () => {
      jest.spyOn(pack, "applyRule");
      const stack = new Stack();
      Aspects.of(stack).add(pack);
      new CfnResource(stack, "rTestResource", { type: "foo" });
      SynthUtils.synthesize(stack).messages;
      expect(pack.actualWarnings.sort()).toEqual(expectedWarnings.sort());
      expect(pack.actualErrors.sort()).toEqual(expectedErrors.sort());
    });
  });
});
