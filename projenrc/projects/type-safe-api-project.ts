/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { ProjenStruct, Struct } from "@mrgrain/jsii-struct-builder";
import { Project } from "projen";
import { Stability } from "projen/lib/cdk";
import { PDKProject, PDK_NAMESPACE } from "../abstract/pdk-project";

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
      repositoryUrl: "https://github.com/aws/aws-pdk",
      devDeps: [
        "@types/fs-extra",
        "@types/lodash",
        "aws-cdk-lib",
        "cdk-nag",
        "constructs",
        "projen",
        "@aws-sdk/client-s3",
        `${PDK_NAMESPACE}monorepo@^0.x`,
      ],
      deps: [
        `${PDK_NAMESPACE}pdk-nag@^0.x`,
        `${PDK_NAMESPACE}monorepo@^0.x`,
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
        dirs: ["src"],
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
        "type-safe-api.parse-openapi-spec": "scripts/parser/parse-openapi-spec",
        "type-safe-api.generate": "scripts/generators/generate",
        "type-safe-api.generate-mock-data":
          "scripts/custom/mock-data/generate-mock-data",
        "type-safe-api.generate-html-redoc-docs":
          "scripts/custom/docs/html-redoc",
        "type-safe-api.clean-openapi-generated-code":
          "scripts/custom/clean-openapi-generated-code/clean-openapi-generated-code",
        "type-safe-api.copy-gradle-wrapper":
          "scripts/custom/gradle-wrapper/copy-gradle-wrapper",
      },
    });

    this.gitignore.exclude("tmp\\.*");
    this.eslint?.addRules({ "import/no-unresolved": ["off"] });
    this.tsconfigEslint!.addInclude("scripts");

    this.generateInterfaces();
  }

  private generateInterfaces() {
    new ProjenStruct(this, {
      name: "TypeScriptProjectOptions",
      filePath: `${this.srcdir}/project/typescript-project-options.ts`,
      outputFileOptions: {
        readonly: false, // Needed as EsLint will complain otherwise
      },
    })
      .mixin(Struct.fromFqn("projen.typescript.TypeScriptProjectOptions"))
      .allOptional();

    new ProjenStruct(this, {
      name: "JavaProjectOptions",
      filePath: `${this.srcdir}/project/java-project-options.ts`,
      outputFileOptions: {
        readonly: false, // Needed as EsLint will complain otherwise
      },
    })
      .mixin(Struct.fromFqn("projen.java.JavaProjectOptions"))
      .allOptional();

    new ProjenStruct(this, {
      name: "PythonProjectOptions",
      filePath: `${this.srcdir}/project/python-project-options.ts`,
      outputFileOptions: {
        readonly: false, // Needed as EsLint will complain otherwise
      },
    })
      .mixin(Struct.fromFqn("projen.python.PythonProjectOptions"))
      .allOptional()
      .omit(
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
      `${this.srcdir}/project/typescript-project-options.ts`
    );
    this.eslint?.addIgnorePattern(
      `${this.srcdir}/project/java-project-options.ts`
    );
    this.eslint?.addIgnorePattern(
      `${this.srcdir}/project/python-project-options.ts`
    );
  }
}
