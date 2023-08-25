/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as fs from "fs";
import * as path from "path";
import { CloudscapeReactTsWebsiteProject } from "@aws-pdk/cloudscape-react-ts-website";
import { NxProject } from "@aws-pdk/monorepo";
import { TypeSafeApiProject } from "@aws-pdk/type-safe-api";
import * as Mustache from "mustache";
import { SampleFile } from "projen";
import { AwsCdkJavaApp } from "projen/lib/awscdk";
import { AwsCdkJavaAppOptions } from "./aws-cdk-java-app-options";

/**
 * Configuration options for the InfrastructureJavaProject.
 */
export interface InfrastructureJavaProjectOptions extends AwsCdkJavaAppOptions {
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
export class InfrastructureJavaProject extends AwsCdkJavaApp {
  constructor(options: InfrastructureJavaProjectOptions) {
    const hasApi = !!options.typeSafeApi;
    const hasWebsite = !!options.cloudscapeReactTsWebsite;
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
            path.resolve(__dirname, "../../../samples/java/README.md")
          )
          .toString(),
      },
    });

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
    }

    this.addDependency("software.aws/aws-pdk@^0");

    const srcDir = path.resolve(__dirname, "../../../samples/java/src");
    const testDir = path.resolve(__dirname, "../../../samples/java/test");

    if (hasApi) {
      if (!options.typeSafeApi.infrastructure.java) {
        throw new Error(
          "Cannot pass in a Type Safe Api without Java Infrastructure configured!"
        );
      }
      NxProject.ensure(this).addJavaDependency(
        options.typeSafeApi.infrastructure.java
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
      infraPackage: `${options.typeSafeApi?.infrastructure.java?.pom.groupId}.${options.typeSafeApi?.infrastructure.java?.pom.name}.infra`,
      groupId,
      websiteDistRelativePath:
        hasWebsite &&
        path.relative(
          this.outdir,
          `${options.cloudscapeReactTsWebsite?.outdir}/build`
        ),
    };

    options.sample !== false &&
      this.emitSampleFiles(srcDir, ["src", "main"], mustacheConfig);
    options.sample !== false &&
      this.emitSampleFiles(testDir, ["src", "test"], mustacheConfig);
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
            [
              ...pathPrefixes,
              ...(f.name === "groupId"
                ? mustacheConfig.groupId.split(".")
                : [f.name]),
            ],
            mustacheConfig
          );
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
