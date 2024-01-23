/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { MavenCompileOptions } from "projen/lib/java";
import { JavaVersion, NodeVersion, PythonVersion } from "../languages";

/**
 * Utilities for java runtime versions
 */
class JavaRuntimeVersionUtils {
  /**
   * Get the maven compile options for the given java runtime
   */
  public static getMavenCompileOptions = (
    runtimeVersion?: JavaVersion
  ): MavenCompileOptions => {
    switch (runtimeVersion) {
      case JavaVersion.JAVA_21:
        return { source: "21", target: "21" };
      case JavaVersion.JAVA_17:
        return { source: "17", target: "17" };
      case JavaVersion.JAVA_11:
        return { source: "11", target: "11" };
      case JavaVersion.JAVA_8:
      case undefined: // For backwards compatibility the default source and compile target version is Java 8, running on the Java 17 runtime
        return { source: "1.8", target: "1.8" };
      default:
        throw new Error(`Unsupported runtime version ${runtimeVersion}`);
    }
  };

  /**
   * Return the CDK lambda runtime constant for the given java version
   * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda.Runtime.html
   */
  public static getLambdaRuntime = (runtimeVersion: JavaVersion): string => {
    switch (runtimeVersion) {
      case JavaVersion.JAVA_8:
        return "JAVA_8_CORRETTO";
      case JavaVersion.JAVA_11:
        return "JAVA_11";
      case JavaVersion.JAVA_17:
        return "JAVA_17";
      case JavaVersion.JAVA_21:
        return "JAVA_21";
      default:
        throw new Error(`Unsupported java runtime ${runtimeVersion}`);
    }
  };
}

/**
 * Utilities for node runtime versions
 */
class NodeRuntimeVersionUtils {
  /**
   * Return the CDK lambda runtime constant for the given node version
   * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda.Runtime.html
   */
  public static getLambdaRuntime = (runtimeVersion: NodeVersion): string => {
    switch (runtimeVersion) {
      case NodeVersion.NODE_18:
        return "NODEJS_18_X";
      case NodeVersion.NODE_20:
        return "NODEJS_20_X";
      default:
        throw new Error(`Unsupported node runtime ${runtimeVersion}`);
    }
  };

  /**
   * Return the target node version for esbuild
   * @see https://esbuild.github.io/api/#target
   */
  public static getEsbuildNodeTarget = (
    runtimeVersion: NodeVersion
  ): string => {
    switch (runtimeVersion) {
      case NodeVersion.NODE_20:
        return "node20";
      case NodeVersion.NODE_18:
        return "node18";
      default:
        throw new Error(`Unsupported node runtime ${runtimeVersion}`);
    }
  };
}

/**
 * Utilities for python runtime versions
 */
class PythonRuntimeVersionUtils {
  /**
   * Return the CDK lambda runtime constant for the given python version
   * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda.Runtime.html
   */
  public static getLambdaRuntime = (runtimeVersion: PythonVersion): string => {
    switch (runtimeVersion) {
      case PythonVersion.PYTHON_3_11:
        return "PYTHON_3_11";
      case PythonVersion.PYTHON_3_12:
        return "PYTHON_3_12";
      default:
        throw new Error(`Unsupported python runtime ${runtimeVersion}`);
    }
  };

  /**
   * Return the version string used for a dependency on python
   */
  public static getPythonDependencyVersion = (
    runtimeVersion: PythonVersion
  ): string => {
    return `python@^${PythonRuntimeVersionUtils.getPythonVersionString(
      runtimeVersion
    )}`;
  };

  /**
   * Return the version string used for packaging python lambdas with pip
   */
  public static getPipPackagingPythonVersion = (
    runtimeVersion: PythonVersion
  ): string => {
    return PythonRuntimeVersionUtils.getPythonVersionString(runtimeVersion);
  };

  /**
   * Return the version string for python
   */
  private static getPythonVersionString = (
    runtimeVersion: PythonVersion
  ): string => {
    switch (runtimeVersion) {
      case PythonVersion.PYTHON_3_12:
        return "3.12";
      case PythonVersion.PYTHON_3_11:
        return "3.11";
      default:
        throw new Error(`Unsupported python runtime ${runtimeVersion}`);
    }
  };
}

/**
 * A collection of utilities for runtime versions.
 */
export class RuntimeVersionUtils {
  /**
   * Java utilities
   */
  public static JAVA = JavaRuntimeVersionUtils;
  /**
   * Node utilities
   */
  public static NODE = NodeRuntimeVersionUtils;
  /**
   * Python utilities
   */
  public static PYTHON = PythonRuntimeVersionUtils;
}
