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
  extends GeneratedTypescriptLibraryProjectOptions {}

/**
 * Typescript project containing generated react-query hooks
 */
export class TypescriptReactQueryHooksLibrary extends GeneratedTypescriptLibraryProject {
  constructor(options: GeneratedTypescriptReactQueryHooksProjectOptions) {
    super({
      ...options,
      tsconfig: options.tsconfig ?? {
        compilerOptions: {
          jsx: TypeScriptJsxMode.REACT,
        },
      },
    });

    // Add dependencies on react-query and react
    this.addDeps("@tanstack/react-query@^4"); // Pin at 4 for now - requires generated code updates to upgrade to 5
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
      },
    };
  }
}
