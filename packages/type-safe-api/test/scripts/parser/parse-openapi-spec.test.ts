/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { execScript } from "../script-utils";

describe("Parse OpenAPI Spec Script Unit Tests", () => {
  it("Bundles Spec Into Single File", () => {
    const specPath = path.resolve(
      __dirname,
      "../../resources/specs/multi.yaml"
    );
    expect(
      execScript(
        "parser",
        ({ outputPath, scriptPath }) =>
          `./parse-openapi-spec --spec-path ${path.relative(
            scriptPath,
            specPath
          )} --output-path ${path.relative(
            scriptPath,
            path.join(outputPath, ".api.json")
          )}`
      )
    ).toMatchSnapshot();
  });
});
