/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import os from "os";
import * as path from "path";
import { exec } from "projen/lib/util";
import { GeneratedJavaHandlersProject } from "../../../src/project/codegen/handlers/generated-java-handlers-project";
import { GeneratedJavaRuntimeProject } from "../../../src/project/codegen/runtime/generated-java-runtime-project";
import { withTmpDirSnapshot } from "../../project/snapshot-utils";

describe("Java Handlers Code Generation Script Unit Tests", () => {
  it.each(["handlers.yaml"])("Generates With %s", (spec) => {
    const specPath = path.resolve(__dirname, `../../resources/specs/${spec}`);

    const snapshot = withTmpDirSnapshot(
      os.tmpdir(),
      (outdir) => {
        exec(`cp ${specPath} ${outdir}/spec.yaml`, {
          cwd: path.resolve(__dirname),
        });
        const runtimeOutdir = path.join(outdir, "runtime");
        const runtime = new GeneratedJavaRuntimeProject({
          name: "test-runtime",
          artifactId: "com.aws.pdk.test.runtime",
          groupId: "test",
          version: "1.0.0",
          outdir: runtimeOutdir,
          specPath: "../spec.yaml",
        });
        const handlersOutdir = path.join(outdir, "handlers");
        const project = new GeneratedJavaHandlersProject({
          name: "test-handlers",
          artifactId: "com.aws.pdk.test.handlers",
          groupId: "test",
          version: "1.0.0",
          outdir: handlersOutdir,
          specPath: "../spec.yaml",
          generatedJavaTypes: runtime,
        });
        project.synth();
        exec(
          project.tasks.tryFind("create-openapitools.json")!.steps[0].exec!,
          { cwd: handlersOutdir }
        );
        exec(
          `${path.resolve(
            __dirname,
            "../../../scripts/type-safe-api/generators/generate"
          )} ${project.buildGenerateCommandArgs()}`,
          {
            cwd: handlersOutdir,
          }
        );
      },
      {
        excludeGlobs: GeneratedJavaRuntimeProject.openApiIgnorePatterns,
        parseJson: false,
      }
    );

    expect(
      snapshot[
        "handlers/src/main/java/test/test-handlers/handlers/JavaOneHandler.java"
      ]
    ).toMatchSnapshot();
    expect(
      snapshot[
        "handlers/src/main/java/test/test-handlers/handlers/JavaTwoHandler.java"
      ]
    ).toMatchSnapshot();
    expect(
      snapshot[
        "handlers/src/test/java/test/test-handlers/handlers/JavaOneHandlerTest.java"
      ]
    ).toMatchSnapshot();
    expect(
      snapshot[
        "handlers/src/test/java/test/test-handlers/handlers/JavaTwoHandlerTest.java"
      ]
    ).toMatchSnapshot();

    // Other language handlers should be skipped
    expect(
      Object.keys(snapshot).filter((p) =>
        p.toLowerCase().includes("typescript")
      )
    ).toHaveLength(0);
    expect(
      Object.keys(snapshot).filter((p) => p.toLowerCase().includes("python"))
    ).toHaveLength(0);

    // Split file should be deleted
    expect(
      Object.keys(snapshot).filter((p) =>
        p.toLowerCase().includes("__all_handlers")
      )
    ).toHaveLength(0);
  });
});
