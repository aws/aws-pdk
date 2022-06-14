/*********************************************************************************************************************
 Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License").
 You may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 ******************************************************************************************************************** */

/**
 * Options for typescript sample code generation
 */
export interface TypescriptSampleCodeOptions {
  /**
   * The package name which exports the OpenApiGatewayLambdaApi construct (ie this pdk package!)
   */
  readonly openApiGatewayPackageName: string;
  /**
   * The name of the generated typescript client package
   */
  readonly typescriptClientPackageName: string;
  /**
   * Whether or not to generate sample code
   */
  readonly sampleCode?: boolean;
  /**
   * Source code directory
   */
  readonly srcdir: string;
}

/**
 * Return a map of file name to contents for the sample typescript source code
 */
export const getTypescriptSampleSource = (
  options: TypescriptSampleCodeOptions
): { [fileName: string]: string } => ({
  "index.ts": ["export * from './api';", "export * from './sample-api';"].join(
    "\n"
  ),
  // This file provides a type-safe interface to the exported OpenApiGatewayLambdaApi construct
  "api.ts": `import { OpenApiGatewayLambdaApi, OpenApiGatewayLambdaApiProps, OpenApiIntegration } from "${options.openApiGatewayPackageName}";
import { Construct } from "constructs";
import { OperationLookup, OperationConfig } from "${options.typescriptClientPackageName}";
import spec from "../spec/parsed-spec.json";

export type ApiIntegrations = OperationConfig<OpenApiIntegration>;

export interface ApiProps extends Omit<OpenApiGatewayLambdaApiProps, "spec" | "operationLookup" | "integrations"> {
  readonly integrations: ApiIntegrations;
}

/**
 * Construct for the API Gateway resources defined by the spec
 */
export class Api extends OpenApiGatewayLambdaApi {
  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id, {
      ...props,
      integrations: props.integrations as any,
      spec,
      operationLookup: OperationLookup as any,
    });
  }
}
`,
  ...(options.sampleCode !== false
    ? {
        // Generate an example which instantiates the Api construct
        // TODO: Consider generating this sample from the parsed spec
        "sample-api.ts": `import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { AuthorizationType } from "aws-cdk-lib/aws-apigateway";
import * as path from "path";
import { Api } from "./api";

/**
 * An example of how to wire lambda handler functions to the API
 */
export class SampleApi extends Api {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      authType: AuthorizationType.IAM,
      integrations: {
        sayHello: {
          function: new NodejsFunction(scope, "SayHelloHandler", {
            entry: path.join(__dirname, "say-hello.handler.ts"),
          }),
        },
      },
    });
  }
}
`,
        // Generate an example lambda handler
        "say-hello.handler.ts": `import { sayHelloHandler, ApiError } from "${options.typescriptClientPackageName}";

/**
 * An example lambda handler which uses the generated handler wrapper to manage marshalling inputs/outputs.
 */
export const handler = sayHelloHandler<ApiError>(async (input) => {
  return {
    statusCode: 200,
    body: {
      message: \`Hello \${input.requestParameters.name}!\`,
    },
  };
});
`,
      }
    : {}),
});

/**
 * Return a map of file name to contents for the sample typescript test code
 */
export const getTypescriptSampleTests = (
  options: TypescriptSampleCodeOptions
) => ({
  "api.test.ts": `import { Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { OperationLookup } from "${options.typescriptClientPackageName}";
import { Api } from "../${options.srcdir}";

/**
 * A simple test to ensure the api construct synthesizes correctly
 */
describe("Api", () => {
  it("should synthesize", () => {
    const stack = new Stack();
    new Api(stack, "ApiTest", {
      // Create a dummy integration for every operation defined in the api
      integrations: Object.fromEntries(Object.keys(OperationLookup).map((operation) => [operation, {
        function: new Function(stack, \`\${operation}Lambda\`, {
          code: Code.fromInline("test"), handler: "test", runtime: Runtime.NODEJS_14_X,
        }),
      }]),
      ) as any,
    });
  
    const template = Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();
  });
});
`,
});
