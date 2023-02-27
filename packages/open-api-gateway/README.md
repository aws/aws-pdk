## OpenAPI Gateway

Define your APIs using [Smithy](https://awslabs.github.io/smithy/2.0/) or [OpenAPI v3](https://swagger.io/specification/), and leverage the power of generated clients and documentation, automatic input validation, and type safe client and server code!

This package vends a projen project type which allows you to define an API using either [Smithy](https://awslabs.github.io/smithy/2.0/) or [OpenAPI v3](https://swagger.io/specification/), and a construct which manages deploying this API in API Gateway, given an integration (eg a lambda) for every operation.

The project will generate models and clients from your api definition in your desired languages, and can be utilised both client side or server side in lambda handlers. The project type also generates a wrapper construct which adds type safety to ensure an integration is provided for every API operation.

When you change your API specification, just run `npx projen` again to regenerate all of this!

### Project

Use the provided projen project types to get started with your API quickly! There are options for TypeScript, Python and Java:

* Smithy
  * `SmithyApiGatewayTsProject`
  * `SmithyApiGatewayPythonProject`
  * `SmithyApiGatewayJavaProject`
* OpenAPI
  * `OpenApiGatewayTsProject`
  * `OpenApiGatewayPythonProject`
  * `OpenApiGatewayJavaProject`

We recommend using the Smithy-based projects, given that Smithy has a less verbose and more powerful IDL (Interface Definition Language).

Choose the project type based on the language you'd like to _write your CDK infrastructure in_. Whichever option above you choose, you can still write your server-side code in any language.

It's recommended that these projects are used as part of an `nx-monorepo` project, as it makes setting up dependencies much easier, and you will not need to manage the build order of generated clients.

#### Typescript

##### OpenAPI

While it is recommended to use the project within an `nx-monorepo`, you can still use this as a standalone project if you like (eg `npx projen new --from @aws-prototyping-sdk/open-api-gateway open-api-gateway-ts`), however you will need to manage build order (ie building the generated client first, followed by the project).

For usage in a monorepo:

Create the project in your .projenrc:

```ts
import { ClientLanguage, DocumentationFormat, OpenApiGatewayTsProject } from "@aws-prototyping-sdk/open-api-gateway";

new OpenApiGatewayTsProject({
  parent: myNxMonorepo,
  defaultReleaseBranch: "mainline",
  name: "my-api",
  outdir: "packages/api",
  clientLanguages: [ClientLanguage.TYPESCRIPT, ClientLanguage.PYTHON, ClientLanguage.JAVA],
  documentationFormats: [DocumentationFormat.HTML2, DocumentationFormat.PLANTUML, DocumentationFormat.MARKDOWN],
});
```

In the output directory (`outdir`), you'll find a few files to get you started.

```
|_ src/
    |_ spec/
        |_ spec.yaml - The OpenAPI specification - edit this to define your API
        |_ .parsed-spec.json - A json spec generated from your spec.yaml.
    |_ api/
        |_ api.ts - A CDK construct which defines the API Gateway resources to deploy your API. 
        |           This wraps the OpenApiGatewayRestApi construct and provides typed interfaces for integrations specific
        |           to your API. You shouldn't need to modify this, instead just extend it as in sample-api.ts.
        |_ sample-api.ts - Example usage of the construct defined in api.ts.
        |_ sample-api.say-hello.ts - An example lambda handler for the operation defined in spec.yaml, making use of the
                                     generated lambda handler wrappers for marshalling and type safety.
|_ generated/
    |_ typescript/ - A generated typescript API client.
    |_ python/ - A generated python API client.
    |_ java/ - A generated java API client.
    |_ documentation/
        |_ html2/ - Generated html documentation
        |_ markdown/ - Generated markdown documentation
        |_ plantuml/ - Generated plant uml documentation
```

If you would prefer to not generate the sample code, you can pass `sampleCode: false` to `OpenApiGatewayTsProject`.

To make changes to your api, simply update `spec.yaml` and run `npx projen` to synthesize all the typesafe client/server code!

The `SampleApi` construct uses `NodejsFunction` to declare the example lambda, but you are free to change this!

##### Smithy

To create a project with Smithy as your interface definition language (IDL), you can use the `SmithyApiGatewayTsProject`:

```ts
import { ClientLanguage, DocumentationFormat, SmithyApiGatewayTsProject } from "@aws-prototyping-sdk/open-api-gateway";

new SmithyApiGatewayTsProject({
  parent: myNxMonorepo,
  defaultReleaseBranch: "mainline",
  name: "my-api",
  outdir: "packages/api",
  serviceName: {
    namespace: "com.mycompany",
    serviceName: "MyService",
  },
  clientLanguages: [ClientLanguage.TYPESCRIPT, ClientLanguage.PYTHON, ClientLanguage.JAVA],
  documentationFormats: [DocumentationFormat.HTML2, DocumentationFormat.PLANTUML, DocumentationFormat.MARKDOWN],
});
```

This will result in a directory structure similar to the following:

```
|_ smithy/
    |_ src/
        |_ main/
            |_ smithy - The Smithy model used to define your API. You can define as many .smithy files in here as you like.
    |_ build.gradle - Smithy build gradle file - use this to add dependencies/plugins used in your smithy build
    |_ settings.gradle - Setup for the Smithy gradle project
    |_ smithy-build.json - Smithy build configuration - managed via options on the projen project
|_ src/
    |_ spec/
        |_ .parsed-spec.json - A json spec generated from your Smithy model.
    |_ api/
        |_ api.ts - A CDK construct which defines the API Gateway resources to deploy your API. 
        |           This wraps the OpenApiGatewayRestApi construct and provides typed interfaces for integrations specific
        |           to your API. You shouldn't need to modify this, instead just extend it as in sample-api.ts.
        |_ sample-api.ts - Example usage of the construct defined in api.ts.
        |_ sample-api.say-hello.ts - An example lambda handler for the operation defined in spec.yaml, making use of the
                                     generated lambda handler wrappers for marshalling and type safety.
|_ generated/
    |_ typescript/ - A generated typescript API client.
    |_ python/ - A generated python API client.
    |_ java/ - A generated java API client.
    |_ documentation/
        |_ html2/ - Generated html documentation
        |_ markdown/ - Generated markdown documentation
        |_ plantuml/ - Generated plant uml documentation
```

###### Customisation

You can customise the Smithy project with several properties:

```ts
new SmithyApiGatewayTsProject({
  parent: myNxMonorepo,
  defaultReleaseBranch: "mainline",
  name: "my-api",
  outdir: "packages/api",
  clientLanguages: [],
  // The fully qualified service name for your API
  serviceName: {
    namespace: "com.mycompany",
    serviceName: "MyService",
  },
  // By default, the contents of `smithy-build/output` will be ignored by source control.
  // Set this to false to include it, for example if you are generating clients directly from the smithy model.
  ignoreSmithyBuildOutput: false,
  // The gradle wrapper used for the smithy build is copied from the PDK itself if it does not already exist in
  // the 'smithy' folder. By default, this gradle wrapper will be ignored by source control.
  // Set this to false if you would like to check the gradle wrapper in to source control, for example if you want
  // to use a different version of the gradle wrapper in your project.
  ignoreGradleWrapper: false,
  // Use smithyBuildOptions to control what is added to smithy-build.json. See more details below.
  smithyBuildOptions: {
    projections: {
      "ts-client": {
        "plugins": {
          "typescript-codegen": {
            "package" : "@my-test/smithy-generated-typescript-client",
            "packageVersion": "0.0.1"
          }
        }
      }
    }
  }
});
```

`smithyBuildOptions` allows you to customise the Smithy build, used for generating clients from the Smithy model (eg above), or customising the OpenAPI generation.

OpenAPI generation can be customised by referencing the `openapi` projection as follows:

```ts
smithyBuildOptions: {
  projections: {
    openapi: {
      plugins: {
        openapi: {
          // Customise the openapi projection here...
          forbidGreedyLabels: true,
          ...
        }
      }
    }
  }
}
```

The OpenAPI specification generated by this projection is used to create the CDK infrastructure, lambda handler wrappers, etc. Options for configuring OpenAPI generation can be found [in the Smithy OpenAPI documentation](https://awslabs.github.io/smithy/2.0/guides/converting-to-openapi.html).

Note that any additional dependencies required for projections/plugins can be added by modifying `smithyBuildOptions`, which in turn will add them to the `smithy/build.gradle` file:

```ts
smithyBuildOptions: {
  maven: {
    dependencies: [
      "software.amazon.smithy:smithy-validation-model:1.27.2",
    ]
  }
}
```

Notice `smithy-cli`, `smithy-model`, `smithy-openapi` and `smithy-aws-traits` are always included in the `build.gradle` since they are required for converting your Smithy model to OpenAPI. You can customise the version of these dependencies by specifying them in `smithyBuildOptions`:

```ts
smithyBuildOptions: {
  maven: {
    dependencies: [
      "software.amazon.smithy:smithy-cli:1.27.0",
      "software.amazon.smithy:smithy-model:1.27.0",
      "software.amazon.smithy:smithy-openapi:1.27.0",
      "software.amazon.smithy:smithy-aws-traits:1.27.0",
    ]
  }
}
```

#### Python

##### OpenAPI

As well as typescript, you can choose to generate the cdk construct and sample handler in python.

```ts
new OpenApiGatewayPythonProject({
  parent: myNxMonorepo,
  outdir: 'packages/myapi',
  name: 'myapi',
  moduleName: 'myapi',
  version: '1.0.0',
  authorName: 'jack',
  authorEmail: 'me@example.com',
  clientLanguages: [ClientLanguage.TYPESCRIPT, ClientLanguage.PYTHON, ClientLanguage.JAVA],
});
```

You will need to set up a shared virtual environment and configure dependencies via the monorepo (see README.md for the nx-monorepo package). An example of a full `.projenrc.ts` might be:

```ts
import { nx_monorepo } from "aws-prototyping-sdk";
import { ClientLanguage, OpenApiGatewayPythonProject } from "@aws-prototyping-sdk/open-api-gateway";
import { AwsCdkPythonApp } from "projen/lib/awscdk";

const monorepo = new nx_monorepo.NxMonorepoProject({
  defaultReleaseBranch: "main",
  devDeps: ["aws-prototyping-sdk", "@aws-prototyping-sdk/open-api-gateway"],
  name: "open-api-test",
});

const api = new OpenApiGatewayPythonProject({
  parent: monorepo,
  outdir: 'packages/myapi',
  name: 'myapi',
  moduleName: 'myapi',
  version: '1.0.0',
  authorName: 'jack',
  authorEmail: 'me@example.com',
  clientLanguages: [ClientLanguage.TYPESCRIPT],
  venvOptions: {
    // Use a shared virtual env dir.
    // The generated python client will also use this virtual env dir
    envdir: '../../.env',
  },
});

// Install into virtual env so it's available for the cdk app
api.tasks.tryFind('install')!.exec('pip install --editable .');

const app = new AwsCdkPythonApp({
  authorName: "jack",
  authorEmail: "me@example.com",
  cdkVersion: "2.1.0",
  moduleName: "myapp",
  name: "myapp",
  version: "1.0.0",
  parent: monorepo,
  outdir: "packages/myapp",
  deps: [api.moduleName],
  venvOptions: {
    envdir: '../../.env',
  },
});

monorepo.addImplicitDependency(app, api);

monorepo.synth();
```

You'll find the following directory structure in `packages/myapi`:

```
|_ myapi/
    |_ spec/
        |_ spec.yaml - The OpenAPI specification - edit this to define your API
        |_ .parsed-spec.json - A json spec generated from your spec.yaml.
    |_ api/
        |_ api.py - A CDK construct which defines the API Gateway resources to deploy your API. 
        |           This wraps the OpenApiGatewayRestApi construct and provides typed interfaces for integrations specific
        |           to your API. You shouldn't need to modify this, instead just extend it as in sample_api.py.
        |_ sample_api.py - Example usage of the construct defined in api.py.
        |_ handlers/
             |_ say_hello_handler_sample.py - An example lambda handler for the operation defined in spec.yaml, making use of the
                                              generated lambda handler wrappers for marshalling and type safety.
|_ generated/
    |_ typescript/ - A generated typescript API client.
    |_ python/ - A generated python API client.
    |_ java/ - A generated java API client.
```

For simplicity, the generated code deploys a lambda layer for the generated code and its dependencies. You may choose to define an entirely separate projen `PythonProject` for your lambda handlers should you wish to add more dependencies than just the generated code.

##### Smithy

Similar to typescript, you can use the `SmithyApiGatewayPythonProject`.

#### Java

##### OpenAPI

As well as TypeScript and Python, you can choose to generate the cdk construct and sample handler in Java.

```ts
new OpenApiGatewayJavaProject({
  parent: monorepo,
  outdir: 'packages/myapi',
  name: "myapi",
  groupId: "com.mycompany",
  artifactId: "my-api",
  version: "1.0.0",
  clientLanguages: [ClientLanguage.PYTHON, ClientLanguage.TYPESCRIPT],
  documentationFormats: [DocumentationFormat.HTML2, DocumentationFormat.PLANTUML, DocumentationFormat.MARKDOWN],
});
```

The output directory will look a little like this:

```
|_ src/
    |_ spec/
        |_ spec.yaml - The OpenAPI specification - edit this to define your API
    |_ main/
        |_ java/
            |_ api/
                |_ Api.java - A CDK construct which defines the API Gateway resources to deploy your API. 
                |             This wraps the OpenApiGatewayRestApi construct and provides typed interfaces for integrations specific
                |             to your API. You shouldn't need to modify this, instead just extend it as in SampleApi.java.
                |_ ApiProps.java - Defines properties for the CDK construct in Api.java
                |_ SampleApi.java - Example usage of the construct defined in Api.java
                |_ SayHelloHandler.java - An example lambda handler for the operation defined in spec.yaml, making use of the
                                        generated lambda handler wrappers for marshalling and type safety.
        |_ resources/
            |_ .parsed-spec.json - A json spec generated from your spec.yaml. This will be bundled in the project jar.
|_ generated/
    |_ typescript/ - A generated typescript API client
    |_ python/ - A generated python API client.
    |_ java/ - A generated java API client.
    |_ documentation/
        |_ html2/ - Generated html documentation
        |_ markdown/ - Generated markdown documentation
        |_ plantuml/ - Generated plant uml documentation
```

The `SampleApi` construct uses a lambda function which deploys the entire project jar as a simple way to get started with an api that deploys out of the box. This jar includes a lot of extra code and dependencies that you don't need in your lambda, so it's recommended that after experimenting with the construct, you separate your lambdas into another `JavaProject`. Please refer to the `Java API Lambda Handlers` section of this README for details on how to set this up.

##### Smithy

Similar to typescript and python, you can use the `SmithyApiGatewayJavaProject`.

### Smithy IDL

Please refer to the [Smithy documentation](https://awslabs.github.io/smithy/2.0/quickstart.html) for how to write models in Smithy. A basic example is provided below:

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

Currently only [AWS restJson1](https://awslabs.github.io/smithy/2.0/aws/protocols/aws-restjson1-protocol.html) is supported. Please ensure your service is annotated with the `@restJson1` trait.

#### Multiple Files

You can split your definition into multiple files and folders, so long as they are all under the `smithy/src/main/smithy` directory in your API project.

#### Authorizers

Smithy supports [adding API Gateway authorizers in the model itself](https://awslabs.github.io/smithy/2.0/aws/aws-auth.html). Given that at model definition time one usually does not know the ARN of the user pool or lambda function for an authorizer, it is recommended to add the authorizer(s) in your Api CDK construct.

If using Smithy generated clients, some authorizer traits (eg sigv4) will include configuring the client for that particular method of authorization, so it can be beneficial to still define authorizers in the model. We therefore support specifying authorizers in both the model and the construct, but note that the construct will take precedence where the authorizer ID is the same.

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

A sample construct is generated which provides a type-safe interface for creating an API Gateway API based on your OpenAPI specification. You'll get a type error if you forget to define an integration for an operation defined in your api.

```ts
import { Authorizers, Integrations } from '@aws-prototyping-sdk/open-api-gateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { Api } from './api';

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

If you would like to use the same integration for every operation, you can use the `Operations.all` method from your generated client to save repeating yourself, for example:

```ts
import { Operations } from 'my-api-typescript-client';
import { Authorizers, Integrations } from '@aws-prototyping-sdk/open-api-gateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { Api } from './api';

export class SampleApi extends Api {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      defaultAuthorizer: Authorizers.iam(),
      // Use the same integration for every operation.
      integrations: Operations.all({
        integration: Integrations.lambda(new NodejsFunction(scope, 'say-hello')),
      }),
    });
  }
}
```

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

### Generated Client

#### Typescript

The [typescript-fetch](https://openapi-generator.tech/docs/generators/typescript-fetch/) OpenAPI generator is used to generate OpenAPI clients for typescript. This requires an implementation of `fetch` to be passed to the client. In the browser one can pass the built in fetch, or in NodeJS you can use an implementation such as [node-fetch](https://www.npmjs.com/package/node-fetch).

Example usage of the client in a website:

```ts
import { Configuration, DefaultApi } from "my-api-typescript-client";

const client = new DefaultApi(new Configuration({
  basePath: "https://xxxxxxxxxx.execute-api.ap-southeast-2.amazonaws.com",
  fetchApi: window.fetch.bind(window),
}));

await client.sayHello({ name: "Jack" });
```

#### Python

The [python](https://openapi-generator.tech/docs/generators/python) OpenAPI generator is used to generate OpenAPI clients for python.

Example usage:

```python
from my_api_python import ApiClient, Configuration
from my_api_python.api.default_api import DefaultApi

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

You'll find details about how to use the python client in the README.md alongside your generated client.

#### Java

The [java](https://openapi-generator.tech/docs/generators/java/) OpenAPI generator is used to generate OpenAPI clients for Java.

Example usage:

```java
import com.generated.api.myapijava.client.api.DefaultApi;
import com.generated.api.myapijava.client.ApiClient;
import com.generated.api.myapijava.client.Configuration;
import com.generated.api.myapijava.client.models.HelloResponse;

ApiClient client = Configuration.getDefaultApiClient();
client.setBasePath("https://xxxxxxxxxx.execute-api.ap-southeast-2.amazonaws.com");

DefaultApi api = new DefaultApi(client);
HelloResponse response = api.sayHello("Adrian").execute()
```

You'll find more details about how to use the Java client in the README.md alongside your generated client.

### Lambda Handler Wrappers

Lambda handler wrappers are also importable from the generated client. These provide input/output type safety, ensuring that your API handlers return outputs that correspond to your specification.

#### Typescript

```ts
import { sayHelloHandler } from "my-api-typescript-client";

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
import { handlerRouter, sayHelloHandler, sayGoodbyeHandler } from "my-api-typescript-client";
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
from myapi_python.apis.tags.default_api_operation_config import say_hello_handler, SayHelloRequest, ApiResponse, SayHelloOperationResponses
from myapi_python.model.api_error import ApiError
from myapi_python.model.hello_response import HelloResponse

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
from myapi_python.apis.tags.default_api_operation_config import say_hello_handler, SayHelloRequest, ApiResponse, SayHelloOperationResponses, handler_router, HandlerRouterHandlers
from myapi_python.model.api_error import ApiError
from myapi_python.model.hello_response import HelloResponse
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
import com.generated.api.myapijava.client.api.Handlers.SayHello;
import com.generated.api.myapijava.client.api.Handlers.SayHello200Response;
import com.generated.api.myapijava.client.api.Handlers.SayHelloRequestInput;
import com.generated.api.myapijava.client.api.Handlers.SayHelloResponse;
import com.generated.api.myapijava.client.model.HelloResponse;


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
import com.generated.api.myapijava.client.api.Handlers.SayGoodbye;
import com.generated.api.myapijava.client.api.Handlers.HandlerRouter;
import com.generated.api.myapijava.client.api.Handlers.Interceptors;
import com.generated.api.myapijava.client.api.Handlers.SayHello;

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
} from "my-api-typescript-client";

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
} from 'my-api-typescript-client';

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
} from 'my-api-typescript-client';

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
from myapi_python.apis.tags.default_api_operation_config import say_hello_handler, SayHelloRequest, ApiResponse, SayHelloOperationResponses
from myapi_python.model.api_error import ApiError
from myapi_python.model.hello_response import HelloResponse

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
from myapi_python.apis.tags.default_api_operation_config import ChainedApiRequest, ApiResponse

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
from myapi_python.model.api_error import ApiError
from myapi_python.apis.tags.default_api_operation_config import ChainedApiRequest, ApiResponse

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
import com.generated.api.myjavaapi.client.api.Handlers.Interceptors;

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
import com.generated.api.myjavaapi.client.api.Handlers.Interceptor;
import com.generated.api.myjavaapi.client.api.Handlers.ChainedRequestInput;
import com.generated.api.myjavaapi.client.api.Handlers.Response;

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
import com.generated.api.myjavaapi.client.api.Handlers.Interceptor;
import com.generated.api.myjavaapi.client.api.Handlers.ChainedRequestInput;
import com.generated.api.myjavaapi.client.api.Handlers.Response;
import com.generated.api.myjavaapi.client.api.Handlers.ApiResponse;
import com.generated.api.myjavaapi.client.model.ApiError;

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

### Other Details

#### Workspaces and `OpenApiGatewayTsProject`

`OpenApiGatewayTsProject` can be used as part of a monorepo using YARN/NPM/PNPM workspaces. When used in a monorepo, a dependency is established between `OpenApiGatewayTsProject` and the generated typescript client, which is expected to be managed by the parent monorepo (ie both `OpenApiGatewayTsProject` and the generated typescript client are parented by the monorepo).

During initial project synthesis, the dependency between `OpenApiGatewayTsProject` and the generated client is established via workspace configuration local to `OpenApiGatewayTsProject`, since the parent monorepo will not have updated to include the new packages in time for the initial "install".

When the package manager is PNPM, this initial workspace is configured by creating a local `pnpm-workspace.yaml` file, and thus if you specify your own for an instance of `OpenApiGatewayTsProject`, synthesis will fail. It is most likely that you will not need to define this file locally in `OpenApiGatewayTsProject` since the monorepo copy should be used to manage all packages within the repo, however if managing this file at the `OpenApiGatewayTsProject` level is required, please use the `pnpmWorkspace` property of `OpenApiGatewayTsProject`.

#### Customising Generated Client Projects

By default, the generated clients are configured automatically, including project names. You can customise the generated client code using the `<language>ProjectOptions` properties when constructing your projen project.

##### Python Shared Virtual Environment

For adding dependencies between python projects within a monorepo you can use a single shared virtual environment, and install your python projects into that environment with `pip install --editable .` in the dependee. The generated python client will automatically do this if it detects it is within a monorepo.

The following example shows how to configure the generated client to use a shared virtual environment:

```ts
const api = new OpenApiGatewayTsProject({
  parent: monorepo,
  name: 'api',
  outdir: 'packages/api',
  defaultReleaseBranch: 'main',
  clientLanguages: [ClientLanguage.PYTHON],
  pythonClientOptions: {
    moduleName: 'my_api_python',
    name: 'my_api_python',
    authorName: 'jack',
    authorEmail: 'me@example.com',
    version: '1.0.0',
    venvOptions: {
      // Directory relative to the generated python client (in this case packages/api/generated/python)
      envdir: '../../../../.env',
    },
  },
});

new PythonProject({
  parent: monorepo,
  outdir: 'packages/my-python-lib',
  moduleName: 'my_python_lib',
  name: 'my_python_lib',
  authorName: 'jack',
  authorEmail: 'me@example.com',
  version: '1.0.0',
  venvOptions: {
    // Directory relative to the python lib (in this case packages/my-python-lib)
    envdir: '../../.env',
  },
  // Generated client can be safely cast to a PythonProject
  deps: [(api.generatedClients[ClientLanguage.PYTHON] as PythonProject).moduleName],
});
```

#### Java API Lambda Handlers

To build your lambda handlers in Java, it's recommended to create a separate `JavaProject` in your `.projenrc`. This needs to build a "super jar" with all of your dependencies packed into a single jar. You can use the `maven-shade-plugin` to achieve this (see [the java lambda docs for details](https://docs.aws.amazon.com/lambda/latest/dg/java-package.html)). You'll need to add a dependency on the generated java client for the handler wrappers. For example, your `.projenrc.ts` might look like:

```ts
const api = new OpenApiGatewayTsProject({
  parent: monorepo,
  name: '@my-test/api',
  outdir: 'packages/api',
  defaultReleaseBranch: 'main',
  clientLanguages: [ClientLanguage.JAVA],
});

const apiJavaClient = (api.generatedClients[ClientLanguage.JAVA] as JavaProject);

const javaLambdaProject = new JavaProject({
  parent: monorepo,
  outdir: 'packages/java-lambdas',
  artifactId: "my-java-lambdas",
  groupId: "com.mycompany",
  name: "javalambdas",
  version: "1.0.0",
  // Add a dependency on the java client
  deps: [`${apiJavaClient.pom.groupId}/${apiJavaClient.pom.artifactId}@${apiJavaClient.pom.version}`],
});

// Set up the dependency on the generated lambda client
monorepo.addImplicitDependency(javaLambdaProject, apiJavaClient);
javaLambdaProject.pom.addRepository({
  url: `file://../api/generated/java/dist/java`,
  id: 'java-api-client',
});

// Use the maven-shade-plugin as part of the maven package task
javaLambdaProject.pom.addPlugin('org.apache.maven.plugins/maven-shade-plugin@3.2.2', {
  configuration: {
    createDependencyReducedPom: false,
    finalName: 'my-java-lambdas',
  },
  executions: [{
    id: 'shade-task',
    phase: 'package', // <- NB "phase" is supported in projen ^0.61.37
    goals: ['shade'],
  }],
});

// Build the "super jar" as part of the project's package task
javaLambdaProject.packageTask.exec('mvn clean install');
```

You can then implement your lambda handlers in your `java-lambdas` project using the generated lambda handler wrappers (see above).

Finally, you can create a lambda function in your CDK infrastructure which points to the resultant "super jar":

```ts
new Api(this, 'JavaApi', {
  integrations: {
    sayHello: {
      function: new Function(this, 'SayHelloJava', {
        code: Code.fromAsset('../java-lambdas/target/my-java-lambdas.jar'),
        handler: 'com.mycompany.SayHelloHandler',
        runtime: Runtime.JAVA_11,
        timeout: Duration.seconds(30),
      }),
    },
  },
});
```

Note that to ensure the jar is built before the CDK infrastructure which consumes it, you must add a dependency, eg:

```ts
monorepo.addImplicitDependency(infra, javaLambdaProject);
```

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

### Tagging Operations

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

### Breaking Changes

* `v0.14.0` - see https://github.com/aws/aws-prototyping-sdk/pull/280
  * Moved smithy model files from `model` directory to `smithy/src/main/smithy` - please move these manually as part of upgrading to `0.14.0`, and delete your `model` directory when done.
  * Moved smithy gradle files from `smithy-build` directory to `smithy` - if you have added any dependencies to your `smithy-build/build.gradle` file you will need to copy them across into `smithy/build.gradle` (note dependencies in the new gradle file start with `implementation` rather than `smithy`).
  * Deprecated `gradleWrapperPath` option on SmithApiGateway projects in favour of `ignoreGradleWrapper: false` - the gradle wrapper in `smithy` directory is always used (and generated automatically if not found). If you used a custom gradle wrapper, copy it into the `smithy` directory, set `ignoreGradleWrapper: false` and check it in to your repository.
