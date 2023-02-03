/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
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
   * Api source code directory, relative to the project root
   */
  readonly apiSrcDir: string;
  /**
   * Directory where the parsed spec is output
   */
  readonly specDir: string;
  /**
   * Name of the parsed spec file
   */
  readonly parsedSpecFileName: string;
}

/**
 * Return a map of file name to contents for the sample typescript source code
 */
export const getTypescriptSampleSource = (
  options: TypescriptSampleCodeOptions
): { [fileName: string]: string } => ({
  "index.ts": [
    "export * from './api';",
    ...(options.sampleCode !== false ? ["export * from './sample-api';"] : []),
  ].join("\n"),
  // This file provides a type-safe interface to the exported OpenApiGatewayRestApi construct
  "api.ts": `import { OpenApiGatewayRestApi, OpenApiGatewayRestApiProps, OpenApiIntegration } from "${options.openApiGatewayPackageName}";
import { Construct } from "constructs";
import { OperationLookup, OperationConfig } from "${options.typescriptClientPackageName}";
import * as path from "path";
import spec from "../${options.specDir}/${options.parsedSpecFileName}";

export type ApiIntegrations = OperationConfig<OpenApiIntegration>;

export interface ApiProps extends Omit<OpenApiGatewayRestApiProps, "spec" | "specPath" | "operationLookup" | "integrations"> {
  readonly integrations: ApiIntegrations;
}

/**
 * Type-safe construct for the API Gateway resources defined by the spec.
 * You will likely not need to modify this file, and can instead extend it and define your integrations.
 */
export class Api extends OpenApiGatewayRestApi {
  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id, {
      ...props,
      integrations: props.integrations as any,
      spec,
      specPath: path.resolve(__dirname, "../${options.specDir}/${options.parsedSpecFileName}"),
      operationLookup: OperationLookup as any,
    });
  }
}
`,
  ...(options.sampleCode !== false
    ? {
        // Generate an example which instantiates the Api construct
        // TODO: Consider generating this sample from the parsed spec
        "sample-api.ts": `import { Authorizers, Integrations } from "${options.openApiGatewayPackageName}";
import { Construct } from "constructs";
import { Cors } from "aws-cdk-lib/aws-apigateway";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Api } from "./api";

/**
 * An example of how to wire lambda handler functions to the API
 */
export class SampleApi extends Api {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      defaultAuthorizer: Authorizers.iam(),
      corsOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
      integrations: {
        sayHello: {
          integration: Integrations.lambda(new NodejsFunction(scope, "say-hello")),
        },
      },
    });
  }
}
`,
        // Generate an example lambda handler
        "sample-api.say-hello.ts": `import { sayHelloHandler } from "${options.typescriptClientPackageName}";

/**
 * An example lambda handler which uses the generated handler wrapper to manage marshalling inputs/outputs.
 */
export const handler = sayHelloHandler(async ({ input }) => {
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
    },
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
  "api.test.ts": `import { Integrations } from "${options.openApiGatewayPackageName}";
import { Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { OperationLookup } from "${options.typescriptClientPackageName}";
import { Api } from "../${options.apiSrcDir}";

/**
 * A simple test to ensure the api construct synthesizes correctly
 */
describe("Api", () => {
  it("should synthesize", () => {
    const stack = new Stack();
    new Api(stack, "ApiTest", {
      // Create a dummy integration for every operation defined in the api
      integrations: Object.fromEntries(Object.keys(OperationLookup).map((operation) => [operation, {
        integration: Integrations.lambda(new Function(stack, \`\${operation}Lambda\`, {
          code: Code.fromInline("test"), handler: "test", runtime: Runtime.NODEJS_14_X,
        })),
      }])) as any,
    });
  
    const template = Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();
  });
});
`,
});
