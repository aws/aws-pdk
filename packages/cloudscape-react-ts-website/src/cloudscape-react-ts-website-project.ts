/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as fs from "fs";
import * as path from "path";
import { SampleDir } from "projen";
import {
  ReactTypeScriptProject,
  ReactTypeScriptProjectOptions,
} from "projen/lib/web";

/**
 * Configuration options for the CloudscapeReactTsWebsiteProject.
 */
export interface CloudscapeReactTsWebsiteProjectOptions
  extends ReactTypeScriptProjectOptions {
  /**
   * Name of the application name.
   *
   * @default "Sample App"
   */
  readonly applicationName?: string;
  /**
   * Public directory.
   *
   * @default "public"
   */
  readonly publicDir?: string;
}

/**
 * Synthesizes a Cloudscape React Typescript Website Project.
 *
 * @pjid cloudscape-react-ts-website
 */
export class CloudscapeReactTsWebsiteProject extends ReactTypeScriptProject {
  public readonly applicationName: string;
  public readonly publicDir: string;

  constructor(options: CloudscapeReactTsWebsiteProjectOptions) {
    super({
      ...options,
      defaultReleaseBranch: options.defaultReleaseBranch,
      name: options.name,
      sampleCode: false,
      readme: {
        contents: fs
          .readFileSync(path.resolve(__dirname, "../README.md"))
          .toString(),
      },
      gitignore: ["runtime-config.json"],
    });

    this.addDeps(
      "@aws-northstar/ui",
      "@cloudscape-design/components",
      "react-router-dom"
    );

    this.testTask.reset();
    const lintTask = this.tasks.tryFind("eslint");
    lintTask && this.testTask.spawn(lintTask);
    this.testTask.exec("react-scripts test --watchAll=false --passWithNoTests");

    this.applicationName = options.applicationName ?? "Sample App";
    this.publicDir = options.publicDir ?? "public";
    const srcDir = path.resolve(__dirname, "../samples/src");
    new SampleDir(this, this.srcdir, {
      files: {
        ...Object.fromEntries(this.buildSampleDirEntries(srcDir)),
        "config.json": JSON.stringify(
          {
            applicationName: this.applicationName,
          },
          undefined,
          2
        ),
      },
    });

    const publicDir = path.resolve(__dirname, "../samples/public");
    new SampleDir(this, this.publicDir, {
      sourceDir: publicDir,
      files: {
        // override index.html to pass through applicationName
        "index.html": fs
          .readFileSync(`${publicDir}/index.html`)
          .toString()
          .replace("<title></title>", `<title>${this.applicationName}</title>`),
      },
    });
  }

  private buildSampleDirEntries(
    dir: string,
    pathPrefixes: string[] = []
  ): [string, string][] {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((f) => f.name !== "config.json")
      .flatMap((f) =>
        f.isDirectory()
          ? this.buildSampleDirEntries(`${dir}/${f.name}`, [
              ...pathPrefixes,
              f.name,
            ])
          : [
              [
                `${path.join(...pathPrefixes, f.name)}`,
                fs.readFileSync(`${dir}/${f.name}`).toString(),
              ],
            ]
      );
  }
}
