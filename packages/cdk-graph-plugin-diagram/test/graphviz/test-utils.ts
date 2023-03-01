/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { AwsArchitecture } from "@aws-prototyping-sdk/aws-arch";
import * as fs from "fs-extra";
import { toMatchImageSnapshot } from "jest-image-snapshot";
import { kebabCase } from "lodash";
import sharp = require("sharp"); // eslint-disable-line @typescript-eslint/no-require-imports

expect.extend({ toMatchImageSnapshot });

export async function makeCdkOutDir(...name: string[]): Promise<string> {
  const dir = path.join(__dirname, "..", ".tmp", ...name, "cdk.out");

  await fs.ensureDir(dir);
  await fs.emptyDir(dir);

  return dir;
}

export function cleanseDotSnapshot(dot: string): string {
  return dot.replace(
    AwsArchitecture.assetDirectory,
    "<aws_arch_asset_directory"
  );
}

export async function expectToMatchImageSnapshot(
  imagePath: string,
  name?: string,
  pixelThreshold?: number,
  failureThreshold?: number
): Promise<void> {
  const image = await sharp(imagePath)
    .resize({
      width: 5120,
      withoutEnlargement: true,
    })
    .toBuffer();
  // https://github.com/americanexpress/jest-image-snapshot#%EF%B8%8F-api
  expect(image).toMatchImageSnapshot({
    customSnapshotIdentifier({ currentTestName, counter, testPath }) {
      const dir = testPath.replace(__dirname, "").split(".")[0];
      if (name) {
        return path.join(dir, name);
      }
      return path.join(
        dir,
        kebabCase(currentTestName).replace(RegExp(`^${dir}`), "") +
          (counter <= 1 ? "" : `-${counter}`)
      );
    },
    customDiffConfig: {
      // Prevent rendering variants between environments (CI, MacOS, Ubuntu, etc)
      threshold: pixelThreshold || 0.05, // default is 0.01
    },
    // Allow a 1% difference in image for testing
    failureThreshold: failureThreshold || 0.01,
    failureThresholdType: "percent",
  });
}
