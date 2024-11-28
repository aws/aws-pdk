/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { TypeScriptJsxMode } from "projen/lib/javascript";
import {
  GeneratedTypescriptLibraryProject,
  GeneratedTypescriptLibraryProjectOptions,
} from "./generated-typescript-library-project";
import { Language, Library } from "../../languages";
import { CodegenOptions } from "../components/utils";

/**
 * Configuration for the generated typescript client project
 */
export interface GeneratedTypescriptReactQueryHooksProjectOptions
  extends GeneratedTypescriptLibraryProjectOptions {
  /**
   * Set to true to use @tanstack/react-query version 5.x
   * @default false - @tanstack/react-query version 4.x is used
   */
  readonly useReactQueryV5?: boolean;
}

/**
 * Typescript project containing generated react-query hooks
 */
export class TypescriptReactQueryHooksLibrary extends GeneratedTypescriptLibraryProject {
  private readonly useReactQueryV5?: boolean;

  constructor(options: GeneratedTypescriptReactQueryHooksProjectOptions) {
    super({
      ...options,
      tsconfig: options.tsconfig ?? {
        compilerOptions: {
          jsx: TypeScriptJsxMode.REACT,
        },
      },
    });
    this.useReactQueryV5 = options.useReactQueryV5;

    // Add dependencies on react-query and react
    if (this.useReactQueryV5) {
      this.addDeps("@tanstack/react-query@^5");
    } else {
      this.addDeps("@tanstack/react-query@^4");
    }
    this.addDevDeps("react", "@types/react");
    this.addPeerDeps("react");
  }

  public buildCodegenOptions(): CodegenOptions {
    return {
      specPath: this.options.specPath,
      // Include the typescript client code in the hooks library
      templateDirs: [
        `${Language.TYPESCRIPT}/templates/client`,
        Library.TYPESCRIPT_REACT_QUERY_HOOKS,
      ],
      metadata: {
        srcDir: this.srcdir,
        queryV5: !!this.useReactQueryV5,
      },
    };
  }
}
