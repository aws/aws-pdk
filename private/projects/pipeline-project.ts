/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as fs from "fs";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import { Project } from "projen";
import { Stability } from "projen/lib/cdk";
import { JavaProject } from "projen/lib/java";
import { NodePackageManager } from "projen/lib/javascript";
import { PythonProject } from "projen/lib/python";
import { TypeScriptProject } from "projen/lib/typescript";
import { JEST_VERSION } from "./pdk-monorepo-project";
import { buildExecutableCommand } from "../../packages/nx-monorepo/src";
import { PDKProject } from "../pdk-project";

/**
 * Contains configuration for the PipelineProject.
 */
export class PipelineProject extends PDKProject {
  private _samples: Project[] = [];

  constructor(parent: Project) {
    super({
      parent,
      author: "AWS APJ COPE",
      authorAddress: "apj-cope@amazon.com",
      defaultReleaseBranch: "mainline",
      name: "pipeline",
      keywords: ["aws", "pdk", "jsii", "projen"],
      repositoryUrl: "https://github.com/aws/aws-prototyping-sdk",
      devDeps: ["projen", "aws-cdk-lib", "constructs", "cdk-nag"],
      peerDeps: ["projen", "aws-cdk-lib", "constructs", "cdk-nag"],
      deps: ["@aws-prototyping-sdk/pdk-nag@^0.x"],
      stability: Stability.STABLE,
    });

    this._samples.push(
      new PipelineTypescriptSampleProject(parent),
      new PipelinePythonSampleProject(parent),
      new PipelineJavaSampleProject(parent)
    );
  }

  public get samples(): Project[] {
    return this._samples;
  }
}

/**
 * Nested Typescript Sample Project configuration.
 */
export class PipelineTypescriptSampleProject extends TypeScriptProject {
  constructor(parent: Project) {
    super({
      parent,
      packageManager: NodePackageManager.PNPM,
      projenCommand: buildExecutableCommand(NodePackageManager.PNPM, "projen"),
      outdir: "packages/pipeline/samples/typescript",
      defaultReleaseBranch: "mainline",
      name: "pipeline-sample-ts",
      sampleCode: false,
      depsUpgrade: false,
      jestOptions: {
        jestVersion: JEST_VERSION,
      },
      deps: ["aws-cdk-lib", "constructs", "aws-prototyping-sdk@0.0.0"],
    });

    this.package.addField("private", true);
    this.eslint?.addRules({
      "import/no-extraneous-dependencies": "off",
    });
  }
}

/**
 * Nested Python Sample Project configuration.
 */
export class PipelinePythonSampleProject extends PythonProject {
  constructor(parent: Project) {
    super({
      parent,
      outdir: "packages/pipeline/samples/python",
      authorEmail: "",
      authorName: "",
      moduleName: "infra",
      sample: false,
      name: "pipeline-sample-py",
      version: "0.0.0",
      devDeps: ["pytest"],
      deps: [
        "aws-cdk-lib",
        "constructs",
        "pyhumps",
        "../../../aws-prototyping-sdk/dist/python/aws_prototyping_sdk-0.0.0-py3-none-any.whl",
      ],
    });

    const installTask =
      this.tasks.tryFind("install") ?? this.addTask("install");
    installTask.reset();
    installTask.exec("pip install --upgrade pip");
    installTask.exec(
      'cat requirements.txt | cut -f1 -d"#" | xargs -n 1 pip install || echo "\\033[33mInstalled with some errors\\033[0m"'
    );
    installTask.exec(
      'cat requirements-dev.txt | cut -f1 -d"#" | xargs -n 1 pip install || echo "\\033[33mInstalled with some errors\\033[0m"'
    );

    this.preCompileTask.spawn(installTask);
  }
}

/**
 * Nested Java Sample Project configuration.
 */
export class PipelineJavaSampleProject extends JavaProject {
  constructor(parent: Project) {
    super({
      parent,
      outdir: "packages/pipeline/samples/java",
      artifactId: "pipeline-sample-java",
      groupId: "pipeline.sample",
      name: "pipeline-sample-java",
      version: "0.0.0",
      sample: false,
      junit: false,
      deps: ["software.amazon.awscdk/aws-cdk-lib@2.15.0"],
      testDeps: [
        "org.junit.jupiter/junit-jupiter-api@5.7.0",
        "org.junit.jupiter/junit-jupiter-engine@5.7.0",
      ],
    });

    this.testTask.exec("mvn test");

    this.deps.postSynthesize = () => {
      const parser = new XMLParser({
        ignoreDeclaration: true,
      });
      let pom = parser.parse(fs.readFileSync(`${this.outdir}/pom.xml`));

      pom.project.dependencies.dependency = [
        ...pom.project.dependencies.dependency,
        {
          groupId: "software.aws.awsprototypingsdk",
          artifactId: "aws-prototyping-sdk",
          version: "0.0.0",
          scope: "system",
          systemPath:
            "${basedir}/../../../aws-prototyping-sdk/dist/java/software/aws/awsprototypingsdk/aws-prototyping-sdk/0.0.0/aws-prototyping-sdk-0.0.0.jar",
        },
      ];

      const builder = new XMLBuilder({
        format: true,
      });
      const newPom = builder.build(pom);

      fs.chmodSync(`${this.outdir}/pom.xml`, "600");
      fs.writeFileSync(`${this.outdir}/pom.xml`, newPom, { mode: "400" });
    };
  }
}
