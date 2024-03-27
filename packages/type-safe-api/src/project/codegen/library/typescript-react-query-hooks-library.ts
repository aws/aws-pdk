/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { TypeScriptJsxMode } from "projen/lib/javascript";
import {
  GeneratedTypescriptLibraryProject,
  GeneratedTypescriptLibraryProjectOptions,
} from "./generated-typescript-library-project";
import { Library } from "../../languages";
import { OpenApiGeneratorHandlebarsIgnoreFile } from "../components/open-api-generator-handlebars-ignore-file";
import { GenerationOptions } from "../components/utils";

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
      tsconfig: {
        compilerOptions: {
          jsx: TypeScriptJsxMode.REACT,
        },
      },
    });

    // Add dependencies on react-query and react
    this.addDeps("@tanstack/react-query@^4"); // Pin at 4 for now - requires generated code updates to upgrade to 5
    this.addDevDeps("react", "@types/react");
    this.addPeerDeps("react");

    // Ignore the hooks, since they're generated with the handlebars templating engine
    const hooksPattern = "**/*Hooks.ts";
    this.openapiGeneratorIgnore.addPatterns(hooksPattern);

    // The hooks are generated using the handlebars templating engine, so we include a handlebars ignore file
    const handlebarsIgnore = new OpenApiGeneratorHandlebarsIgnoreFile(this);
    handlebarsIgnore.addPatterns(`!${hooksPattern}`);
  }

  public buildOpenApiGeneratorOptions(): GenerationOptions {
    return {
      generator: "typescript-fetch",
      specPath: this.options.specPath,
      generatorDirectory: Library.TYPESCRIPT_REACT_QUERY_HOOKS,
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
    };
  }
}
