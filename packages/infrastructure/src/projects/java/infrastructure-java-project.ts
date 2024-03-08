/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as fs from "fs";
import * as path from "path";
import { CloudscapeReactTsWebsiteProject } from "@aws/cloudscape-react-ts-website";
import { NxProject } from "@aws/monorepo";
import { TypeSafeApiProject } from "@aws/type-safe-api";
import * as Mustache from "mustache";
import { SampleFile } from "projen";
import { AwsCdkJavaApp } from "projen/lib/awscdk";
import { AwsCdkJavaAppOptions } from "./aws-cdk-java-app-options";
import { InfrastructureCommands } from "../../components/infrastructure-commands";
import { DEFAULT_STACK_NAME } from "../../consts";

/**
 * Configuration options for the InfrastructureJavaProject.
 */
export interface InfrastructureJavaProjectOptions extends AwsCdkJavaAppOptions {
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
 * Synthesizes a Infrastructure Java Project.
 */
export class InfrastructureJavaProject extends AwsCdkJavaApp {
  constructor(options: InfrastructureJavaProjectOptions) {
    const groupId = options.groupId ?? "software.aws.infra";
    const artifactId = options.artifactId ?? "infra";

    super({
      ...options,
      cdkVersion: options.cdkVersion ?? "2.1.0",
      sample: false,
      junit: false,
      groupId,
      artifactId,
      mainClass: `${groupId}.Main`,
      version: options.version ?? "0.0.0",
      name: options.name,
      readme: {
        contents: fs
          .readFileSync(
            path.resolve(
              __dirname,
              "../../../samples/infrastructure/java/README.md"
            )
          )
          .toString(),
      },
    });

    InfrastructureCommands.ensure(this);

    this.pom.addPlugin("org.apache.maven.plugins/maven-surefire-plugin@3.1.2");
    this.pom.addPlugin("org.apache.maven.plugins/maven-compiler-plugin@3.8.1", {
      configuration: {
        release: "11",
      },
    });

    if (options.junit !== false) {
      [
        "org.junit.jupiter/junit-jupiter-api@^5",
        "org.junit.jupiter/junit-jupiter-engine@^5",
        "io.github.origin-energy/java-snapshot-testing-junit5@^4.0.6",
        "io.github.origin-energy/java-snapshot-testing-plugin-jackson@^4.0.6",
        "org.slf4j/slf4j-simple@2.0.0-alpha0",
      ].forEach((d) => this.addTestDependency(d));
      this.testTask.exec("mvn test");
    }

    this.addDependency("software.aws/pdk@^0");

    const srcDir = path.resolve(
      __dirname,
      "../../../samples/infrastructure/java/src"
    );
    const testDir = path.resolve(
      __dirname,
      "../../../samples/infrastructure/java/test"
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
      if (!tsApi.infrastructure.java) {
        throw new Error(
          "Cannot pass in a Type Safe Api without Java Infrastructure configured!"
        );
      }
      NxProject.ensure(this).addJavaDependency(tsApi.infrastructure.java);
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
      groupId,
      typeSafeApis: this.generateTypeSafeMustacheConfig(groupId, typeSafeApis),
      cloudscapeReactTsWebsites: cloudscapeReactTsWebsites.map((csWebsite) => {
        const websiteName = this.capitalize(
          csWebsite.package.packageName
            .replace(/[^a-z0-9_]+/gi, "")
            .replace(/^[0-9]+/gi, "")
        );
        return {
          websiteName,
          websiteNameLowercase: websiteName.toLowerCase(),
          groupId,
          websiteDistRelativePath: path.relative(
            this.outdir,
            `${csWebsite.outdir}/build`
          ),
          typeSafeApis: this.generateTypeSafeMustacheConfig(
            groupId,
            csWebsite.typeSafeApis
          ),
        };
      }),
    };

    options.sample !== false &&
      this.emitSampleFiles(srcDir, ["src", "main"], mustacheConfig);
    options.sample !== false &&
      this.emitSampleFiles(testDir, ["src", "test"], mustacheConfig);
  }

  private generateTypeSafeMustacheConfig(
    groupId: string,
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
        groupId,
        infraPackage: `${tsApi?.infrastructure.java?.pom.groupId}.${tsApi?.infrastructure.java?.pom.name}.infra`,
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
          [
            ...pathPrefixes,
            ...(f.name === "groupId"
              ? mustacheConfig.groupId.split(".")
              : [f.name]),
          ],
          mustacheConfig
        );
      } else if (f.name.endsWith("ApiConstruct.java.mustache")) {
        mustacheConfig.typeSafeApis.forEach((tsApi: any) => {
          new SampleFile(
            this,
            `${path.join(...pathPrefixes, `${tsApi.apiName}.java`)}`,
            {
              contents: Mustache.render(
                fs.readFileSync(`${dir}/${f.name}`).toString(),
                tsApi
              ),
            }
          );
        });
      } else if (f.name.endsWith("WebsiteConstruct.java.mustache")) {
        mustacheConfig.cloudscapeReactTsWebsites.forEach((csWebsite: any) => {
          new SampleFile(
            this,
            `${path.join(...pathPrefixes, `${csWebsite.websiteName}.java`)}`,
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
          `${path.join(...pathPrefixes, f.name.replace(".mustache", ""))}`,
          {
            contents,
            sourcePath: (!contents && `${dir}/${f.name}`) || undefined,
          }
        );
      }
    });
  }
}
