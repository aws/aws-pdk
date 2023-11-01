/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as fs from "fs";
import * as path from "path";
import { CloudscapeReactTsWebsiteProject } from "@aws/cloudscape-react-ts-website";
import { NxProject } from "@aws/monorepo";
import { TypeSafeApiProject } from "@aws/type-safe-api";
import * as Mustache from "mustache";
import { SampleFile } from "projen";
import { AwsCdkTypeScriptApp } from "projen/lib/awscdk";
import { NodeProject } from "projen/lib/javascript";
import { AwsCdkTypeScriptAppOptions } from "./aws-cdk-ts-app-options";
import { DEFAULT_STACK_NAME } from "../../consts";

/**
 * Configuration options for the InfrastructureTsProject.
 */
export interface InfrastructureTsProjectOptions
  extends AwsCdkTypeScriptAppOptions {
  /**
   * Stack name.
   *
   * @default infra-dev
   */
  readonly stackName?: string;

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
 * Synthesizes a Infrastructure Typescript Project.
 */
export class InfrastructureTsProject extends AwsCdkTypeScriptApp {
  constructor(options: InfrastructureTsProjectOptions) {
    const hasApi = !!options.typeSafeApi;
    const hasWebsite = !!options.cloudscapeReactTsWebsite;

    super({
      ...options,
      defaultReleaseBranch: options.defaultReleaseBranch ?? "main",
      prettier: options.prettier || true,
      packageManager:
        options.parent && options.parent instanceof NodeProject
          ? options.parent.package.packageManager
          : options.packageManager,
      cdkVersion: options.cdkVersion ?? "2.1.0",
      name: options.name,
      sampleCode: false,
      readme: {
        contents: fs
          .readFileSync(
            path.resolve(
              __dirname,
              "../../../samples/infrastructure/typescript/README.md"
            )
          )
          .toString(),
      },
    });

    this.addDeps("@aws/pdk");

    const srcDir = path.resolve(
      __dirname,
      "../../../samples/infrastructure/typescript/src"
    );
    const testDir = path.resolve(
      __dirname,
      "../../../samples/infrastructure/typescript/test"
    );

    if (hasApi) {
      if (!options.typeSafeApi.infrastructure.typescript) {
        throw new Error(
          "Cannot pass in a Type Safe Api without Typescript Infrastructure configured!"
        );
      }
      this.addDeps(
        options.typeSafeApi.infrastructure.typescript?.package.packageName!
      );
      // Ensure handlers are built before infra
      options.typeSafeApi.all.handlers?.forEach((handler) => {
        NxProject.ensure(this).addImplicitDependency(handler);
      });
    }
    if (hasWebsite) {
      // Ensure website is built before infra
      this.addDevDeps(options.cloudscapeReactTsWebsite.package.packageName);
    }

    const mustacheConfig = {
      hasApi,
      hasWebsite,
      stackName: options.stackName || DEFAULT_STACK_NAME,
      infraPackage:
        options.typeSafeApi?.infrastructure.typescript?.package.packageName,
      websiteDistRelativePath:
        hasWebsite &&
        path.relative(
          this.outdir,
          `${options.cloudscapeReactTsWebsite?.outdir}/build`
        ),
    };

    options.sampleCode !== false &&
      this.emitSampleFiles(srcDir, ["src"], mustacheConfig);
    options.sampleCode !== false &&
      this.emitSampleFiles(testDir, ["test"], mustacheConfig);

    const eslintTask = this.tasks.tryFind("eslint");
    this.testTask.reset();
    this.testTask.exec("jest --passWithNoTests ${CI:-'--updateSnapshot'}");
    eslintTask && this.testTask.spawn(eslintTask);
  }

  private emitSampleFiles(
    dir: string,
    pathPrefixes: string[] = [],
    mustacheConfig: any
  ) {
    fs.readdirSync(dir, { withFileTypes: true })
      .filter((f) => {
        let shouldIncludeFile = true;
        if (!mustacheConfig.hasApi) {
          shouldIncludeFile &&= !f.name.endsWith("api.ts.mustache");
        }
        if (!mustacheConfig.hasWebsite) {
          shouldIncludeFile &&= !f.name.endsWith("website.ts.mustache");
        }
        return shouldIncludeFile;
      })
      .forEach((f) =>
        f.isDirectory()
          ? this.emitSampleFiles(
              `${dir}/${f.name}`,
              [...pathPrefixes, f.name],
              mustacheConfig
            )
          : new SampleFile(
              this,
              `${path.join(...pathPrefixes, f.name.replace(".mustache", ""))}`,
              {
                contents: Mustache.render(
                  fs.readFileSync(`${dir}/${f.name}`).toString(),
                  mustacheConfig
                ),
              }
            )
      );
  }
}
