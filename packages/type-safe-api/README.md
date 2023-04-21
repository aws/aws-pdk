## Type Safe API

Define your APIs using [Smithy](https://smithy.io/2.0/) or [OpenAPI v3](https://swagger.io/specification/), and leverage the power of generated client and server types, infrastructure, documentation, and automatic input validation!

This package vends a projen project type which allows you to define an API using either [Smithy](https://smithy.io/2.0/) or [OpenAPI v3](https://swagger.io/specification/), and a construct which manages deploying this API in API Gateway, given an integration (eg a lambda) for every operation.

The project will generate "runtime" projects from your API definition in your desired languages, which can be utilised both client side for interacting with your API, or server side for implementing your API. The project also generates a type-safe CDK construct which ensures an integration is provided for every API operation.

Code is generated at build time, so when you change your API model, just rebuild and you'll see your changes reflected in the generated code.

### Quick Start: TypeScript

This section describes how to get started quickly, with TypeScript infrastructure and lambda handlers. See the end of the README for examples in [Python](#quick-start--python) and [Java](#quick-start--python).

#### Create Your API Project

Use the project in your `.projenrc.ts`. It can either be part of an [`nx-monorepo`](../nx-monorepo/README.md) (recommended) or used in a standalone fashion.

```ts
import { NxMonorepoProject } from "@aws-prototyping-sdk/nx-monorepo";
import { TypeSafeApiProject } from "@aws-prototyping-sdk/type-safe-api";
import { AwsCdkTypeScriptApp } from "projen/lib/awscdk";

// Create the monorepo
const monorepo = new NxMonorepoProject({ ... });

// Create the API project
const api = new TypeSafeApiProject({
  name: "myapi",
  parent: monorepo,
  outdir: 'packages/api',
  // Smithy as the model language. You can also use ModelLanguage.OPENAPI
  model: {
    language: ModelLanguage.SMITHY,
    options: {
      smithy: {
        serviceName: {
          namespace: 'com.mycompany',
          serviceName: 'MyApi',
        },
      },
    },
  },
  // Generate types, client and server code in TypeScript, Python and Java
  runtime: {
    languages: [Language.TYPESCRIPT, Language.PYTHON, Language.JAVA],
  },
  // CDK infrastructure in TypeScript
  infrastructure: {
    language: Language.TYPESCRIPT,
  },
  // Generate HTML documentation
  documentation: {
    formats: [DocumentationFormat.HTML_REDOC],
  }
});

// Create a CDK infrastructure project
const infra = new AwsCdkTypeScriptApp({ ... });

// Infrastructure can depend on the generated API infrastructure and runtime
infra.addDeps(api.infrastructure.typescript!.package.packageName);
infra.addDeps(api.runtime.typescript!.package.packageName);

monorepo.synth();
```

#### Use the CDK Construct

In your CDK application, consume the `Api` construct, vended from the generated typescript infrastructure package.

```ts
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Api } from "myapi-typescript-infra"; // <- generated typescript infrastructure package
import { Authorizers, Integrations } from "@aws-prototyping-sdk/type-safe-api";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Cors } from "aws-cdk-lib/aws-apigateway";
import * as path from 'path';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    // Instantiate the generated CDK construct to deploy an API Gateway API based on your model
    new Api(this, 'MyApi', {
      defaultAuthorizer: Authorizers.iam(),
      corsOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
      // Supply an integration for every operation
      integrations: {
        sayHello: {
          integration: Integrations.lambda(new NodejsFunction(this, 'SayHelloLambda', {
            entry: path.resolve(__dirname, 'say-hello.ts'),
          })),
        },
      },
    });
  }
}
```

#### Implement a Lambda Handler

The generated runtime projects include lambda handler wrappers which provide type-safety for implementing your API operations. You can implement your lambda handlers in any of the supported languages, and even mix and match languages for different operations if you like. In typescript, the implementation of `say-hello.ts` would look like:

```ts
import { sayHelloHandler } from "myapi-typescript-runtime"; // <- generated typescript runtime package

// Use the handler wrapper for type-safety to ensure you correctly implement your modelled API operation
export const handler = sayHelloHandler(async ({ input }) => {
  return {
    statusCode: 200,
    body: {
      message: `Hello ${input.requestParameters.name}`,
    },
  };
});
```

### Project

The `TypeSafeApiProject` projen project sets up the project structure for you. You have a few parameters to consider when creating the project:

* `model` - Configure the API model. Select a `language` for the model of either [Smithy](https://smithy.io/2.0/) or [OpenAPI v3](https://swagger.io/specification/), and supply `options.smithy` or `options.openapi` depending on your choice.
* `runtime` - Configure the generated runtime projects. Include one or more `languages` you wish to write your client and server-side code in. These projects contain generated types defined in your model, as well as type-safe lambda handler wrappers for implementing each operation.
* `infrastructure` - Pick the `language` you are writing your CDK infrastructure in. A construct will be generated in this language which can be used to deploy the API.
* `documentation` - Specify `formats` to generate documentation in.

It's recommended that these projects are used as part of an `nx-monorepo` project (eg. by specifying `parent: myMonorepoProject`), as it makes setting up dependencies much easier, particularly when extending your project further with a CDK app and lambda functions.

Depending on the `model.language` you choose, you must supply the corresponding `model.options`. For example:

```ts
new TypeSafeApiProject({
  model: {
    language: ModelLanguage.SMITHY,
    options: {
      smithy: {
        serviceName: {
          namespace: 'com.mycompany',
          serviceName: 'MyApi',
        },
      },
    },
  },
  ...
});
```

```ts
new TypeSafeApiProject({
  model: {
    language: ModelLanguage.OPENAPI,
    options: {
      openapi: {
        title: 'MyApi',
      },
    },
  },
  ...
});
```

`model.options.smithy` allows for further customisation of the Smithy project, eg:

```ts
new TypeSafeApiProject({
  model: {
    language: ModelLanguage.SMITHY,
    options: {
      smithy: {
        serviceName: {
          namespace: 'com.mycompany',
          serviceName: 'MyApi',
        },
        // By default, the contents of the smithy build output directory `model/output` will be ignored by source control.
        // Set this to false to include it, for example if you are generating clients directly from the smithy model.
        ignoreSmithyBuildOutput: false,
        // The gradle wrapper used for the smithy build is copied from the PDK itself if it does not already exist in
        // the 'smithy' folder. By default, this gradle wrapper will be ignored by source control.
        // Set this to false if you would like to check the gradle wrapper in to source control, for example if you want
        // to use a different version of the gradle wrapper in your project.
        ignoreGradleWrapper: false,
        // Use smithyBuildOptions to control what is added to smithy-build.json.
        smithyBuildOptions: {
          projections: {
            // You can customise the built-in openapi projection, used to generate the OpenAPI specification.
            openapi: {
              plugins: {
                openapi: {
                  // Customise the openapi projection here.
                  // See: https://smithy.io/2.0/guides/converting-to-openapi.html
                  useIntegerType: true,
                  ...
                }
              }
            },
            // You can add new projections here too
            "ts-client": {
              "plugins": {
                "typescript-codegen": {
                  "package" : "@my-test/smithy-generated-typescript-client",
                  "packageVersion": "0.0.1"
                }
              }
            }
          },
          // Note that any additional dependencies required for projections/plugins can be added here, which in turn will
          // add them to the `smithy/build.gradle` file
          maven: {
            dependencies: [
              "software.amazon.smithy:smithy-validation-model:1.27.2",
            ]
          }
        }
      },
    }
  },
  ...
});
```

#### Directory Structure

The `TypeSafeApiProject` will create the following directory structure within its `outdir`:

```
|_ model/
    |_ src/
        |_ main/
            |_ smithy - your API definition if you chose ModelLanguage.SMITHY
            |_ openapi - your API definition if you chose ModelLanguage.OPENAPI
|_ runtime/ - generated types, client, and server code in the languages you specified
    |_ typescript
    |_ python
    |_ java
|_ infrastructure/ - generated infrastructure (you'll find only one directory in here based on your chosen infrastructure language)
    |_ typescript
    |_ python
    |_ java
|_ documentation/ - generated documentation in the formats you specified
    |_ html2
    |_ html_redoc
    |_ plantuml
    |_ markdown
```


### Smithy IDL

Please refer to the [Smithy documentation](https://smithy.io/2.0/quickstart.html) for how to write models in Smithy. A basic example is provided below:

```smithy
$version: "2"
namespace example.hello

use aws.protocols#restJson1

@title("A Sample Hello World API")

/// A sample smithy api
@restJson1
service Hello {
    version: "1.0"
    operations: [SayHello]
}

@readonly
@http(method: "GET", uri: "/hello")
operation SayHello {
    input: SayHelloInput
    output: SayHelloOutput
    errors: [ApiError]
}

string Name
string Message

@input
structure SayHelloInput {
    @httpQuery("name")
    @required
    name: Name
}

@output
structure SayHelloOutput {
    @required
    message: Message
}

@error("client")
structure ApiError {
    @required
    errorMessage: Message
}
```

#### Supported Protocols

Currently only [AWS restJson1](https://smithy.io/2.0/aws/protocols/aws-restjson1-protocol.html) is supported. Please ensure your service is annotated with the `@restJson1` trait.

#### Multiple Files

You can split your definition into multiple files and folders, so long as they are all under the `model/src/main/smithy` directory in your API project.

#### Authorizers

Smithy supports [adding API Gateway authorizers in the model itself](https://smithy.io/2.0/aws/aws-auth.html). Given that at model definition time one usually does not know the ARN of the user pool or lambda function for an authorizer, it is recommended to add the authorizer(s) in your Api CDK construct.

If using Smithy generated clients, some authorizer traits (eg sigv4) will include configuring the client for that particular method of authorization, so it can be beneficial to still define authorizers in the model. We therefore support specifying authorizers in both the model and the construct, but note that the construct will take precedence where the authorizer ID is the same.

### OpenAPI Specification

Your `model/src/main/openapi/main.yaml` file defines your api using [OpenAPI Version 3.0.3](https://swagger.io/specification/). An example spec might look like:

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
|_ model/src/main/openapi/
    |_ main.yaml
    |_ paths/
        |_ index.yaml
        |_ sayHello.yaml
    |_ schemas/
        |_ index.yaml
        |_ helloResponse.yaml
```

Where `main.yaml` looks as follows:

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
    $ref: './sayHello.yaml'
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

A CDK construct is generated in the `infrastructure/<language>` directory which provides a type-safe interface for creating an API Gateway API based on your model.

You can extend or instantiate this construct in your CDK infrastructure project. You'll get a type error if you forget to define an integration for an operation defined in your api.

```ts
import { Authorizers, Integrations } from '@aws-prototyping-sdk/type-safe-api';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { Api } from 'myapi-typescript-infra';

/**
 * An example of how to wire lambda handler functions to the API
 */
export class SampleApi extends Api {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      defaultAuthorizer: Authorizers.iam(),
      integrations: {
        // Every operation defined in your API must have an integration defined!
        sayHello: {
          integration: Integrations.lambda(new NodejsFunction(scope, 'say-hello')),
        },
      },
    });
  }
}
```

#### Sharing Integrations

If you would like to use the same integration for every operation (for example you'd like to use a single lambda function to service all requests with the in-built [handler router](#handler-router)), you can use the `Operations.all` method from a generated runtime project to save repeating yourself:

```ts
import { Operations } from 'myapi-typescript-runtime';
import { Authorizers, Integrations } from '@aws-prototyping-sdk/type-safe-api';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { Api } from 'myapi-typescript-infra';

export class SampleApi extends Api {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      defaultAuthorizer: Authorizers.iam(),
      // Use the same integration for every operation.
      integrations: Operations.all({
        integration: Integrations.lambda(new NodejsFunction(scope, 'router')),
      }),
    });
  }
}
```

TypeScript is demonstrated above, but this is also available in Java and Python.

#### Authorizers

The `Api` construct allows you to define one or more authorizers for securing your API. An integration will use the `defaultAuthorizer` unless an `authorizer` is specified at the integration level. The following authorizers are supported:

* `Authorizers.none` - No auth
* `Authorizers.iam` - AWS IAM (Signature Version 4)
* `Authorizers.cognito` - Cognito user pool
* `Authorizers.custom` - A custom authorizer

##### Cognito Authorizer

To use the Cognito authorizer, one or more user pools must be provided. You can optionally specify the scopes to check if using an access token. You can use the `withScopes` method to use the same authorizer but verify different scopes for individual integrations, for example:

```ts
export class SampleApi extends Api {
  constructor(scope: Construct, id: string) {
    const cognitoAuthorizer = Authorizers.cognito({
      authorizerId: 'myCognitoAuthorizer',
      userPools: [new UserPool(scope, 'UserPool')],
    });

    super(scope, id, {
      defaultAuthorizer: cognitoAuthorizer,
      integrations: {
        // Everyone in the user pool can call this operation:
        sayHello: {
          integration: Integrations.lambda(new NodejsFunction(scope, 'say-hello')),
        },
        // Only users with the given scopes can call this operation
        myRestrictedOperation: {
          integration: Integrations.lambda(new NodejsFunction(scope, 'my-restricted-operation')),
          authorizer: cognitoAuthorizer.withScopes('my-resource-server/my-scope'),
        },
      },
    });
  }
}
```

For more information about scopes or identity and access tokens, please see the [API Gateway documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-integrate-with-cognito.html).

##### Custom Authorizer

Custom authorizers use lambda functions to handle authorizing requests. These can either be simple token-based authorizers, or more complex request-based authorizers. See the [API Gateway documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html) for more details.

An example token-based authorizer (default):

```ts
Authorizers.custom({
  authorizerId: 'myTokenAuthorizer',
  function: new NodejsFunction(scope, 'authorizer'),
});
```

An example request-based handler. By default the identitySource will be `method.request.header.Authorization`, however you can customise this as per [the API Gateway documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-apigateway-authorizer.html#cfn-apigateway-authorizer-identitysource).

```ts
Authorizers.custom({
  authorizerId: 'myRequestAuthorizer',
  type: CustomAuthorizerType.REQUEST,
  identitySource: 'method.request.header.MyCustomHeader, method.request.querystring.myQueryString',
  function: new NodejsFunction(scope, 'authorizer'),
});
```

#### Integrations

Integrations are used by API Gateway to service requests.

##### Lambda Integration

Currently, the only built-in integration is a lambda integration. You can construct one using `Integrations.lambda(yourLambdaFunction)`.

##### Custom Integrations

You can implement your own integrations by inheriting the `Integration` class and implementing its `render` method. This method is responsible for returning a snippet of OpenAPI which will be added as the `x-amazon-apigateway-integration` for an operation. Please refer to the [API Gateway Swagger Extensions documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-swagger-extensions-integration.html) for more details.

You can also optionally override the `grant` method if you need to use CDK to grant API Gateway access to invoke your integration.

### Runtime: Clients

The generated runtime projects include clients which can be used for type-safe interaction with your API.

#### Typescript

The [typescript-fetch](https://openapi-generator.tech/docs/generators/typescript-fetch/) OpenAPI generator is used to generate typescript client. This requires an implementation of `fetch` to be passed to the client. In the browser one can pass the built in fetch, or in NodeJS you can use an implementation such as [node-fetch](https://www.npmjs.com/package/node-fetch).

Example usage of the client in a website:

```ts
import { Configuration, DefaultApi } from "myapi-typescript-runtime";

const client = new DefaultApi(new Configuration({
  basePath: "https://xxxxxxxxxx.execute-api.ap-southeast-2.amazonaws.com",
  fetchApi: window.fetch.bind(window),
}));

await client.sayHello({ name: "Jack" });
```

#### Python

The [python](https://openapi-generator.tech/docs/generators/python) OpenAPI generator is used to generate clients for python.

Example usage:

```python
from myapi_python_runtime import ApiClient, Configuration
from myapi_python_runtime.api.default_api import DefaultApi

configuration = Configuration(
    host = "https://xxxxxxxxxx.execute-api.ap-southeast-2.amazonaws.com"
)

with ApiClient(configuration) as api_client:
    client = DefaultApi(api_client)

    client.say_hello(
        query_params={
            'name': "name_example",
        },
    )
```

You'll find details about how to use the python client in the README.md in your generated runtime project.

#### Java

The [java](https://openapi-generator.tech/docs/generators/java/) OpenAPI generator is used to generate clients for Java.

Example usage:

```java
import com.generated.api.myapijavaruntime.runtime.api.DefaultApi;
import com.generated.api.myapijavaruntime.runtime.ApiClient;
import com.generated.api.myapijavaruntime.runtime.Configuration;
import com.generated.api.myapijavaruntime.runtime.models.HelloResponse;

ApiClient client = Configuration.getDefaultApiClient();
client.setBasePath("https://xxxxxxxxxx.execute-api.ap-southeast-2.amazonaws.com");

DefaultApi api = new DefaultApi(client);
HelloResponse response = api.sayHello("Adrian").execute()
```

You'll find more details about how to use the Java client in the README.md in your generated runtime project.

### Lambda Handler Wrappers

Lambda handler wrappers are also importable from the generated runtime projects. These provide input/output type safety, ensuring that your API handlers return outputs that correspond to your model.

#### Typescript

```ts
import { sayHelloHandler } from "myapi-typescript-runtime";

export const handler = sayHelloHandler(async ({ input }) => {
  return {
    statusCode: 200,
    body: {
      message: `Hello ${input.requestParameters.name}!`,
    },
  };
});
```

##### Handler Router

The lambda handler wrappers can be used in isolation as handler methods for separate lambdas. If you would like to use a single lambda function to serve all requests, you can do so with the `handlerRouter`.

```ts
import { handlerRouter, sayHelloHandler, sayGoodbyeHandler } from "myapi-typescript-runtime";
import { corsInterceptor } from "./interceptors";
import { sayGoodbye } from "./handlers/say-goodbye";

const sayHello = sayHelloHandler(async ({ input }) => {
  return {
    statusCode: 200,
    body: {
      message: `Hello ${input.requestParameters.name}!`,
    },
  };
});

export const handler = handlerRouter({
  // Interceptors declared in this list will apply to all operations
  interceptors: [corsInterceptor],
  // Assign handlers to each operation here
  handlers: {
    sayHello,
    sayGoodbye,
  },
});
```

#### Python

```python
from myapi_python_runtime.apis.tags.default_api_operation_config import say_hello_handler, SayHelloRequest, ApiResponse, SayHelloOperationResponses
from myapi_python_runtime.model.api_error import ApiError
from myapi_python_runtime.model.hello_response import HelloResponse

@say_hello_handler
def handler(input: SayHelloRequest, **kwargs) -> SayHelloOperationResponses:
    return ApiResponse(
        status_code=200,
        body=HelloResponse(message="Hello {}!".format(input.request_parameters["name"])),
        headers={}
    )
```

##### Handler Router

The lambda handler wrappers can be used in isolation as handler methods for separate lambdas. If you would like to use a single lambda function to serve all requests, you can do so with the `handler_router`.

```python
from myapi_python_runtime.apis.tags.default_api_operation_config import say_hello_handler, SayHelloRequest, ApiResponse, SayHelloOperationResponses, handler_router, HandlerRouterHandlers
from myapi_python_runtime.model.api_error import ApiError
from myapi_python_runtime.model.hello_response import HelloResponse
from other_handlers import say_goodbye
from my_interceptors import cors_interceptor

@say_hello_handler
def say_hello(input: SayHelloRequest, **kwargs) -> SayHelloOperationResponses:
    return ApiResponse(
        status_code=200,
        body=HelloResponse(message="Hello {}!".format(input.request_parameters["name"])),
        headers={}
    )

handler = handler_router(
  # Interceptors defined here will apply to all operations
  interceptors=[cors_interceptor],
  handlers=HandlerRouterHandlers(
    say_hello=say_hello,
    say_goodbye=say_goodbye
  )
)
```

#### Java

```java
import com.generated.api.myapijavaruntime.runtime.api.Handlers.SayHello;
import com.generated.api.myapijavaruntime.runtime.api.Handlers.SayHello200Response;
import com.generated.api.myapijavaruntime.runtime.api.Handlers.SayHelloRequestInput;
import com.generated.api.myapijavaruntime.runtime.api.Handlers.SayHelloResponse;
import com.generated.api.myapijavaruntime.runtime.model.HelloResponse;


public class SayHelloHandler extends SayHello {
    @Override
    public SayHelloResponse handle(SayHelloRequestInput sayHelloRequestInput) {
        return SayHello200Response.of(HelloResponse.builder()
                .message(String.format("Hello %s", sayHelloRequestInput.getInput().getRequestParameters().getName()))
                .build());
    }
}
```

##### Handler Router

The lambda handler wrappers can be used in isolation as handler methods for separate lambdas. If you would like to use a single lambda function to serve all requests, you can do so by extending the `HandlerRouter` class.

```java
import com.generated.api.myapijavaruntime.runtime.api.Handlers.SayGoodbye;
import com.generated.api.myapijavaruntime.runtime.api.Handlers.HandlerRouter;
import com.generated.api.myapijavaruntime.runtime.api.Handlers.Interceptors;
import com.generated.api.myapijavaruntime.runtime.api.Handlers.SayHello;

import java.util.Arrays;
import java.util.List;

// Interceptors defined here apply to all operations
@Interceptors({ TimingInterceptor.class })
public class ApiHandlerRouter extends HandlerRouter {
    // You must implement a method to return a handler for every operation
    @Override
    public SayHello sayHello() {
        return new SayHelloHandler();
    }

    @Override
    public SayGoodbye sayGoodbye() {
        return new SayGoodbyeHandler();
    }
}
```

### Interceptors

The lambda handler wrappers allow you to pass in a _chain_ of handler functions to handle the request. This allows you to implement middleware / interceptors for handling requests. Each handler function may choose whether or not to continue the handler chain by invoking `chain.next`.

#### Typescript

In typescript, interceptors are passed as separate arguments to the generated handler wrapper, in the order in which they should be executed. Call `request.chain.next(request)` from an interceptor to delegate to the rest of the chain to handle a request. Note that the last handler in the chain (ie the actual request handler which transforms the input to the output) should not call `chain.next`.

```ts
import {
  sayHelloHandler,
  ChainedRequestInput,
  OperationResponse,
} from "myapi-typescript-runtime";

// Interceptor to wrap invocations in a try/catch, returning a 500 error for any unhandled exceptions.
const tryCatchInterceptor = async <RequestParameters, RequestArrayParameters, RequestBody, Response>(
  request: ChainedRequestInput<RequestParameters, RequestArrayParameters, RequestBody, Response>
): Promise<Response | OperationResponse<500, { errorMessage: string }>> => {
  try {
    return await request.chain.next(request);
  } catch (e: any) {
    return { statusCode: 500, body: { errorMessage: e.message }};
  }
};

// tryCatchInterceptor is passed first, so it runs first and calls the second argument function (the request handler) via chain.next
export const handler = sayHelloHandler(tryCatchInterceptor, async ({ input }) => {
  return {
    statusCode: 200,
    body: {
      message: `Hello ${input.requestParameters.name}!`,
    },
  };
});
```

Another example interceptor might be to record request time metrics. The example below includes the full generic type signature for an interceptor:

```ts
import {
  ChainedRequestInput,
} from 'myapi-typescript-runtime';

const timingInterceptor = async <RequestParameters, RequestArrayParameters, RequestBody, Response>(
  request: ChainedRequestInput<RequestParameters, RequestArrayParameters, RequestBody, Response>
): Promise<Response> => {
  const start = Date.now();
  const response = await request.chain.next(request);
  const end = Date.now();
  console.log(`Took ${end - start} ms`);
  return response;
};
```

Interceptors may mutate the `interceptorContext` to pass state to further interceptors or the final lambda handler, for example an `identityInterceptor` might want to extract the authenticated user from the request so that it is available in handlers.

```ts
import {
  LambdaRequestParameters,
  LambdaHandlerChain,
} from 'myapi-typescript-runtime';

const identityInterceptor = async <RequestParameters, RequestArrayParameters, RequestBody, Response>(
  request: ChainedRequestInput<RequestParameters, RequestArrayParameters, RequestBody, Response>
): Promise<Response> => {
  const authenticatedUser = await getAuthenticatedUser(request.event);
  return await request.chain.next({
    ...request,
    interceptorContext: {
      ...request.interceptorContext,
      authenticatedUser,
    },
  });
};
```

#### Python

In Python, a list of interceptors can be passed as a keyword argument to the generated lambda handler decorator, for example:

```python
from myapi_python_runtime.apis.tags.default_api_operation_config import say_hello_handler, SayHelloRequest, ApiResponse, SayHelloOperationResponses
from myapi_python_runtime.model.api_error import ApiError
from myapi_python_runtime.model.hello_response import HelloResponse

@say_hello_handler(interceptors=[timing_interceptor, try_catch_interceptor])
def handler(input: SayHelloRequest, **kwargs) -> SayHelloOperationResponses:
    return ApiResponse(
        status_code=200,
        body=HelloResponse(message="Hello {}!".format(input.request_parameters["name"])),
        headers={}
    )
```

Writing an interceptor is just like writing a lambda handler. Call `chain.next(input)` from an interceptor to delegate to the rest of the chain to handle a request.

```python
import time
from myapi_python_runtime.apis.tags.default_api_operation_config import ChainedApiRequest, ApiResponse

def timing_interceptor(input: ChainedApiRequest) -> ApiResponse:
    start = int(round(time.time() * 1000))
    response = input.chain.next(input)
    end = int(round(time.time() * 1000))
    print("Took {} ms".format(end - start))
    return response
```

Interceptors may choose to return different responses, for example to return a 500 response for any unhandled exceptions:

```python
import time
from myapi_python_runtime.model.api_error import ApiError
from myapi_python_runtime.apis.tags.default_api_operation_config import ChainedApiRequest, ApiResponse

def try_catch_interceptor(input: ChainedApiRequest) -> ApiResponse:
    try:
        return input.chain.next(input)
    except Exception as e:
        return ApiResponse(
            status_code=500,
            body=ApiError(errorMessage=str(e)),
            headers={}
        )
```

Interceptors are permitted to mutate the "interceptor context", which is a `Dict[str, Any]`. Each interceptor in the chain, and the final handler, can access this context:

```python
def identity_interceptor(input: ChainedApiRequest) -> ApiResponse:
    input.interceptor_context["AuthenticatedUser"] = get_authenticated_user(input.event)
    return input.chain.next(input)
```

Interceptors can also mutate the response returned by the handler chain. An example use case might be adding cross-origin resource sharing headers:

```python
def add_cors_headers_interceptor(input: ChainedApiRequest) -> ApiResponse:
    response = input.chain.next(input)
    return ApiResponse(
        status_code=response.status_code,
        body=response.body,
        headers={
            **response.headers,
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*"
        }
    )
```

#### Java

In Java, interceptors can be added to a handler via the `@Interceptors` class annotation:

```java
import com.generated.api.myjavaapiruntime.runtime.api.Handlers.Interceptors;

@Interceptors({ TimingInterceptor.class, TryCatchInterceptor.class })
public class SayHelloHandler extends SayHello {
    @Override
    public SayHelloResponse handle(SayHelloRequestInput sayHelloRequestInput) {
        return SayHello200Response.of(HelloResponse.builder()
                .message(String.format("Hello %s", sayHelloRequestInput.getInput().getRequestParameters().getName()))
                .build());
    }
}
```

To write an interceptor, you can implement the `Interceptor` interface. For example, a timing interceptor:

```java
import com.generated.api.myjavaapiruntime.runtime.api.Handlers.Interceptor;
import com.generated.api.myjavaapiruntime.runtime.api.Handlers.ChainedRequestInput;
import com.generated.api.myjavaapiruntime.runtime.api.Handlers.Response;

public class TimingInterceptor<Input> implements Interceptor<Input> {
    @Override
    public Response handle(ChainedRequestInput<Input> input) {
        long start = System.currentTimeMillis();
        Response res = input.getChain().next(input);
        long end = System.currentTimeMillis();
        System.out.printf("Took %d ms%n", end - start);
        return res;
    }
}
```

Interceptors may choose to return different responses, for example to return a 500 response for any unhandled exceptions:

```java
import com.generated.api.myjavaapiruntime.runtime.api.Handlers.Interceptor;
import com.generated.api.myjavaapiruntime.runtime.api.Handlers.ChainedRequestInput;
import com.generated.api.myjavaapiruntime.runtime.api.Handlers.Response;
import com.generated.api.myjavaapiruntime.runtime.api.Handlers.ApiResponse;
import com.generated.api.myjavaapiruntime.runtime.model.ApiError;

public class TryCatchInterceptor<Input> implements Interceptor<Input> {
    @Override
    public Response handle(ChainedRequestInput<Input> input) {
        try {
            return input.getChain().next(input);
        } catch (Exception e) {
            return ApiResponse.builder()
                    .statusCode(500)
                    .body(ApiError.builder()
                            .errorMessage(e.getMessage())
                            .build().toJson())
                    .build();
        }
    }
}
```

Interceptors are permitted to mutate the "interceptor context", which is a `Map<String, Object>`. Each interceptor in the chain, and the final handler, can access this context:

```java
public class IdentityInterceptor<Input> implements Interceptor<Input> {
    @Override
    public Response handle(ChainedRequestInput<Input> input) {
        input.getInterceptorContext().put("AuthenticatedUser", this.getAuthenticatedUser(input.getEvent()));
        return input.getChain().next(input);
    }
}
```

Interceptors can also mutate the response returned by the handler chain. An example use case might be adding cross-origin resource sharing headers:

```java
public static class AddCorsHeadersInterceptor<Input> implements Interceptor<Input> {
    @Override
    public Response handle(ChainedRequestInput<Input> input) {
        Response res = input.getChain().next(input);
        res.getHeaders().put("Access-Control-Allow-Origin", "*");
        res.getHeaders().put("Access-Control-Allow-Headers", "*");
        return res;
    }
}
```

##### Interceptors with Dependency Injection

Interceptors referenced by the `@Interceptors` annotation must be constructable with no arguments. If more complex instantiation of your interceptor is required (for example if you are using dependency injection or wish to pass configuration to your interceptor), you may instead override the `getInterceptors` method in your handler:

```java
public class SayHelloHandler extends SayHello {
    @Override
    public List<Interceptor<SayHelloInput>> getInterceptors() {
        return Arrays.asList(
                new MyConfiguredInterceptor<>(42),
                new MyOtherConfiguredInterceptor<>("configuration"));
    }

    @Override
    public SayHelloResponse handle(SayHelloRequestInput sayHelloRequestInput) {
        return SayHello200Response.of(HelloResponse.builder()
                .message(String.format("Hello %s!", sayHelloRequestInput.getInput().getRequestParameters().getName()))
                .build());
    }
}
```

### Quick Start: Python

This guide assumes you want to write your CDK infrastructure in Python and your lambda handlers in Python, however note that you your infrastructure language and lambda handler language(s) are not tied to one another, you can mix and match as you like. Just specify the language in `runtime.languages` for any language you would like to write lambda handlers in.

#### Create Your API Project

Use the project in your `.projenrc.ts`. It can either be part of an [`nx-monorepo`](../nx-monorepo/README.md) (recommended) or used in a standalone fashion.

```ts
import { NxMonorepoProject } from "@aws-prototyping-sdk/nx-monorepo";
import { TypeSafeApiProject } from "@aws-prototyping-sdk/type-safe-api";
import { AwsCdkTypeScriptApp } from "projen/lib/awscdk";
import { PythonProject } from "projen/lib/python";

// Create the monorepo
const monorepo = new NxMonorepoProject({
  name: 'monorepo',
  defaultReleaseBranch: "main",
});

// Create the API project
const api = new TypeSafeApiProject({
  name: "myapi",
  parent: monorepo,
  outdir: 'packages/api',
  // Smithy as the model language. You can also use ModelLanguage.OPENAPI
  model: {
    language: ModelLanguage.SMITHY,
    options: {
      smithy: {
        serviceName: {
          namespace: 'com.mycompany',
          serviceName: 'MyApi',
        },
      },
    },
  },
  // Generate client and server types in TypeScript, Python, and Java
  runtime: {
    languages: [Language.TYPESCRIPT, Language.PYTHON, Language.JAVA],
  },
  // Generate CDK infrastructure in Python
  infrastructure: {
    language: Language.PYTHON,
  },
  // Generate HTML documentation
  documentation: {
    formats: [DocumentationFormat.HTML_REDOC]
  },
});

// Create a project for our lambda handlers written in python
const lambdas = new PythonProject({
  name: "lambdas",
  parent: monorepo,
  outdir: 'packages/lambdas',
  authorEmail: "me@example.com",
  authorName: "me",
  moduleName: "lambdas",
  version: "1.0.0",
  // Poetry is used to simplify local python dependencies
  poetry: true,
});

// Add a local dependency on the generated python runtime
monorepo.addPythonPoetryDependency(lambdas, api.runtime.python!);

// Add commands to the lambda project's package task to create a distributable which can be deployed to AWS Lambda
lambdas.packageTask.exec(`mkdir -p lambda-dist && rm -rf lambda-dist/*`);
lambdas.packageTask.exec(`cp -r ${lambdas.moduleName} lambda-dist/${lambdas.moduleName}`);
lambdas.packageTask.exec(`poetry export --without-hashes --format=requirements.txt > lambda-dist/requirements.txt`);
lambdas.packageTask.exec(`pip install -r lambda-dist/requirements.txt --target lambda-dist --upgrade`);
lambdas.gitignore.addPatterns('lambda-dist');

// Create a CDK infrastructure project
const infra = new AwsCdkPythonApp({
  name: "infra",
  parent: monorepo,
  outdir: 'packages/infra',
  authorEmail: "me@example.com",
  authorName: "me",
  cdkVersion: "2.0.0",
  moduleName: "infra",
  version: "1.0.0",
  poetry: true,
});

// The infrastructure project depends on the python types, python infrastructure, and the lambda package
monorepo.addPythonPoetryDependency(infra, api.runtime.python!);
monorepo.addPythonPoetryDependency(infra, api.infrastructure.python!);
monorepo.addPythonPoetryDependency(infra, lambdas);

monorepo.synth();
```

#### Use the CDK Construct

In your CDK application, consume the `Api` construct, vended from the generated Python infrastructure package.

```python
import os
from aws_cdk import Stack
from constructs import Construct
from aws_cdk.aws_lambda import LayerVersion, Code, Function, Runtime
from aws_prototyping_sdk.type_safe_api import Authorizers, TypeSafeApiIntegration, Integrations

from myapi_python_runtime.apis.tags.default_api_operation_config import OperationConfig
from myapi_python_infra.api import Api
from pathlib import Path
from os import path

class MyStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Use the generated Api construct
        self.api = Api(self, 'Api',
            default_authorizer=Authorizers.iam(),
            integrations=OperationConfig(
                say_hello=TypeSafeApiIntegration(
                    # Create a python lambda function from our "lambda-dist" package
                    integration=Integrations.lambda_(Function(self, 'SayHello',
                        runtime=Runtime.PYTHON_3_9,
                        code=Code.from_asset(path.join("..", "lambdas", "lambda-dist")),
                        handler="lambdas.say_hello.handler",
                    )),
                ),
            ),
        )
```

#### Implement a Lambda Handler

In your `lambdas` project you can define your lambda handler in its source directory, eg `lambdas/lambdas/say_hello.py`:

```python
from myapi_python_runtime.model.say_hello_response_content import SayHelloResponseContent
from myapi_python_runtime.apis.tags.default_api_operation_config import say_hello_handler,
    SayHelloRequest, SayHelloOperationResponses, ApiResponse


@say_hello_handler
def handler(input: SayHelloRequest, **kwargs) -> SayHelloOperationResponses:
    return ApiResponse(
        status_code=200,
        body=SayHelloResponseContent(message="Hello {}".format(input.request_parameters["name"])),
        headers={}
    )
```

### Quick Start: Java

This guide assumes you want to write your CDK infrastructure in Java and your lambda handlers in Java, however note that you your infrastructure language and lambda handler language(s) are not tied to one another, you can mix and match as you like.

#### Create Your API Project

Use the project in your `.projenrc.ts`. It can either be part of an [`nx-monorepo`](../nx-monorepo/README.md) (recommended) or used in a standalone fashion.

```ts
import { NxMonorepoProject } from "@aws-prototyping-sdk/nx-monorepo";
import { TypeSafeApiProject } from "@aws-prototyping-sdk/type-safe-api";
import { AwsCdkTypeScriptApp } from "projen/lib/awscdk";
import { JavaProject } from "projen/lib/java";

// Create the monorepo
const monorepo = new NxMonorepoProject({
  name: 'monorepo',
  defaultReleaseBranch: "main",
});

// Create the API project
const api = new TypeSafeApiProject({
  name: "myapi",
  parent: monorepo,
  outdir: 'packages/api',
  // Smithy as the model language. You can also use ModelLanguage.OPENAPI
  model: {
    language: ModelLanguage.SMITHY,
    options: {
      smithy: {
        serviceName: {
          namespace: 'com.mycompany',
          serviceName: 'MyApi',
        },
      },
    },
  },
  // Generate client and server types in TypeScript, Python and Java
  runtime: {
    languages: [Language.TYPESCRIPT, Language.PYTHON, Language.JAVA],
  },
  // Generate CDK infrastructure in Java
  infrastructure: {
    language: Language.JAVA,
  },
  // Generate HTML documentation
  documentation: {
    formats: [DocumentationFormat.HTML_REDOC],
  },
});

const lambdas = new JavaProject({
  name: "lambdas",
  parent: monorepo,
  outdir: 'packages/lambdas',
  artifactId: "lambdas",
  groupId: "com.my.api",
  version: "1.0.0",
});

// The lambdas package needs a dependency on the generated java runtime
monorepo.addJavaDependency(lambdas, api.runtime.java!);

// Use the maven shade plugin to build a "super jar" which we can deploy to AWS Lambda
lambdas.pom.addPlugin("org.apache.maven.plugins/maven-shade-plugin@3.3.0", {
  configuration: {
    createDependencyReducedPom: false,
  },
  executions: [
    {
      id: "shade-task",
      phase: "package",
      goals: ["shade"],
    },
  ],
});

const infra = new AwsCdkJavaApp({
  name: "infra",
  parent: monorepo,
  outdir: 'packages/infra',
  artifactId: "infra",
  groupId: "com.my.api",
  mainClass: "com.my.api.MyApp",
  version: "1.0.0",
  cdkVersion: "2.0.0",
});

// Add a dependency on the generated CDK infrastructure
monorepo.addJavaDependency(infra, api.infrastructure.java!);

// Make sure the java lambda builds before our CDK infra
monorepo.addImplicitDependency(infra, lambdas);

monorepo.synth();
```

#### Use the CDK Construct

In your CDK application, consume the `Api` construct, vended from the generated Java infrastructure package.

```java
package com.my.api;

import com.generated.api.myapijavainfra.infra.Api;
import com.generated.api.myapijavainfra.infra.ApiProps;
import com.generated.api.myapijavaruntime.runtime.api.OperationConfig;

import software.amazon.awscdk.Duration;
import software.amazon.awscdk.services.apigateway.CorsOptions;
import software.amazon.awscdk.services.lambda.Code;
import software.amazon.awscdk.services.lambda.Function;
import software.amazon.awscdk.services.lambda.FunctionProps;
import software.amazon.awscdk.services.lambda.Runtime;
import software.aws.awsprototypingsdk.typesafeapi.Authorizers;
import software.aws.awsprototypingsdk.typesafeapi.Integrations;
import software.aws.awsprototypingsdk.typesafeapi.TypeSafeApiIntegration;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Stack;

import java.util.Arrays;

public class MyApp {
    public static void main(final String[] args) {
        App app = new App();
        Stack s = new Stack(app, "infra");

        // Declare the API construct to deploy the API Gateway resources
        new Api(s, "Api", ApiProps.builder()
                .defaultAuthorizer(Authorizers.iam())
                .corsOptions(CorsOptions.builder()
                        .allowOrigins(Arrays.asList("*"))
                        .allowMethods(Arrays.asList("*"))
                        .build())
                .integrations(OperationConfig.<TypeSafeApiIntegration>builder()
                        .sayHello(TypeSafeApiIntegration.builder()
                                .integration(Integrations.lambda(
                                        // Point the lambda function to our built jar from the "lambdas" package
                                        new Function(s, "say-hello", FunctionProps.builder()
                                                .code(Code.fromAsset("../lambdas/dist/java/com/my/api/lambdas/1.0.0/lambdas-1.0.0.jar"))
                                                .handler("com.my.api.SayHelloHandler")
                                                .runtime(Runtime.JAVA_11)
                                                .timeout(Duration.seconds(30))
                                                .build())))
                                .build())
                        .build())
                .build());

        app.synth();
    }
}
```

#### Implement a Lambda Handler

In your `lambdas` project you can define your lambda handler in its source directory, eg `lambdas/src/main/java/com/my/api/SayHelloHandler.java`:

```java
package com.my.api;

import com.generated.api.myapijavaruntime.runtime.api.Handlers.SayHello;
import com.generated.api.myapijavaruntime.runtime.api.Handlers.SayHello200Response;
import com.generated.api.myapijavaruntime.runtime.api.Handlers.SayHelloRequestInput;
import com.generated.api.myapijavaruntime.runtime.api.Handlers.SayHelloResponse;
import com.generated.api.myapijavaruntime.runtime.model.SayHelloResponseContent;

/**
 * An example lambda handler which uses the generated handler wrapper class (Handlers.SayHello) to manage marshalling
 * inputs and outputs.
 */
public class SayHelloHandler extends SayHello {
    @Override
    public SayHelloResponse handle(SayHelloRequestInput sayHelloRequestInput) {
        return SayHello200Response.of(SayHelloResponseContent.builder()
                .message(String.format("Hello %s", sayHelloRequestInput.getInput().getRequestParameters().getName()))
                .build());
    }
}

```


### Other Details

#### Customising Generated Types/Infrastructure Projects

By default, the generated types and infrastructure projects are configured automatically, including their project names. You can customise the generated projects using the `runtime.options.<language>` or `infrastructure.options.<language>` properties when constructing the `TypeSafeApiProject`.

#### AWS WAFv2 Web ACL

By default, a [Web ACL](https://docs.aws.amazon.com/waf/latest/developerguide/web-acl.html) is deployed and attached to your API Gateway Rest API with the "[AWSManagedRulesCommonRuleSet](https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups-baseline.html)", which provides protection against exploitation of a wide range of vulnerabilities, including some of the high risk and commonly occurring vulnerabilities described in OWASP publications such as [OWASP Top 10](https://owasp.org/www-project-top-ten/).

You can customise the Web ACL configuration via the `webAclOptions` of your `Api` CDK construct, eg:

```ts
export class SampleApi extends Api {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      integrations: { ... },
      webAclOptions: {
        // Allow access only to specific CIDR ranges
        cidrAllowList: {
          cidrType: 'IPV4',
          cidrRanges: ['1.2.3.4/5'],
        },
        // Pick from the set here: https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups-list.html
        managedRules: [
          { vendor: 'AWS', name: 'AWSManagedRulesSQLiRuleSet' },
        ],
      },
    });
  }
}
```

You can remove the Web ACL entirely with `webAclOptions: { disable: true }` - you may wish to use this if you'd like to set up a Web ACL yourself with more control over the rules.

#### Smithy IntelliJ Plugin

The Smithy-based projects are compatible with the [Smithy IntelliJ Plugin](https://github.com/iancaffey/smithy-intellij-plugin), which provides syntax highlighting and auto-complete for your Smithy model. To make use of it, perform the following steps:

* Install the "Smithy" plugin (under `Preferences -> Plugins`)
* Right-click on the `smithy/build.gradle` file in your Smithy API project
* Select "Link Gradle Project"

#### Tagging Operations

Operations can be grouped together into logical collections via tags. This can be achieved in Smithy with the `@tags` trait:

```smithy
@tags(["pets", "users"])
operation PurchasePet {
  ...
}
```

Or in OpenAPI using the `tags` property:

```yaml
paths:
  /pets/purchase:
    post:
      operationId: purchasePet
      tags:
        - pets
        - users
      ...
```

When multiple tags are used, the "first" tag is considered to be the API that the operation belongs to, so in the generated client, the above example operation would be included in the `PetsApi` client but not the `UsersApi` client.

Multiple tags are still useful for documentation generation, for example `DocumentationFormat.HTML_REDOC` will group operations by tag in the side navigation bar.

If you would like to introduce tags without breaking existing clients, we recommend first adding a tag named `default` to all operations.

⚠️ __Important Note__: Smithy versions below `1.28.0` sort tags in alphabetical order and so the "first" tag will be the earliest in the alphabet. Therefore, if using tags with older versions of Smithy, we recommend prefixing your desired first tag with an underscore (for example `_default`). This is rectified in `1.28.0`, where tag order from the `@tags` trait is preserved.

#### Smithy Model Libraries and Dependencies

You can instantiate the TypeSafeApiModelProject on its own to create a standalone Smithy model library.

You can consume the library using the `addSmithyDeps` method, which adds a local file dependency on the built Smithy jar.

```ts
// Standalone model project, used as our model library
const shapes = new TypeSafeApiModelProject({
  name: "shapes",
  parent: monorepo,
  outdir: "packages/shapes",
  modelLanguage: ModelLanguage.SMITHY,
  modelOptions: {
    smithy: {
      serviceName: {
        namespace: "com.my.shared.shapes",
        serviceName: "Ignored",
      },
    },
  },
});

const api = new TypeSafeApiProject({ ... });

// Add the implicit monorepo dependency (if using the nx-monorepo) to ensure the shape library is built before the api model
monorepo.addImplicitDependency(api.model, shapes);

// Add a local file dependency on the built shapes jar
api.model.smithy!.addSmithyDeps(shapes.smithy!);
```
