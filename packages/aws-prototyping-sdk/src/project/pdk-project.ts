// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { SampleDir } from "projen";
import { JsiiProject, JsiiProjectOptions } from "projen/lib/cdk";

export interface PDKProjectOptions extends JsiiProjectOptions {}

export class PDKProject extends JsiiProject {
  constructor(options: PDKProjectOptions) {
    const nameWithUnderscore = options.name.replace("-", "_");
    const condensedName = options.name.replace("-", "");

    super({
      ...options,
      github: false,
      sampleCode: false,
      docgen: false,
      prettier: true,
      projenDevDependency: false,
      srcdir: "src",
      testdir: "test",
      readme: {
        contents: "TODO",
      },
      packageName: `@aws/pdk-${options.name}`,
      outdir: `packages/@aws/pdk-${options.name}`,
      publishToPypi: {
        distName: `aws_prototyping_sdk.${nameWithUnderscore}`,
        module: `aws_prototyping_sdk.${nameWithUnderscore}`,
      },
      publishToMaven: {
        mavenEndpoint: "https://aws.oss.sonatype.org",
        mavenGroupId: "software.aws.awsprototypingsdk",
        mavenArtifactId: `aws-pdk-${options.name}`,
        javaPackage: `software.aws.awsprototypingsdk.${condensedName}`,
      },
    });

    if (this.deps.all.find((dep) => "aws-prototyping-sdk" === dep.name)) {
      throw new Error(
        "PDK Projects cannot have a dependency on the aws-prototyping-sdk!"
      );
    }

    if (!this.name.match(/^[a-z-]+(?<!-)$/)) {
      throw new Error("name should be lowercase and include optional hyphens");
    }

    if (!this.parent) {
      throw new Error("parent must be provided!");
    }

    new SampleDir(this, this.srcdir, {
      files: {
        "index.ts":
          'export * as construct from "./construct";\nexport * as project from "./project";',
        "construct/index.ts": 'export default "IMPLEMENT ME";',
        "project/index.ts": 'export default "IMPLEMENT ME";',
      },
    });

    new SampleDir(this, this.testdir, {
      files: {
        "construct/.gitkeep": "",
        "project/.gitkeep": "",
      },
    });
  }
}
