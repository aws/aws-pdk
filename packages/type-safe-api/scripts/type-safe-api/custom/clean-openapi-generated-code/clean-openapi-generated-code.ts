/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as fs from "fs";
import * as path from "path";
import { parse } from "ts-command-line-args";

interface Arguments {
  /**
   * Path to the generated code project's outdir
   */
  readonly codePath: string;
}

(() => {
  const args = parse<Arguments>({
    codePath: { type: String },
  });

  // OpenAPI generator writes a manifest called FILES which lists the files it generated.
  const openApiGeneratedFilesManifestPath = path.join(
    args.codePath,
    ".openapi-generator",
    "FILES"
  );

  // If the manifest exists, delete the files it lists
  if (fs.existsSync(openApiGeneratedFilesManifestPath)) {
    const previouslyGeneratedFiles = new Set(
      fs
        .readFileSync(openApiGeneratedFilesManifestPath, { encoding: "utf-8" })
        .split("\n")
        .filter((x) => x)
    );
    previouslyGeneratedFiles.forEach((previouslyGeneratedFile) => {
      const filePath = path.join(args.codePath, previouslyGeneratedFile);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  }
})();
