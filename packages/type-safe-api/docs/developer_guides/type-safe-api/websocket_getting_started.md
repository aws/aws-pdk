# Getting started: WebSocket API

This section describes how to get started with the Type Safe WebSocket API. For more information, refer to the other user guides on particular features of this library.

!!! warning

    Type Safe WebSocket APIs are currently experimental, and only TypeScript is supported.

### Type Safe WebSocket API project structure

The `TypeSafeWebSocketApiProject` projen project sets up the project structure for you. Consider the following parameters when creating the project:

- `model` - Configure the API model. Select a `language` for the model from either [Smithy](https://smithy.io/2.0/), [TypeSpec](https://typespec.io/) or [OpenAPI v3](https://swagger.io/specification/), and provide `options.smithy`, `options.typeSpec` or `options.openapi` depending on your choice.
- `infrastructure` - Select the `language` you are writing your CDK infrastructure in. A construct will be generated in this language which can be used to deploy the API.
- `handlers` - Optionally select the `languages` in which you wish to write lambda handlers for operations in.
- `runtime` - Optionally configure additional generated runtime projects. Include one or more `languages` you want to write your server-side code in. These projects contain generated types defined in your model, as well as type-safe lambda handler wrappers for implementing each operation, and server SDKs for sending messages to connected clients. You'll notice runtime packages are automatically generated for languages you picked for `infrastructure` and `handlers`.
- `library` - Optionally specify additional `libraries` to generate, such as clients or React hooks for use in a React website.
- `documentation` - Optionally specify `formats` to generate documentation in.

## Create your API project

!!! info

    We recommend you use these projects as part of an `monorepo` project (eg. by specifying `parent: monorepo`), as it makes setting up dependencies much easier, particularly when extending your project further with a CDK app and lambda functions.

1.) To start an empty `monorepo` project, use this command:

```bash
npx projen new --from @aws/pdk monorepo-ts --package-manager=pnpm
```

2.) Edit your `.projenrc` and configure `TypeSafeWebSocketApiProject`.

=== "TS"

    ```ts
    import { MonorepoTsProject } from "@aws/pdk/monorepo";
    import {
      Language,
      ModelLanguage,
      TypeSafeWebSocketApiProject,
      WebSocketLibrary,
      WebSocketDocumentationFormat,
    } from "@aws/pdk/type-safe-api";
    import { InfrastructureTsProject } from "@aws/pdk/infrastructure";
    import { CloudscapeReactTsWebsiteProject } from "@aws/pdk/cloudscape-react-ts-website";
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
    const api = new TypeSafeWebSocketApiProject({
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
      },
      // Generate react hooks to interact with the API from a React website
      library: {
        libraries: [WebSocketLibrary.TYPESCRIPT_WEBSOCKET_HOOKS],
      },
      // Generate HTML documentation
      documentation: {
        formats: [
          WebSocketDocumentationFormat.HTML,
        ],
      },
    });

    // Create a website project, which includes an API explorer which is useful for testing our API
    const website = new CloudscapeReactTsWebsiteProject({
        parent: monorepo,
        outdir: "packages/website",
        name: "website",
        typeSafeWebSocketApis: [api],
    });

    // Create a CDK infrastructure project
    new InfrastructureTsProject({
        parent: monorepo,
        outdir: "packages/infra",
        name: "infra",
        typeSafeWebSocketApis: [api],
        cloudscapeReactTsWebsites: [website],
    });

    monorepo.synth();
    ```

=== "JAVA"

    !!!warning

        Java is not yet supported.

=== "PYTHON"

    !!!warning

        Python is not yet supported.

3.) Given we have modified our `projenrc` file we need to run the `npx projen` command to synthesize our new API and infrastructure onto the filesystem. We can then run a first build with `npx projen build`.

A sample API definition is generated for you in `packages/api/model`, which you are free to modify. Modelling WebSocket APIs is slightly different to REST APIs, namely each operation in a WebSocket API is one-way, sent either from a client to a server or from a server to a client. This means that WebSocket operations define only an input and do not define response types. For more details please refer to [Using Smithy](./websocket_using_smithy.md), [Using TypeSpec](./websocket_using_typespec.md) and [Using OpenAPI](./websocket_using_smithy.md).

## Implement a Lambda handler

The generated runtime projects include lambda handler wrappers which provide type-safety for implementing your `client_to_server` or `bidirectional` operations. The generated `handlers` projects include generated stubs for you to implement for every operation which has been annotated accordingly:

=== "SMITHY"

    Use the `@async` trait to select the operation direction. Choose between `client_to_server`, `server_to_client` or `bidirectional`.

    Use the `@handler` trait, and specify the language you wish to implement this operation in.

    ```smithy hl_lines="1-2"
    @async(direction: "client_to_server")
    @handler(language: "typescript")
    operation SubscribeToNotifications {
        input := {
            @required
            topic: String
        }
    }
    ```

    !!!tip

        The `@handler` trait may only be applied to `client_to_server` or `bidirectional` operations.


=== "TYPESPEC"

    Use the `@async` decorator to select the operation direction. Choose between `client_to_server`, `server_to_client` or `bidirectional`.

    Use the `@handler` trait, and specify the language you wish to implement this operation in.

    ```tsp hl_lines="1-2"
    @async({ direction: "client_to_server" })
    @handler({ language: "typescript" })
    op SubscribeToNotifications(
      topic: string,
    ): void;
    ```

    !!!tip

        The `@handler` decorator may only be applied to `client_to_server` or `bidirectional` operations.

=== "OPENAPI"

    Use the `x-async` vendor extension to select the operation direction. Choose between `client_to_server`, `server_to_client` or `bidirectional`

    Use the `x-handler` vendor extension, specifying the language you wish to implement this operation in.

    ```yaml hl_lines="4-7"
    /SubscribeToNotifications:
      post:
        operationId: SubscribeToNotifications
        x-async:
          direction: client_to_server
        x-handler:
          language: typescript
        requestBody:
          content:
            application/json:
              schema:
                type: object
                properties:
                  name:
                    type: string
                required:
                  - name
        responses: {}
    ```

    !!!tip

        The `x-handler` vendor extension may only be applied to `client_to_server` or `bidirectional` operations.

!!!note

    If you wish to deviate from the folder structure of the `handlers` projects, or wish to implement your operations in a language not supported by Type Safe API, or through a non-lambda interation (such as a server running in a Fargate container) you can omit the `@handler` trait or `x-handler` vendor extension.

You can implement your lambda handlers in any of the supported languages, or mix and match languages for different operations if you prefer.

=== "TS"

    In TypeScript, you'll notice you have a lambda handler stub in `packages/api/handlers/typescript/src/subscribe-to-notifications.ts`:

    ```ts
    import {
        subscribeToNotificationsHandler,
        SubscribeToNotificationsChainedHandlerFunction,
        INTERCEPTORS,
        LoggingInterceptor,
    } from 'myapi-typescript-runtime';

    /**
     * Type-safe handler for the SubscribeToNotifications operation
     */
    export const subscribeToNotifications: SubscribeToNotificationsChainedHandlerFunction = async (request) => {
        LoggingInterceptor.getLogger(request).info('Start SubscribeToNotifications Operation');

        // `input` contains the request input
        // `connectionId` is the ID of the connection which sent this request to the server.
        // `sdk` is used to send messages to connected clients
        const { input, connectionId, sdk } = request;

        // TODO: Implement SubscribeToNotifications Operation.
    };

    /**
     * Entry point for the AWS Lambda handler for the SubscribeToNotifications operation.
     * The subscribeToNotificationsHandler method wraps the type-safe handler and manages marshalling inputs
     */
    export const handler = subscribeToNotificationsHandler(...INTERCEPTORS, subscribeToNotifications);
    ```

=== "JAVA"

    !!!warning

        Java is not yet supported.

=== "PYTHON"

    !!!warning

        Python is not yet supported.

!!!note
    You will notice the handler stubs make use of some default "interceptors". [You can read more about interceptors here](./websocket_interceptors.md).

We can replace the stubbed response with a real implementation. While our lambda handler may not return a response, we can communicate with the client which sent the request by using the provided Server SDK.

=== "TS"

    ```ts
    /**
     * Type-safe handler for the SubscribeToNotifications operation
     */
    export const subscribeToNotifications: SubscribeToNotificationsChainedHandlerFunction = async (request) => {
        LoggingInterceptor.getLogger(request).info('Start SubscribeToNotifications Operation');

        const { input, connectionId, sdk } = request;

        await sdk.sendNotification(connectionId, { topic: input.topic, title: 'Hello', message: 'Hello from server!' });
    };
    ```

=== "JAVA"

    !!!warning

        Java is not yet supported.

=== "PYTHON"

    !!!warning

        Python is not yet supported.


## Use the CDK construct

In your CDK application, using your preferred language, include the `WebSocketApi` construct, vended from the generated infrastructure package.

Given we used the AWS PDK vended infrastructure project, this will be configured for us already. Notice that our integrations have been mocked for us already, but we can replace them with our lambda implementation.

!!!tip
    Use the function constructs from the generated API infrastructure project to easily create lambda functions which reference implementations in the `api/handlers` projects.

=== "TS"

    Open `packages/infra/src/constructs/api/myapi.ts`. Notice our API has been mocked by default. We can replace the integration for our `sayHello` operation to use a lambda implementation:

    ```typescript hl_lines="7 33-37"
    import { UserIdentity } from "@aws/pdk/identity";
    import { Stack } from "aws-cdk-lib";
    import { WebSocketIamAuthorizer } from "aws-cdk-lib/aws-apigatewayv2-authorizers";
    import { WebSocketLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
    import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
    import { Construct } from "constructs";
    import { WebSocketApi, SubscribeToNotificationsFunction } from "myapi-typescript-infra";

    /**
     * Api construct props.
     */
    export interface MyApiProps {
      /**
       * Instance of the UserIdentity.
       */
      readonly userIdentity: UserIdentity;
    }

    /**
     * Infrastructure construct to deploy a Type Safe WebSocket API.
     */
    export class MyApi extends Construct {
      /**
       * API instance
       */
      public readonly api: WebSocketApi;

      constructor(scope: Construct, id: string, props?: MyApiProps) {
        super(scope, id);

        this.api = new WebSocketApi(this, id, {
          authorizer: new WebSocketIamAuthorizer(),
          integrations: {
            subscribeToNotifications: {
              integration: new WebSocketLambdaIntegration("SubscribeIntegration",
                new SubscribeToNotificationsFunction(this, "SubscribeFunction")),
            },
          },
        });

        // Grant authenticated users access to interact with the WebSocket API
        props?.userIdentity.identityPool.authenticatedRole.addToPrincipalPolicy(
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["execute-api:Invoke"],
            resources: [
              Stack.of(this).formatArn({
                service: "execute-api",
                resource: this.api.api.apiId,
                resourceName: "*",
              }),
            ],
          }),
        );
      }
    }
    ```

=== "JAVA"

    !!!warning

        Java is not yet supported.

=== "PYTHON"

    !!!warning

        Python is not yet supported.

## Add a new operation

To add a new operation to your API, follow these steps.

### Define the operation in your model

Add the new operation in the `model` project, for example:

=== "SMITHY"

    In `model/src/main/smithy/main.smithy`, or another `.smithy` file somewhere in `model/src/main/smithy`, define the operation:

    ```smithy
    /// Documentation about your operation can go here
    @async(direction: "bidirectional") // <- you can also choose "client_to_server" or "server_to_client"
    @handler(language: "typescript")
    operation Ping {
        input := {
            @required
            message: String
        }
    }
    ```

    Register the operation to the service in `main.smithy`:

    ```smithy
    @websocketJson
    service MyService {
        version: "1.0"
        operations: [
            SubscribeToNotifications
            SendNotification
            Ping // <- add your new operation here
        ]
    }
    ```

=== "TYPESPEC"

    In `model/src/main.tsp`, or another `.tsp` file somewhere in `model/src`, define the operation:

    ```tsp
    @async({ direction: "bidirectional" }) // <- you can also choose "client_to_server" or "server_to_client"
    @handler({ language: "typescript" })
    op Ping(
      message: string,
    ): void;
    ```

    If you defined your operation in a separate file, make sure you import it in `model/src/main.tsp`, eg:

    ```tsp
    import "./operations/ping.tsp";
    ```

    !!!note

          If you defined your operation in a separate file, you will need to import the decorators from `model/generated/aws-pdk`, for example:

          ```tsp
          import "../../generated/aws-pdk/prelude.tsp";
          import "../../generated/aws-pdk/async.tsp";
          ```

          You will also need to ensure the `namespace` is the same as the one in your `main.tsp` file.

=== "OPENAPI"

    In `model/src/main/openapi/main.yaml`, add the new operation under `paths`, and any new schemas under `components.schemas`.

    ```yaml
    paths:
        ...
        # Add the operation under "paths". The path (with no slash) is used as the route key for your operation.
        /Ping:
            # The operation should be "post". You may not specify multiple operations under a path
            post:
                operationId: Ping
                # You can also choose "client_to_server" or "server_to_client" for the handler language below
                x-async:
                    direction: bidirectional
                x-handler:
                    language: typescript
                requestBody:
                    content:
                        application/json:
                            # We can define the request body inline or use a ref
                            schema:
                                $ref: "#/components/schemas/PingRequestContent"
                # Responses are blank as WebSocket operations are one-way
                responses: {}
    components:
        schemas:
            ...
            # Add components here
            PingRequestContent:
                type: object
                properties:
                    message:
                        type: string
                required:
                    - name
    ```

    !!!note

        You can split your API into multiple `yaml` files. For more information, refer to [Using OpenAPI](./websocket_using_openapi.md).

### Build your project

To run a build in the root of your monorepo, use the `npx projen build` command:

```
npx projen build
```

The build will regenerate the infrastructure, runtime, and library projects based on your updated model. It will also generate a new stub for your new operation if you specified the `@handler` trait in Smithy/TypeSpec or `x-handler` vendor extension in OpenAPI.

As you must define an integration for every `client_to_server` or `bidirectional` operation, you may see the following build error in your CDK application.

```ts
TSError: ⨯ Unable to compile TypeScript:
src/constructs/api/myapi.ts: error TS2741: Property 'ping' is missing in type '{ subscribeToNotifications: { integration: WebSocketLambdaIntegration; }; }' but required in type 'OperationConfig<TypeSafeWebSocketApiIntegration>'.
```

This is expected, so follow these steps to add an integration.

### Add an integration

In your CDK application, add an integration for your new operation in the `Api` construct:

=== "TS"

    ```ts
    new WebSocketApi(this, "MyApi", {
      ...
      integrations: {
        subscribeToNotifications: {
          integration: new WebSocketLambdaIntegration("SubscribeIntegration", new SubscribeToNotificationsFunction(this, "SubscribeFunction")),
        },
        // Add the new integration here
        ping: {
          integration: new WebSocketLambdaIntegration("PingIntegration", new PingFunction(this, "PingFunction")),
        },
      },
      ...
    });
    ```

=== "JAVA"

    !!!warning

        Java is not yet supported.

=== "PYTHON"

    !!!warning

        Python is not yet supported.

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

Try out your new API! Since we included the [`CloudscapeReactTsWebsiteProject`](../cloudscape-react-ts-website/index.md) in our `projenrc`, we can test our API with the API Explorer.
