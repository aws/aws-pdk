/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import os from "os";
import * as path from "path";
import { exec } from "projen/lib/util";
import { OpenApiToolsJsonFile } from "../../../../src/project/codegen/components/open-api-tools-json-file";
import { GeneratedJavaAsyncRuntimeProject } from "../../../../src/project/codegen/runtime/generated-java-async-runtime-project";
import { withTmpDirSnapshot } from "../../../project/snapshot-utils";

describe("Java Async Runtime Code Generation Script Unit Tests", () => {
  it.each(["single.yaml"])("Generates With %s", (spec) => {
    const specPath = path.resolve(
      __dirname,
      `../../../resources/specs/async/${spec}`
    );

    expect(
      withTmpDirSnapshot(os.tmpdir(), (outdir) => {
        exec(`cp ${specPath} ${outdir}/spec.yaml`, {
          cwd: path.resolve(__dirname),
        });
        const project = new GeneratedJavaAsyncRuntimeProject({
          name: "test",
          artifactId: "com.aws.pdk.test",
          groupId: "test",
          version: "1.0.0",
          outdir,
          specPath: "spec.yaml",
        });
        // Synth the openapitools.json since it's used by the generate command
        OpenApiToolsJsonFile.of(project)!.synthesize();
        exec(
          project.tasks.tryFind("create-openapitools.json")!.steps[0].exec!,
          { cwd: outdir }
        );
        exec(
          `${path.resolve(
            __dirname,
            "../../../../scripts/type-safe-api/generators/generate"
          )} ${project.buildGenerateCommandArgs()}`,
          {
            cwd: outdir,
          }
        );
        return {
          excludeGlobs: [
            ...(project as any).openapiGeneratorIgnore._patterns,
            "spec.yaml",
          ],
          parseJson: false,
        };
      })
    ).toMatchSnapshot();
  });
});
