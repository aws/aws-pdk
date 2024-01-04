/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

import { Stack } from "aws-cdk-lib";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { AwsSolutionsChecks, NagPack } from "cdk-nag";
import { AwsPrototypingChecks, PDKNag } from "../src";

const TEST_CASES: { [key: string]: NagPack[] | undefined } = {
  "multiple-aspects": [new AwsPrototypingChecks(), new AwsSolutionsChecks()],
  default: undefined,
  "single-aspect": [new AwsPrototypingChecks()],
};

describe("PDK Nag Aspect Tests", () => {
  Object.entries(TEST_CASES).forEach(([testCase, nagPacks]) => {
    test(testCase, () => {
      const app = PDKNag.app({
        nagPacks,
        failOnError: false,
        failOnWarning: false,
      });

      const stack = new Stack(app, "MyStack");
      new Bucket(stack, "Bucket");

      app.synth();

      const nagPacksSet = new Set(
        app.nagPacks?.map((pack) => pack.readPackName)
      );

      const messages = app
        .nagResults()
        .filter(
          (result) =>
            result.messages
              .map((message) => message.messageDescription)
              .filter(
                (messageDescription) =>
                  !nagPacksSet.has(messageDescription.split("-")[0])
              ).length > 0
        );

      expect(messages.length).toEqual(0);

      expect(app.extendedNagResults().length).toBeGreaterThan(0);
      expect(
        app.extendedNagResults().filter((m) => !nagPacksSet.has(m.nagPackName))
      ).toHaveLength(0);
    });
  });
});
