/*********************************************************************************************************************
 Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License").
 You may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 ******************************************************************************************************************** */

import { SampleDir } from "projen";
import {
  JsiiJavaTarget,
  JsiiProject,
  JsiiProjectOptions,
  JsiiPythonTarget,
  Stability,
} from "projen/lib/cdk";
import { Release } from "projen/lib/release";

/**
 * Configuration options for the PDK Project.
 */
export interface PDKProjectOptions extends JsiiProjectOptions {
  /**
   * Publish to pypi
   *
   * @default - package will be published with module name: aws_prototyping_sdk.<your_package_name>
   */
  readonly publishToPypiConfig?: JsiiPythonTarget;

  /**
   * Publish to maven
   *
   * @default - package will be published with package name: software.aws.awsprototypingsdk.<yourpackagename>
   */
  readonly publishToMavenConfig?: JsiiJavaTarget;
}

/**
 * Project type to be used when creating new Constructs.
 *
 * This project handles correct naming for the PDK, along with validation and auto publishing of artifacts to the various package managers.
 */
export class PDKProject extends JsiiProject {
  public readonly pdkRelease: PDKRelease;

  constructor(options: PDKProjectOptions) {
    const nameWithUnderscore = options.name.replace(/-/g, "_");
    const condensedName = options.name.replace(/-/g, "");
    const name =
      options.name === "aws-prototyping-sdk"
        ? options.name
        : `@aws-prototyping-sdk/${options.name}`;

    super({
      ...options,
      stability: options.stability || Stability.EXPERIMENTAL,
      github: false,
      sampleCode: false,
      docgen: false,
      prettier: true,
      projenDevDependency: false,
      eslint: true,
      srcdir: "src",
      testdir: "test",
      readme: {
        contents: "TODO",
      },
      name,
      packageName: name,
      outdir: `packages/${options.name}`,
      publishToPypi: options.publishToPypiConfig || {
        distName: `aws_prototyping_sdk.${nameWithUnderscore}`,
        module: `aws_prototyping_sdk.${nameWithUnderscore}`,
      },
      publishToMaven: options.publishToMavenConfig || {
        mavenEndpoint: "https://aws.oss.sonatype.org",
        mavenGroupId: "software.aws.awsprototypingsdk",
        mavenArtifactId: `${options.name}`,
        javaPackage: `software.aws.awsprototypingsdk.${condensedName}`,
      },
      gitignore: [...(options.gitignore || []), "LICENSE_THIRD_PARTY"],
    });

    if (
      options.stability &&
      !Object.values(Stability).find((f) => f === options.stability)
    ) {
      throw new Error(`stability must be one of: ${Object.values(Stability)}`);
    }

    if (this.deps.all.find((dep) => "aws-prototyping-sdk" === dep.name)) {
      throw new Error(
        "PDK Projects cannot have a dependency on the aws-prototyping-sdk!"
      );
    }

    if (
      !this.name.match(
        /^(@aws-prototyping-sdk\/[a-z-]+(?<!-)|aws-prototyping-sdk)$/
      )
    ) {
      throw new Error("name should be lowercase and include optional hyphens.");
    }

    if (!this.parent) {
      throw new Error("parent must be provided!");
    }

    if (options.sampleCode === undefined || options.sampleCode === true) {
      new SampleDir(this, this.srcdir, {
        files: {
          "index.ts": "// export * from 'my-construct';",
        },
      });

      new SampleDir(this, this.testdir, {
        files: {
          ".gitkeep": "// Delete me once tests are added",
        },
      });
    }

    this.pdkRelease = new PDKRelease(this);
  }
}

/**
 * Enforces licenses and attribution are checked and included as part of the release distributable. Sets up a release:mainline task which
 * bumps package versions using semantic versioning.
 */
class PDKRelease extends Release {
  constructor(project: PDKProject) {
    super(project, {
      versionFile: "package.json",
      task: project.buildTask,
      branch: "mainline",
      artifactsDirectory: project.artifactsDirectory,
    });

    project.addDevDeps("license-checker", "oss-attribution-generator");

    project.packageTask.reset();
    project.packageTask.exec(
      "npx license-checker --summary --production --onlyAllow 'MIT;Apache-2.0;Unlicense;BSD;BSD-2-Clause;BSD-3-Clause;ISC;'"
    );
    project.packageTask.exec(
      "npx -p oss-attribution-generator@latest generate-attribution && mv oss-attribution/attribution.txt ./LICENSE_THIRD_PARTY && rm -rf oss-attribution"
    );
    project.packageTask.spawn(project.tasks.tryFind("package-all")!);
    project.npmignore?.addPatterns("!LICENSE_THIRD_PARTY");

    const releaseTask = project.tasks.tryFind("release:mainline")!;
    releaseTask.reset();
    releaseTask.env("RELEASE", "true");
    releaseTask.exec("rm -rf dist");
    releaseTask.spawn(project.tasks.tryFind("bump")!);
    releaseTask.spawn(project.buildTask);
    releaseTask.spawn(project.tasks.tryFind("unbump")!);

    project.package.addField("publishConfig", {
      access: "public",
    });
  }
}
