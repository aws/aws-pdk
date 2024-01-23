/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { JavaVersion, NodeVersion, PythonVersion } from "../../../src";
import { RuntimeVersionUtils } from "../../../src/project/codegen/runtime-version-utils";

describe("RuntimeVersionUtils", () => {
  describe("Node", () => {
    it.each(Object.values(NodeVersion))(
      "maps the esbuild target for %s",
      (version) => {
        expect(
          RuntimeVersionUtils.NODE.getEsbuildNodeTarget(version)
        ).toMatchSnapshot();
      }
    );

    it.each(Object.values(NodeVersion))(
      "maps the lambda runtime version for %s",
      (version) => {
        expect(
          RuntimeVersionUtils.NODE.getLambdaRuntime(version)
        ).toMatchSnapshot();
      }
    );
  });

  describe("Java", () => {
    it.each(Object.values(JavaVersion))(
      "maps maven compile options for %s",
      (version) => {
        expect(
          RuntimeVersionUtils.JAVA.getMavenCompileOptions(version)
        ).toMatchSnapshot();
      }
    );

    it.each(Object.values(JavaVersion))(
      "maps the lambda runtime version for %s",
      (version) => {
        expect(
          RuntimeVersionUtils.JAVA.getLambdaRuntime(version)
        ).toMatchSnapshot();
      }
    );
  });

  describe("Python", () => {
    it.each(Object.values(PythonVersion))(
      "maps the pip packaging python version for %s",
      (version) => {
        expect(
          RuntimeVersionUtils.PYTHON.getPipPackagingPythonVersion(version)
        ).toMatchSnapshot();
      }
    );

    it.each(Object.values(PythonVersion))(
      "maps the python dependency version for %s",
      (version) => {
        expect(
          RuntimeVersionUtils.PYTHON.getPythonDependencyVersion(version)
        ).toMatchSnapshot();
      }
    );

    it.each(Object.values(PythonVersion))(
      "maps the lambda runtime version for %s",
      (version) => {
        expect(
          RuntimeVersionUtils.PYTHON.getLambdaRuntime(version)
        ).toMatchSnapshot();
      }
    );
  });
});
