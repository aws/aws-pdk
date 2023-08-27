/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { PrimitiveType } from "@jsii/spec";
import { ProjenStruct, Struct } from "@mrgrain/jsii-struct-builder";
import { Project } from "projen";
import { Stability } from "projen/lib/cdk";
import { PDKProject, PDK_NAMESPACE } from "../abstract/pdk-project";

/**
 * Contains configuration for the CloudscapeReactTsWebsiteProject.
 */
export class CloudscapeReactTsWebsiteProject extends PDKProject {
  constructor(parent: Project) {
    super({
      parent,
      author: "AWS APJ COPE",
      authorAddress: "apj-cope@amazon.com",
      defaultReleaseBranch: "mainline",
      name: "cloudscape-react-ts-website",
      keywords: ["aws", "pdk", "jsii", "projen"],
      repositoryUrl: "https://github.com/aws/aws-pdk",
      devDeps: ["projen", "@types/mustache", `${PDK_NAMESPACE}monorepo@^0.x`],
      deps: [`${PDK_NAMESPACE}type-safe-api@^0.x`],
      peerDeps: ["projen", `${PDK_NAMESPACE}type-safe-api@^0.x`],
      bundledDeps: ["mustache"],
      stability: Stability.STABLE,
    });

    this.generateInterfaces();
  }

  private generateInterfaces() {
    new ProjenStruct(this, {
      name: "ReactTypeScriptProjectOptions",
      filePath: `${this.srcdir}/react-ts-project-options.ts`,
      outputFileOptions: {
        readonly: false, // Needed as EsLint will complain otherwise
      },
    })
      .mixin(Struct.fromFqn("projen.web.ReactTypeScriptProjectOptions"))
      .allOptional()
      .add({
        name: "name",
        type: { primitive: PrimitiveType.String },
        optional: false,
      })
      .omit("sampleCode");

    this.eslint?.addIgnorePattern(`${this.srcdir}/react-ts-project-options.ts`);
  }
}
