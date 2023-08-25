/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { PrimitiveType } from "@jsii/spec";
import { ProjenStruct, Struct } from "@mrgrain/jsii-struct-builder";
import { Project } from "projen";
import { Stability } from "projen/lib/cdk";
import { PDKProject, PDK_NAMESPACE } from "../abstract/pdk-project";

/**
 * Contains configuration for the Infrastructure projects.
 */
export class InfrastructureProject extends PDKProject {
  constructor(parent: Project) {
    super({
      parent,
      author: "AWS APJ COPE",
      authorAddress: "apj-cope@amazon.com",
      defaultReleaseBranch: "mainline",
      name: "infrastructure",
      keywords: ["aws", "pdk", "jsii", "projen"],
      repositoryUrl: "https://github.com/aws/aws-pdk",
      devDeps: ["projen", "@types/mustache"],
      deps: [
        `${PDK_NAMESPACE}monorepo@^0.x`,
        `${PDK_NAMESPACE}type-safe-api@^0.x`,
        `${PDK_NAMESPACE}cloudscape-react-ts-website@^0.x`,
      ],
      peerDeps: [
        "projen",
        `${PDK_NAMESPACE}monorepo@^0.x`,
        `${PDK_NAMESPACE}type-safe-api@^0.x`,
        `${PDK_NAMESPACE}cloudscape-react-ts-website@^0.x`,
      ],
      bundledDeps: ["mustache"],
      stability: Stability.EXPERIMENTAL,
    });

    this.generateInterfaces();
  }

  private generateInterfaces() {
    new ProjenStruct(this, {
      name: "AwsCdkTypeScriptAppOptions",
      filePath: `${this.srcdir}/projects/typescript/aws-cdk-ts-app-options.ts`,
      outputFileOptions: {
        readonly: false, // Needed as EsLint will complain otherwise
      },
    })
      .mixin(Struct.fromFqn("projen.awscdk.AwsCdkTypeScriptAppOptions"))
      .allOptional()
      .add({
        name: "name",
        type: { primitive: PrimitiveType.String },
        optional: false,
        docs: {
          default: "$BASEDIR",
        },
      });

    new ProjenStruct(this, {
      name: "AwsCdkJavaAppOptions",
      filePath: `${this.srcdir}/projects/java/aws-cdk-java-app-options.ts`,
      outputFileOptions: {
        readonly: false, // Needed as EsLint will complain otherwise
      },
    })
      .mixin(Struct.fromFqn("projen.awscdk.AwsCdkJavaAppOptions"))
      .allOptional()
      .add({
        name: "name",
        type: { primitive: PrimitiveType.String },
        optional: false,
        docs: {
          default: "$BASEDIR",
        },
      })
      .omit("mainClass");

    new ProjenStruct(this, {
      name: "AwsCdkPythonAppOptions",
      filePath: `${this.srcdir}/projects/python/aws-cdk-py-app-options.ts`,
      outputFileOptions: {
        readonly: false, // Needed as EsLint will complain otherwise
      },
    })
      .mixin(Struct.fromFqn("projen.awscdk.AwsCdkPythonAppOptions"))
      .allOptional()
      .add({
        name: "name",
        type: { primitive: PrimitiveType.String },
        optional: false,
        docs: {
          default: "$BASEDIR",
        },
      })
      .omit(
        "appEntrypoint",
        "pip",
        "venv",
        "venvOptions",
        "poetry",
        "projenrcPython",
        "projenrcJs",
        "projenrcJsOptions",
        "projenrcTs",
        "projenrcTsOptions"
      );

    this.eslint?.addIgnorePattern(
      `${this.srcdir}/projects/typescript/aws-cdk-ts-app-options.ts`
    );
    this.eslint?.addIgnorePattern(
      `${this.srcdir}/projects/java/aws-cdk-java-app-options.ts`
    );
    this.eslint?.addIgnorePattern(
      `${this.srcdir}/projects/python/aws-cdk-py-app-options.ts`
    );
  }
}
