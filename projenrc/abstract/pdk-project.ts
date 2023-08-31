/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { PublishConfig as _PublishConfig } from "@pnpm/types";
import { Project, SampleDir, TextFile, TextFileOptions } from "projen";
import { JsiiProject, JsiiProjectOptions, Stability } from "projen/lib/cdk";
import { NodePackageManager } from "projen/lib/javascript";
import { NodePackageUtils } from "../../packages/monorepo/src";
import { NxProject } from "../../packages/monorepo/src/components/nx-project";
import type { Nx } from "../../packages/monorepo/src/nx-types";

export const PDK_NAMESPACE = "@aws/";
const AWS_PDK = "pdk";
const README = "README.md";

export type PublishConfig = _PublishConfig & {
  access?: undefined | "restricted" | "public";
};

/**
 * Configuration options for the PDK Project.
 */
export interface PDKProjectOptions extends JsiiProjectOptions {
  /**
   * Nx project configuration.
   *
   * @see https://nx.dev/reference/project-configuration
   */
  readonly nx?: Nx.ProjectConfig;

  /**
   * PublishConfig.
   *
   * @see https://pnpm.io/package_json#publishconfig
   */
  readonly publishConfig?: PublishConfig;
}

/**
 * Project type to be used when creating new Constructs.
 *
 * This project handles correct naming for the PDK, along with validation and auto publishing of artifacts to the various package managers.
 */
export abstract class PDKProject extends JsiiProject {
  public readonly options: PDKProjectOptions;
  public readonly nx: NxProject;

  constructor(options: PDKProjectOptions) {
    const name = `${PDK_NAMESPACE}${options.name}`;
    super({
      ...options,
      packageManager: NodePackageManager.PNPM,
      projenCommand: NodePackageUtils.command.projen(NodePackageManager.PNPM),
      stability: options.stability || Stability.EXPERIMENTAL,
      github: false,
      depsUpgrade: false,
      sampleCode: false,
      docgen: false,
      prettier: true,
      releaseToNpm: options.releaseToNpm ?? false,
      projenDevDependency: false,
      jsiiVersion: "*",
      srcdir: "src",
      testdir: "test",
      name,
      packageName: name,
      outdir: `packages/${options.name}`,
      gitignore: [...(options.gitignore || []), "LICENSE_THIRD_PARTY"],
      disableTsconfigDev: false,
      disableTsconfig: true,
      publishToPypi: {
        distName: "aws_pdk",
        module: "aws_pdk",
      },
      publishToMaven: {
        mavenEndpoint: "https://aws.oss.sonatype.org",
        mavenGroupId: "software.aws",
        mavenArtifactId: "pdk",
        javaPackage: "software.aws.pdk",
      },
    });

    this.preCompileTask.prependExec("rm -f tsconfig.json");
    this.postCompileTask.prependExec("rm -f tsconfig.json");
    this.packageTask.reset();

    this.options = options;
    if (
      options.stability &&
      !Object.values(Stability).find((f) => f === options.stability)
    ) {
      throw new Error(`stability must be one of: ${Object.values(Stability)}`);
    }

    if (this.deps.all.find((dep) => AWS_PDK === dep.name)) {
      throw new Error("PDK Projects cannot have a dependency on the @aws/pdk!");
    }

    if (!this.parent) {
      throw new Error("parent must be provided!");
    }

    if (options.sampleCode !== false) {
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

    if (options.eslint !== false) {
      this.eslint?.addIgnorePattern("scripts/**/*.ts");
      const eslintTask = this.tasks.tryFind("eslint");
      eslintTask?.reset(
        `eslint --ext .ts,.tsx \${CI:-'--fix'} --no-error-on-unmatched-pattern ${this.srcdir} ${this.testdir}`,
        { receiveArgs: true }
      );
      eslintTask && this.testTask.spawn(eslintTask);

      this.addTask("eslint-staged", {
        description: "Run eslint against the staged files only",
        steps: [
          {
            exec: "eslint --fix --no-error-on-unmatched-pattern $(git diff --name-only --relative --staged HEAD . | grep -E '.(ts|tsx)$' | grep -v 'samples/*' | xargs)",
          },
        ],
      });
      this.packageTask.spawn(eslintTask!);
    }

    if (options.jest !== false) {
      const jestTask =
        this.jest &&
        this.addTask("jest", {
          exec: [
            "jest",
            "--passWithNoTests",
            // Only update snapshot locally
            "${CI:-'--updateSnapshot'}",
            // Always run in band for nx runner (nx run-many)
            "${NX_WORKSPACE_ROOT:+'--runInBand'}",
          ].join(" "),
          receiveArgs: true,
        });
      this.testTask.reset();
      jestTask && this.testTask.spawn(jestTask);
    }

    if (options.releaseToNpm !== true) {
      this.tasks.tryFind("package-all")?.reset();
    }

    if (!!options.publishConfig) {
      this.package.addField("publishConfig", {
        access: "public",
        ...options.publishConfig,
      });
    }

    this.nx = NxProject.ensure(this);
    options.nx && this.nx.merge(options.nx);

    options.docgen !== false && new PDKDocgen(this);

    // Suppress JSII upgrade warnings
    this.tasks.addEnvironment("JSII_SUPPRESS_UPGRADE_PROMPT", "true");

    this.generateReadme(options.name);
  }

  private generateReadme(name: string) {
    new Readme(this, {
      lines: this.generateReadmeLines(name),
      readonly: true,
    });
  }

  private generateReadmeLines(name: string) {
    if (name === "pdk") {
      return [
        "# AWS PDK",
        "",
        "All documentation is located at: https://aws.github.io/aws-pdk",
      ].concat(
        this.parent?.subprojects
          .filter((s) => s.name !== `${PDK_NAMESPACE}${name}`)
          .sort((s1, s2) => s1.name.localeCompare(s2.name))
          .map((s) => [""].concat((s.tryFindFile(README) as Readme)._lines!))
          .flat() as string[]
      );
    } else {
      return [
        `# ${name}`,
        "",
        `Please refer to [Developer Guide](./docs/developer_guides/${name}/index.md).`,
      ];
    }
  }
}

class Readme extends TextFile {
  _lines: string[];

  constructor(project: Project, options: TextFileOptions) {
    super(project, README, options);
    this._lines = options.lines!;
  }

  addLine(line: string): void {
    this._lines?.push(line);
    super.addLine(line);
  }
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

export class PDKDocgen {
  constructor(project: PDKProject) {
    project.addDevDeps("jsii-docgen");

    const docsBasePath = "docs/api";

    const docgen = project.addTask("docgen", {
      description: "Generate API docs from .jsii manifest",
      exec: `mkdir -p ${docsBasePath}/typescript && jsii-docgen -r=false -o ${docsBasePath}/typescript/index.md && sed -i'' -e 's/@aws\\//@aws\\/pdk\\//g' ${docsBasePath}/typescript/index.md`,
    });

    docgen.exec(
      `mkdir -p ${docsBasePath}/python && jsii-docgen -l python -r=false -o ${docsBasePath}/python/index.md && sed -i'' -e 's/aws.pdk/aws.pdk.${this.toSnakeCase(
        project
      )}/g' ${docsBasePath}/python/index.md`
    );

    docgen.exec(
      `mkdir -p ${docsBasePath}/java && jsii-docgen -l java -r=false -o ${docsBasePath}/java/index.md && sed -i'' -e 's/software.aws.pdk/software.aws.pdk.${this.toSnakeCase(
        project
      )}/g' ${docsBasePath}/java/index.md`
    );

    NxProject.of(project)?.addBuildTargetFiles(
      [`!{projectRoot}/${docsBasePath}/**/*`],
      [`{projectRoot}/${docsBasePath}`]
    );

    // spawn docgen after compilation (requires the .jsii manifest).
    project.postCompileTask.spawn(docgen);
    project.gitignore.exclude(`/${docsBasePath}`);
    project.annotateGenerated(`/${docsBasePath}`);
  }

  private toSnakeCase(project: PDKProject) {
    return project.name
      .split("/")
      .reverse()[0]
      .toLowerCase()
      .replace(/-/g, "_");
  }
}
