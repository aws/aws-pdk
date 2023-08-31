/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as fs from "fs";
import * as path from "path";
import { CloudscapeReactTsWebsiteProject } from "@aws/cloudscape-react-ts-website";
import { NxProject } from "@aws/monorepo";
import { TypeSafeApiProject } from "@aws/type-safe-api";
import * as Mustache from "mustache";
import { SampleFile } from "projen";
import { AwsCdkPythonApp } from "projen/lib/awscdk";
import { AwsCdkPythonAppOptions } from "./aws-cdk-py-app-options";

/**
 * Configuration options for the InfrastructurePyProject.
 */
export interface InfrastructurePyProjectOptions extends AwsCdkPythonAppOptions {
  /**
   * TypeSafeApi instance to use when setting up the initial project sample code.
   */
  readonly typeSafeApi?: TypeSafeApiProject;

  /**
   * CloudscapeReactTsWebsiteProject instance to use when setting up the initial project sample code.
   */
  readonly cloudscapeReactTsWebsite?: CloudscapeReactTsWebsiteProject;
}

/**
 * Synthesizes a Infrastructure Python Project.
 */
export class InfrastructurePyProject extends AwsCdkPythonApp {
  constructor(options: InfrastructurePyProjectOptions) {
    const hasApi = !!options.typeSafeApi;
    const hasWebsite = !!options.cloudscapeReactTsWebsite;
    const moduleName = options.moduleName ?? "infra";

    super({
      ...options,
      cdkVersion: options.cdkVersion ?? "2.1.0",
      sample: false,
      poetry: true,
      moduleName,
      appEntrypoint: "main.py",
      pytest: options.pytest ?? false,
      version: options.version ?? "0.0.0",
      authorName: options.authorName ?? "pdkuser",
      authorEmail: options.authorEmail ?? "user@pdk.com",
      name: options.name,
      readme: {
        contents: fs
          .readFileSync(
            path.resolve(__dirname, "../../../samples/python/README.md")
          )
          .toString(),
      },
    });

    ["pytest@^7", "syrupy@^4"].forEach((devDep) =>
      this.addDevDependency(devDep)
    );
    ["aws_pdk@^0", "python@^3.9"].forEach((dep) => this.addDependency(dep));

    const srcDir = path.resolve(__dirname, "../../../samples/python/src");
    const testDir = path.resolve(__dirname, "../../../samples/python/test");

    if (hasApi) {
      if (!options.typeSafeApi.infrastructure.python) {
        throw new Error(
          "Cannot pass in a Type Safe Api without Python Infrastructure configured!"
        );
      }
      NxProject.ensure(this).addPythonPoetryDependency(
        options.typeSafeApi.infrastructure.python
      );
      // Ensure handlers are built before infra
      options.typeSafeApi.all.handlers?.forEach((handler) => {
        NxProject.ensure(this).addImplicitDependency(handler);
      });
    }
    if (hasWebsite) {
      // Ensure website is built before infra
      NxProject.ensure(this).addImplicitDependency(
        options.cloudscapeReactTsWebsite
      );
    }

    const mustacheConfig = {
      hasApi,
      hasWebsite,
      infraPackage: options.typeSafeApi?.infrastructure.python?.moduleName,
      moduleName,
      websiteDistRelativePath:
        hasWebsite &&
        path.relative(
          this.outdir,
          `${options.cloudscapeReactTsWebsite?.outdir}/build`
        ),
    };

    options.sample !== false &&
      this.emitSampleFiles(srcDir, [this.moduleName], mustacheConfig);
    options.sample !== false &&
      this.emitSampleFiles(testDir, ["tests"], mustacheConfig);

    this.testTask.reset("poetry run pytest ${CI:-'--snapshot-update'}");
  }

  private emitSampleFiles(
    dir: string,
    pathPrefixes: string[] = [],
    mustacheConfig: any
  ) {
    fs.readdirSync(dir, { withFileTypes: true })
      .filter((f) => {
        if (!mustacheConfig.hasApi) {
          return !f.name.endsWith("api.ts.mustache");
        } else if (!mustacheConfig.hasWebsite) {
          return !f.name.endsWith("website.ts.mustache");
        } else {
          return true;
        }
      })
      .forEach((f) => {
        if (f.isDirectory()) {
          return this.emitSampleFiles(
            `${dir}/${f.name}`,
            [...pathPrefixes, f.name],
            mustacheConfig
          );
        } else {
          const contents = Mustache.render(
            fs.readFileSync(`${dir}/${f.name}`).toString(),
            mustacheConfig
          );
          return new SampleFile(
            this,
            `${path.join(
              ...(f.name !== "main.py.mustache" ? pathPrefixes : []), // emit at the root so package imports work correctly :(
              f.name.replace(".mustache", "")
            )}`,
            {
              contents,
              sourcePath: (!contents && `${dir}/${f.name}`) || undefined,
            }
          );
        }
      });
  }
}
