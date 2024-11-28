/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { ProjenStruct, Struct } from "@mrgrain/jsii-struct-builder";
import { Project } from "projen";
import { Stability } from "projen/lib/cdk";
import { JavaProject } from "projen/lib/java";
import { SmithyAsyncTransformerProject } from "./internal/smithy-async-transformer";
import { NxProject } from "../../packages/monorepo/src/components/nx-project";
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
        "@aws-sdk/client-apigatewayv2",
        `${PDK_NAMESPACE}monorepo@^0.x`,
        "@apidevtools/swagger-parser@10.1.0", // Used by scripts
        "ts-command-line-args@2.4.2", // Used by scripts
        "@faker-js/faker@8.1.0", // Used by scripts
        "reregexp@1.6.1", // Used by scripts
        "ejs@3.1.10", // Used by scripts
        "@types/ejs@3.1.5", // Used by scripts
        "parse-openapi@0.0.1", // Used by scripts
        "minimatch@10.0.1", // Used by scripts
        "esbuild",
      ],
      deps: [
        `${PDK_NAMESPACE}pdk-nag@^0.x`,
        `${PDK_NAMESPACE}monorepo@^0.x`,
        "fs-extra",
      ],
      bundledDeps: ["fs-extra", "lodash", "log4js", "openapi-types"],
      peerDeps: ["aws-cdk-lib", "cdk-nag", "constructs", "projen"],
      stability: Stability.STABLE,
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
          "scripts/type-safe-api/run.js",
          "scripts/type-safe-api/custom/gradle-wrapper/gradlew",
          "scripts/type-safe-api/custom/gradle-wrapper/gradlew.bat",
        ],
      },
      bin: {
        "type-safe-api": "scripts/type-safe-api/run.js",
      },
    });

    this.gitignore.exclude("tmp\\.*");
    this.eslint?.addRules({ "import/no-unresolved": ["off"] });
    this.tsconfigEslint!.addInclude("scripts");

    // Depend on the smithy transformer project
    const smithyAsyncTransformer = parent.subprojects.find(
      (p) => p.name === SmithyAsyncTransformerProject.NAME
    )! as JavaProject;
    NxProject.of(this)?.addImplicitDependency(smithyAsyncTransformer);

    // Copy the transformer jar into the script dir
    const smithyAsyncTransformerJar =
      "scripts/type-safe-api/custom/smithy-async-transformer/aws-pdk-smithy-async-transformer.jar";
    this.preCompileTask.exec(
      `cp ${path.join(
        path.relative(this.outdir, smithyAsyncTransformer.outdir),
        ...[
          smithyAsyncTransformer.distdir,
          ...smithyAsyncTransformer.pom.groupId.split("."),
          smithyAsyncTransformer.pom.artifactId,
          smithyAsyncTransformer.pom.version,
          `${smithyAsyncTransformer.pom.artifactId}-${smithyAsyncTransformer.pom.version}.jar`,
        ]
      )} ${smithyAsyncTransformerJar}`
    );
    NxProject.of(this)?.addBuildTargetFiles(
      [],
      [`{projectRoot}/${smithyAsyncTransformerJar}`]
    );
    this.gitignore.addPatterns(smithyAsyncTransformerJar);

    // Build the "run" script
    const runScript = "scripts/type-safe-api/run";
    this.preCompileTask.exec(
      `esbuild --bundle ${runScript}.ts --platform=node --outfile=${runScript}.js`
    );
    this.preCompileTask.exec(`chmod +x ${runScript}.js`);
    NxProject.of(this)?.addBuildTargetFiles(
      [],
      [`{projectRoot}/${runScript}.js`]
    );
    this.gitignore.addPatterns(`${runScript}.js`);

    this.generateInterfaces();
  }

  private generateInterfaces() {
    new ProjenStruct(this, {
      name: "PartialManagedRuleGroupStatementProperty",
      filePath: `${this.srcdir}/construct/waf/generated-types.ts`,
      outputFileOptions: {
        readonly: false, // Needed as EsLint will complain otherwise
      },
    })
      .mixin(
        Struct.fromFqn(
          "aws-cdk-lib.aws_wafv2.CfnWebACL.ManagedRuleGroupStatementProperty"
        )
      )
      .withoutDeprecated()
      .allOptional()
      .update("name", { optional: false })
      .omit("vendorName");

    new ProjenStruct(this, {
      name: "WebSocketApiProps",
      filePath: `${this.srcdir}/construct/websocket/websocket-api-props.ts`,
      outputFileOptions: {
        readonly: false, // Needed as EsLint will complain otherwise
      },
    })
      .mixin(Struct.fromFqn("aws-cdk-lib.aws_apigatewayv2.WebSocketApiProps"))
      .withoutDeprecated()
      .allOptional()
      .omit(
        "routeSelectionExpression",
        "connectRouteOptions",
        "disconnectRouteOptions",
        "defaultRouteOptions"
      );

    new ProjenStruct(this, {
      name: "WebSocketStageProps",
      filePath: `${this.srcdir}/construct/websocket/websocket-stage-props.ts`,
      outputFileOptions: {
        readonly: false, // Needed as EsLint will complain otherwise
      },
    })
      .mixin(Struct.fromFqn("aws-cdk-lib.aws_apigatewayv2.WebSocketStageProps"))
      .withoutDeprecated()
      .allOptional()
      .omit("webSocketApi");

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
      `${this.srcdir}/construct/waf/generated-types.ts`
    );
    this.eslint?.addIgnorePattern(
      `${this.srcdir}/construct/websocket/websocket-api-props.ts`
    );
    this.eslint?.addIgnorePattern(
      `${this.srcdir}/construct/websocket/websocket-stage-props.ts`
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
