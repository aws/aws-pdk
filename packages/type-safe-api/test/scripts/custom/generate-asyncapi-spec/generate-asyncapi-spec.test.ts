/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import os from "os";
import path from "path";
import { exec } from "projen/lib/util";
import { withTmpDirSnapshot } from "../../../project/snapshot-utils";

describe("Generate AsyncAPI Spec Unit Tests", () => {
  it.each(["single.yaml", "inline-body.yaml"])(
    "Generates AsyncAPI Spec for %s",
    (specFile) => {
      expect(
        withTmpDirSnapshot(os.tmpdir(), (tmpDir) => {
          const specPath = `../../../resources/specs/async/${specFile}`;
          const outputPath = path.join(
            path.relative(path.resolve(__dirname), tmpDir),
            ".asyncapi.json"
          );
          const command = `../../../../scripts/type-safe-api/custom/generate-asyncapi-spec/generate-asyncapi-spec --spec-path ${specPath} --output-path ${outputPath}`;
          exec(command, {
            cwd: path.resolve(__dirname),
          });
        })
      ).toMatchSnapshot();
    }
  );
});
