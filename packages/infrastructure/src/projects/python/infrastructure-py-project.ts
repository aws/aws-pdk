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
import { InfrastructureCommands } from "../../components/infrastructure-commands";
import { DEFAULT_STACK_NAME } from "../../consts";

/**
 * Configuration options for the InfrastructurePyProject.
 */
export interface InfrastructurePyProjectOptions extends AwsCdkPythonAppOptions {
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
   * TypeSafeApi instance to use when setting up the initial project sample code.
   */
  readonly typeSafeApis?: TypeSafeApiProject[];

  /**
   * CloudscapeReactTsWebsiteProject instance to use when setting up the initial project sample code.
   */
  readonly cloudscapeReactTsWebsites?: CloudscapeReactTsWebsiteProject[];
}

/**
 * Synthesizes a Infrastructure Python Project.
 */
export class InfrastructurePyProject extends AwsCdkPythonApp {
  constructor(options: InfrastructurePyProjectOptions) {
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
            path.resolve(
              __dirname,
              "../../../samples/infrastructure/python/README.md"
            )
          )
          .toString(),
      },
    });

    InfrastructureCommands.ensure(this);

    ["pytest@^7", "syrupy@^4"].forEach((devDep) =>
      this.addDevDependency(devDep)
    );
    ["aws_pdk@^0", "python@^3.9"].forEach((dep) => this.addDependency(dep));

    const srcDir = path.resolve(
      __dirname,
      "../../../samples/infrastructure/python/src"
    );
    const testDir = path.resolve(
      __dirname,
      "../../../samples/infrastructure/python/test"
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
      if (!tsApi.infrastructure.python) {
        throw new Error(
          "Cannot pass in a Type Safe Api without Python Infrastructure configured!"
        );
      }
      NxProject.ensure(this).addPythonPoetryDependency(
        tsApi.infrastructure.python
      );
      // Ensure handlers are built before infra
      tsApi.all.handlers?.forEach((handler) => {
        NxProject.ensure(this).addImplicitDependency(handler);
      });
    });

    cloudscapeReactTsWebsites.forEach((csWebsite) => {
      // Ensure website is built before infra
      NxProject.ensure(this).addImplicitDependency(csWebsite);
    });

    const mustacheConfig = {
      stackName: options.stackName || DEFAULT_STACK_NAME,
      moduleName,
      typeSafeApis: this.generateTypeSafeMustacheConfig(
        moduleName,
        typeSafeApis
      ),
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
            moduleName,
            csWebsite.typeSafeApis
          ),
        };
      }),
    };

    const tstDir = "tests";

    options.sample !== false &&
      this.emitSampleFiles(srcDir, [this.moduleName], mustacheConfig);
    options.sample !== false &&
      this.emitSampleFiles(testDir, [tstDir], mustacheConfig);

    this.testTask.reset(
      `poetry run pytest ${tstDir}/ \${CI:-'--snapshot-update'}`
    );
  }

  private generateTypeSafeMustacheConfig(
    moduleName: string,
    typeSafeApis?: TypeSafeApiProject[]
  ) {
    return typeSafeApis?.map((tsApi, idx) => {
      const apiName = this.capitalize(
        tsApi.model
          .apiName!.replace(/[^a-z0-9_]+/gi, "")
          .replace(/^[0-9]+/gi, "")
      );
      return {
        apiName,
        apiNameLowercase: apiName?.toLowerCase(),
        infraPackage: tsApi.infrastructure.python?.moduleName,
        moduleName,
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
        return this.emitSampleFiles(
          `${dir}/${f.name}`,
          [...pathPrefixes, f.name],
          mustacheConfig
        );
      } else if (f.name.endsWith("api.py.mustache")) {
        mustacheConfig.typeSafeApis.forEach((tsApi: any) => {
          new SampleFile(
            this,
            `${path.join(...pathPrefixes, `${tsApi.apiNameLowercase}.py`)}`,
            {
              contents: Mustache.render(
                fs.readFileSync(`${dir}/${f.name}`).toString(),
                tsApi
              ),
            }
          );
        });
      } else if (f.name.endsWith("website.py.mustache")) {
        mustacheConfig.cloudscapeReactTsWebsites.forEach((csWebsite: any) => {
          new SampleFile(
            this,
            `${path.join(
              ...pathPrefixes,
              `${csWebsite.websiteNameLowercase}.py`
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
