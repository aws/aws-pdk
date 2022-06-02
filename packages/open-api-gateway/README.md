## OpenAPI Gateway

This package vends a projen project type which allows you to define an API using [OpenAPI v3](https://swagger.io/specification/), and a construct which manages deploying this API in API Gateway, given a defined lambda integration for every operation.

The project will generate models and clients from your OpenAPI spec in your desired languages, and can be utilised both client side or server side in lambda handlers. The project type also generates a wrapper construct which adds type safety to ensure a lambda integration is provided for every API integration.

You can also configure the languages for which you would like API clients to be generated. Currently only Typescript is supported!

### Project

### Typescript

Create the project in your projenrc:

```ts
import {ClientLanguage, OpenApiGatewayTsProject} from "@aws-prototyping-sdk/open-api-gateway";

new OpenApiGatewayTsProject({
  defaultReleaseBranch: "mainline",
  name: "my-api",
  outdir: "packages/api",
  clientLanguages: [ClientLanguage.TYPESCRIPT],
});
```

In the output directory (`outdir`), you'll find a few files to get you started.

```
|-- spec/
    |-- spec.yaml - The OpenAPI specification - edit this to define your API
|-- src/
    |-- api.ts - A CDK construct which defines the API Gateway resources to deploy your API
|-- generated/
    |-- typescript/ - A generated typescript API client, including with generated lambda handler wrappers
```

### Construct

A sample construct is generated which provides a type-safe interface for creating an API Gateway API based on your OpenAPI specification. You'll get a type error if you forget to define an integration for an operation defined in your api.

```ts
import { AuthorizationType } from "aws-cdk-lib/aws-apigateway";
import { Api } from "./api";
import { Function } from "aws-cdk-lib/aws-lambda";

new Api(this, "Api", {
  authType: AuthorizationType.IAM,
  integrations: {
    sayHello: {
      function: new Function(this, "SayHelloHandler", { ... }),
    },
  },
});
```

### Generated Client

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
