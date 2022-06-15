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
    |_ typescript/ - A generated typescript API client, including generated lambda handler wrappers
```

If you would prefer to not generate the sample code, you can pass `sampleCode: false` to `OpenApiGatewayTsProject`.

To make changes to your api, simply update `spec.yaml` and run `npx projen` to synthesize all the typesafe client/server code!

### OpenAPI Specification

Your `spec.yaml` file defines your api using [OpenAPI Version 3.0.3](https://swagger.io/specification/). An example spec might look like:

```yaml
openapi: 3.0.3
info:
  version: 1.0.0
  title: Example API
paths:
  /hello:
    get:
      operationId: sayHello
      parameters:
        - in: query
          name: name
          schema:
            type: string
          required: true
      responses:
        '200':
          description: Successful response
          content:
            'application/json':
              schema:
                $ref: '#/components/schemas/HelloResponse'
components:
  schemas:
    HelloResponse:
      type: object
      properties:
        message:
          type: string
      required:
        - message
```

You can divide your specification into multiple files using `$ref`.

For example, you might choose to structure your spec as follows:

```
|_ spec/
    |_ spec.yaml
    |_ paths/
        |_ index.yaml
        |_ sayHello.yaml
    |_ schemas/
        |_ index.yaml
        |_ helloResponse.yaml
```

Where `spec.yaml` looks as follows:

```yaml
openapi: 3.0.3
info:
  version: 1.0.0
  title: Example API
paths:
  $ref: './paths/index.yaml'
components:
  schemas:
    $ref: './schemas/index.yaml'
```

`paths/index.yaml`:

```yaml
/hello:
  get:
    $ref: './sayHello.yaml''\
```

`paths/sayHello.yaml`:

```yaml
operationId: sayHello
parameters:
 - in: query
   name: name
   schema:
     type: string
   required: true
responses:
  '200':
    description: Successful response
    content:
      'application/json':
        schema:
          $ref: '../schemas/helloResponse.yaml'
```

`schemas/index.yaml`:

```yaml
HelloResponse:
  $ref: './helloResponse.yaml'
```

`schemas/helloResponse.yaml`:

```yaml
type: object
properties:
  message:
    type: string
required:
  - message
```

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

### Other Details

#### Workspaces and `OpenApiGatewayTsProject`

`OpenApiGatewayTsProject` can be used as part of a monorepo using YARN/NPM/PNPM workspaces. When used in a monorepo, a dependency is established between `OpenApiGatewayTsProject` and the generated typescript client, which is expected to be managed by the parent monorepo (ie both `OpenApiGatewayTsProject` and the generated typescript client are parented by the monorepo).

During initial project synthesis, the dependency between `OpenApiGatewayTsProject` and the generated client is established via workspace configuration local to `OpenApiGatewayTsProject`, since the parent monorepo will not have updated to include the new packages in time for the initial "install".

When the package manager is PNPM, this initial workspace is configured by creating a local `pnpm-workspace.yaml` file, and thus if you specify your own for an instance of `OpenApiGatewayTsProject`, synthesis will fail. It is most likely that you will not need to define this file locally in `OpenApiGatewayTsProject` since the monorepo copy should be used to manage all packages within the repo, however if managing this file at the `OpenApiGatewayTsProject` level is required, please use the `pnpmWorkspace` property of `OpenApiGatewayTsProject`.
