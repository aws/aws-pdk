/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project } from "projen";
import { Stability } from "projen/lib/cdk";
import { mergeTsconfigOptions } from "projen/lib/typescript";
import { PDKProject, PDKProjectOptions, PDK_NAMESPACE } from "./pdk-project";

/**
 * Options for {@link CdkGraphPluginProject} projects.
 */
export interface CdkGraphPluginProjectOptions
  extends Partial<Omit<PDKProjectOptions, "name">> {
  readonly parent: Project;
  /**
   * Name of the plugin - which will be prefixed with `cdk-graph-plugin-`.
   * @example `pluginName: 'diagram' => 'cdk-graph-plugin-diagram'`
   */
  readonly pluginName: string;
}

/**
 * Base project for CdkGraph plugin projects
 */
export abstract class CdkGraphPluginProject extends PDKProject {
  constructor(options: CdkGraphPluginProjectOptions) {
    const { pluginName, ...props } = options;
    super({
      // defaults
      author: "AWS APJ COPE",
      authorAddress: "apj-cope@amazon.com",
      defaultReleaseBranch: "mainline",
      repositoryUrl: "https://github.com/aws/aws-pdk",
      stability: Stability.STABLE,
      // explicit/overrides
      ...props,
      // merged/managed
      keywords: [
        "aws",
        "pdk",
        "jsii",
        "projen",
        "cdk",
        "graph",
        "cdk-graph",
        "cdk-graph-plugin",
        ...(options.keywords || []),
      ],
      devDeps: [
        "projen",
        "aws-cdk-lib",
        "constructs",
        "fs-extra",
        `${PDK_NAMESPACE}aws-arch@^0.x`,
        `${PDK_NAMESPACE}cdk-graph@^0.x`,
        ...(options.devDeps || []),
      ],
      peerDeps: [
        "projen",
        "aws-cdk-lib",
        "constructs",
        `${PDK_NAMESPACE}aws-arch@^0.x`,
        `${PDK_NAMESPACE}cdk-graph@^0.x`,
        ...(options.peerDeps || []),
      ],
      tsconfigDev: mergeTsconfigOptions(
        {
          compilerOptions: {
            noEmit: true,
            noUnusedLocals: false,
            noImplicitAny: false,
            noImplicitReturns: false,
            noImplicitThis: false,
            noUnusedParameters: false,
          },
        },
        options.tsconfigDev
      ),
      // enforce plugin names to follow prefix pattern
      name: `cdk-graph-plugin-${pluginName}`,
    });

    this.addPackageIgnore("**/node_modules");
  }
}
