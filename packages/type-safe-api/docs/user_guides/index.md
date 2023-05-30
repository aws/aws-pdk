# Getting Started

This section describes how to get started quickly with a brief overview. Please refer to the other user guides for more details on particular features of this library. Note that the different tabs show how to use this library in purely that language, but you can mix-and-match languages (for example you could write CDK infrastructure in Java, implement your lambda handlers in Python and write your `.projenrc` in TypeScript).

## Create your API Project

The `TypeSafeApiProject` projen project sets up the project structure for you. You have a few parameters to consider when creating the project:

- `model` - Configure the API model. Select a `language` for the model of either [Smithy](https://smithy.io/2.0/) or [OpenAPI v3](https://swagger.io/specification/), and supply `options.smithy` or `options.openapi` depending on your choice.
- `runtime` - Configure the generated runtime projects. Include one or more `languages` you wish to write your client and/or server-side code in. These projects contain generated types defined in your model, as well as type-safe lambda handler wrappers for implementing each operation.
- `infrastructure` - Pick the `language` you are writing your CDK infrastructure in. A construct will be generated in this language which can be used to deploy the API.
- `documentation` - Specify `formats` to generate documentation in.
- `library` - Specify additional `libraries` to generate, such as React Query hooks for use in a React website.

It's recommended that these projects are used as part of an [`nx-monorepo`](../../../nx-monorepo/README.md) project (eg. by specifying `parent: monorepo`), as it makes setting up dependencies much easier, particularly when extending your project further with a CDK app and lambda functions.

See below for an example `.projenrc` making use of `TypeSafeApiProject`:

=== "TS"

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
      },
      // Generate react-query hooks to interact with the UI from a React website
      library: {
        libraries: [Library.TYPESCRIPT_REACT_QUERY_HOOKS],
      },
    });
    
    // Create a CDK infrastructure project. Can also consider PDKPipelineTsProject as an alternative!
    const infra = new AwsCdkTypeScriptApp({ ... });
    
    // Infrastructure can depend on the generated API infrastructure and runtime
    infra.addDeps(api.infrastructure.typescript!.package.packageName);
    infra.addDeps(api.runtime.typescript!.package.packageName);
    
    monorepo.synth();
    ```

=== "JAVA"

    ```java
    import software.aws.awsprototypingsdk.nxmonorepo.NxMonorepoProject;
    import aws.prototyping.sdk.type.safe.api.TypeSafeApiProject;
    import io.github.cdklabs.projen.awscdk.AwsCdkTypeScriptApp;
    import io.github.cdklabs.projen.java.JavaProject;
    
    // Create the monorepo
    NxMonorepoProject monorepo = NxMonorepoProject.Builder.create()
            .name("monorepo")
            .defaultReleaseBranch("main")
            .build();
    
    // Create the API project
    TypeSafeApiProject api = TypeSafeApiProject.Builder.create()
            .name("myapi")
            .parent(monorepo)
            .outdir("packages/api")
            // Smithy as the model language. You can also use ModelLanguage.OPENAPI
            .model(Map.of(
                    "language", ModelLanguage.getSMITHY(),
                    "options", Map.of(
                            "smithy", Map.of(
                                    "serviceName", Map.of(
                                            "namespace", "com.mycompany",
                                            "serviceName", "MyApi")))))
            // Generate client and server types in TypeScript, Python and Java
            .runtime(Map.of(
                    "languages", List.of(Language.getTYPESCRIPT(), Language.getPYTHON(), Language.getJAVA())))
            // Generate CDK infrastructure in Java
            .infrastructure(Map.of(
                    "language", Language.getJAVA()))
            // Generate HTML documentation
            .documentation(Map.of(
                    "formats", List.of(DocumentationFormat.getHTML_REDOC())))
            .build();
    
    JavaProject lambdas = JavaProject.Builder.create()
            .name("lambdas")
            .parent(monorepo)
            .outdir("packages/lambdas")
            .artifactId("lambdas")
            .groupId("com.my.api")
            .version("1.0.0")
            .build();
    
    // The lambdas package needs a dependency on the generated java runtime
    monorepo.addJavaDependency(lambdas, api.getRuntime().getJava());
    
    // Use the maven shade plugin to build a "super jar" which we can deploy to AWS Lambda
    lambdas.pom.addPlugin("org.apache.maven.plugins/maven-shade-plugin@3.3.0", PluginOptions.builder()
            .configuration(Map.of(
                    "createDependencyReducedPom", false))
            .executions(List.of(PluginExecution.builder()
                    .id("shade-task")
                    .phase("package")
                    .goals(List.of("shade"))
                    .build()))
            .build());
    
    AwsCdkJavaApp infra = AwsCdkJavaApp.Builder.create()
            .name("infra")
            .parent(monorepo)
            .outdir("packages/infra")
            .artifactId("infra")
            .groupId("com.my.api")
            .mainClass("com.my.api.MyApp")
            .version("1.0.0")
            .cdkVersion("2.0.0")
            .build();
    
    // Add a dependency on the generated CDK infrastructure
    monorepo.addJavaDependency(infra, api.getInfrastructure().getJava());
    
    // Make sure the java lambda builds before our CDK infra
    monorepo.addImplicitDependency(infra, lambdas);
    
    monorepo.synth();
    ```

=== "PYTHON"

    ```python
    from aws_prototyping_sdk.nx_monorepo import NxMonorepoProject
    from aws_prototyping_sdk.type_safe_api import TypeSafeApiProject
    from projen.awscdk import AwsCdkTypeScriptApp
    from projen.python import PythonProject
    
    # Create the monorepo
    monorepo = NxMonorepoProject(
        name="monorepo",
        default_release_branch="main"
    )
    
    # Create the API project
    api = TypeSafeApiProject(
        name="myapi",
        parent=monorepo,
        outdir="packages/api",
        # Smithy as the model language. You can also use ModelLanguage.OPENAPI
        model={
            "language": ModelLanguage.SMITHY,
            "options": {
                "smithy": {
                    "service_name": {
                        "namespace": "com.mycompany",
                        "service_name": "MyApi"
                    }
                }
            }
        },
        # Generate client and server types in TypeScript, Python, and Java
        runtime={
            "languages": [Language.TYPESCRIPT, Language.PYTHON, Language.JAVA]
        },
        # Generate CDK infrastructure in Python
        infrastructure={
            "language": Language.PYTHON
        },
        # Generate HTML documentation
        documentation={
            "formats": [DocumentationFormat.HTML_REDOC]
        }
    )
    
    # Create a project for our lambda handlers written in python
    lambdas = PythonProject(
        name="lambdas",
        parent=monorepo,
        outdir="packages/lambdas",
        author_email="me@example.com",
        author_name="me",
        module_name="lambdas",
        version="1.0.0",
        # Poetry is used to simplify local python dependencies
        poetry=True
    )
    
    # Add a local dependency on the generated python runtime
    monorepo.add_python_poetry_dependency(lambdas, api.runtime.python)
    
    # Add commands to the lambda project's package task to create a distributable which can be deployed to AWS Lambda
    lambdas.package_task.exec("mkdir -p lambda-dist && rm -rf lambda-dist/*")
    lambdas.package_task.exec(f"cp -r {lambdas.moduleName} lambda-dist/{lambdas.moduleName}")
    lambdas.package_task.exec("poetry export --without-hashes --format=requirements.txt > lambda-dist/requirements.txt")
    lambdas.package_task.exec("pip install -r lambda-dist/requirements.txt --target lambda-dist --upgrade")
    lambdas.gitignore.add_patterns("lambda-dist")
    
    # Create a CDK infrastructure project
    infra = AwsCdkPythonApp(
        name="infra",
        parent=monorepo,
        outdir="packages/infra",
        author_email="me@example.com",
        author_name="me",
        cdk_version="2.0.0",
        module_name="infra",
        version="1.0.0",
        poetry=True
    )
    
    # The infrastructure project depends on the python types, python infrastructure, and the lambda package
    monorepo.add_python_poetry_dependency(infra, api.runtime.python)
    monorepo.add_python_poetry_dependency(infra, api.infrastructure.python)
    monorepo.add_python_poetry_dependency(infra, lambdas)
    
    monorepo.synth()
    ```

After defining your `.projenrc`, you'll need to run `projen` and `build` using the appropriate command for your package manager (eg. `yarn projen && yarn build`).

## Use the CDK Construct

In your CDK application, consume the `Api` construct, which is vended from the generated infrastructure package in your chosen infrastructure language.

=== "TS"

    You can edit `packages/infra/src/main.ts` to include the `Api` construct.

    ```ts
    import { Stack, StackProps } from "aws-cdk-lib";
    import { Construct } from "constructs";
    import { Api } from "myapi-typescript-infra"; // <- generated typescript infrastructure package
    import { Authorizers, Integrations } from "@aws-prototyping-sdk/type-safe-api";
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

    You can edit `packages/infra/src/main/java/com/my/api/MyApp.java` to include the `Api` construct.

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

    You can edit `packages/infra/infra/main.py` to include the `Api` construct.

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

## Implement a Lambda Handler

The generated runtime projects include lambda handler wrappers which provide type-safety for implementing your API operations. You can implement your lambda handlers in any of the supported languages, and even mix and match languages for different operations if you like.


=== "TS"

    In the above TypeScript CDK application, we used `NodejsFunction` with the entry point as `say-hello.ts`, so we can define the lambda function in the same `infra` project.

    The implementation of `packages/infra/src/say-hello.ts` might look as follows:

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

    In your `lambdas` project you can define your lambda handler in its source directory, eg `packages/lambdas/src/main/java/com/my/api/SayHelloHandler.java`:

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

    In your `lambdas` project you can define your lambda handler in its source directory, eg `packages/lambdas/lambdas/say_hello.py`:

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

## Adding an Operation

To add a new operation to your API, you can follow the below steps:

### Define the Operation in your Model

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

    Then register the operation to the service in `main.smithy`:

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

    Note that you may wish to split your API into multiple `yaml` files. Please see [Using OpenAPI](using_openapi.md) for details.

### Build your Project

Run a build in the root of your monorepo using your package manager's build command, eg `yarn build`.

The build will regenerate the infrastructure, runtime, documentation and library projects based on your updated model.

You'll most likely get a build error in your CDK application now! For example:

```
TSError: ⨯ Unable to compile TypeScript:
src/main.ts(16,7): error TS2741: Property 'sayGoodbye' is missing in type '{ sayHello: { integration: Integration; }; }' but required in type 'OperationConfig<TypeSafeApiIntegration>'.
```

This is because we need to define an integration for every operation in our API. Let's do this next!

### Add an Integration

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
    new Api(s, "Api", ApiProps.builder()
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

### Implement the Lambda Handler

Now that we've added the integration, we need to implement the API operation:

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

    In your `lambdas` project you can define your new lambda handler: `packages/lambdas/src/main/java/com/my/api/SayGoodbyeHandler.java`:

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

    In your `lambdas` project you can define your new lambda handler: `packages/lambdas/lambdas/say_goodbye.py`:

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

### Deploy

Now that you've implemented your new operation, you can build your project again (eg `yarn build`), deploy, and try out your new operation!
