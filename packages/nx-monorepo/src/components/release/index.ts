/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Component, DependencyType, Project } from "projen";
import { JsiiProject, Stability } from "projen/lib/cdk";
import { NodePackageUtils } from "../../utils";
import { relativeOutdir } from "../../utils/common";
import { NxProject } from "../nx-project";
import { NxWorkspace } from "../nx-workspace";

/**
 * NxRelease component manages versioning and publishing of release artifacts for the monorepo.
 */
export class NxRelease extends Component {
  /**
   * Retrieves the singleton NxRelease instance associated with project root.
   *
   * @param scope project instance.
   */
  static of(scope: Project): NxRelease | undefined {
    return scope.root.components.find((c) => c instanceof NxRelease) as
      | NxRelease
      | undefined;
  }

  /** Reference to NxWorkspace component for project */
  nx: NxWorkspace;

  /**
   * Tag that indicates the most recent previous release. New packages without
   * existing release tags will be from this tag rather than the initial repo commit.
   * @default "last-release"
   */
  lastReleaseTag: string = "last-release";

  /**
   * Additional arguments for nx commands (affected, run-many).
   */
  nxArgs?: string[];

  /**
   * Indicates if test task is skipping during release build.
   *
   * @default true
   */
  skipTestDuringBuild: boolean = true;

  constructor(project: Project) {
    // Make sure only being added to the root project.
    if (project.root !== project) {
      throw new Error("NxRelease can only be added to the root project");
    }
    // Make sure we only ever have 1 instance of NxRelease component per project
    if (NxRelease.of(project)) {
      throw new Error(
        `Project ${project.name} already has associated NxRelease component.`
      );
    }

    if (NxWorkspace.of(project) == null) {
      throw new Error(`Project ${project.name} requires NxWorkspace`);
    }

    super(project);

    this.nx = NxWorkspace.of(project)!;

    // Nx plugin for versioning using SemVer and CHANGELOG generation powered by Conventional Commits.
    project.deps.addDependency("@jscutlery/semver", DependencyType.BUILD);

    this.nx.plugins.push("@jscutlery/semver");
  }

  preSynthesize(): void {
    super.preSynthesize();

    this.nx.setTargetDefault("release:version", {
      dependsOn: ["^release:version"],
    });

    const nxAffected = `nx affected --base=${
      this.lastReleaseTag
    } --nx-bail --output-style=stream ${(this.nxArgs || []).join(" ")}`;

    const buildTask = this.project.addTask("release:build", {
      env: {
        SKIP_TEST: "true",
      },
      exec: NodePackageUtils.command.exec(
        NodePackageUtils.resolvePackageManager(this.project),
        "nx run-many --target=build --output-style=stream --nx-bail",
        ...(this.nxArgs || [])
      ),
    });

    const releaseTask = this.project.addTask("release", {
      steps: [
        {
          // prepare for release
          exec: NodePackageUtils.command.exec(
            NodePackageUtils.resolvePackageManager(this.project),
            `${nxAffected} --target=release:prepare`
          ),
        },
        {
          // perform package version bumps
          exec: NodePackageUtils.command.exec(
            NodePackageUtils.resolvePackageManager(this.project),
            `${nxAffected} --parallel=1 --target=release:version`
          ),
        },
        {
          // resolve workspace package dependencies
          exec: NodePackageUtils.command.exec(
            NodePackageUtils.resolvePackageManager(this.project),
            "pdk-release-version-sync"
          ),
        },
        {
          // rebuild everything after versioning
          spawn: buildTask.name,
        },
        {
          // create github releases
          exec: NodePackageUtils.command.exec(
            NodePackageUtils.resolvePackageManager(this.project),
            // package.json will be modified on versioned packages
            `${nxAffected} --target=release:create`
          ),
        },
        {
          // publish
          exec: NodePackageUtils.command.exec(
            NodePackageUtils.resolvePackageManager(this.project),
            // package.json will be modified on versioned packages
            `${nxAffected} --target=release:publish`
          ),
        },
      ],
    });

    const tagTask = this.project.addTask("release:tag", {
      // tag last release
      exec: `git tag -f ${this.lastReleaseTag} && git push origin ${this.lastReleaseTag} --force`,
      condition: `[ "\${CI:-false}" = "true" ]`,
    });
    // print all local tags for this release
    tagTask.exec("git tag --list --contains `git rev-parse HEAD`");
    releaseTask.spawn(tagTask);

    const initTask = this.project.addTask("release:init", {
      description:
        "Initialize the repository for release by ensuring release tag",
      // Do not push this tag, we just need it locally
      exec: `git tag -f ${this.lastReleaseTag} $(git rev-list --max-parents=0 HEAD)^{}`,
      condition: `[[ ! $(git tag -l "${this.lastReleaseTag}") ]]`,
    });

    releaseTask.prependSpawn(initTask);
  }
}

/**
 * NxReleaseProject component manages versioning and publishing of release artifacts for a project.
 */
export class NxReleaseProject extends Component {
  /**
   * Retrieves an instance of NxReleaseProject if one is associated to the given project.
   *
   * @param project project instance.
   */
  static of(project: Project): NxReleaseProject | undefined {
    return project.components.find((c) => c instanceof NxReleaseProject) as
      | NxReleaseProject
      | undefined;
  }
  /**
   * Retrieves an instance of NxReleaseProject if one is associated to the given project,
   * otherwise created a NxReleaseProject instance for the project.
   *
   * @param project project instance.
   */
  static ensure(project: Project): NxReleaseProject {
    return NxReleaseProject.of(project) || new NxReleaseProject(project);
  }

  /** Reference to NxProject component for the project */
  readonly nx: NxProject;

  /**
   * Indicates if project release is considered "stable" (1.x) or
   * initial development (0.x).
   *
   * If stable, the version will start at 1.x and increment major version bumps with every "BREAKING CHANGE",
   * otherwise will start at and be fixed to major 0.x versioning.
   *
   * Will default to the project's `stability` property or `false` if project does not have stability defined.
   */
  stable?: boolean;

  /**
   * Indicates if test task is skipping during release build.
   *
   * @default {boolean} {@link NxRelease.skipTestDuringBuild}
   */
  skipTestDuringBuild?: boolean;

  constructor(project: Project) {
    // Make sure we only ever have 1 instance of NxReleaseProject component per project
    if (NxReleaseProject.of(project)) {
      throw new Error(
        `Project ${project.name} already has associated NxReleaseProject component.`
      );
    }

    // nx semver plugin modifies the package.json, so we can only support node projects at this time
    if (!NodePackageUtils.isNodeProject(project)) {
      throw new Error(
        `NxReleaseProject currently only supports NodeProjects: ${project.name}`
      );
    }

    super(project);

    this.nx = NxProject.ensure(project);
  }

  /** @inheritdoc */
  preSynthesize(): void {
    super.preSynthesize();

    const RELEASE_ENV = "dist/.release.env";

    const nodePackage = NodePackageUtils.tryFindNodePackage(this.project);

    const stable =
      this.stable ?? nodePackage?.manifest.stability === Stability.STABLE;

    const release = NxRelease.of(this.project);
    if (release == null) {
      throw new Error(
        `Root project requires NxRelease to synthesize NxReleaseProject`
      );
    }
    const baseBranch = release.nx.baseBranch;

    const packageManager = NodePackageUtils.resolvePackageManager(this.project);

    const prepareTask = this.project.addTask("release:prepare", {
      steps: [
        {
          // Clean up dist so we don't get 0.0.0 default build and new version artifacts
          exec: "rm -rf dist && mkdir dist",
        },
      ],
    });

    const minVersion = stable ? "1.0.0" : "0.0.0";
    const initTask = this.project.addTask("release:init", {
      description: "Initialize the package for release by ensuring initial tag",
      steps: [
        {
          // create a local tag for min version at latest-release
          exec: `git tag -f ${this.project.name}-${minVersion} ${release.lastReleaseTag}^{}`,
        },
      ],
      // only need to create tag if none exist for minVersion major
      condition: `[[ ! $(git tag -l "${this.project.name}-${
        stable ? "1" : "0"
      }.*") ]]`,
    });
    prepareTask.spawn(initTask);

    // called only when a new version should be created
    this.nx.setTarget("release:version:post", {
      executor: "nx:run-commands",
      options: {
        // postTargets in semver:version concats all options to end so we comment them out
        // https://github.com/jscutlery/semver#triggering-executors-post-release
        // create a Ini file with release tag details for downstream commands
        command:
          NodePackageUtils.command.exec(
            packageManager,
            "pdk-release-version-post",
            String(stable),
            '"${projectName}"',
            '"${version}"',
            '"${tag}"',
            '"${previousTag}"'
          ) + " # ", // append # to comment out semver:version jank
        cwd: relativeOutdir(this.project),
      },
    });

    // https://github.com/jscutlery/semver
    this.nx.setTarget("release:version", {
      executor: "@jscutlery/semver:version",
      options: {
        baseBranch,
        postTargets: ["release:version:post"].map(
          (t) => `${this.project.name}:"${t}"`
        ),
        noVerify: true,
        push: false,
        trackDeps: true,
        skipCommit: true,
        changelogHeader: formatChangelogHeader(this.project),
        cwd: relativeOutdir(this.project),
      },
    });

    // Only perform publish if version available to publish
    const publishTask = this.project.addTask("release:publish", {
      description: "Publish artifacts",
      condition: `[ "\${CI:-false}" = "true" ] && [ -f "${RELEASE_ENV}" ]`,
    });

    const releaseFiles: string[] = [];

    if (this.project instanceof JsiiProject) {
      // Create a zip of each package artifact directory for release assets
      const packageJs = this.project.tasks.tryFind("package:js");
      if (packageJs) {
        packageJs.exec("zip -FSr ../js.zip .", { cwd: "dist/js" });
        releaseFiles.push("dist/js.zip");

        publishTask.exec(
          NodePackageUtils.command.downloadExecPkg(
            packageManager,
            "publib@latest",
            "publib-npm"
          )
        );
      }

      const packageJava = this.project.tasks.tryFind("package:java");
      if (packageJava) {
        packageJava.exec("zip -FSr ../java.zip .", { cwd: "dist/java" });
        releaseFiles.push("dist/java.zip");

        publishTask.exec(
          NodePackageUtils.command.downloadExecPkg(
            packageManager,
            "publib@latest",
            "publib-maven"
          )
        );
      }

      const packagePython = this.project.tasks.tryFind("package:python");
      if (packagePython) {
        packagePython.exec("zip -FSr ../python.zip .", { cwd: "dist/python" });
        releaseFiles.push("dist/python.zip");

        publishTask.exec(
          NodePackageUtils.command.downloadExecPkg(
            packageManager,
            "publib@latest",
            "publib-pypi"
          )
        );
      }
    }

    // create tag and release in github
    this.nx.setTarget("release:github", {
      executor: "nx:run-commands",
      options: {
        commands: [
          // Push the release tag for this package
          "git push origin $RELEASE_TAG",
          // Create a release with package artifacts
          [
            "gh release create",
            // tag
            "$RELEASE_TAG",
            // files
            "CHANGELOG.md",
            ...releaseFiles,
            "--title",
            '"$RELEASE_TAG"',
            // notes
            "--notes-file",
            "CHANGELOG.md",
          ].join(" "),
        ],
        envFile: RELEASE_ENV,
        parallel: false,
        cwd: relativeOutdir(this.project),
      },
    });

    this.project.addTask("release:create", {
      exec: NodePackageUtils.command.exec(
        NodePackageUtils.resolvePackageManager(this.project),
        `nx run ${this.project.name}:"release:github"`
      ),
      condition: `[ "\${CI:-false}" = "true" ] && [ -f "${RELEASE_ENV}" ]`,
    });

    if (
      this.skipTestDuringBuild === true ||
      (this.skipTestDuringBuild == null && release.skipTestDuringBuild === true)
    ) {
      const condition =
        (this.project.testTask.condition
          ? `${this.project.testTask.condition} && `
          : "") + '[ "${SKIP_TEST:-false}" = "true" ]';
      // @ts-ignore - private
      this.project.testTask.condition = condition;
    }
  }
}

function formatChangelogHeader(project: Project): string {
  const manifest = NodePackageUtils.tryFindNodePackage(project)?.manifest;
  const stability: string =
    manifest?.stability || (manifest?.deprecated && "deprecated") || "stable"; // Jsii default

  let changelogHeader = `# Changelog \n## Package \`${
    project.name
  }\` (**${stability.toUpperCase()}**) \n`;

  const jsiiTargets = manifest?.jsii?.targets;
  if (jsiiTargets) {
    changelogHeader += `\n- **NPM:** [${manifest.name}](https://www.npmjs.com/package/${manifest.name})`;
    jsiiTargets.java &&
      (changelogHeader += `\n- **Maven:** [${jsiiTargets.java.package}](https://central.sonatype.com/artifact/${jsiiTargets.java.maven.groupId}/${jsiiTargets.java.maven.artifactId})`);
    // TODO: discrepancies is jsii vs pypi of _ vs - in naming
    jsiiTargets.python &&
      (changelogHeader += `\n- **Pypi:** *${jsiiTargets.python.module}*`);
    changelogHeader += "\n";
  }

  return changelogHeader;
}
