/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
import { execScript } from "../../script-utils";

describe("Generate Mock Data Unit Tests", () => {
  it("Generates Mock Data", () => {
    const specPath = path.resolve(
      __dirname,
      "../../../resources/specs/single.yaml"
    );
    expect(
      execScript(
        "custom/mock-data",
        ({ outputPath, scriptPath }) =>
          `./generate-mock-data --spec-path ${path.relative(
            scriptPath,
            specPath
          )} --output-path ${path.relative(scriptPath, outputPath)}`
      )
    ).toMatchSnapshot();
  });
});
