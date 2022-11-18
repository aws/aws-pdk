/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

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
