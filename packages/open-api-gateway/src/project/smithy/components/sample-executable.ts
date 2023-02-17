/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as fs from "fs";
import * as path from "path";
import { Project, SampleFile, SampleFileOptions } from "projen";
import { getFilePermissions } from "projen/lib/util";

/**
 * A sample file that is executable
 */
export class SampleExecutable extends SampleFile {
  private readonly fullFilePath: string;

  constructor(project: Project, filePath: string, options: SampleFileOptions) {
    super(project, filePath, options);
    this.fullFilePath = path.join(this.project.outdir, filePath);
  }

  /**
   * @inheritDoc
   */
  public synthesize() {
    if (fs.existsSync(this.fullFilePath)) {
      return;
    }

    super.synthesize();

    fs.chmodSync(
      this.fullFilePath,
      getFilePermissions({
        executable: true,
        readonly: false,
      })
    );
  }
}
