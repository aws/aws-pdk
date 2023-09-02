# Type Safe API

![stable](https://img.shields.io/badge/stability-stable-green.svg)
[![API Documentation](https://img.shields.io/badge/view-API_Documentation-blue.svg)](../../api/typescript/type-safe-api/index.md)
[![Source Code](https://img.shields.io/badge/view-Source_Code-blue.svg)](https://github.com/aws/aws-pdk/tree/mainline/packages/type-safe-api)

The _type-safe-api_ package provides a projen project type which allows you to define an API using either [Smithy](https://smithy.io/2.0/) or [OpenAPI v3](https://swagger.io/specification/), and a construct which manages deploying this API in an API Gateway.

You can define your APIs using [Smithy](https://smithy.io/2.0/) or [OpenAPI v3](https://swagger.io/specification/), and leverage the power of generated client and server types, infrastructure, documentation, and automatic input validation.

## How does it work?

The project will generate runtime projects from your API definition in your desired languages, which you can use both on the client side for interacting with your API, or server side for implementing your API. The project also generates a type-safe CDK construct which ensures an integration is provided for every API operation.

!!! note

    The code is generated at build time, so when you change your API model, you will need to rebuild to see your changes reflected in the generated code.

The `TypeSafeApiProject` projen project creates the following directory structure within its `outdir`:

```
|_ model/
    |_ src/
        |_ main/
            |_ smithy - your API definition if you chose ModelLanguage.SMITHY
            |_ openapi - your API definition if you chose ModelLanguage.OPENAPI
|_ generated/
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
    |_ library/ - generated libraries if specified
        |_ typescript-react-query-hooks
```

## Getting started

This section describes how to get started with the type-safe API. For more information, refer to the other user guides on particular features of this library.

!!! info

    Select the tabs to use this library with infrastructure and lambda handlers in the same language, but you can mix and match language. For example, you could write CDK infrastructure in Java and implement your lambda handlers in Python.

### Type Safe API project structure

The `TypeSafeApiProject` projen project sets up the project structure for you. Consider the following parameters when creating the project:

- `model` - Configure the API model. Select a `language` for the model from either [Smithy](https://smithy.io/2.0/) or [OpenAPI v3](https://swagger.io/specification/), and provide `options.smithy` or `options.openapi` depending on your choice.
- `runtime` - Configure the generated runtime projects. Include one or more `languages` you want to write your client and/or server-side code in. These projects contain generated types defined in your model, as well as type-safe lambda handler wrappers for implementing each operation.
- `infrastructure` - Select the `language` you are writing your CDK infrastructure in. A construct will be generated in this language which can be used to deploy the API.
- `documentation` - Specify `formats` to generate documentation in.
- `library` - Specify additional `libraries` to generate, such as React Query hooks for use in a React website.

## Create your API project

!!! info

    We recommend you use these projects as part of an `monorepo` project (eg. by specifying `parent: monorepo`), as it makes setting up dependencies much easier, particularly when extending your project further with a CDK app and lambda functions.

1. To start an empty `monorepo` project, use this command:

```bash
npx projen new --from @aws-prototyping-sdk/monorepo
```

2. Add `@aws-prototyping-sdk/type-safe-api` to your `MonorepoTsProject`'s `devDeps` and re-synthesize to install the dependency.

```
yarn projen
```

3. Edit your `.projenrc` and configure `TypeSafeApiProject`.

!!! tip

    Use the tabs to see how to set up a project for writing infrastructure, and server-side code using specfic languages (TypeScript, Java, and Python).

=== "TS"

    ```ts
    import { MonorepoTsProject } from "@aws-prototyping-sdk/monorepo";
    import {
      DocumentationFormat,
      Language,
      Library,
      ModelLanguage,
      TypeSafeApiProject,
    } from "@aws-prototyping-sdk/type-safe-api";
    import { AwsCdkTypeScriptApp } from "projen/lib/awscdk";

    // Create the monorepo
    const monorepo = new MonorepoTsProject({
      name: "my-project",
      defaultReleaseBranch: "main",
      devDeps: [
        "@aws-prototyping-sdk/monorepo",
        "@aws-prototyping-sdk/type-safe-api",
      ],
    });

    // Create the API project
    const api = new TypeSafeApiProject({
      name: "myapi",
      parent: monorepo,
      outdir: "packages/api",
      // Smithy as the model language. You can also use ModelLanguage.OPENAPI
      model: {
        language: ModelLanguage.SMITHY,
        options: {
          smithy: {
            serviceName: {
              namespace: "com.my.company",
              serviceName: "MyApi",
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
      },
      // Generate react-query hooks to interact with the UI from a React website
      library: {
        libraries: [Library.TYPESCRIPT_REACT_QUERY_HOOKS],
      },
    });

    // Create a CDK infrastructure project. Can also consider PDKPipelineTsProject as an alternative!
    const infra = new AwsCdkTypeScriptApp({
      defaultReleaseBranch: "main",
      cdkVersion: "2.0.0",
      parent: monorepo,
      outdir: "packages/infra",
      name: "myinfra",
      deps: [
        "@aws-prototyping-sdk/type-safe-api",
      ],
    });

    // Infrastructure can depend on the generated API infrastructure and runtime
    infra.addDeps(api.infrastructure.typescript!.package.packageName);
    infra.addDeps(api.runtime.typescript!.package.packageName);

    monorepo.synth();
    ```

=== "JAVA"

    The `.projenrc` file is written in TypeScript here in order to make use of the `monorepo`, but shows an example project definition for implementing infrastructure and lambda handlers in Java.

    ```ts
    import { MonorepoTsProject } from "@aws-prototyping-sdk/monorepo";
    import {
      DocumentationFormat,
      Language,
      Library,
      ModelLanguage,
      TypeSafeApiProject,
    } from "@aws-prototyping-sdk/type-safe-api";
    import { AwsCdkJavaApp } from "projen/lib/awscdk";
    import { JavaProject } from "projen/lib/java";

    // Create the monorepo
    const monorepo = new MonorepoTsProject({
      name: "my-project",
      defaultReleaseBranch: "main",
      devDeps: [
        "@aws-prototyping-sdk/monorepo",
        "@aws-prototyping-sdk/type-safe-api",
      ],
    });

    // Create the API project
    const api = new TypeSafeApiProject({
      name: "myapi",
      parent: monorepo,
      outdir: "packages/api",
      // Smithy as the model language. You can also use ModelLanguage.OPENAPI
      model: {
        language: ModelLanguage.SMITHY,
        options: {
          smithy: {
            serviceName: {
              namespace: "com.my.company",
              serviceName: "MyApi",
            },
          },
        },
      },
      // Generate types, client and server code in TypeScript, Python and Java
      runtime: {
        languages: [Language.TYPESCRIPT, Language.PYTHON, Language.JAVA],
      },
      // CDK infrastructure in Java
      infrastructure: {
        language: Language.JAVA,
      },
      // Generate HTML documentation
      documentation: {
        formats: [DocumentationFormat.HTML_REDOC],
      },
      // Generate react-query hooks to interact with the UI from a React website
      library: {
        libraries: [Library.TYPESCRIPT_REACT_QUERY_HOOKS],
      },
    });

    // Create a Java project for our lambda functions which will implement the API operations
    const lambdas = new JavaProject({
      artifactId: "lambdas",
      groupId: "com.my.company",
      name: "lambdas",
      version: "1.0.0",
      parent: monorepo,
      outdir: "packages/lambdas",
      sample: false,
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

    // Create a CDK infrastructure project. Can also consider PDKPipelineJavaProject as an alternative!
    const infra = new AwsCdkJavaApp({
      artifactId: "infra",
      groupId: "com.my.company",
      mainClass: "com.my.company.MyApp",
      version: "1.0.0",
      cdkVersion: "2.0.0",
      name: "infra",
      parent: monorepo,
      outdir: "packages/infra",
      deps: [
        "software.aws.awsprototypingsdk/type-safe-api@^0",
      ],
    });

    // Add a dependency on the generated CDK infrastructure and runtime
    monorepo.addJavaDependency(infra, api.infrastructure.java!);
    monorepo.addJavaDependency(infra, api.runtime.java!);

    // Make sure the java lambda builds before our CDK infra
    monorepo.addImplicitDependency(infra, lambdas);

    monorepo.synth();
    ```

=== "PYTHON"

    The `.projenrc` file is written in TypeScript here in order to make use of the `monorepo`, but shows an example project definition for implementing infrastructure and lambda handlers in Python.

    ```ts
    import { MonorepoTsProject } from "@aws-prototyping-sdk/monorepo";
    import {
      DocumentationFormat,
      Language,
      Library,
      ModelLanguage,
      TypeSafeApiProject,
    } from "@aws-prototyping-sdk/type-safe-api";
    import { AwsCdkPythonApp } from "projen/lib/awscdk";
    import { PythonProject } from "projen/lib/python";

    // Create the monorepo
    const monorepo = new MonorepoTsProject({
      name: "my-project",
      defaultReleaseBranch: "main",
      devDeps: [
        "@aws-prototyping-sdk/monorepo",
        "@aws-prototyping-sdk/type-safe-api",
      ],
    });

    // Create the API project
    const api = new TypeSafeApiProject({
      name: "myapi",
      parent: monorepo,
      outdir: "packages/api",
      // Smithy as the model language. You can also use ModelLanguage.OPENAPI
      model: {
        language: ModelLanguage.SMITHY,
        options: {
          smithy: {
            serviceName: {
              namespace: "com.my.company",
              serviceName: "MyApi",
            },
          },
        },
      },
      // Generate types, client and server code in TypeScript, Python and Java
      runtime: {
        languages: [Language.TYPESCRIPT, Language.PYTHON, Language.JAVA],
      },
      // CDK infrastructure in Python
      infrastructure: {
        language: Language.PYTHON,
      },
      // Generate HTML documentation
      documentation: {
        formats: [DocumentationFormat.HTML_REDOC],
      },
      // Generate react-query hooks to interact with the UI from a React website
      library: {
        libraries: [Library.TYPESCRIPT_REACT_QUERY_HOOKS],
      },
    });

    // Create a Python project for our lambda functions which will implement the API operations
    const lambdas = new PythonProject({
      parent: monorepo,
      poetry: true,
      outdir: "packages/lambdas",
      moduleName: "lambdas",
      name: "lambdas",
      version: "1.0.0",
      authorEmail: "me@example.com",
      authorName: "test",
    });

    // The lambdas package needs a dependency on the generated python runtime
    monorepo.addPythonPoetryDependency(lambdas, api.runtime.python!);

    // Add commands to the lambda project's package task to create a distributable which can be deployed to AWS Lambda
    lambdas.packageTask.exec(`mkdir -p lambda-dist && rm -rf lambda-dist/*`);
    lambdas.packageTask.exec(`cp -r ${lambdas.moduleName} lambda-dist/${lambdas.moduleName}`);
    lambdas.packageTask.exec(`poetry export --without-hashes --format=requirements.txt > lambda-dist/requirements.txt`);
    lambdas.packageTask.exec(`pip install -r lambda-dist/requirements.txt --target lambda-dist --upgrade`);

    // Create a CDK infrastructure project. Can also consider PDKPipelinePyProject as an alternative!
    const infra = new AwsCdkPythonApp({
      parent: monorepo,
      poetry: true,
      outdir: "packages/infra",
      moduleName: "infra",
      name: "infra",
      version: "1.0.0",
      cdkVersion: "2.0.0",
      authorEmail: "me@example.com",
      authorName: "test",
      deps: [
        "aws_prototyping_sdk.type_safe_api@<1.0.0",
      ],
    });

    // Add a dependency on the generated CDK infrastructure and runtime
    monorepo.addPythonPoetryDependency(infra, api.infrastructure.python!);
    monorepo.addPythonPoetryDependency(infra, api.runtime.python!);

    // Make sure the python lambdas build before our CDK infra
    monorepo.addImplicitDependency(infra, lambdas);

    monorepo.synth();
    ```

4. After you define your `.projenrc`, run `projen` and `build` (using the appropriate commands for your package manager). For example, if you are using `yarn`, use these commands.

```
yarn projen
yarn build
```

## Use the CDK construct

In your CDK application, using your preferred language, include the `Api` construct, vended from the generated infrastructure package.

=== "TS"

    Edit `packages/infra/src/main.ts` to include the `Api` construct.

    ```ts
    import { Stack, StackProps } from "aws-cdk-lib";
    import { Construct } from "constructs";
    import { Api } from "myapi-typescript-infra"; // <- generated typescript infrastructure package
    import { Authorizers, Integrations } from "@aws/pdk/type-safe-api";
    import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
    import { Cors } from "aws-cdk-lib/aws-apigateway";
    import * as path from "path";

    export class MyStack extends Stack {
      constructor(scope: Construct, id: string, props: StackProps = {}) {
        super(scope, id, props);

        // Instantiate the generated CDK construct to deploy an API Gateway API based on your model
        new Api(this, "MyApi", {
          defaultAuthorizer: Authorizers.iam(),
          corsOptions: {
            allowOrigins: Cors.ALL_ORIGINS,
            allowMethods: Cors.ALL_METHODS,
          },
          // Supply an integration for every operation
          integrations: {
            sayHello: {
              integration: Integrations.lambda(
                new NodejsFunction(this, "SayHelloLambda", {
                  entry: path.resolve(__dirname, "say-hello.ts"),
                })
              ),
            },
          },
        });
      }
    }
    ```

=== "JAVA"

    Edit `packages/infra/src/main/java/com/my/api/MyApp.java` to include the `Api` construct.

    ```java
    package com.my.api;

    // Imports from the generated infrastructure and runtime projects
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
            new Api(this, "Api", ApiProps.builder()
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
                                                    .runtime(Runtime.JAVA_17)
                                                    .timeout(Duration.seconds(30))
                                                    .build())))
                                    .build())
                            .build())
                    .build());

            app.synth();
        }
    }
    ```

=== "PYTHON"

    Edit `packages/infra/infra/main.py` to include the `Api` construct.

    ```python
    import os
    from aws_cdk import Stack
    from constructs import Construct
    from aws_cdk.aws_lambda import LayerVersion, Code, Function, Runtime
    from aws_prototyping_sdk.type_safe_api import Authorizers, TypeSafeApiIntegration, Integrations

    # Imports from the generated runtime and infrastructure projects
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

## Implement a Lambda handler

The generated runtime projects include lambda handler wrappers which provide type-safety for implementing your API operations. You can implement your lambda handlers in any of the supported languages, or mix and match languages for different operations if you prefer.

=== "TS"

    In the TypeScript CDK application in the CDK construct, we used `NodejsFunction` which allows you to write your lambda handler code in the same `infra` project. Define `say-hello.ts` and use the generated lambda handler wrapper.

    For example, the implementation of `packages/infra/src/say-hello.ts` may include:

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

=== "JAVA"

    In your `lambdas` project you can define your lambda handler in its source directory, for example, `packages/lambdas/src/main/java/com/my/api/SayHelloHandler.java`:

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

=== "PYTHON"

    In your `lambdas` project you can define your lambda handler in its source directory, for example, `packages/lambdas/lambdas/say_hello.py`:

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

## Add a new operation

To add a new operation to your API, follow these steps.

### Define the operation in your model

Add the new operation in the `model` project, for example:

=== "SMITHY"

    In `model/src/main/smithy/main.smithy`, or another `.smithy` file somewhere in `model/src/main/smithy`, define the operation:

    ```smithy
    /// Documentation about your operation can go here
    @http(method: "POST", uri: "/goodbye")
    operation SayGoodbye {
        input := {
            @required
            name: String
        }
        output := {
            @required
            message: String
        }
    }
    ```

    Register the operation to the service in `main.smithy`:

    ```smithy
    @restJson1
    service MyService {
        version: "1.0"
        operations: [
            SayHello
            SayGoodbye // <- add your new operation here
        ]
    }
    ```

=== "OPENAPI"

    In `model/src/main/openapi/main.yaml`, add the new operation under `paths`, and any new schemas under `components.schemas`.

    ```yaml
    paths:
        ...
        # Add the operation under "paths"
        /goodbye:
            post:
                operationId: sayGoodbye
                requestBody:
                    content:
                        application/json:
                            # We can define the request body inline or use a ref
                            schema:
                                $ref: "#/components/schemas/SayGoodbyeRequest"
                responses:
                    200:
                        description: Successful Response
                        content:
                            application/json:
                                # We can define the response body inline or use a ref
                                schema:
                                    $ref: "#/components/schemas/SayGoodbyeResponse"
    components:
        schemas:
            # Add components here
            SayGoodbyeRequest:
                type: object
                properties:
                    name:
                        type: string
                required:
                    - name
            SayGoodbyeResponse:
                type: object
                properties:
                    message:
                        type: string
                required:
                    - message
    ```

    Note: You can split your API into multiple `yaml` files. For more information, refer to [Using OpenAPI](using_openapi.md).

### Build your project

To run a build in the root of your monorepo, use your package manager's build command.

```
yarn build
```

The build will regenerate the infrastructure, runtime, documentation, and library projects based on your updated model.

As you must define an integration for every operation, you may see the following build error in your CDK application.

```ts
TSError: ⨯ Unable to compile TypeScript:
src/main.ts(16,7): error TS2741: Property 'sayGoodbye' is missing in type '{ sayHello: { integration: Integration; }; }' but required in type 'Operation
Config<TypeSafeApiIntegration>'.
```

This is expected, so follow these steps to add an integration.

### Add an integration

In your CDK application, add an integration for your new operation in the `Api` construct:

=== "TS"

    ```ts
    new Api(this, "MyApi", {
      ...
      integrations: {
        sayHello: {
          integration: Integrations.lambda(
            new NodejsFunction(this, "SayHelloLambda", {
              entry: path.resolve(__dirname, "say-hello.ts"),
            })
          ),
        },
        // Add the new integration here
        sayGoodbye: {
          integration: Integrations.lambda(
            new NodejsFunction(this, "SayGoodbyeLambda", {
              // Point at say-goodbye.ts which we'll define next
              entry: path.resolve(__dirname, "say-goodbye.ts"),
            })
          ),
        },
      },
    });
    ```

=== "JAVA"

    ```java
    new Api(this, "Api", ApiProps.builder()
            ...
            .integrations(OperationConfig.<TypeSafeApiIntegration>builder()
                    .sayHello(TypeSafeApiIntegration.builder()
                            .integration(Integrations.lambda(
                                    new Function(s, "say-hello", FunctionProps.builder()
                                            .code(Code.fromAsset("../lambdas/dist/java/com/my/api/lambdas/1.0.0/lambdas-1.0.0.jar"))
                                            .handler("com.my.api.SayHelloHandler")
                                            .runtime(Runtime.JAVA_17)
                                            .timeout(Duration.seconds(30))
                                            .build())))
                            .build())
                    .build())
                    // Add the new integration here
                    .sayGoodbye(TypeSafeApiIntegration.builder()
                            .integration(Integrations.lambda(
                                    new Function(s, "say-goodbye", FunctionProps.builder()
                                            // We'll point at the same jar and define our handler in the same "lambdas" package
                                            .code(Code.fromAsset("../lambdas/dist/java/com/my/api/lambdas/1.0.0/lambdas-1.0.0.jar"))
                                            // Point to SayGoodbyeHandler which we'll define next
                                            .handler("com.my.api.SayGoodbyeHandler")
                                            .runtime(Runtime.JAVA_17)
                                            .timeout(Duration.seconds(30))
                                            .build())))
                            .build())
                    .build())
            .build());

    ```

=== "PYTHON"

    ```python
    Api(self, 'Api',
        ...
        integrations=OperationConfig(
            say_hello=TypeSafeApiIntegration(
                integration=Integrations.lambda_(Function(self, 'SayHello',
                    runtime=Runtime.PYTHON_3_9,
                    code=Code.from_asset(path.join("..", "lambdas", "lambda-dist")),
                    handler="lambdas.say_hello.handler",
                )),
            ),
            # Add the new integration here
            say_goodbye=TypeSafeApiIntegration(
                integration=Integrations.lambda_(Function(self, 'SayHello',
                    runtime=Runtime.PYTHON_3_9,
                    # We'll point to the same distributable in the "lambdas" package
                    code=Code.from_asset(path.join("..", "lambdas", "lambda-dist")),
                    # But this time we point to the handler method in say_goodbye.py which we'll define next
                    handler="lambdas.say_goodbye.handler",
                )),
            ),
        ),
    )
    ```

### Implement the Lambda handler

After you add the integration, implement the API operation:

=== "TS"

    Add the new handler in `packages/infra/src/say-goodbye.ts`:

    ```ts
    import { sayGoodbyeHandler } from "myapi-typescript-runtime";

    export const handler = sayGoodbyeHandler(async ({ input }) => {
      return {
        statusCode: 200,
        body: {
          // This time we're referencing the name parameter from the POST request body
          message: `Goodbye ${input.body.name}`,
        },
      };
    });
    ```

=== "JAVA"

    In your `lambdas` project, define your new lambda handler: `packages/lambdas/src/main/java/com/my/api/SayGoodbyeHandler.java`:

    ```java
    package com.my.api;

    import com.generated.api.myapijavaruntime.runtime.api.Handlers.SayGoodbye;
    import com.generated.api.myapijavaruntime.runtime.api.Handlers.SayGoodbye200Response;
    import com.generated.api.myapijavaruntime.runtime.api.Handlers.SayGoodbyeRequestInput;
    import com.generated.api.myapijavaruntime.runtime.api.Handlers.SayGoodbyeResponse;
    import com.generated.api.myapijavaruntime.runtime.model.SayGoodbyeResponseContent;

    public class SayGoodbyeHandler extends SayGoodbye {
        @Override
        public SayGoodbyeResponse handle(SayGoodbyeRequestInput sayGoodbyeRequestInput) {
            return SayGoodbye200Response.of(SayGoodbyeResponseContent.builder()
                    .message(String.format("Goodbye %s", sayGoodbyeRequestInput.getInput().getBody().getName()))
                    .build());
        }
    }
    ```

=== "PYTHON"

    In your `lambdas` project, define your new lambda handler: `packages/lambdas/lambdas/say_goodbye.py`:

    ```python
    from myapi_python_runtime.model.say_goodbye_response_content import SayGoodbyeResponseContent
    from myapi_python_runtime.apis.tags.default_api_operation_config import say_goodbye_handler,
        SayGoodbyeRequest, SayGoodbyeOperationResponses, ApiResponse


    @say_goodbye_handler
    def handler(input: SayGoodbyeRequest, **kwargs) -> SayGoodbyeOperationResponses:
        return ApiResponse(
            status_code=200,
            body=SayGoodbyeResponseContent(message="Goodbye {}".format(input.body["name"])),
            headers={}
        )
    ```

### Deploy your project

After you implement your new operation, build your project again using `yarn build`, deploy, and try out your new operation.
