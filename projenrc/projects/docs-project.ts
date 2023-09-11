/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project } from "projen";
import { NodePackageManager } from "projen/lib/javascript";
import { TypeScriptProject } from "projen/lib/typescript";
import { NodePackageUtils, NxProject } from "../../packages/monorepo/src";
import { PDK_NAMESPACE } from "../abstract/pdk-project";

/**
 * Contains configuration for the public (docs) package.
 */
export class DocsProject extends TypeScriptProject {
  constructor(parent: Project) {
    super({
      parent,
      packageManager: NodePackageManager.PNPM,
      projenCommand: NodePackageUtils.command.projen(NodePackageManager.PNPM),
      outdir: "docs", // nx has issues with root directories being called 'docs'
      defaultReleaseBranch: "mainline",
      sampleCode: false,
      jest: false,
      name: "docs",
      depsUpgrade: false,
      deps: ["fs-extra"],
    });

    this.package.addField("private", true);

    this.compileTask.reset();
    this.testTask.reset();
    this.packageTask.reset("./scripts/build-docs");

    parent.subprojects
      .filter((p) => p.name.startsWith(PDK_NAMESPACE) && p.name !== "@aws/pdk")
      .forEach((p) => NxProject.ensure(this).addImplicitDependency(p));
  }
}
