/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
import { TypescriptReactQueryV5HooksLibrary } from "../../../../src/project/codegen/library/typescript-react-query-v5-hooks-library";
import { synthProject } from "../../snapshot-utils";

describe("Generated Typescript React Query v5 Project Unit Tests", () => {
  it("Synth", () => {
    const project = new TypescriptReactQueryV5HooksLibrary({
      outdir: path.resolve(__dirname, "ts-infra"),
      name: "test-ts-infra",
      defaultReleaseBranch: "main",
      specPath: "my-spec.json",
    });

    expect(synthProject(project)).toMatchSnapshot();
  });
});
