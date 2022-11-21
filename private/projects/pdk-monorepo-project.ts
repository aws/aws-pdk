/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

import path from "path";
import { Project } from "projen";
import { NodeProject, NpmConfig } from "projen/lib/javascript";
import {
  NxMonorepoProject,
  TargetDependencyProject,
  DEFAULT_CONFIG,
} from "../../packages/nx-monorepo/src";
import { PDKProject } from "../pdk-project";

export const JEST_VERSION = "^27"; // This is needed due to: https://github.com/aws/jsii/issues/3619
const HEADER_RULE = {
  "header/header": [
    2,
    "block",
    [
      "! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.",
      "SPDX-License-Identifier: Apache-2.0 ",
    ],
  ],
};

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
      depsUpgrade: false,
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
        "got@^11.8.5",
        "license-checker",
        "oss-attribution-generator",
      ],
      monorepoUpgradeDepsOptions: {
        syncpackConfig: { ...DEFAULT_CONFIG, workspace: false },
      },
      tsconfig: {
        compilerOptions: {
          rootDir: ".",
        },
        include: ["**/*.ts"],
      },
      deps: ["fast-xml-parser", "projen"],
      nxConfig: {
        // This is OK to be stored given its read only and the repository is public
        nxCloudReadOnlyAccessToken:
          "OWJmZDJmZmEtNzk5MC00OGJkLTg3YjUtNmNkZDk1MmYxZDZkfHJlYWQ=",
        targetDependencies: {
          "release:mainline": [
            {
              target: "release:mainline",
              projects: TargetDependencyProject.DEPENDENCIES,
            },
          ],
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
          "aws-prototyping-sdk/@nrwl/devkit",
          "aws-prototyping-sdk/@nrwl/devkit/*",
          "aws-prototyping-sdk/license-checker",
          "aws-prototyping-sdk/license-checker/*",
          "aws-prototyping-sdk/oss-attribution-generator",
          "aws-prototyping-sdk/oss-attribution-generator/*",
          "@aws-prototyping-sdk/*/license-checker",
          "@aws-prototyping-sdk/*/license-checker/*",
          "@aws-prototyping-sdk/*/oss-attribution-generator",
          "@aws-prototyping-sdk/*/oss-attribution-generator/*",
          "@aws-prototyping-sdk/open-api-gateway/openapi-types",
          "@aws-prototyping-sdk/open-api-gateway/openapi-types/*",
          "@aws-prototyping-sdk/open-api-gateway/fs-extra",
          "@aws-prototyping-sdk/open-api-gateway/fs-extra/*",
          "@aws-prototyping-sdk/open-api-gateway/lodash",
          "@aws-prototyping-sdk/open-api-gateway/lodash/*",
          "@aws-prototyping-sdk/open-api-gateway/log4js",
          "@aws-prototyping-sdk/open-api-gateway/log4js/*",
          "@aws-prototyping-sdk/cloudscape-react-ts-sample-website",
          "@aws-prototyping-sdk/cloudscape-react-ts-sample-website/**",
        ],
      },
    });

    this.eslint?.addPlugins("header");
    this.eslint?.addRules(HEADER_RULE);

    // Do NOT lint packages files as they get linted by the package
    this.eslint?.addIgnorePattern("packages/**/*.*");

    this.addTask("eslint-staged", {
      description:
        "Run eslint against the workspace staged files only; excluding ./packages/ files.",
      steps: [
        {
          // exlcude package files as they are run by the packages directly
          exec: "eslint --fix --no-error-on-unmatched-pattern $(git diff --name-only --relative --staged HEAD . | grep -E '.(ts|tsx)$' | grep -v -E '^packages/' | xargs)",
        },
      ],
    });

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

    // add local `.npmrc` to automatically avoid build hangs if npx is promping to install a package
    const npmrc = new NpmConfig(this);
    npmrc.addConfig("yes", "true");

    resolveDependencies(this);

    this.testTask.spawn(gitSecretsScanTask);
  }

  /**
   * @inheritDoc
   */
  synth() {
    this.subProjects.forEach((subProject) => {
      resolveDependencies(subProject);
      updateJavaPackageTask(subProject);
      this.configureEsLint(subProject);

      const relativeDir = `${
        subProject.outdir.split(subProject.root.outdir)[1]
      }`;

      this.overrideProjectTargets(
        subProject,
        subProject instanceof PDKProject
          ? subProject.getNxProjectTargets()
          : {
              build: {
                outputs: [
                  `${relativeDir}/dist`,
                  `${relativeDir}/build`,
                  `${relativeDir}/coverage`,
                  `${relativeDir}/lib`,
                  `${relativeDir}/target`,
                ],
                dependsOn: [
                  {
                    target: "build",
                    projects: TargetDependencyProject.DEPENDENCIES,
                  },
                ],
              },
            }
      );
    });

    super.synth();
  }

  configureEsLint(project: any) {
    if (project.eslint) {
      project.addDevDeps("eslint-plugin-header");
      project.eslint.addPlugins("header");
      project.eslint.addRules(HEADER_RULE);
    }
  }
}

/**
 * Uses a local maven repository when packaging for java. This significantly improves peformance as the default behaviour
 * is to create a new tmp cache and re-download all dependencies.
 *
 * This logic will by default attempt to symlink in the user .m2 repository if it exists. Otherwise a fresh repository
 * will be created in node_modules/.cache/.m2/repository.
 *
 * @param project project to update.
 */
const updateJavaPackageTask = (project: Project): void => {
  const defaultM2 = "~/.m2/repository";
  const localM2Root = path.relative(
    project.outdir,
    path.join(process.cwd(), "node_modules/.cache/.m2")
  );
  const localM2Repository = path.join(localM2Root, "repository");
  const javaTask = project.tasks.tryFind("package:java");

  javaTask?.reset();
  javaTask?.exec(
    `[ -d ${defaultM2} ] && [ ! -d "${localM2Repository}" ] && mkdir -p ${localM2Root} && ln -s ${defaultM2} ${localM2Repository} || true`
  );
  javaTask?.exec(
    `jsii-pacmak -v --target java --maven-local-repository=${localM2Repository}`
  );
};

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
      "async@^2.6.4",
      "nth-check@^2.0.1",
      "got@^11.8.5"
    );
  }
};
