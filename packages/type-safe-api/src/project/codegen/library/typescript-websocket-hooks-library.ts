/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { TypeScriptJsxMode } from "projen/lib/javascript";
import {
  GeneratedTypescriptLibraryProject,
  GeneratedTypescriptLibraryProjectOptions,
} from "./generated-typescript-library-project";
import { WebSocketLibrary } from "../../languages";
import { CodegenOptions } from "../components/utils";

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
      tsconfig: options.tsconfig ?? {
        compilerOptions: {
          jsx: TypeScriptJsxMode.REACT,
        },
      },
    });
    this.options = options;

    this.addDevDeps("react", "@types/react");
    this.addPeerDeps("react");
  }

  protected buildCodegenOptions(): CodegenOptions {
    return {
      specPath: this.options.specPath,
      templateDirs: [WebSocketLibrary.TYPESCRIPT_WEBSOCKET_HOOKS],
      metadata: {
        srcDir: this.srcdir,
        websocketClientPackageName: this.options.clientPackageName,
      },
    };
  }
}
