/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { SampleDir } from "projen";
import {
  JsiiJavaTarget,
  JsiiProject,
  JsiiProjectOptions,
  JsiiPythonTarget,
  Stability,
} from "projen/lib/cdk";
import { Release } from "projen/lib/release";
import type { Nx } from "../packages/nx-monorepo/src/nx-types";
import {
  JEST_VERSION,
  NX_TARGET_DEFAULTS,
} from "./projects/pdk-monorepo-project";

/**
 * Configuration options for the PDK Project.
 */
export interface PDKProjectOptions extends JsiiProjectOptions {
  /**
   * Publish to pypi
   *
   * @default - package will be published with module name: aws_prototyping_sdk.<your_package_name>
   */
  readonly publishToPypiConfig?: JsiiPythonTarget | false;

  /**
   * Publish to maven
   *
   * @default - package will be published with package name: software.aws.awsprototypingsdk.<yourpackagename>
   */
  readonly publishToMavenConfig?: JsiiJavaTarget | false;

  /**
   * Nx project configuration.
   *
   * @see https://nx.dev/reference/project-configuration
   */
  readonly nx?: Nx.ProjectConfig;
}

/**
 * Project type to be used when creating new Constructs.
 *
 * This project handles correct naming for the PDK, along with validation and auto publishing of artifacts to the various package managers.
 */
export abstract class PDKProject extends JsiiProject {
  public readonly pdkRelease: PDKRelease;

  constructor(options: PDKProjectOptions) {
    const nameWithUnderscore = options.name.replace(/-/g, "_");
    const condensedName = options.name.replace(/-/g, "");
    const name =
      options.name === "aws-prototyping-sdk"
        ? options.name
        : `@aws-prototyping-sdk/${options.name}`;

    super({
      ...options,
      stability: options.stability || Stability.EXPERIMENTAL,
      github: false,
      depsUpgrade: false,
      sampleCode: false,
      docgen: false,
      prettier: true,
      jestOptions: {
        ...options.jestOptions,
        jestVersion: JEST_VERSION,
      },
      projenDevDependency: false,
      eslint: true,
      srcdir: "src",
      testdir: "test",
      readme: {
        contents: "TODO",
      },
      name,
      packageName: name,
      outdir: `packages/${options.name}`,
      publishToPypi:
        (options.publishToPypiConfig ?? {
          distName: `aws_prototyping_sdk.${nameWithUnderscore}`,
          module: `aws_prototyping_sdk.${nameWithUnderscore}`,
        }) ||
        undefined,
      publishToMaven:
        (options.publishToMavenConfig ?? {
          mavenEndpoint: "https://aws.oss.sonatype.org",
          mavenGroupId: "software.aws.awsprototypingsdk",
          mavenArtifactId: `${options.name}`,
          javaPackage: `software.aws.awsprototypingsdk.${condensedName}`,
        }) ||
        undefined,
      gitignore: [...(options.gitignore || []), "LICENSE_THIRD_PARTY"],
    });

    if (
      options.stability &&
      !Object.values(Stability).find((f) => f === options.stability)
    ) {
      throw new Error(`stability must be one of: ${Object.values(Stability)}`);
    }

    if (this.deps.all.find((dep) => "aws-prototyping-sdk" === dep.name)) {
      throw new Error(
        "PDK Projects cannot have a dependency on the aws-prototyping-sdk!"
      );
    }

    if (
      !this.name.match(
        /^(@aws-prototyping-sdk\/[a-z-]+(?<!-)|aws-prototyping-sdk)$/
      )
    ) {
      throw new Error("name should be lowercase and include optional hyphens.");
    }

    if (!this.parent) {
      throw new Error("parent must be provided!");
    }

    if (options.sampleCode === undefined || options.sampleCode === true) {
      new SampleDir(this, this.srcdir, {
        files: {
          "index.ts": "// export * from 'my-construct';",
        },
      });

      new SampleDir(this, this.testdir, {
        files: {
          ".gitkeep": "// Delete me once tests are added",
        },
      });
    }

    const eslintTask = this.tasks.tryFind("eslint");
    eslintTask?.reset(
      `eslint --ext .ts,.tsx \${CI:-'--fix'} --no-error-on-unmatched-pattern ${this.srcdir} ${this.testdir}`
    );
    const jestTask =
      this.jest &&
      this.addTask("jest", {
        exec: `jest --passWithNoTests \${CI:-'--updateSnapshot'}`,
      });
    this.testTask.reset();
    jestTask && this.testTask.spawn(jestTask);
    eslintTask && this.testTask.spawn(eslintTask);

    this.addTask("eslint-staged", {
      description: "Run eslint against the staged files only",
      steps: [
        {
          exec: "eslint --fix --no-error-on-unmatched-pattern $(git diff --name-only --relative --staged HEAD . | grep -E '.(ts|tsx)$' | grep -v 'samples/*' | xargs)",
        },
      ],
    });

    this.pdkRelease = new PDKRelease(this);

    if (options.nx) {
      this.nx = options.nx;
    }
  }

  /**
   * Get Nx project configuration.
   *
   * If project does not have explicit Nx configuration, the workspace defaults
   * will be returned.
   *
   * @see https://nx.dev/reference/project-configuration
   */
  public get nx(): Nx.ProjectConfig | undefined {
    return this.manifest.nx || cloneDeep({ targets: NX_TARGET_DEFAULTS });
  }

  /**
   * Set Nx project configuration.
   *
   * This will overwrite the entire configuration and replace any workspace
   * defaults of same key.
   *
   * @see https://nx.dev/reference/project-configuration
   */
  public set nx(config: Nx.ProjectConfig | undefined) {
    this.package.addField("nx", config);
  }

  /**
   * Override specific Nx config value for specific path.
   * @param path Key path to override value
   * @param value Value to override
   * @param {boolean} [append=false] Indicates if array values are appended to, rather than overwritten.
   */
  public nxOverride(path: string, value: any, append?: boolean): void {
    const nx = cloneDeep(this.nx);
    overrideField(nx, path, value, append);

    this.nx = nx;
  }
}

/**
 * Enforces licenses and attribution are checked and included as part of the release distributable. Sets up a release:mainline task which
 * bumps package versions using semantic versioning.
 */
class PDKRelease extends Release {
  constructor(project: PDKProject) {
    super(project, {
      versionFile: "package.json",
      task: project.buildTask,
      branch: "mainline",
      artifactsDirectory: project.artifactsDirectory,
    });

    project.addDevDeps("license-checker", "oss-attribution-generator");

    project.packageTask.reset();
    project.packageTask.exec(
      "npx license-checker --summary --production --onlyAllow 'MIT;Apache-2.0;Unlicense;BSD;BSD-2-Clause;BSD-3-Clause;ISC;'"
    );
    project.packageTask.exec(
      "npx oss-attribution-generator generate-attribution && mv oss-attribution/attribution.txt ./LICENSE_THIRD_PARTY && rm -rf oss-attribution"
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
    });
  }
}

/**
 * Utility to deeply clone a value
 * @param value Value to clone
 * @returns Cloned value
 */
export function cloneDeep(value: any): any {
  return JSON.parse(JSON.stringify(value));
}

/**
 * Utility to override nested object path value - performed in-place on the object.
 * @param obj Object to override path value
 * @param path Path of value to override
 * @param value Value to override
 * @param {boolean} [append=false] Indicates if array values are appended to, rather than overwritten.
 */
export function overrideField(
  obj: any,
  path: string,
  value: any,
  append?: boolean
): void {
  const parts = path.split(".");
  let curr = obj;
  while (parts.length > 1) {
    const key = parts.shift() as string;
    // if we can't recurse further or the previous value is not an
    // object overwrite it with an object.
    const isObject =
      curr[key] != null &&
      typeof curr[key] === "object" &&
      !Array.isArray(curr[key]);
    if (!isObject) {
      curr[key] = {};
    }
    curr = curr[key];
  }
  const lastKey = parts.shift() as string;

  if (
    append &&
    curr[lastKey] != null &&
    Array.isArray(value) &&
    Array.isArray(curr[lastKey])
  ) {
    curr[lastKey] = [...curr[lastKey], ...value];
  } else {
    curr[lastKey] = value;
  }
}
