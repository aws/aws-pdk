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
import { Project } from "projen";
import { NodeProject } from "projen/lib/javascript";
import {
  NxMonorepoProject,
  TargetDependencyProject,
} from "../../packages/nx-monorepo/src";

/**
 * Contains configuration for the PDK monorepo (root package).
 */
export class PDKMonorepoProject extends NxMonorepoProject {
  constructor() {
    super({
      defaultReleaseBranch: "mainline",
      eslint: true,
      eslintOptions: {
        dirs: ["projects", "private"],
      },
      name: "aws-prototyping-sdk-monorepo",
      devDeps: [
        "nx",
        "@nrwl/devkit",
        "@aws-prototyping-sdk/nx-monorepo@0.0.0",
        "@aws-prototyping-sdk/pipeline@0.0.0",
        "@commitlint/cli",
        "@commitlint/config-conventional",
        "cz-conventional-changelog",
        "eslint-plugin-header",
        "husky",
        "syncpack",
      ],
      deps: ["fast-xml-parser", "projen"],
      nxConfig: {
        // This is OK to be stored given its read only and the repository is public
        nxCloudReadOnlyAccessToken: 'OWJmZDJmZmEtNzk5MC00OGJkLTg3YjUtNmNkZDk1MmYxZDZkfHJlYWQ=',
        targetDependencies: {
          upgrade: [
            {
              target: "upgrade",
              projects: TargetDependencyProject.DEPENDENCIES,
            },
          ],
        },
      },
      workspaceConfig: {
        noHoist: [
          "aws-prototyping-sdk/aws-cdk-lib",
          "aws-prototyping-sdk/aws-cdk-lib/*",
          "aws-prototyping-sdk/projen",
          "aws-prototyping-sdk/projen/*",
          "aws-prototyping-sdk/@nrwl/devkit",
          "aws-prototyping-sdk/@nrwl/devkit/*",
          "aws-prototyping-sdk/constructs",
          "aws-prototyping-sdk/constructs/*",
          "aws-prototyping-sdk/license-checker",
          "aws-prototyping-sdk/license-checker/*",
          "aws-prototyping-sdk/oss-attribution-generator",
          "aws-prototyping-sdk/oss-attribution-generator/*",
          "@aws-prototyping-sdk/*/aws-cdk-lib",
          "@aws-prototyping-sdk/*/aws-cdk-lib/*",
          "@aws-prototyping-sdk/*/projen",
          "@aws-prototyping-sdk/*/projen/*",
          "@aws-prototyping-sdk/*/constructs",
          "@aws-prototyping-sdk/*/constructs/*",
          "@aws-prototyping-sdk/*/license-checker",
          "@aws-prototyping-sdk/*/license-checker/*",
          "@aws-prototyping-sdk/*/oss-attribution-generator",
          "@aws-prototyping-sdk/*/oss-attribution-generator/*",
          "@aws-prototyping-sdk/open-api-gateway/openapi-types",
          "@aws-prototyping-sdk/open-api-gateway/openapi-types/*",
          "@aws-prototyping-sdk/open-api-gateway/fs-extra",
          "@aws-prototyping-sdk/open-api-gateway/fs-extra/*",
        ],
      },
    });

    this.eslint?.addPlugins("header");
    this.eslint?.addRules({ "header/header": [2, "header.js"] });

    this.addTask("prepare", {
      exec: "husky install",
    });

    const gitSecretsScanTask = this.addTask("git-secrets-scan", {
      exec: "./scripts/git-secrets-scan.sh",
    });

    // Commit lint and commitizen settings
    this.addFields({
      config: {
        commitizen: {
          path: "./node_modules/cz-conventional-changelog",
        },
      },
      commitlint: {
        extends: ["@commitlint/config-conventional"],
      },
    });

    // Update .gitignore
    this.gitignore.exclude(
      "/.tools/",
      "/.idea/",
      "*.iml",
      ".tmp",
      "LICENSE-THIRD-PARTY",
      ".DS_Store",
      "build",
      ".env",
      ".venv",
      "tsconfig.tsbuildinfo"
    );

    resolveDependencies(this);

    this.testTask.spawn(gitSecretsScanTask);

    const upgradeDepsTask = this.addTask("upgrade-deps");
    upgradeDepsTask.exec("npx npm-check-updates --deep --rejectVersion 0.0.0 -u");
    upgradeDepsTask.exec("npx syncpack fix-mismatches");
    upgradeDepsTask.exec("yarn install --check-files");
    upgradeDepsTask.exec("npx projen");
  }

  /**
   * @inheritDoc
   */
  synth() {
    this.subProjects.forEach((subProject) => {
      // Resolve any problematic dependencies
      resolveDependencies(subProject);

      this.configureEsLint(subProject);

      const relativeDir = `${subProject.outdir.split(subProject.root.outdir)[1]}`;
      this.overrideProjectTargets(subProject, {
        build: {
          outputs: [`${relativeDir}/dist`, `${relativeDir}/build`, `${relativeDir}/lib`, `${relativeDir}/target`, `${relativeDir}/.jsii`],
          dependsOn: [
            {
              target: 'build',
              projects: TargetDependencyProject.DEPENDENCIES
            }
          ]
        }
      });
    });

    super.synth();
  }

  configureEsLint(project: any) {
    if (project.eslint) {
      project.addDevDeps("eslint-plugin-header");
      project.eslint.addPlugins("header");
      const rootHops = (project as Project).outdir.split(this.outdir)[1].split('/').splice(1);
      project.eslint.addRules({ "header/header": [2, `${rootHops.map(() => '..').join('/')}/header.js`] });
    }
  }
}

/**
 * Resolves dependencies for projects of type NodeProject.
 *
 * @param project Project instance to configure.
 */
const resolveDependencies = (project: any): void => {
  // resolutions
  if (project instanceof NodeProject || project.package) {
    project.package.addPackageResolutions(
      "@types/prettier@2.6.0",
      "ansi-regex@^5.0.1",
      "underscore@^1.12.1",
      "deep-extend@^0.5.1",
      "argparse@^1.0.10",
      "debug@^2.6.9",
      "minimist@^1.2.6",
      "ejs@^3.1.7",
      "async@^2.6.4"
      );
  }
};
