/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { TypeScriptJsxMode } from "projen/lib/javascript";
import {
  GeneratedTypescriptLibraryProject,
  GeneratedTypescriptLibraryProjectOptions,
} from "./generated-typescript-library-project";
import { WebSocketLibrary } from "../../languages";
import { OpenApiGeneratorIgnoreFile } from "../components/open-api-generator-ignore-file";
import { GenerationOptions } from "../components/utils";

/**
 * Configuration for the generated typescript websocket hooks project
 */
export interface TypescriptWebsocketHooksLibraryOptions
  extends GeneratedTypescriptLibraryProjectOptions {
  readonly clientPackageName: string;
}

/**
 * Typescript project containing generated websocket hooks
 */
export class TypescriptWebsocketHooksLibrary extends GeneratedTypescriptLibraryProject {
  protected readonly options: TypescriptWebsocketHooksLibraryOptions;

  constructor(options: TypescriptWebsocketHooksLibraryOptions) {
    super({
      ...options,
      tsconfig: {
        compilerOptions: {
          jsx: TypeScriptJsxMode.REACT,
        },
      },
    });
    this.options = options;

    this.addDevDeps("react", "@types/react");
    this.addPeerDeps("react");

    this.openapiGeneratorIgnore.addPatterns(
      // Ignore all but relevant hooks files
      ...OpenApiGeneratorIgnoreFile.ALL_FILES_PATTERNS,
      `!${this.srcdir}/index.ts`,
      `!${this.srcdir}/hooks/*`,
      `!${this.srcdir}/hooks/**/*`
    );
  }

  public buildOpenApiGeneratorOptions(): GenerationOptions {
    return {
      generator: "typescript-fetch",
      specPath: this.options.specPath,
      generatorDirectory: WebSocketLibrary.TYPESCRIPT_WEBSOCKET_HOOKS,
      additionalProperties: {
        npmName: this.package.packageName,
        typescriptThreePlus: "true",
        useSingleParameter: "true",
        supportsES6: "true",
      },
      srcDir: this.srcdir,
      normalizers: {
        KEEP_ONLY_FIRST_TAG_IN_OPERATION: true,
      },
      extraVendorExtensions: {
        "x-websocket-client-package-name": this.options.clientPackageName,
      },
    };
  }
}
