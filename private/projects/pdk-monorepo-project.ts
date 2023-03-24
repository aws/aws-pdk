/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
import { Project } from "projen";
import { JsiiProject } from "projen/lib/cdk";
import {
  NodePackageManager,
  NodeProject,
  NpmConfig,
} from "projen/lib/javascript";
import {
  NxMonorepoProject,
  DEFAULT_CONFIG,
} from "../../packages/nx-monorepo/src";
import { Nx } from "../../packages/nx-monorepo/src/nx-types";

// Default NX outputs to cache
export const NX_DEFAULT_OUTPUTS = [
  "{projectRoot}/dist",
  "{projectRoot}/lib",
  "{projectRoot}/build",
  "{projectRoot}/coverage",
  "{projectRoot}/test-reports",
  "{projectRoot}/target",
  "{projectRoot}/LICENSE_THIRD_PARTY",
  "{projectRoot}/.jsii",
];
/**
 * Workspace default NX "build" target
 *
 * @see {@link NxTargetDefaults}
 * @see {@link ProjectTarget}
 */
export const NX_BUILD_TARGET_DEFAULT: Nx.ProjectTarget = {
  outputs: NX_DEFAULT_OUTPUTS,
  dependsOn: [
    {
      target: "build",
      projects: Nx.TargetDependencyProject.DEPENDENCIES,
    },
  ],
};
/**
 * Workspace default NX `targetDefaults`
 *
 * @see {@link NxTargetDefaults}
 */
export const NX_TARGET_DEFAULTS: Nx.TargetDefaults = {
  build: NX_BUILD_TARGET_DEFAULT,
};

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
      packageManager: NodePackageManager.PNPM,
      defaultReleaseBranch: "mainline",
      eslint: true,
      eslintOptions: {
        dirs: ["projects", "private"],
        ignorePatterns: ["packages/**/*.*"],
      },
      depsUpgrade: false,
      name: "aws-prototyping-sdk-monorepo",
      devDeps: [
        "lerna",
        "nx",
        "@nrwl/devkit",
        "@aws-prototyping-sdk/nx-monorepo@^0.x",
        "@aws-prototyping-sdk/pipeline@^0.x",
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
      deps: ["fast-xml-parser", "projen"],
      nxConfig: {
        // This is OK to be stored given its read only and the repository is public
        nxCloudReadOnlyAccessToken:
          "OWJmZDJmZmEtNzk5MC00OGJkLTg3YjUtNmNkZDk1MmYxZDZkfHJlYWQ=",
        cacheableOperations: ["build", "test", "generate"],
        targetDefaults: NX_TARGET_DEFAULTS,
        targetDependencies: {
          "release:mainline": [
            {
              target: "release:mainline",
              projects: Nx.TargetDependencyProject.DEPENDENCIES,
            },
          ],
          upgrade: [
            {
              target: "upgrade",
              projects: Nx.TargetDependencyProject.DEPENDENCIES,
            },
          ],
        },
      },
      workspaceConfig: {
        disableNoHoistBundled: true,
      },
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
      ".pnp.loader.cjs"
    );

    // add local `.npmrc` to automatically avoid build hangs if npx is promping to install a package
    const npmrc = new NpmConfig(this);
    npmrc.addConfig("yes", "true");

    resolveDependencies(this);

    this.testTask.spawn(gitSecretsScanTask);

    this.addTask("dev:workspace:link", {
      exec: "./scripts/dev/link-workspace.js link",
    });

    this.addTask("dev:workspace:unlink", {
      exec: "./scripts/dev/link-workspace.js unlink",
    });
  }

  /**
   * @inheritDoc
   */
  synth() {
    this.subProjects.forEach((subProject) => {
      // TODO: remove this and the script once https://github.com/aws/jsii/pull/4030 is merged!
      if (subProject instanceof JsiiProject) {
        subProject.packageTask.prependExec(
          `pnpx ts-node ${path.relative(
            subProject.outdir,
            this.outdir
          )}/scripts/jsii-pacmak-hack.ts`
        );
      }
      resolveDependencies(subProject);
      updateJsPackageTask(subProject);
      updateJavaPackageTask(subProject);
      updatePythonPackageTask(subProject);
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
 * Uses a local maven repository when packaging for java. This significantly improves peformance as the default behaviour
 * is to create a new tmp cache and re-download all dependencies.
 *
 * This logic will by default attempt to symlink in the user .m2 repository if it exists. Otherwise a fresh repository
 * will be created in node_modules/.cache/.m2/repository.
 *
 * This also configures pnpm as the pack command.
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
    `jsii-pacmak -v --target java --maven-local-repository=${localM2Repository} --pack-command='pnpm pack'`
  );
};

/**
 * Changes the pack command to use pnpm.
 *
 * @param project project to update.
 */
const updateJsPackageTask = (project: Project): void => {
  project.tasks
    .tryFind("package:js")
    ?.reset(`jsii-pacmak -v --target js --pack-command='pnpm pack'`);
};

/**
 * Changes the pack command to use pnpm.
 *
 * @param project project to update.
 */
const updatePythonPackageTask = (project: Project): void => {
  project.tasks
    .tryFind("package:python")
    ?.reset(`jsii-pacmak -v --target python --pack-command='pnpm pack'`);
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
      "got@^11.8.5",
      "@types/yargs@17.0.10"
    );
  }
};
