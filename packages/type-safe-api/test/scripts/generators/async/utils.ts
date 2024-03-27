/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { GeneratedHandlersProjects } from "../../../../src/project/codegen/generate";
import { GeneratedJavaAsyncHandlersProject } from "../../../../src/project/codegen/handlers/generated-java-async-handlers-project";
import { GeneratedPythonAsyncHandlersProject } from "../../../../src/project/codegen/handlers/generated-python-async-handlers-project";
import { GeneratedTypescriptAsyncHandlersProject } from "../../../../src/project/codegen/handlers/generated-typescript-async-handlers-project";
import { GeneratedJavaAsyncRuntimeProject } from "../../../../src/project/codegen/runtime/generated-java-async-runtime-project";
import { GeneratedPythonAsyncRuntimeProject } from "../../../../src/project/codegen/runtime/generated-python-async-runtime-project";
import { GeneratedTypescriptAsyncRuntimeProject } from "../../../../src/project/codegen/runtime/generated-typescript-async-runtime-project";

export const getTestTypeScriptRuntimeProject = (baseOutdir: string) => {
  return new GeneratedTypescriptAsyncRuntimeProject({
    name: "test-typescript-runtime",
    defaultReleaseBranch: "main",
    outdir: path.join(baseOutdir, "typescript-runtime"),
    specPath: "../spec.yaml",
  });
};

export const getTestPythonRuntimeProject = (baseOutdir: string) => {
  return new GeneratedPythonAsyncRuntimeProject({
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
  return new GeneratedJavaAsyncRuntimeProject({
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
    java: GeneratedJavaAsyncRuntimeProject;
    python: GeneratedPythonAsyncRuntimeProject;
    typescript: GeneratedTypescriptAsyncRuntimeProject;
  };
  handlers: GeneratedHandlersProjects;
} => {
  const runtimes = {
    typescript: getTestTypeScriptRuntimeProject(baseOutdir),
    java: getTestJavaRuntimeProject(baseOutdir),
    python: getTestPythonRuntimeProject(baseOutdir),
  };

  const java = new GeneratedJavaAsyncHandlersProject({
    name: "test-java-handlers",
    artifactId: "com.aws.pdk.test.handlers",
    groupId: "test",
    version: "1.0.0",
    outdir: path.join(baseOutdir, "java-handlers"),
    specPath: "../spec.yaml",
    generatedJavaTypes: runtimes.java,
  });

  const python = new GeneratedPythonAsyncHandlersProject({
    name: "test-python-handlers",
    moduleName: "test_python_handlers",
    authorEmail: "me@example.com",
    authorName: "test",
    version: "1.0.0",
    outdir: path.join(baseOutdir, "python-handlers"),
    specPath: "../spec.yaml",
    generatedPythonTypes: runtimes.python,
  });

  const typescript = new GeneratedTypescriptAsyncHandlersProject({
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
