/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project } from "projen";
import { Stability } from "projen/lib/cdk";
import { PDKProject } from "../pdk-project";

/**
 * Contains configuration for the OpenApiGateway project.
 */
export class TypeSafeApiProject extends PDKProject {
  constructor(parent: Project) {
    super({
      parent,
      author: "AWS APJ COPE",
      authorAddress: "apj-cope@amazon.com",
      defaultReleaseBranch: "mainline",
      name: "type-safe-api",
      keywords: [
        "aws",
        "pdk",
        "projen",
        "openapi",
        "smithy",
        "api",
        "type-safe",
      ],
      repositoryUrl: "https://github.com/aws/aws-prototyping-sdk",
      devDeps: [
        "@types/fs-extra",
        "@types/lodash",
        "aws-cdk-lib",
        "cdk-nag",
        "constructs",
        "projen",
        "@aws-sdk/client-s3",
        "@aws-prototyping-sdk/nx-monorepo@^0.x",
      ],
      deps: [
        "@aws-prototyping-sdk/pdk-nag@^0.x",
        "@aws-prototyping-sdk/nx-monorepo@^0.x",
        "fs-extra",
      ],
      bundledDeps: [
        "fs-extra",
        "lodash",
        "log4js",
        "openapi-types",
        "read-pkg-up",
      ],
      peerDeps: ["aws-cdk-lib", "cdk-nag", "constructs", "projen"],
      stability: Stability.EXPERIMENTAL,
      eslintOptions: {
        dirs: ["src", "scripts"],
      },
      jestOptions: {
        jestConfig: {
          globalSetup: "<rootDir>/jest.setup.ts",
        },
      },
      publishConfig: {
        executableFiles: [
          "scripts/common/common.sh",
          "scripts/custom/docs/html-redoc",
          "scripts/generators/generate",
          "scripts/parser/parse-openapi-spec",
          "scripts/custom/clean-openapi-generated-code/clean-openapi-generated-code",
          "scripts/custom/mock-data/generate-mock-data",
          "scripts/custom/gradle-wrapper/copy-gradle-wrapper",
          "scripts/custom/gradle-wrapper/gradlew",
          "samples/custom/gradle-wrapper/gradlew.bat",
        ],
      },
      bin: {
        "parse-openapi-spec": "scripts/parser/parse-openapi-spec",
        generate: "scripts/generators/generate",
        "generate-mock-data": "scripts/custom/mock-data/generate-mock-data",
        "generate-html-redoc-docs": "scripts/custom/docs/html-redoc",
        "clean-openapi-generated-code":
          "scripts/custom/clean-openapi-generated-code/clean-openapi-generated-code",
        "copy-gradle-wrapper":
          "scripts/custom/gradle-wrapper/copy-gradle-wrapper",
      },
    });

    this.gitignore.exclude("tmp\\.*");
    this.eslint?.addRules({ "import/no-unresolved": ["off"] });
    this.tsconfigEslint!.addInclude("scripts");
  }
}
