/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as fs from "fs";
import * as path from "path";
import {
  TypeSafeApiProject,
  TypeSafeWebSocketApiProject,
} from "@aws/type-safe-api";
import * as Mustache from "mustache";
import { SampleDir } from "projen";
import { NodePackageManager, NodeProject } from "projen/lib/javascript";
import { ReactTypeScriptProject } from "projen/lib/web";
import { ReactTypeScriptProjectOptions } from "./react-ts-project-options";

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
   * @deprecated use typeSafeApis
   */
  readonly typeSafeApi?: TypeSafeApiProject;

  /**
   * TypeSafeApi instances to use when setting up the initial project sample code.
   */
  readonly typeSafeApis?: TypeSafeApiProject[];

  /**
   * TypeSafeWebSocketApi instances to use when setting up the initial project sample code
   */
  readonly typeSafeWebSocketApis?: TypeSafeWebSocketApiProject[];
}

/**
 * Synthesizes a Cloudscape React Typescript Website Project.
 *
 * @pjid cloudscape-react-ts-website
 */
export class CloudscapeReactTsWebsiteProject extends ReactTypeScriptProject {
  public readonly applicationName: string;
  public readonly publicDir: string;
  public readonly typeSafeApis?: TypeSafeApiProject[];
  public readonly typeSafeWebSocketApis?: TypeSafeWebSocketApiProject[];

  constructor(options: CloudscapeReactTsWebsiteProjectOptions) {
    super({
      ...options,
      defaultReleaseBranch: options.defaultReleaseBranch ?? "main",
      name: options.name,
      sampleCode: false,
      prettier: options.prettier || true,
      packageManager:
        options.parent && options.parent instanceof NodeProject
          ? options.parent.package.packageManager
          : options.packageManager ?? NodePackageManager.PNPM,
      readme: {
        contents: fs
          .readFileSync(
            path.resolve(
              __dirname,
              "../samples/cloudscape-react-ts-website/README.md"
            )
          )
          .toString(),
      },
      gitignore: [
        "public/runtime-config.json",
        "public/api.json",
        "public/*/api.json",
        ...(options.gitignore || []),
      ],
    });

    this.typeSafeApis = [
      ...(options.typeSafeApis || []),
      ...(options.typeSafeApi ? [options.typeSafeApi] : []),
    ];
    this.typeSafeWebSocketApis = options.typeSafeWebSocketApis ?? [];

    this.addDeps(
      "@aws-northstar/ui",
      "@cloudscape-design/components",
      "@cloudscape-design/board-components",
      "react-router-dom"
    );

    this.testTask.reset();
    const lintTask = this.tasks.tryFind("eslint");
    lintTask && this.testTask.spawn(lintTask);
    this.testTask.exec("react-scripts test --watchAll=false --passWithNoTests");

    this.applicationName = options.applicationName ?? "Sample App";
    this.publicDir = options.publicDir ?? "public";
    const srcDir = path.resolve(
      __dirname,
      "../samples/cloudscape-react-ts-website/src"
    );
    const publicDir = path.resolve(
      __dirname,
      "../samples/cloudscape-react-ts-website/public"
    );

    this.typeSafeApis.forEach((typeSafeApi) => {
      const hooks = typeSafeApi.library?.typescriptReactQueryHooks;
      const libraryHooksPackage = hooks?.package?.packageName;
      const libraryHooksPackageVersion = hooks?.package?.manifest.version;
      if (!libraryHooksPackage) {
        throw new Error(
          "Cannot pass in a Type Safe Api without React Hooks Library configured!"
        );
      }
      this.addDeps(`${libraryHooksPackage}@${libraryHooksPackageVersion}`);

      this.setupApiExplorer(typeSafeApi);
    });

    this.typeSafeWebSocketApis.forEach((typeSafeWebSocketApi) => {
      const hooks = typeSafeWebSocketApi.library?.typescriptWebSocketHooks;
      const client = typeSafeWebSocketApi.library?.typescriptWebSocketClient;
      if (!hooks || !client) {
        throw new Error(
          "Cannot pass in a Type Safe WebSocket Api without React Hooks Library configured"
        );
      }
      this.addDeps(
        `${hooks.package.packageName}@${hooks.package.manifest.version}`,
        `${client.package.packageName}@${client.package.manifest.version}`
      );

      this.setupApiExplorer(typeSafeWebSocketApi);
    });

    const apis = this.typeSafeApis.map((tsApi, idx) => ({
      apiName: tsApi.model.apiName,
      isLast: idx === this.typeSafeApis!.length - 1,
      apiNameSafe: tsApi.model.apiName
        ?.replace(/[^a-z0-9_]+/gi, "")
        .replace(/^[0-9]+/gi, ""),
      hooksPackage:
        tsApi.library?.typescriptReactQueryHooks?.package?.packageName,
    }));
    const webSocketApis = this.typeSafeWebSocketApis.map((tsApi, idx) => ({
      apiName: tsApi.model.apiName,
      isLast: idx === this.typeSafeWebSocketApis!.length - 1,
      apiNameSafe: tsApi.model.apiName
        ?.replace(/[^a-z0-9_]+/gi, "")
        .replace(/^[0-9]+/gi, ""),
      hooksPackage:
        tsApi.library?.typescriptWebSocketHooks?.package?.packageName,
      clientPackage:
        tsApi.library?.typescriptWebSocketClient?.package?.packageName,
    }));
    const mustacheConfig = {
      applicationName: this.applicationName,
      hasApis: apis.length + webSocketApis.length > 0,
      typeSafeApis: apis,
      typeSafeApisReversed: [...apis].reverse(),
      typeSafeWebSocketApis: webSocketApis,
      typeSafeWebSocketApisReversed: [...webSocketApis].reverse(),
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

    // Relax EsLint and TSC for dev
    this.tasks.tryFind("dev")?.env("ESLINT_NO_DEV_ERRORS", "true");
    this.tasks.tryFind("dev")?.env("TSC_COMPILE_ON_ERROR", "true");
  }

  private setupApiExplorer(
    tsApi: TypeSafeApiProject | TypeSafeWebSocketApiProject
  ) {
    this.addDevDeps("@types/swagger-ui-react", "@types/uuid");
    this.addDeps(
      "swagger-ui-react@5.5.0",
      "aws4fetch",
      "uuid",
      "@aws-crypto/sha256-js",
      "@aws-sdk/signature-v4",
      "@aws-sdk/protocol-http"
    );

    const targetApiSpecFolder = `public/${tsApi.model.apiName}`;
    const targetApiSpecPath = `${targetApiSpecFolder}/api.json`;
    this.preCompileTask.exec(`rm -rf ${targetApiSpecFolder}`);
    this.preCompileTask.exec(
      `mkdir -p ${targetApiSpecFolder} && cp ${path.relative(
        this.outdir,
        tsApi.model.outdir
      )}/.api.json ${targetApiSpecPath}`
    );
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
          mustacheConfig.typeSafeApis.length +
            mustacheConfig.typeSafeWebSocketApis.length >
            0 || !`${pathPrefixes.join("/")}${f.name}`.includes("ApiExplorer")
      )
      .filter(
        (f) =>
          mustacheConfig.typeSafeApis.length > 0 ||
          !`${pathPrefixes.join("/")}${f.name}`.includes("TypeSafeApiClient")
      )
      .filter(
        (f) =>
          mustacheConfig.typeSafeWebSocketApis.length > 0 ||
          !`${pathPrefixes.join("/")}${f.name}`.includes(
            "TypeSafeWebSocketApiClient"
          )
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
