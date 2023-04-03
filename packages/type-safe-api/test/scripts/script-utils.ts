/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as os from "os";
import * as path from "path";
import { exec } from "projen/lib/util";
import { withTmpDirSnapshot } from "../project/snapshot-utils";

export interface BuildCommandProps {
  readonly outputPath: string;
  readonly scriptPath: string;
}

export const execScript = (
  scriptDir: string,
  buildCommand: (props: BuildCommandProps) => string
) => {
  return withTmpDirSnapshot(os.tmpdir(), (outputPath) => {
    const scriptPath = path.resolve(__dirname, "../../scripts", scriptDir);
    exec(`TYPE_SAFE_API_DEBUG=1 ${buildCommand({ outputPath, scriptPath })}`, {
      cwd: scriptPath,
    });
  });
};
