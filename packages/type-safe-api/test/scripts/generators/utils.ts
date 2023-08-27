/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { GeneratedHandlersProjects } from "../../../src/project/codegen/generate";
import { GeneratedJavaHandlersProject } from "../../../src/project/codegen/handlers/generated-java-handlers-project";
import { GeneratedPythonHandlersProject } from "../../../src/project/codegen/handlers/generated-python-handlers-project";
import { GeneratedTypescriptHandlersProject } from "../../../src/project/codegen/handlers/generated-typescript-handlers-project";
import { GeneratedJavaRuntimeProject } from "../../../src/project/codegen/runtime/generated-java-runtime-project";
import { GeneratedPythonRuntimeProject } from "../../../src/project/codegen/runtime/generated-python-runtime-project";
import { GeneratedTypescriptRuntimeProject } from "../../../src/project/codegen/runtime/generated-typescript-runtime-project";

export const getTestTypeScriptRuntimeProject = (baseOutdir: string) => {
  return new GeneratedTypescriptRuntimeProject({
    name: "test-typescript-runtime",
    defaultReleaseBranch: "main",
    outdir: path.join(baseOutdir, "typescript-runtime"),
    specPath: "../spec.yaml",
  });
};

export const getTestPythonRuntimeProject = (baseOutdir: string) => {
  return new GeneratedPythonRuntimeProject({
    name: "test-python-runtime",
    moduleName: "test_python_runtime",
    authorEmail: "me@example.com",
    authorName: "test",
    version: "1.0.0",
    outdir: path.join(baseOutdir, "python-runtime"),
    specPath: "../spec.yaml",
  });
};

export const getTestJavaRuntimeProject = (baseOutdir: string) => {
  return new GeneratedJavaRuntimeProject({
    name: "test-java-runtime",
    artifactId: "com.aws.pdk.test.runtime",
    groupId: "test",
    version: "1.0.0",
    outdir: path.join(baseOutdir, "java-runtime"),
    specPath: "../spec.yaml",
  });
};

export const getTestHandlerProjects = (
  baseOutdir: string
): {
  runtimes: {
    java: GeneratedJavaRuntimeProject;
    python: GeneratedPythonRuntimeProject;
    typescript: GeneratedTypescriptRuntimeProject;
  };
  handlers: GeneratedHandlersProjects;
} => {
  const runtimes = {
    typescript: getTestTypeScriptRuntimeProject(baseOutdir),
    java: getTestJavaRuntimeProject(baseOutdir),
    python: getTestPythonRuntimeProject(baseOutdir),
  };

  const java = new GeneratedJavaHandlersProject({
    name: "test-java-handlers",
    artifactId: "com.aws.pdk.test.handlers",
    groupId: "test",
    version: "1.0.0",
    outdir: path.join(baseOutdir, "java-handlers"),
    specPath: "../spec.yaml",
    generatedJavaTypes: runtimes.java,
  });

  const python = new GeneratedPythonHandlersProject({
    name: "test-python-handlers",
    moduleName: "test_python_handlers",
    authorEmail: "me@example.com",
    authorName: "test",
    version: "1.0.0",
    outdir: path.join(baseOutdir, "python-handlers"),
    specPath: "../spec.yaml",
    generatedPythonTypes: runtimes.python,
  });

  const typescript = new GeneratedTypescriptHandlersProject({
    name: "test-typescript-handlers",
    defaultReleaseBranch: "main",
    outdir: path.join(baseOutdir, "typescript-handlers"),
    specPath: "../spec.yaml",
    generatedTypescriptTypes: runtimes.typescript,
  });

  return {
    handlers: {
      java,
      python,
      typescript,
    },
    runtimes,
  };
};
