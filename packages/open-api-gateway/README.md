## OpenAPI Gateway

Define your APIs using [OpenAPI v3](https://swagger.io/specification/), and leverage the power of generated clients, automatic input validation, and type safe client and server code!

This package vends a projen project type which allows you to define an API using [OpenAPI v3](https://swagger.io/specification/), and a construct which manages deploying this API in API Gateway, given a lambda integration for every operation.

The project will generate models and clients from your OpenAPI spec in your desired languages, and can be utilised both client side or server side in lambda handlers. The project type also generates a wrapper construct which adds type safety to ensure a lambda integration is provided for every API integration.

_Currently only Typescript is supported, but more languages are coming soon!_

### Project

It's recommended that this project is used as part of an `nx_monorepo` project. You can still use this as a standalone project if you like (eg `npx projen new --from @aws-prototyping-sdk/open-api-gateway open-api-gateway-ts`), however you will need to manage build order (ie building the generated client first, followed by the project).

For usage in a monorepo:

Create the project in your .projenrc:

```ts
import {ClientLanguage, OpenApiGatewayTsProject} from "@aws-prototyping-sdk/open-api-gateway";

new OpenApiGatewayTsProject({
  parent: myNxMonorepo,
  defaultReleaseBranch: "mainline",
  name: "my-api",
  outdir: "packages/api",
  clientLanguages: [ClientLanguage.TYPESCRIPT],
});
```

In the output directory (`outdir`), you'll find a few files to get you started.

```
|_ spec/
    |_ spec.yaml - The OpenAPI specification - edit this to define your API
|_ src/
    |_ api.ts - A CDK construct which defines the API Gateway resources to deploy your API. 
    |           This wraps the OpenApiGatewayLambdaApi construct and provides typed interfaces for integrations specific
    |           to your API. You shouldn't need to modify this, instead just extend it as in sample-api.ts.
    |_ sample-api.ts - Example usage of the construct defined in api.ts.
    |_ say-hello.handler.ts - An example lambda handler for the operation defined in spec.yaml, making use of the
                              generated lambda handler wrappers for marshalling and type safety.
|_ generated/
    |_ typescript/ - A generated typescript API client, including with generated lambda handler wrappers
```

If you would not like the sample code to be generated, you can pass `sampleCode: false` to `OpenApiGatewayTsProject`.

To make changes to your api, simply update `spec.yaml` and run `npx projen` to regenerate all the generated code!

### Construct

A sample construct is generated which provides a type-safe interface for creating an API Gateway API based on your OpenAPI specification. You'll get a type error if you forget to define an integration for an operation defined in your api.

```ts
import * as path from 'path';
import { AuthorizationType } from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { Api } from './api';

/**
 * An example of how to wire lambda handler functions to the API
 */
export class SampleApi extends Api {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      authType: AuthorizationType.IAM,
      integrations: {
        // Every operation defined in your API must have an integration defined!
        sayHello: {
          function: new NodejsFunction(scope, 'SayHelloHandler', {
            entry: path.join(__dirname, 'say-hello.handler.ts'),
          }),
        },
      },
    });
  }
}
```

### Generated Client

The [typescript-fetch](https://openapi-generator.tech/docs/generators/typescript-fetch/) OpenAPI generator is used to generate OpenAPI clients for typescript.

Example usage of the client in a website:

```ts
import { Configuration, DefaultApi } from "my-api-typescript-client";

const client = new DefaultApi(new Configuration({
  basePath: "https://xxxxxxxxxx.execute-api.ap-southeast-2.amazonaws.com",
  fetchApi: window.fetch.bind(window),
}));

await client.sayHello({ name: "Jack" });
```

### Lambda Handler Wrappers

Lambda handler wrappers are also importable from the generated client. These provide input/output type safety, as well as allowing you to define a custom type for API error responses.

```ts
import { sayHelloHandler, ApiError } from "my-api-typescript-client";

export const handler = sayHelloHandler<ApiError>(async (input) => {
  return {
    statusCode: 200,
    body: {
      message: `Hello ${input.requestParameters.name}!`,
    },
  };
});
```
