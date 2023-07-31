/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as fs from "fs";
import * as path from "path";
import { TypeSafeApiProject } from "@aws-prototyping-sdk/type-safe-api";
import * as Mustache from "mustache";
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

  /**
   * TypeSafeApi instance to use when setting up the initial project sample code.
   */
  readonly typeSafeApi?: TypeSafeApiProject;
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
    const srcDir = path.resolve(__dirname, "../templates/src");
    const publicDir = path.resolve(__dirname, "../templates/public");

    if (options.typeSafeApi) {
      const hooks = options.typeSafeApi.library?.typescriptReactQueryHooks;
      const libraryHooksPackage = hooks?.package?.packageName;
      if (!libraryHooksPackage) {
        throw new Error(
          "Cannot pass in a Type Safe Api without React Hooks Library configured!"
        );
      }
      this.addDeps(libraryHooksPackage);
    }

    const mustacheConfig = {
      applicationName: this.applicationName,
      hasApi: !!options.typeSafeApi,
      apiHooksPackage:
        options.typeSafeApi?.library?.typescriptReactQueryHooks?.package
          ?.packageName,
    };

    new SampleDir(this, this.srcdir, {
      files: {
        ...Object.fromEntries(
          this.buildSampleDirEntries(srcDir, [], mustacheConfig)
        ),
      },
    });

    new SampleDir(this, this.publicDir, {
      files: {
        ...Object.fromEntries(
          this.buildSampleDirEntries(publicDir, [], mustacheConfig)
        ),
      },
    });

    // Linting is managed as part of the test task already, so disable react-scripts running eslint again
    this.tasks.addEnvironment("DISABLE_ESLINT_PLUGIN", "true");
  }

  private buildSampleDirEntries(
    dir: string,
    pathPrefixes: string[] = [],
    mustacheConfig: any
  ): [string, string][] {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter(
        (f) =>
          mustacheConfig.hasApi ||
          !`${pathPrefixes.join("/")}${f.name}`.includes("DefaultApi")
      )
      .flatMap((f) =>
        f.isDirectory()
          ? this.buildSampleDirEntries(
              `${dir}/${f.name}`,
              [...pathPrefixes, f.name],
              mustacheConfig
            )
          : [
              [
                `${path.join(
                  ...pathPrefixes,
                  f.name.replace(".mustache", "")
                )}`,
                Mustache.render(
                  fs.readFileSync(`${dir}/${f.name}`).toString(),
                  mustacheConfig
                ),
              ],
            ]
      );
  }
}
