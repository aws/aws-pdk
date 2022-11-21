/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Dependency, DependencyType, Project } from "projen";
import { Stability } from "projen/lib/cdk";
import {
  ProjectTargets,
  NxMonorepoProject,
} from "../../packages/nx-monorepo/src";
import { PDKProject } from "../pdk-project";
import { PDKMonorepoProject } from "./pdk-monorepo-project";

/**
 * File patterns to keep in the .gitignore. Also used to determine which files to keep when cleaning.
 */
const filesGlobsToKeep = [
  "node_modules",
  ".eslintrc.json",
  ".git*",
  ".npm*",
  "scripts",
  "scripts/*.ts",
  ".projen",
  "LICENSE",
  "README.md",
  ".prettierignore",
  ".prettierrc.json",
  "tsconfig.dev.json",
  "tsconfig.json",
  "package.json",
];

/**
 * Contains configuration for the aws-prototyping-sdk package.
 */
export class AwsPrototypingSdkProject extends PDKProject {
  constructor(parent: Project) {
    super({
      parent,
      author: "AWS APJ COPE",
      authorAddress: "apj-cope@amazon.com",
      defaultReleaseBranch: "mainline",
      name: "aws-prototyping-sdk",
      keywords: ["aws", "pdk", "jsii", "projen"],
      eslint: false,
      prettier: false,
      repositoryUrl: "https://github.com/aws/aws-prototyping-sdk",
      devDeps: ["ts-node", "fs-extra"],
      stability: Stability.STABLE,
      sampleCode: false,
      excludeTypescript: ["**/samples/**"],
      outdir: ".",
      tsconfigDev: {
        compilerOptions: {
          outDir: ".",
          rootDir: ".",
        },
      },
      publishToPypiConfig: {
        distName: `aws_prototyping_sdk`,
        module: `aws_prototyping_sdk`,
      },
      publishToMavenConfig: {
        mavenEndpoint: "https://aws.oss.sonatype.org",
        mavenGroupId: "software.aws.awsprototypingsdk",
        mavenArtifactId: `aws-prototyping-sdk`,
        javaPackage: `software.aws.awsprototypingsdk`,
      },
      gitignore: ["*", ...filesGlobsToKeep.map((f) => `!${f}`)],
    });

    this.npmignore?.addPatterns(
      "/scripts/",
      "**/*.ts",
      "!**/*.d.ts",
      "!**/samples/**/*.ts",
      "!samples"
    );

    const cleanTask = this.addTask("clean", {
      exec: `find . -maxdepth 1 ${[".", "..", "dist", ...filesGlobsToKeep]
        .map((f) => `! -name "${f}"`)
        .join(" ")} -exec rm -rf {} \\;`,
    });

    this.preCompileTask.spawn(cleanTask);
    this.preCompileTask.exec("./scripts/bundle.ts");
    this.package.addField("bundle", {
      exclude: true,
    });
    this.package.addField("main", "./index.js");
    this.package.addField("types", "./index.d.ts");
    this.package.manifest.jsii.tsc.rootDir = ".";
    this.package.manifest.jsii.tsc.outDir = ".";
  }

  /**
   * Returns a list of filtered dependencies which are not apart of the @aws-prototyping-sdk scope.
   *
   * @param deps list of all deps
   * @param type DependencyType to filter by
   */
  private getNonPDKDependenciesByType(
    deps: Dependency[],
    type: DependencyType
  ) {
    return deps
      .filter(
        (d) => d.type === type && !d.name.startsWith("@aws-prototyping-sdk")
      )
      .map((d) => d.name);
  }

  /**
   * @inheritDoc
   */
  synth() {
    const monorepo = this.root as NxMonorepoProject;
    const stableProjects = monorepo.subProjects
      .filter((s: Project) => s.name !== "aws-prototyping-sdk")
      .filter((s: any) => s.package?.manifest?.stability === Stability.STABLE);

    const stableDeps: Dependency[] = stableProjects
      .map((p) => p.deps.all)
      .reduce((prev, curr) => [...prev, ...curr], []);
    this.addDeps(
      ...this.getNonPDKDependenciesByType(stableDeps, DependencyType.RUNTIME)
    );
    this.addPeerDeps(
      ...this.getNonPDKDependenciesByType(stableDeps, DependencyType.PEER)
    );
    this.addBundledDeps(
      ...this.getNonPDKDependenciesByType(stableDeps, DependencyType.BUNDLED)
    );

    this.package.addField("exports", {
      ".": "./index.js",
      "./package.json": "./package.json",
      "./.jsii": "./.jsii",
      "./.warnings.jsii.js": "./.warnings.jsii.js",
      ...stableProjects.reduce((p, c) => {
        return {
          ...p,
          [`./${path.basename(c.outdir)}`]: `./${path.basename(
            c.outdir
          )}/index.js`,
        };
      }, {}),
    });

    super.synth();
  }

  /**
   * @inheritDoc
   */
  getNxProjectTargets(): ProjectTargets {
    const defaultTargets = super.getNxProjectTargets();
    const relativeDir = `${this.outdir.split(this.root.outdir)[1]}`;

    // aws-prototyping-sdk needs the stable folders as cached outputs
    const additionalOutputs = (this.root as PDKMonorepoProject).subProjects
      .filter((s: Project) => s.name !== "aws-prototyping-sdk")
      .filter((s: any) => s.package?.manifest?.stability === Stability.STABLE)
      .map((s) => path.join(relativeDir, path.basename(s.outdir)));

    return {
      build: {
        outputs: [...defaultTargets.build.outputs!, ...additionalOutputs],
        dependsOn: defaultTargets.build.dependsOn,
      },
    };
  }
}
