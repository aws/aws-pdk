/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project } from "projen";
import { NodePackageManager } from "projen/lib/javascript";
import { TypeScriptProject } from "projen/lib/typescript";
import { buildExecutableCommand } from "../../packages/nx-monorepo";

/**
 * Contains configuration for the public (docs) package.
 */
export class DocsProject extends TypeScriptProject {
  constructor(parent: Project) {
    super({
      parent,
      packageManager: NodePackageManager.PNPM,
      projenCommand: buildExecutableCommand(NodePackageManager.PNPM, "projen"),
      outdir: "public/docs", // nx has issues with root directories being called 'docs'
      defaultReleaseBranch: "mainline",
      sampleCode: false,
      jest: false,
      name: "docs",
      depsUpgrade: false,
      devDeps: ["exponential-backoff", "jsii-docgen"],
      deps: ["fs-extra"],
    });

    this.package.addField("private", true);

    // TODO: HACK! Remove when https://github.com/cdklabs/jsii-docgen/pull/644 is merged
    this.preCompileTask.exec("pnpx ts-node ./scripts/perf-boost-hack.ts");

    this.compileTask.reset();
    this.testTask.reset();
    this.packageTask.reset("./scripts/build-docs");
  }
}
