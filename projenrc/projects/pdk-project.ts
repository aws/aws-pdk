/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Dependency, DependencyType, Project } from "projen";
import { JsiiProject, Stability } from "projen/lib/cdk";
import { NodePackageManager } from "projen/lib/javascript";
import { Release } from "projen/lib/release";
import { PDKInternalProjectUtils } from "./internal/internal-project";
import { NodePackageUtils, NxProject } from "../../packages/monorepo/src";
import {
  PDKProject,
  PDK_NAMESPACE,
  PublishConfig,
} from "../abstract/pdk-project";

const PACK_COMMAND = [
  "rm -rf build",
  "pnpm --config.shamefully-hoist=true --config.node-linker=hoisted --config.hoist=true --config.symlinks=false --config.shared-workspace-lockfile=false --filter=@aws/pdk -P deploy build",
  "cd build",
  "npm pack",
  "mv *.tgz ..",
  "cd ..",
  "rm -rf build",
].join(" && ");

/**
 * Contains configuration for the UberProject.
 */
export class PdkProject extends PDKProject {
  static getJsiiProjects(parent?: Project): JsiiProject[] | undefined {
    return parent?.subprojects
      .filter((subProject) => !PDKInternalProjectUtils.isInternal(subProject))
      .filter((subProject) => subProject instanceof JsiiProject)
      .filter((subProject) => subProject.name.startsWith(PDK_NAMESPACE))
      .map((subProject) => subProject as JsiiProject);
  }

  static getProjectName(project: JsiiProject | string, snakeCase?: boolean) {
    const pathSegments = (
      project instanceof JsiiProject ? project.outdir : project
    ).split("/");
    const projectName = pathSegments[pathSegments.length - 1];
    return snakeCase ? projectName.replace(/-/g, "_") : projectName;
  }

  constructor(parent: Project) {
    const jsiiProjects: JsiiProject[] | undefined =
      PdkProject.getJsiiProjects(parent);

    const paths = jsiiProjects?.reduce(
      (p, c) => ({
        ...p,
        ...{
          [c.name]: [`./${PdkProject.getProjectName(c)}`],
        },
      }),
      {}
    );

    super({
      parent,
      author: "AWS APJ COPE",
      authorAddress: "apj-cope@amazon.com",
      defaultReleaseBranch: "mainline",
      name: "pdk",
      eslint: false,
      jest: false,
      docgen: false,
      sampleCode: false,
      releaseToNpm: true,
      keywords: ["aws", "pdk", "jsii", "projen"],
      repositoryUrl: "https://github.com/aws/aws-pdk",
      stability: Stability.STABLE,
      excludeTypescript: ["**/samples/**/*.ts", "**/scripts/**/*.ts"],
      libdir: ".",
      srcdir: ".",
      rootdir: ".",
      tsconfigDev: {
        compilerOptions: {
          paths,
          outDir: ".",
        },
      },
      publishConfig: {
        executableFiles: ["./_scripts/pdk.sh", "./_scripts/exec-command.js"],
      },
    });
    this.manifest.main = "index.js";
    this.manifest.jsii.tsc.paths = paths;
    this.manifest.jsii.tsc.rootDir = ".";

    this.addBundledDeps("findup");
    [
      "scripts",
      "assets",
      "samples",
      "index.*",
      ...(jsiiProjects || []).map((p) => PdkProject.getProjectName(p)),
    ].forEach((s) => this.addGitIgnore(s));

    // Rewrite imports to use tsconfig paths
    this.compileTask.exec(
      NodePackageUtils.command.downloadExec(
        NodePackageManager.PNPM,
        "tsc-alias",
        "-p",
        "tsconfig.dev.json",
        "--dir",
        "."
      )
    );
    this.generateSource(jsiiProjects);

    jsiiProjects?.forEach((p) =>
      NxProject.ensure(this).addImplicitDependency(p)
    );

    this.package.addField("bin", () =>
      jsiiProjects
        ?.map((p) =>
          Object.fromEntries(
            Object.entries(p.manifest.bin() || {}).map(([k, v]) => [
              k,
              `./${v}`,
            ])
          )
        )
        .reduce((p, c) => ({ ...p, ...c }), { pdk: "./_scripts/pdk.sh" })
    );

    // Make sure this is after NxProject so targets can be updated after inference
    new PDKRelease(this, {
      executableFiles: [
        ...this.manifest.publishConfig.executableFiles,
        ...(jsiiProjects
          ?.map((p) =>
            (p.manifest.publishConfig?.executableFiles || []).map(
              (_p: string) => `./${_p}`
            )
          )
          .flatMap((x) => x) || []),
      ],
    });
  }

  private generateSource(jsiiProjects?: JsiiProject[]): void {
    this.preCompileTask.exec(
      `rm -rf index.* samples scripts assets ${jsiiProjects
        ?.map((p) => PdkProject.getProjectName(p))
        .join(" ")}`
    );
    jsiiProjects?.forEach((subProject) => {
      this.copyProjectSource(subProject);
    });
    this.addProjectDeps((jsiiProjects || []).flatMap((p) => p.deps.all));
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
            `export * as ${PdkProject.getProjectName(
              p,
              true
            )} from "./${PdkProject.getProjectName(p)}";`
        )
        .join("\n")}' > ./index.ts`
    );
  }

  private conditionallyCopyFiles(
    project: JsiiProject,
    dir: string,
    targetDir: string = dir,
    copyRoot: string = "."
  ) {
    this.preCompileTask.exec(
      `if [ -d "${path.relative(
        this.outdir,
        project.outdir
      )}/${dir}/" ]; then mkdir -p ./${copyRoot}/${PdkProject.getProjectName(
        project
      )}/${targetDir} && rsync -a ${path.relative(
        this.outdir,
        project.outdir
      )}/${dir}/ ./${copyRoot}/${PdkProject.getProjectName(
        project
      )}/${targetDir} --prune-empty-dirs; fi;`
    );
  }

  private copyProjectSource(project: JsiiProject) {
    this.conditionallyCopyFiles(project, project.srcdir, ".");
    this.conditionallyCopyFiles(project, "samples", "../samples");
    this.conditionallyCopyFiles(project, "scripts", "../scripts");
    this.conditionallyCopyFiles(project, "assets", "../assets");

    this.preCompileTask.exec(
      `mkdir -p ./${PdkProject.getProjectName(
        project
      )} && rsync --exclude=**/*.ts -a ${path.relative(
        this.outdir,
        project.outdir
      )}/${project.srcdir}/ ./${PdkProject.getProjectName(
        project
      )} --prune-empty-dirs`
    );
  }

  private addProjectDeps(deps: Dependency[]) {
    const bundledDeps = new Set(
      deps
        .filter((dep) => dep.type === DependencyType.BUNDLED)
        .map((dep) => dep.name)
    );

    deps
      .filter((dep) => !dep.name.startsWith(PDK_NAMESPACE))
      .forEach((dep) => {
        switch (dep.type) {
          case DependencyType.BUILD:
          case DependencyType.TEST:
            !bundledDeps.has(dep.name) &&
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

    this.updateJsPackageTask(project);
    this.updateJavaPackageTask(project);
    this.updatePythonPackageTask(project);

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

    [
      ".gitattributes",
      ".prettier*",
      "index.ts",
      "project.json",
      "!/assets",
      "!/samples",
      "!/scripts",
      "!.jsii",
      "!README.md",
      "!LICENSE",
      "!LICENSE_THIRD_PARTY",
      "!scripts",
      "!_scripts",
      "!assets",
      "!samples",
      "!index.js",
      "!index.d.ts",
      ...(PdkProject.getJsiiProjects(project.parent) || []).map(
        (p) => `!/${PdkProject.getProjectName(p)}`
      ),
      ...(PdkProject.getJsiiProjects(project.parent) || []).map(
        (p) => `/${PdkProject.getProjectName(p)}/**/*.ts`
      ),
      ...(PdkProject.getJsiiProjects(project.parent) || []).map(
        (p) => `!/${PdkProject.getProjectName(p)}/**/*.d.ts`
      ),
    ].forEach((p) => project.addPackageIgnore(p));

    project.package.addField("publishConfig", {
      access: "public",
      ...publishConfig,
    });

    NxProject.of(project)?.addBuildTargetFiles(
      ["!{projectRoot}/LICENSE_THIRD_PARTY"],
      ["{projectRoot}/LICENSE_THIRD_PARTY"]
    );
  }

  /**
   * Updates the java package task to use the pack command.
   *
   * @param project project to update.
   */
  private updateJavaPackageTask = (project: Project): void => {
    project.tasks
      .tryFind("package:java")
      ?.reset(
        `jsii-pacmak -vvvv --target java --pack-command='${PACK_COMMAND}'`
      );
  };

  /**
   * Changes the pack command to use pnpm.
   *
   * @param project project to update.
   */
  private updateJsPackageTask = (project: Project): void => {
    project.tasks
      .tryFind("package:js")
      ?.reset(`jsii-pacmak -vvvv --target js --pack-command='${PACK_COMMAND}'`);
  };

  /**
   * Changes the pack command to use pnpm.
   *
   * @param project project to update.
   */
  private updatePythonPackageTask = (project: Project): void => {
    project.tasks
      .tryFind("package:python")
      ?.reset(
        `jsii-pacmak -vvvv --target python --pack-command='${PACK_COMMAND}'`
      );
  };
}
