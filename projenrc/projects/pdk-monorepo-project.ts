/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { NodePackageManager, NodeProject } from "projen/lib/javascript";
import { MonorepoTsProject, Syncpack } from "../../packages/monorepo/src";
import { PDK_NAMESPACE } from "../abstract/pdk-project";

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
export class PDKMonorepoProject extends MonorepoTsProject {
  constructor() {
    super({
      packageManager: NodePackageManager.PNPM,
      defaultReleaseBranch: "mainline",
      eslint: true,
      eslintOptions: {
        dirs: ["projects", "private"],
        ignorePatterns: ["packages/**/*.*"],
      },
      depsUpgrade: false,
      name: "@aws/pdk-monorepo",
      devDeps: [
        "lerna",
        "nx",
        "@nrwl/devkit",
        `${PDK_NAMESPACE}monorepo@0.0.0`,
        `${PDK_NAMESPACE}pipeline@0.0.0`,
        "@commitlint/cli",
        "@commitlint/config-conventional",
        "commitizen",
        "cz-conventional-changelog",
        "eslint-plugin-header",
        "husky",
        "got@^11.8.5",
        "@jsii/spec",
      ],
      monorepoUpgradeDepsOptions: {
        syncpackConfig: {
          ...Syncpack.DEFAULT_CONFIG,
          dependencyTypes: ["!local"],
        },
      },
      deps: [
        "fast-xml-parser",
        "projen",
        "@pnpm/types@^9.0.0",
        "@mrgrain/jsii-struct-builder",
      ],
      workspaceConfig: {
        linkLocalWorkspaceBins: true,
      },
    });

    // Turn on automatic target inference for this repo
    this.nx.autoInferProjectTargets = true;
    // This is OK to be stored given its read only and the repository is public
    this.nx.useNxCloud(
      "OWJmZDJmZmEtNzk5MC00OGJkLTg3YjUtNmNkZDk1MmYxZDZkfHJlYWQ="
    );
    this.nx.cacheableOperations.push("generate");
    this.nx.setTargetDefault("release:mainline", {
      dependsOn: ["^release:mainline"],
    });
    this.nx.setTargetDefault("upgrade", {
      dependsOn: ["^upgrade"],
    });

    this.eslint?.addPlugins("header");
    this.eslint?.addRules(HEADER_RULE);

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
      "tsconfig.tsbuildinfo",
      ".yarn/unplugged",
      ".yarn/install-state.gz",
      ".yarn/cache",
      ".yarn/__virtual__",
      ".pnp.cjs",
      ".pnp.loader.cjs",
      ".pnpm-store"
    );

    // add to local `.npmrc` to automatically avoid build hangs if npx is prompting to install a package
    this.npmrc.addConfig("yes", "true");
    this.npmrc.addConfig("prefer-workspace-packages", "true");

    resolveDependencies(this);

    this.testTask.spawn(gitSecretsScanTask);
  }

  /**
   * @inheritDoc
   */
  synth() {
    this.subprojects.forEach((subProject) => {
      resolveDependencies(subProject);
      this.configureEsLint(subProject);
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
 * Resolves dependencies for projects of type NodeProject.
 *
 * @param project Project instance to configure.
 */
const resolveDependencies = (project: any): void => {
  // resolutions
  if (project instanceof NodeProject || project.package) {
    project.package.addPackageResolutions(
      "tar@^4.4.18",
      "@babel/traverse@7.23.2",
      "syncpack@12.3.3"
    );
  }
};
