/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { PrimitiveType } from "@jsii/spec";
import { ProjenStruct, Struct } from "@mrgrain/jsii-struct-builder";
import { Project } from "projen";
import { Stability } from "projen/lib/cdk";
import { PDKProject } from "../abstract/pdk-project";

/**
 * Contains configuration for the Monorepo Projects.
 */
export class MonorepoProject extends PDKProject {
  constructor(parent: Project) {
    super({
      parent,
      author: "AWS APJ COPE",
      authorAddress: "apj-cope@amazon.com",
      defaultReleaseBranch: "mainline",
      name: "monorepo",
      keywords: ["aws", "pdk", "jsii", "projen"],
      repositoryUrl: "https://github.com/aws/aws-pdk",
      devDeps: [
        "projen",
        "nx",
        "@types/fs-extra",
        "@types/semver",
        "@nx/devkit",
      ],
      peerDeps: ["projen", "constructs"],
      bundledDeps: [
        "fs-extra",
        "semver",
        "@pnpm/reviewing.dependencies-hierarchy",
        "read-pkg-up",
      ],
      stability: Stability.STABLE,
    });

    this.compileTask.exec(
      'rsync -a ./src/** ./lib --include="*/" --include="**/*.js" --exclude="*" --prune-empty-dirs'
    );

    this.package.addBin({
      "monorepo.nx-dir-hasher": "./scripts/monorepo/nx-dir-hasher.js",
    });

    this.package.addBin({
      "monorepo.pnpm-link-bundled-transitive-deps":
        "./scripts/monorepo/pnpm/link-bundled-transitive-deps.js",
    });

    // Don't check for a license header etc for projen-version.ts so this can be written via automation
    this.eslint?.addIgnorePattern("src/components/projen-version.ts");

    // Add a task to upgrade the projen version. Ideally run before upgrade-deps in the root.
    this.addTask("upgrade-projen").exec("ts-node ./scripts/upgrade-projen.ts");

    this.generateInterfaces();
  }

  private generateInterfaces() {
    new ProjenStruct(this, {
      name: "TypeScriptProjectOptions",
      filePath: `${this.srcdir}/projects/typescript/typescript-project-options.ts`,
      outputFileOptions: {
        readonly: false, // Needed as EsLint will complain otherwise
      },
    })
      .mixin(Struct.fromFqn("projen.typescript.TypeScriptProjectOptions"))
      .allOptional()
      .add({
        name: "name",
        type: { primitive: PrimitiveType.String },
        optional: false,
        docs: {
          default: "$BASEDIR",
        },
      })
      .update("deps", {
        docs: {
          custom: {
            featured: "false",
          },
        },
      })
      .update("description", {
        docs: {
          custom: {
            featured: "false",
          },
        },
      })
      .update("packageName", {
        docs: {
          custom: {
            featured: "false",
          },
        },
      });

    new ProjenStruct(this, {
      name: "JavaProjectOptions",
      filePath: `${this.srcdir}/projects/java/java-project-options.ts`,
      outputFileOptions: {
        readonly: false, // Needed as EsLint will complain otherwise
      },
    })
      .mixin(Struct.fromFqn("projen.java.JavaProjectOptions"))
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
      name: "PythonProjectOptions",
      filePath: `${this.srcdir}/projects/python/python-project-options.ts`,
      outputFileOptions: {
        readonly: false, // Needed as EsLint will complain otherwise
      },
    })
      .mixin(Struct.fromFqn("projen.python.PythonProjectOptions"))
      .allOptional()
      .add({
        name: "name",
        type: { primitive: PrimitiveType.String },
        optional: false,
        docs: {
          default: "$BASEDIR",
        },
      })
      .add({
        name: "moduleName",
        type: { primitive: PrimitiveType.String },
        optional: false,
        docs: {
          default: "$PYTHON_MODULE_NAME",
        },
      })
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
      `${this.srcdir}/projects/typescript/typescript-project-options.ts`
    );
    this.eslint?.addIgnorePattern(
      `${this.srcdir}/projects/java/java-project-options.ts`
    );
    this.eslint?.addIgnorePattern(
      `${this.srcdir}/projects/python/python-project-options.ts`
    );
  }
}
