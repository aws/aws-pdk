/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project } from "projen";
import { Stability } from "projen/lib/cdk";
import { NodePackageManager } from "projen/lib/javascript";
import { ReactTypeScriptProject } from "projen/lib/web";
import { NodePackageUtils, NxProject } from "../../packages/nx-monorepo/src";
import { PDKProject } from "../pdk-project";

/**
 * Contains configuration for the CloudscapeReactTsWebsiteProject.
 */
export class CloudscapeReactTsWebsiteProject extends PDKProject {
  public sampleProject: Project;

  constructor(parent: Project) {
    super({
      parent,
      author: "AWS APJ COPE",
      authorAddress: "apj-cope@amazon.com",
      defaultReleaseBranch: "mainline",
      name: "cloudscape-react-ts-website",
      keywords: ["aws", "pdk", "jsii", "projen"],
      repositoryUrl: "https://github.com/aws/aws-prototyping-sdk",
      devDeps: ["projen"],
      peerDeps: ["projen"],
      stability: Stability.EXPERIMENTAL,
    });

    this.sampleProject = new CloudscapeReactTsSampleWebsiteProject(parent);

    NxProject.ensure(this.sampleProject).addImplicitDependency(this);
    NxProject.ensure(this.sampleProject).addTag("sample");

    this.addPackageIgnore("!samples");
    this.addGitIgnore("samples");
    this.preCompileTask.exec(
      'rm -rf samples && rsync -a ../../samples/cloudscape-react-ts-website/* ./samples --include="*/" --include="public/**" --include="src/**" --exclude="*" --prune-empty-dirs'
    );
  }
}

/**
 * Nested CloudscapeReactTsSampleWebsiteProject configuration.
 */
class CloudscapeReactTsSampleWebsiteProject extends ReactTypeScriptProject {
  constructor(parent: Project) {
    super({
      parent,
      packageManager: NodePackageManager.PNPM,
      projenCommand: NodePackageUtils.command.projen(NodePackageManager.PNPM),
      outdir: "samples/cloudscape-react-ts-website",
      defaultReleaseBranch: "mainline",
      depsUpgrade: false,
      name: "@aws-prototyping-sdk/cloudscape-react-ts-sample-website",
      sampleCode: false,
      deps: [
        "@aws-northstar/ui",
        "@cloudscape-design/components",
        "react-router-dom",
      ],
      gitignore: ["runtime-config.json"],
    });

    this.npmignore?.include("src", "public");
    this.package.addField("private", true);
    this.testTask.reset(
      "react-scripts test --watchAll=false --passWithNoTests"
    );
  }
}
