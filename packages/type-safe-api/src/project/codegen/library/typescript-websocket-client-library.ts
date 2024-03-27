/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  GeneratedTypescriptLibraryProject,
  GeneratedTypescriptLibraryProjectOptions,
} from "./generated-typescript-library-project";
import { WebSocketLibrary } from "../../languages";
import { GenerationOptions } from "../components/utils";

/**
 * Configuration for the generated typescript websocket client project
 */
export interface TypescriptWebsocketClientLibraryOptions
  extends GeneratedTypescriptLibraryProjectOptions {}

/**
 * Typescript project containing a generated websocket client
 */
export class TypescriptWebsocketClientLibrary extends GeneratedTypescriptLibraryProject {
  constructor(options: TypescriptWebsocketClientLibraryOptions) {
    super(options);

    this.addDeps(
      // Browser + node compatible websockets
      "ws@^8",
      "isomorphic-ws@^5",
      // For sigv4 signing
      "@aws-crypto/sha256-js",
      "@aws-sdk/signature-v4",
      "@aws-sdk/protocol-http",
      "@aws-sdk/types",
      "uuid@^9"
    );
    this.addDeps("@types/ws@^8", "@types/uuid@^9");

    this.openapiGeneratorIgnore.addPatterns(
      // Skip generating http clients
      `${this.srcdir}/apis/*`,
      `${this.srcdir}/apis/**/*`
    );
  }

  public buildOpenApiGeneratorOptions(): GenerationOptions {
    return {
      generator: "typescript-fetch",
      specPath: this.options.specPath,
      generatorDirectory: WebSocketLibrary.TYPESCRIPT_WEBSOCKET_CLIENT,
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
