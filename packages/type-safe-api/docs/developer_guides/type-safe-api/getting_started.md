# Getting started: REST API

This section describes how to get started with the Type Safe API. For more information, refer to the other user guides on particular features of this library.

!!! info

    Select the tabs to use this library with infrastructure and lambda handlers in the same language, but you can mix and match language. For example, you could write CDK infrastructure in Java and implement some lambda handlers in Python, and others in TypeScript.

## Type Safe API project structure

The `TypeSafeApiProject` projen project sets up the project structure for you. Consider the following parameters when creating the project:

- `model` - Configure the API model. Select a `language` for the model from either [Smithy](https://smithy.io/2.0/), [TypeSpec](https://typespec.io/) or [OpenAPI v3](https://swagger.io/specification/), and provide `options.smithy`, `options.typeSpec` or `options.openapi` depending on your choice.
- `infrastructure` - Select the `language` you are writing your CDK infrastructure in. A construct will be generated in this language which can be used to deploy the API.
- `handlers` - Optionally select the `languages` in which you wish to write lambda handlers for operations in.
- `runtime` - Optionally configure additional generated runtime projects. Include one or more `languages` you want to write your client and/or server-side code in. These projects contain generated types defined in your model, as well as type-safe lambda handler wrappers for implementing each operation. You'll notice runtime packages are automatically generated for languages you picked for `infrastructure` and `handlers`.
- `documentation` - Optionally specify `formats` to generate documentation in.
- `library` - Optionally specify additional `libraries` to generate, such as React Query hooks for use in a React website.

## Create your API project

!!! info

    We recommend you use these projects as part of an `monorepo` project (eg. by specifying `parent: monorepo`), as it makes setting up dependencies much easier, particularly when extending your project further with a CDK app and lambda functions.

1.) To start an empty `monorepo` project, use this command:

```bash
npx projen new --from @aws/pdk monorepo-ts --package-manager=pnpm
```

2.) Edit your `.projenrc` and configure `TypeSafeApiProject`.

!!! tip

    Use the tabs to see how to set up a project for writing infrastructure, and server-side code using specfic languages (TypeScript, Java, and Python).

=== "TS"

    ```ts
    import { MonorepoTsProject } from "@aws/pdk/monorepo";
    import {
      DocumentationFormat,
      Language,
      Library,
      ModelLanguage,
      TypeSafeApiProject,
    } from "@aws/pdk/type-safe-api";
    import { InfrastructureTsProject } from "@aws/pdk/infrastructure";
    import { NodePackageManager } from "projen/lib/javascript";

    // Create the monorepo
    const monorepo = new MonorepoTsProject({
      name: "my-project",
      devDeps: [
        "@aws/pdk",
      ],
      packageManager: NodePackageManager.PNPM,
    });

    // Create the API project
    const api = new TypeSafeApiProject({
      name: "myapi",
      parent: monorepo,
      outdir: "packages/api",
      // Smithy as the model language. You can also use ModelLanguage.TYPESPEC or ModelLanguage.OPENAPI
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
      // CDK infrastructure in TypeScript
      infrastructure: {
        language: Language.TYPESCRIPT,
      },
      // Lambda handlers in TypeScript
      handlers: {
        languages: [Language.TYPESCRIPT],
      }
      // Generate HTML documentation
      documentation: {
        formats: [DocumentationFormat.HTML_REDOC],
      },
      // Generate react-query hooks to interact with the API from a React website
      library: {
        libraries: [Library.TYPESCRIPT_REACT_QUERY_HOOKS],
      },
    });

    // Create a CDK infrastructure project
    new InfrastructureTsProject({
        parent: monorepo,
        outdir: "packages/infra",
        name: "infra",
        typeSafeApis: [api],
    });

    monorepo.synth();
    ```

=== "JAVA"

    ```java
    import software.aws.pdk.monorepo.MonorepoJavaProject;
    import software.aws.pdk.monorepo.MonorepoJavaOptions;
    import software.aws.pdk.infrastructure.InfrastructureJavaProject;
    import software.aws.pdk.infrastructure.InfrastructureJavaProjectOptions;
    import software.aws.pdk.type_safe_api.*;
    import java.util.Arrays;

    public class projenrc {
        public static void main(String[] args) {
            MonorepoJavaProject monorepo = new MonorepoJavaProject(MonorepoJavaOptions.builder()
                    .name("my-project")
                    .build());

            TypeSafeApiProject api = new TypeSafeApiProject(TypeSafeApiProjectOptions.builder()
                    .name("myapi")
                    .parent(monorepo)
                    .outdir("packages/api")
                    .model(ModelConfiguration.builder()
                            .language(ModelLanguage.SMITHY)
                            .options(ModelOptions.builder()
                                    .smithy(SmithyModelOptions.builder()
                                            .serviceName(SmithyServiceName.builder()
                                                    .namespace("com.my.company")
                                                    .serviceName("MyApi")
                                                    .build())
                                            .build())
                                    .build())
                            .build())
                    .infrastructure(InfrastructureConfiguration.builder()
                            .language(Language.JAVA)
                            .build())
                    .documentation(DocumentationConfiguration.builder()
                            .formats(Arrays.asList(DocumentationFormat.HTML_REDOC))
                            .build())
                    .library(LibraryConfiguration.builder()
                            .libraries(Arrays.asList(Library.TYPESCRIPT_REACT_QUERY_HOOKS))
                            .build())
                    .handlers(HandlersConfiguration.builder()
                            .languages(Arrays.asList(Language.JAVA))
                            .build())
                    .build());

            new InfrastructureJavaProject(
                InfrastructureJavaProjectOptions.builder()
                    .parent(monorepo)
                    .outdir("packages/infra")
                    .name("infra")
                    .typeSafeApi(api)
                    .build());

            monorepo.synth();
        }
    }
    ```

=== "PYTHON"

    ```python
    from aws_pdk.monorepo import MonorepoPythonProject
    from aws_pdk.infrastructure import InfrastructurePyProject
    from aws_pdk.type_safe_api import *

    monorepo = MonorepoPythonProject(
        module_name="my_project",
        name="my-project",
    )

    api = TypeSafeApiProject(
        name="myapi",
        parent=monorepo,
        outdir="packages/api",
        model=ModelConfiguration(
            language=ModelLanguage.SMITHY,
            options=ModelOptions(
                smithy=SmithyModelOptions(
                    service_name=SmithyServiceName(
                        namespace="com.amazon",
                        service_name="MyAPI"
                    )
                )
            )
        ),
        infrastructure=InfrastructureConfiguration(
            language=Language.PYTHON
        ),
        documentation=DocumentationConfiguration(
            formats=[DocumentationFormat.HTML_REDOC]
        ),
        handlers=HandlersConfiguration(
            languages=[Language.PYTHON]
        ),
        library=LibraryConfiguration(
            libraries=[Library.TYPESCRIPT_REACT_QUERY_HOOKS]
        )
    )

    InfrastructurePyProject(
        parent=monorepo,
        outdir="packages/infra",
        name="infra",
        type_safe_api=api,
    )

    monorepo.synth()
    ```

3.) Given we have modified our `projenrc` file we need to run the `npx projen` command to synthesize our new API and infrastructure onto the filesystem. We can then run a first build with `npx projen build`.

## Implement a Lambda handler

The generated runtime projects include lambda handler wrappers which provide type-safety for implementing your API operations. The generated `handlers` projects include generated stubs for you to implement for every operation which has been annotated accordingly:

=== "SMITHY"

    Use the `@handler` trait, and specify the language you wish to implement this operation in.

    ```smithy hl_lines="3"
    @readonly
    @http(method: "GET", uri: "/hello")
    @handler(language: "typescript")
    operation SayHello {
        input := {
            @httpQuery("name")
            @required
            name: String
        }
        output := {
            @required
            message: String
        }
    }
    ```

=== "TYPESPEC"

    Use the `@handler` decorator, and specify the language you wish to implement the operation in.

    ```tsp hl_lines="3"
    @get
    @route("/hello")
    @handler({ language: "typescript" })
    op SayHello(@query name: string): {
        message: string;
    };
    ```

=== "OPENAPI"

    Use the `x-handler` vendor extension, specifying the language you wish to implement this operation in.

    ```yaml hl_lines="4-5"
    /hello:
      get:
        operationId: sayHello
        x-handler:
          language: typescript
        parameters:
          - in: query
            name: name
            schema:
              type: string
              required: true
        responses:
          200:
            description: Successful response
            content:
              'application/json':
                schema:
                  $ref: '#/components/schemas/SayHelloResponseContent'
    ```

!!!note

    If you wish to deviate from the folder structure of the `handlers` projects, or wish to implement your operations in a language not supported by Type Safe API, or through a non-lambda interation (such as a server running in a Fargate container) you can omit the `@handler` trait or `x-handler` vendor extension.

You can implement your lambda handlers in any of the supported languages, or mix and match languages for different operations if you prefer.

=== "TS"

    In TypeScript, you'll notice you have a lambda handler stub in `packages/api/handlers/typescript/src/say-hello.ts`:

    ```ts
    import {
      sayHelloHandler,
      SayHelloChainedHandlerFunction,
      INTERCEPTORS,
      Response,
      LoggingInterceptor,
    } from "myapi-typescript-runtime";

    /**
     * Type-safe handler for the SayHello operation
     */
    export const sayHello: SayHelloChainedHandlerFunction = async (request) => {
      LoggingInterceptor.getLogger(request).info("Start SayHello Operation");

      // TODO: Implement SayHello Operation. `input` contains the request input.
      const { input } = request;

      return Response.internalFailure({
        message: "Not Implemented!",
      });
    };

    /**
     * Entry point for the AWS Lambda handler for the SayHello operation.
     * The sayHelloHandler method wraps the type-safe handler and manages marshalling inputs and outputs
     */
    export const handler = sayHelloHandler(...INTERCEPTORS, sayHello);
    ```

=== "JAVA"

    In Java, you'll notice you have a lambda handler stub in `packages/api/handlers/java/src/main/java/com/generated/api/myapijavahandlers/handlers/SayHelloHandler.java`:

    ```java
    package com.generated.api.myapijavahandlers.handlers;

    import com.generated.api.myapijavaruntime.runtime.api.interceptors.DefaultInterceptors;
    import com.generated.api.myapijavaruntime.runtime.api.interceptors.powertools.LoggingInterceptor;
    import com.generated.api.myapijavaruntime.runtime.api.handlers.Interceptor;
    import com.generated.api.myapijavaruntime.runtime.api.handlers.say_hello.SayHello;
    import com.generated.api.myapijavaruntime.runtime.api.handlers.say_hello.SayHelloInput;
    import com.generated.api.myapijavaruntime.runtime.api.handlers.say_hello.SayHello500Response;
    import com.generated.api.myapijavaruntime.runtime.api.handlers.say_hello.SayHelloRequestInput;
    import com.generated.api.myapijavaruntime.runtime.api.handlers.say_hello.SayHelloResponse;
    import com.generated.api.myapijavaruntime.runtime.model.*;

    import java.util.List;

    /**
     * Entry point for the AWS Lambda handler for the SayHello operation.
     * The SayHello class manages marshalling inputs and outputs.
     */
    public class SayHelloHandler extends SayHello {
        /**
         * Return the interceptors for this handler.
         * You can also use the @Interceptors annotation on the class to add interceptors
         */
        @Override
        public List<Interceptor<SayHelloInput>> getInterceptors() {
            return DefaultInterceptors.all();
        }

        /**
         * Type-safe handler for the SayHello operation
         */
        @Override
        public SayHelloResponse handle(final SayHelloRequestInput request) {
            LoggingInterceptor.getLogger(request).info("Start SayHello Operation");

            // TODO: Implement SayHello Operation. `input` contains the request input.
            SayHelloInput input = request.getInput();

            return SayHello500Response.of(InternalFailureErrorResponseContent.builder()
                    .message("Not Implemented!")
                    .build());
        }
    }
    ```

=== "PYTHON"

    In Python, you'll notice you have a lambda handler stub in `packages/api/handlers/python/myapi_python_handlers/say_hello.py`:

    ```python
    from myapi_python_runtime.models import *
    from myapi_python_runtime.response import Response
    from myapi_python_runtime.interceptors import INTERCEPTORS
    from myapi_python_runtime.interceptors.powertools.logger import LoggingInterceptor
    from myapi_python_runtime.api.operation_config import (
        say_hello_handler, SayHelloRequest, SayHelloOperationResponses
    )


    def say_hello(input: SayHelloRequest, **kwargs) -> SayHelloOperationResponses:
        """
        Type-safe handler for the SayHello operation
        """
        LoggingInterceptor.get_logger(input).info("Start SayHello Operation")

        # TODO: Implement SayHello Operation. `input` contains the request input

        return Response.internal_failure(InternalFailureErrorResponseContent(
            message="Not Implemented!"
        ))


    # Entry point for the AWS Lambda handler for the SayHello operation.
    # The say_hello_handler method wraps the type-safe handler and manages marshalling inputs and outputs
    handler = say_hello_handler(interceptors=INTERCEPTORS)(say_hello)
    ```

!!!note
    You will notice the handler stubs make use of some default "interceptors". [You can read more about interceptors here](./interceptors.md).

We can replace the stubbed response with a real implementation:

=== "TS"

    ```ts
    /**
     * Type-safe handler for the SayHello operation
     */
    export const sayHello: SayHelloChainedHandlerFunction = async (request) => {
      LoggingInterceptor.getLogger(request).info("Start SayHello Operation");

      const { input } = request;

      return Response.success({
        message: `Hello ${input.requestParameters.name}!`,
      });
    };
    ```

=== "JAVA"

    ```java
    /**
     * Type-safe handler for the SayHello operation
     */
    @Override
    public SayHelloResponse handle(final SayHelloRequestInput request) {
        LoggingInterceptor.getLogger(request).info("Start SayHello Operation");

        // TODO: Implement SayHello Operation. `input` contains the request input.
        SayHelloInput input = request.getInput();

        return SayHello200Response.of(SayHelloResponseContent.builder()
                .message(String.format("Hello %s!", input.getRequestParameters().getName()))
                .build());
    }
    ```

=== "PYTHON"

    ```python
    def say_hello(input: SayHelloRequest, **kwargs) -> SayHelloOperationResponses:
        """
        Type-safe handler for the SayHello operation
        """
        LoggingInterceptor.get_logger(input).info("Start SayHello Operation")

        return Response.success(SayHelloResponseContent(
            message=f"Hello {input.request_parameters.name}!"
        ))
    ```


## Use the CDK construct

In your CDK application, using your preferred language, include the `Api` construct, vended from the generated infrastructure package.

Given we used the AWS PDK vended infrastructure project, this will be configured for us already. Notice that our integrations have been mocked for us already, but we can replace them with our lambda implementation.

!!!tip
    Use the function constructs from the generated API infrastructure project to easily create lambda functions which reference implementations in the `api/handlers` projects.

=== "TS"

    Open `packages/infra/src/constructs/api/myapi.ts`. Notice our API has been mocked by default. We can replace the integration for our `sayHello` operation to use a lambda implementation:

    ```typescript hl_lines="15 46-50"
    import { UserIdentity } from "@aws/pdk/identity";
    import { Authorizers, Integrations } from "@aws/pdk/type-safe-api";
    import { Stack } from "aws-cdk-lib";
    import { Cors } from "aws-cdk-lib/aws-apigateway";
    import {
      AccountPrincipal,
      AnyPrincipal,
      Effect,
      PolicyDocument,
      PolicyStatement,
    } from "aws-cdk-lib/aws-iam";
    import { Construct } from "constructs";
    import {
      Api,
      SayHelloFunction,
    } from "myapi-typescript-infra";

    /**
     * Api construct props.
     */
    export interface ApiConstructProps {
      /**
       * Instance of the UserIdentity.
       */
      readonly userIdentity: UserIdentity;
    }

    /**
     * Infrastructure construct to deploy a Type Safe API.
     */
    export class ApiConstruct extends Construct {
      /**
       * API instance
       */
      public readonly api: Api;

      constructor(scope: Construct, id: string, props?: ApiConstructProps) {
        super(scope, id);

        this.api = new Api(this, id, {
          defaultAuthorizer: Authorizers.iam(),
          corsOptions: {
            allowOrigins: Cors.ALL_ORIGINS,
            allowMethods: Cors.ALL_METHODS,
          },
          integrations: {
            sayHello: {
              integration: Integrations.lambda(new SayHelloFunction(this, "SayHello")),
            },
          },
          policy: new PolicyDocument({
            statements: [
              // Here we grant any AWS credentials from the account that the prototype is deployed in to call the api.
              // Machine to machine fine-grained access can be defined here using more specific principals (eg roles or
              // users) and resources (ie which api paths may be invoked by which principal) if required.
              // If doing so, the cognito identity pool authenticated role must still be granted access for cognito users to
              // still be granted access to the API.
              new PolicyStatement({
                effect: Effect.ALLOW,
                principals: [new AccountPrincipal(Stack.of(this).account)],
                actions: ["execute-api:Invoke"],
                resources: ["execute-api:/*"],
              }),
              // Open up OPTIONS to allow browsers to make unauthenticated preflight requests
              new PolicyStatement({
                effect: Effect.ALLOW,
                principals: [new AnyPrincipal()],
                actions: ["execute-api:Invoke"],
                resources: ["execute-api:/*/OPTIONS/*"],
              }),
            ],
          }),
        });

        // Grant authenticated users access to invoke the api
        props?.userIdentity.identityPool.authenticatedRole.addToPrincipalPolicy(
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["execute-api:Invoke"],
            resources: [this.api.api.arnForExecuteApi("*", "/*", "*")],
          }),
        );
      }
    }
    ```

=== "JAVA"

    Open `packages/infra/src/main/java/software/aws/infra/constructs/ApiConstruct.java`. Notice our API has been mocked by default. We can replace the integration for our `sayHello` operation to use a lambda implementation:

    ```java hl_lines="5 44-49"
    package software.aws.infra.constructs;

    import com.generated.api.myapijavainfra.infra.Api;
    import com.generated.api.myapijavainfra.infra.ApiProps;
    import com.generated.api.myapijavainfra.infra.functions.SayHelloFunction;
    import com.generated.api.myapijavaruntime.runtime.api.operation_config.OperationConfig;

    import java.util.Arrays;

    import software.amazon.awscdk.Stack;
    import software.amazon.awscdk.services.apigateway.Cors;
    import software.amazon.awscdk.services.apigateway.CorsOptions;
    import software.amazon.awscdk.services.iam.AccountPrincipal;
    import software.amazon.awscdk.services.iam.AnyPrincipal;
    import software.amazon.awscdk.services.iam.Effect;
    import software.amazon.awscdk.services.iam.PolicyDocument;
    import software.amazon.awscdk.services.iam.PolicyDocumentProps;
    import software.amazon.awscdk.services.iam.PolicyStatement;
    import software.amazon.awscdk.services.iam.PolicyStatementProps;
    import software.aws.pdk.identity.UserIdentity;
    import software.aws.pdk.type_safe_api.Authorizers;
    import software.aws.pdk.type_safe_api.TypeSafeApiIntegration;
    import software.aws.pdk.type_safe_api.Integrations;
    import software.constructs.Construct;

    /**
     * Infrastructure construct to deploy a Type Safe API.
     */
    public class ApiConstruct extends Construct {
        /**
         * API instance
         */
        public final Api api;

        public ApiConstruct(Construct scope, String id, UserIdentity userIdentity) {
            super(scope, id);

            this.api = new Api(this, id, ApiProps.builder()
                    .defaultAuthorizer(Authorizers.iam())
                    .corsOptions(CorsOptions.builder()
                            .allowOrigins(Cors.ALL_ORIGINS)
                            .allowMethods(Cors.ALL_METHODS)
                            .build())
                    .integrations(OperationConfig.<TypeSafeApiIntegration>builder()
                            .sayHello(TypeSafeApiIntegration.builder()
                                    .integration(Integrations.lambda(
                                            new SayHelloFunction(this, "SayHello")))
                                    .build())
                            .build())
                    .policy(new PolicyDocument(PolicyDocumentProps.builder()
                        .statements(Arrays.asList(
                            // Here we grant any AWS credentials from the account that the prototype is deployed in to call the api.
                            // Machine to machine fine-grained access can be defined here using more specific principals (eg roles or
                            // users) and resources (ie which api paths may be invoked by which principal) if required.
                            // If doing so, the cognito identity pool authenticated role must still be granted access for cognito users to
                            // still be granted access to the API.
                            new PolicyStatement(PolicyStatementProps.builder()
                                .effect(Effect.ALLOW)
                                .principals(Arrays.asList(new AccountPrincipal(Stack.of(this))))
                                .actions(Arrays.asList("execute-api:Invoke"))
                                .resources(Arrays.asList("execute-api:/*"))
                                .build()),
                            // Open up OPTIONS to allow browsers to make unauthenticated preflight requests
                            new PolicyStatement(PolicyStatementProps.builder()
                                .effect(Effect.ALLOW)
                                .principals(Arrays.asList(new AnyPrincipal()))
                                .actions(Arrays.asList("execute-api:Invoke"))
                                .resources(Arrays.asList("execute-api:/*/OPTIONS/*"))
                                .build())
                        ))
                        .build()))
                    .build());

            userIdentity.getIdentityPool().getAuthenticatedRole()
                .addToPrincipalPolicy(new PolicyStatement(PolicyStatementProps.builder()
                    .effect(Effect.ALLOW)
                    .actions(Arrays.asList("execute-api:Invoke"))
                    .resources(Arrays.asList(this.api.getApi().arnForExecuteApi("*", "/*", "*")))
                    .build()));
        }
    }
    ```

=== "PYTHON"

    Open `packages/infra/infra/constructs/api.py`. Notice our API has been mocked by default. We can replace the integration for our `sayHello` operation to use a lambda implementation:

    ```python hl_lines="3 22-26"
    from constructs import Construct
    from myapi_python_infra.api import Api
    from myapi_python_infra.functions import SayHelloFunction
    from myapi_python_runtime.api.operation_config import OperationConfig
    from aws_cdk import Stack
    from aws_pdk.identity import UserIdentity
    from aws_pdk.type_safe_api import Authorizers, TypeSafeApiIntegration, Integrations
    from aws_cdk.aws_apigateway import CorsOptions, Cors
    from aws_cdk.aws_iam import AccountPrincipal, AnyPrincipal, Effect, PolicyDocument, PolicyStatement

    # Infrastructure construct to deploy a Type Safe API.
    class ApiConstruct(Construct):
        def __init__(self, scope: Construct, id: str, user_identity: UserIdentity, **kwargs) -> None:
            super().__init__(scope, id, **kwargs)

            self.api = Api(self, id,
               default_authorizer=Authorizers.iam(),
               cors_options=CorsOptions(
                   allow_origins=Cors.ALL_ORIGINS,
                   allow_methods=Cors.ALL_METHODS
               ),
               integrations=OperationConfig(
                   say_hello=TypeSafeApiIntegration(
                       integration=Integrations.lambda_(SayHelloFunction(self, 'SayHello')),
                   ),
               ),
               policy=PolicyDocument(
                   statements=[
                       # Here we grant any AWS credentials from the account that the prototype is deployed in to call the api.
                       # Machine to machine fine-grained access can be defined here using more specific principals (eg roles or
                       # users) and resources (ie which api paths may be invoked by which principal) if required.
                       # If doing so, the cognito identity pool authenticated role must still be granted access for cognito users to
                       # still be granted access to the API.
                       PolicyStatement(
                           effect=Effect.ALLOW,
                           principals=[AccountPrincipal(Stack.of(self).account)],
                           actions=['execute-api:Invoke'],
                           resources=['execute-api:/*']
                       ),
                       # Open up OPTIONS to allow browsers to make unauthenticated preflight requests
                       PolicyStatement(
                           effect=Effect.ALLOW,
                           principals=[AnyPrincipal()],
                           actions=['execute-api:Invoke'],
                           resources=['execute-api:/*/OPTIONS/*']
                       )
                   ]
               ))

            user_identity.identity_pool.authenticated_role.add_to_principal_policy(
                PolicyStatement(
                    effect=Effect.ALLOW,
                    actions=['execute-api:Invoke'],
                    resources=[self.api.api.arn_for_execute_api('*', '/*', '*')]
                )
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
    @handler(language: "typescript") // <- you can also choose "python" or "java"
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

=== "TYPESPEC"

    In `model/src/main.tsp` or another `.tsp` file somewhere in the `model/src` directory, define the operation:

    ```tsp
    namespace MyApi; // <- ensure the namespace is the same as in main.tsp if defining in another file

    /**
     * Documentation about the operation can go here
     */
    @post
    @route("/goodbye")
    @handler({ language: "typescript" }) // <- you can also choose "python" or "java"
    op SayGoodbye(
        name: string,
    ): {
        message: string;
    };
    ```

    If you defined your operation in a different file, you must import it in `model/src/main.tsp`:

    ```tsp
    import "./operations/say-goodbye.tsp";
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
                # You can also choose "python" or "java" for the handler language below
                x-handler:
                    language: "typescript"
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

    !!!note

        You can split your API into multiple `yaml` files. For more information, refer to [Using OpenAPI](using_openapi.md).

### Build your project

To run a build in the root of your monorepo, use the `npx projen build` command:

```
npx projen build
```

The build will regenerate the infrastructure, runtime, documentation, and library projects based on your updated model. It will also generate a new stub for your new operation if you specified the `@handler` trait in Smithy or `x-handler` vendor extension in OpenAPI.

As you must define an integration for every operation, you may see the following build error in your CDK application.

```ts
TSError: ⨯ Unable to compile TypeScript:
src/constructs/api/myapi.ts: error TS2741: Property 'sayGoodbye' is missing in type '{ sayHello: { integration: Integration; }; }' but required in type 'OperationConfig<TypeSafeApiIntegration>'.
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
          integration: Integrations.lambda(new SayHelloFunction(this, "SayHello")),
        },
        // Add the new integration here
        sayGoodbye: {
          integration: Integrations.lambda(new SayGoodbyeFunction(this, "SayGoodbye")),
        },
      },
      ...
    });
    ```

=== "JAVA"

    ```java
    new Api(this, "Api", ApiProps.builder()
            ...
            .integrations(OperationConfig.<TypeSafeApiIntegration>builder()
                    .sayHello(TypeSafeApiIntegration.builder()
                            .integration(Integrations.lambda(
                                    new SayHelloFunction(this, "SayHello")))
                            .build())
                    .sayGoodbye(TypeSafeApiIntegration.builder()
                            .integration(Integrations.lambda(
                                    new SayGoodbyeFunction(this, "SayGoodbye")))
                            .build())
                    .build())
            ...
            .build());
    ```

=== "PYTHON"

    ```python
    Api(self, 'Api',
        ...
        integrations=OperationConfig(
            say_hello=TypeSafeApiIntegration(
                integration=Integrations.lambda_(SayHelloFunction(self, 'SayHello')),
            ),
            say_goodbye=TypeSafeApiIntegration(
                integration=Integrations.lambda_(SayGoodbyeFunction(self, 'SayGoodbye')),
            ),
        ),
        ...
    )
    ```

### Implement the Lambda handler

As described above, you'll find a lambda handler stub for your new operation, which you can edit as you wish.

### Deploy your project

After you implement your new operation, build your project again and deploy it:

```bash
npx projen build
cd packages/infra
npx projen deploy:dev
```

!!!tip
    If you want to quickly test changes to your lambda handler code, you can re-package the handlers, then run `npx projen deploy:dev` in your infrastructure project to perform a fast [hotswap deployment](https://aws.amazon.com/blogs/developer/increasing-development-speed-with-cdk-watch/). For example from the root of your project:

    ```bash
    npx nx run myapi-typescript-handlers:package && npx nx run infra:deploy\:dev
    ```

Try out your new API! You can use a tool such as [awscurl](https://github.com/okigan/awscurl) to make Sigv4 signed requests to your API, since we set the default authorizer to `Authorizers.iam()`. Alternatively, you can deploy the [`CloudscapeReactTsWebsiteProject`](../cloudscape-react-ts-website/index.md) and try out the [API Explorer](../cloudscape-react-ts-website/api_explorer.md).