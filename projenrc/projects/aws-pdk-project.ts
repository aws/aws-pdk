/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Dependency, DependencyType, Project } from "projen";
import { JsiiProject, Stability } from "projen/lib/cdk";
import { NodePackageManager } from "projen/lib/javascript";
import { Release } from "projen/lib/release";
import { NodePackageUtils, NxProject } from "../../packages/nx-monorepo/src";
import {
  PDKProject,
  PDK_NAMESPACE,
  PublishConfig,
} from "../abstract/pdk-project";

/**
 * Contains configuration for the UberProject.
 */
export class AwsPdkProject extends PDKProject {
  private static getJsiiProjects(parent?: Project): JsiiProject[] | undefined {
    return parent?.subprojects
      .filter((subProject) => subProject instanceof JsiiProject)
      .filter((subProject) => subProject.name.startsWith(PDK_NAMESPACE))
      .map((subProject) => subProject as JsiiProject);
  }

  private static getSafeProjectName(project: JsiiProject | string) {
    const pathSegments = (
      project instanceof JsiiProject ? project.outdir : project
    ).split("/");
    return pathSegments[pathSegments.length - 1].replace(/-/g, "_");
  }

  constructor(parent: Project) {
    const jsiiProjects: JsiiProject[] | undefined =
      AwsPdkProject.getJsiiProjects(parent);

    const paths = jsiiProjects?.reduce(
      (p, c) => ({
        ...p,
        ...{
          [c.name]: [
            `./${c.srcdir}/${AwsPdkProject.getSafeProjectName(c)}/src`,
          ],
        },
      }),
      {}
    );
    super({
      parent,
      author: "AWS APJ COPE",
      authorAddress: "apj-cope@amazon.com",
      defaultReleaseBranch: "mainline",
      name: "aws-pdk",
      eslint: false,
      jest: false,
      docgen: false,
      releaseToNpm: true,
      keywords: ["aws", "pdk", "jsii", "projen"],
      repositoryUrl: "https://github.com/aws/aws-prototyping-sdk",
      stability: Stability.EXPERIMENTAL,
      tsconfigDev: {
        compilerOptions: {
          paths,
        },
      },
      excludeTypescript: ["**/samples/**/*.ts", "**/scripts/**/*.ts"],
    });

    this.addGitIgnore("src");

    // Rewrite imports to use tsconfig paths
    this.compileTask.exec(
      NodePackageUtils.command.downloadExec(
        NodePackageManager.PNPM,
        "tsc-alias",
        "-p",
        "tsconfig.dev.json",
        "--dir",
        "lib"
      )
    );
    this.generateSource(jsiiProjects);

    jsiiProjects?.forEach((p) =>
      NxProject.ensure(this).addImplicitDependency(p)
    );

    this.manifest.jsii.tsc.paths = paths;
    this.package.addField("exports", {
      ".": "./lib/index.js",
      "./package.json": "./package.json",
      "./.jsii": "./.jsii",
      "./.warnings.jsii.js": "./.warnings.jsii.js",
      ...jsiiProjects?.reduce((p, c) => {
        return {
          ...p,
          [`./${path.basename(
            c.outdir
          )}`]: `./lib/${AwsPdkProject.getSafeProjectName(
            path.basename(c.outdir)
          )}/src/index.js`,
          [`./lib/${AwsPdkProject.getSafeProjectName(
            path.basename(c.outdir)
          )}`]: `./lib/${AwsPdkProject.getSafeProjectName(
            path.basename(c.outdir)
          )}/src/index.js`,
        };
      }, {}),
    });

    this.package.addField("bin", () =>
      jsiiProjects
        ?.map((p) =>
          Object.fromEntries(
            Object.entries(p.manifest.bin() || {}).map(([k, v]) => [
              k,
              `./lib/${AwsPdkProject.getSafeProjectName(p)}/${v}`,
            ])
          )
        )
        .reduce((p, c) => ({ ...p, ...c }), {})
    );

    // Make sure this is after NxProject so targets can be updated after inference
    new PDKRelease(this, {
      executableFiles: jsiiProjects
        ?.map((p) =>
          (p.manifest.publishConfig?.executableFiles || []).map(
            (_p: string) => `./lib/${AwsPdkProject.getSafeProjectName(p)}/${_p}`
          )
        )
        .flatMap((x) => x),
    });
  }

  private generateSource(jsiiProjects?: JsiiProject[]): void {
    this.preCompileTask.exec(
      `rm -rf ${this.srcdir} lib dist && mkdir ${this.srcdir}`
    );
    jsiiProjects?.forEach((subProject) => {
      this.copyProjectSource(subProject);
      this.addProjectDeps(subProject);
    });
    this.emitIndexFile(jsiiProjects);
  }

  private emitIndexFile(projects?: JsiiProject[]) {
    if (!projects) {
      return;
    }

    this.preCompileTask.exec(
      `echo '${projects
        .map(
          (p) =>
            `export * as ${AwsPdkProject.getSafeProjectName(
              p
            )} from "./${AwsPdkProject.getSafeProjectName(p)}/src";`
        )
        .join("\n")}' > ./${this.srcdir}/index.ts`
    );
  }

  private copyProjectSource(project: JsiiProject) {
    this.preCompileTask.exec(
      `mkdir -p ./${this.srcdir}/${AwsPdkProject.getSafeProjectName(
        project
      )}/src && rsync -a ${path.relative(this.outdir, project.outdir)}/${
        project.srcdir
      }/ ./${this.srcdir}/${AwsPdkProject.getSafeProjectName(
        project
      )}/src --prune-empty-dirs`
    );
    this.preCompileTask.exec(
      `if [[ -d "${path.relative(
        this.outdir,
        project.outdir
      )}/samples/" ]]; then mkdir -p ./lib/${AwsPdkProject.getSafeProjectName(
        project
      )}/samples && rsync -a ${path.relative(
        this.outdir,
        project.outdir
      )}/samples/ ./lib/${AwsPdkProject.getSafeProjectName(
        project
      )}/samples --prune-empty-dirs; fi;`
    );
    this.preCompileTask.exec(
      `if [[ -d "${path.relative(
        this.outdir,
        project.outdir
      )}/scripts/" ]]; then mkdir -p ./lib/${AwsPdkProject.getSafeProjectName(
        project
      )}/scripts && rsync -a ${path.relative(
        this.outdir,
        project.outdir
      )}/scripts/ ./lib/${AwsPdkProject.getSafeProjectName(
        project
      )}/scripts --prune-empty-dirs; fi;`
    );
  }

  private addProjectDeps(project: JsiiProject) {
    project.deps.all
      .filter((dep) => !dep.name.startsWith(PDK_NAMESPACE))
      .forEach((dep) => {
        switch (dep.type) {
          case DependencyType.BUILD:
          case DependencyType.TEST:
            this.addDevDeps(this.renderDependency(dep));
            break;
          case DependencyType.BUNDLED:
            this.addBundledDeps(this.renderDependency(dep));
            break;
          case DependencyType.PEER:
            this.addPeerDeps(this.renderDependency(dep));
            break;
          case DependencyType.RUNTIME:
            this.addDeps(this.renderDependency(dep));
            break;
          default:
            break;
        }
      });
  }

  private renderDependency(dep: Dependency) {
    return `${dep.name}${!!dep.version ? `@${dep.version}` : ""}`;
  }
}

/**
 * Enforces licenses and attribution are checked and included as part of the release distributable. Sets up a release:mainline task which
 * bumps package versions using semantic versioning.
 */
class PDKRelease extends Release {
  constructor(project: PDKProject, publishConfig?: PublishConfig) {
    super(project, {
      versionFile: "package.json",
      task: project.buildTask,
      branch: "mainline",
      artifactsDirectory: project.artifactsDirectory,
    });

    project.addDevDeps("license-checker", "generate-license-file");

    project.packageTask.reset();
    project.packageTask.exec(
      NodePackageUtils.command.exec(
        project.package.packageManager,
        "license-checker",
        "--summary",
        "--production",
        "--onlyAllow",
        "'MIT;Apache-2.0;Unlicense;BSD;BSD-2-Clause;BSD-3-Clause;ISC;'"
      )
    );
    project.packageTask.exec(
      NodePackageUtils.command.exec(
        project.package.packageManager,
        "generate-license-file",
        "--input package.json",
        "--output LICENSE_THIRD_PARTY",
        "--overwrite"
      )
    );
    project.packageTask.spawn(project.tasks.tryFind("package-all")!);
    project.npmignore?.addPatterns("!LICENSE_THIRD_PARTY");

    const releaseTask = project.tasks.tryFind("release:mainline")!;
    releaseTask.reset();
    releaseTask.env("RELEASE", "true");
    releaseTask.exec("rm -rf dist");
    releaseTask.spawn(project.tasks.tryFind("bump")!);
    releaseTask.spawn(project.preCompileTask);
    releaseTask.spawn(project.compileTask);
    releaseTask.spawn(project.postCompileTask);
    releaseTask.spawn(project.packageTask);
    releaseTask.spawn(project.tasks.tryFind("unbump")!);

    project.package.addField("publishConfig", {
      access: "public",
      ...publishConfig,
    });

    NxProject.of(project)?.addBuildTargetFiles(
      ["!{projectRoot}/LICENSE_THIRD_PARTY"],
      ["{projectRoot}/LICENSE_THIRD_PARTY"]
    );
  }
}
