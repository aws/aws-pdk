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
import { InfrastructureCommands } from "../../components/infrastructure-commands";
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
   * @deprecated use typeSafeApis
   */
  readonly typeSafeApi?: TypeSafeApiProject;

  /**
   * CloudscapeReactTsWebsiteProject instance to use when setting up the initial project sample code.
   * @deprecated use cloudscapeReactTsWebsites
   */
  readonly cloudscapeReactTsWebsite?: CloudscapeReactTsWebsiteProject;

  /**
   * TypeSafeApi instances to use when setting up the initial project sample code.
   */
  readonly typeSafeApis?: TypeSafeApiProject[];

  /**
   * CloudscapeReactTsWebsiteProject instances to use when setting up the initial project sample code.
   */
  readonly cloudscapeReactTsWebsites?: CloudscapeReactTsWebsiteProject[];
}

/**
 * Synthesizes a Infrastructure Typescript Project.
 */
export class InfrastructureTsProject extends AwsCdkTypeScriptApp {
  constructor(options: InfrastructureTsProjectOptions) {
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

    InfrastructureCommands.ensure(this);

    this.addDeps("@aws/pdk");

    const srcDir = path.resolve(
      __dirname,
      "../../../samples/infrastructure/typescript/src"
    );
    const testDir = path.resolve(
      __dirname,
      "../../../samples/infrastructure/typescript/test"
    );

    const typeSafeApis = [
      ...(options.typeSafeApis || []),
      ...(options.typeSafeApi ? [options.typeSafeApi] : []),
    ];
    const cloudscapeReactTsWebsites = [
      ...(options.cloudscapeReactTsWebsites || []),
      ...(options.cloudscapeReactTsWebsite
        ? [options.cloudscapeReactTsWebsite]
        : []),
    ];

    typeSafeApis.forEach((tsApi) => {
      if (!tsApi.infrastructure.typescript) {
        throw new Error(
          "Cannot pass in a Type Safe Api without Typescript Infrastructure configured!"
        );
      }
      this.addDeps(
        `${tsApi.infrastructure.typescript?.package.packageName!}@${
          tsApi.infrastructure.typescript?.package.manifest.version
        }`
      );
      // Ensure handlers are built before infra
      tsApi.all.handlers?.forEach((handler) => {
        NxProject.ensure(this).addImplicitDependency(handler);
      });
    });

    cloudscapeReactTsWebsites.forEach((csWebsite) => {
      // Ensure website is built before infra
      this.addDevDeps(
        `${csWebsite.package.packageName}@${csWebsite.package.manifest.version}`
      );
    });

    const mustacheConfig = {
      stackName: options.stackName || DEFAULT_STACK_NAME,
      typeSafeApis: this.generateTypeSafeMustacheConfig(typeSafeApis),
      cloudscapeReactTsWebsites: cloudscapeReactTsWebsites.map((csWebsite) => {
        const websiteName = this.capitalize(
          csWebsite.package.packageName
            .replace(/[^a-z0-9_]+/gi, "")
            .replace(/^[0-9]+/gi, "")
        );
        return {
          websiteName,
          websiteNameLowercase: websiteName.toLowerCase(),
          websiteDistRelativePath: path.relative(
            this.outdir,
            `${csWebsite.outdir}/build`
          ),
          typeSafeApis: this.generateTypeSafeMustacheConfig(
            csWebsite.typeSafeApis
          ),
        };
      }),
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

  private generateTypeSafeMustacheConfig(typeSafeApis?: TypeSafeApiProject[]) {
    return typeSafeApis?.map((tsApi, idx) => {
      const apiName = this.capitalize(
        tsApi.model
          .apiName!.replace(/[^a-z0-9_]+/gi, "")
          .replace(/^[0-9]+/gi, "")
      );
      return {
        apiName,
        apiNameLowercase: apiName?.toLowerCase(),
        infraPackage: tsApi.infrastructure.typescript?.package.packageName,
        isLast: idx === typeSafeApis.length - 1,
      };
    });
  }

  private capitalize(word: string) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  private emitSampleFiles(
    dir: string,
    pathPrefixes: string[] = [],
    mustacheConfig: any
  ) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((f) => {
      if (f.isDirectory()) {
        this.emitSampleFiles(
          `${dir}/${f.name}`,
          [...pathPrefixes, f.name],
          mustacheConfig
        );
      } else if (f.name.endsWith("api.ts.mustache")) {
        mustacheConfig.typeSafeApis.forEach((tsApi: any) => {
          new SampleFile(
            this,
            `${path.join(...pathPrefixes, `${tsApi.apiNameLowercase}.ts`)}`,
            {
              contents: Mustache.render(
                fs.readFileSync(`${dir}/${f.name}`).toString(),
                tsApi
              ),
            }
          );
        });
      } else if (f.name.endsWith("website.ts.mustache")) {
        mustacheConfig.cloudscapeReactTsWebsites.forEach((csWebsite: any) => {
          new SampleFile(
            this,
            `${path.join(
              ...pathPrefixes,
              `${csWebsite.websiteNameLowercase}.ts`
            )}`,
            {
              contents: Mustache.render(
                fs.readFileSync(`${dir}/${f.name}`).toString(),
                csWebsite
              ),
            }
          );
        });
      } else {
        new SampleFile(
          this,
          `${path.join(...pathPrefixes, f.name.replace(".mustache", ""))}`,
          {
            contents: Mustache.render(
              fs.readFileSync(`${dir}/${f.name}`).toString(),
              mustacheConfig
            ),
          }
        );
      }
    });
  }
}
