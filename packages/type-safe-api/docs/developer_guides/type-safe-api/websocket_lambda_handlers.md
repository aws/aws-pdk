# Lambda Handlers

The generated runtime projects include lambda handler wrappers, which can be used to implement API operations for messages received by the server (ie `direction` is `client_to_server` or `bidirectional`). These provide type safety, ensuring that your API handlers make use of inputs defined in your model.

For example:

=== "TS"

    ```ts
    import { sayHelloHandler } from "myapi-typescript-runtime";

    export const handler = sayHelloHandler(async ({ input, sdk, connectionId }) => {
      // The server SDK provides type-safety for sending messages to clients
      await sdk.sendGreeting(connectionId, { greeting: `Hello ${input.name}!` });
    });
    ```

=== "JAVA"

    !!!warning

        Java is not yet supported.

=== "PYTHON"

    !!!warning

        Python is not yet supported.

## Handler Projects

By configuring `handlers.languages` in your `TypeSafeWebSocketApiProject` and annotating your operations, you can take advantage of generated handler stubs and generated lambda function CDK constructs to speed up development even further.

=== "SMITHY"

    Use the `@handler` trait, and specify the language you wish to implement this operation in.

    ```smithy hl_lines="2"
    @async(direction: "client_to_server")
    @handler(language: "typescript")
    operation SayHello {
        input := {
            @required
            name: String
        }
    }
    ```

=== "TYPESPEC"

    Use the `@handler` decorator, and specify the language you wish to implement this operation in.

    ```tsp hl_lines="1-2"
    @async({ direction: "client_to_server" })
    @handler({ language: "typescript" })
    op SayHello(
        name: string,
    ): void;
    ```

=== "OPENAPI"

    Use the `x-handler` vendor extension, specifying the language you wish to implement this operation in.

    ```yaml hl_lines="6-7"
    /SayHello:
      get:
        operationId: SayHello
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

This will give you generated lambda handler stubs which look like the following:

=== "TS"

    Notice this defines a `sayHello` method which provides type-safety for your inputs, and preconfigures the server SDK. You can implement your business logic in there. The lambda handler is wrapped by the `sayHelloHandler` wrapper which manages marshalling and demarshalling, as well as the application of "interceptors".

    Notice the default `INTERCEPTORS` are added to your handler, which provide logging, tracing and metrics from Powertools for AWS Lambda, as well as error handling. For more details about interceptors, refer to the [Interceptors section](./websocket_interceptors.md).

    ```ts
    import {
      sayHelloHandler,
      SayHelloChainedHandlerFunction,
      INTERCEPTORS,
      LoggingInterceptor,
    } from "myapi-typescript-runtime";

    /**
     * Type-safe handler for the SayHello operation
     */
    export const sayHello: SayHelloChainedHandlerFunction = async (request) => {
      LoggingInterceptor.getLogger(request).info('Start SayHello Operation');

      // `input` contains the request input
      // `connectionId` is the ID of the connection which sent this request to the server.
      // `sdk` is used to send messages to connected clients
      const { input, connectionId, sdk } = request;

      // TODO: Implement SayHello Operation.
    };

    /**
     * Entry point for the AWS Lambda handler for the SayHello operation.
     * The sayHelloHandler method wraps the type-safe handler and manages marshalling inputs and outputs
     */
    export const handler = sayHelloHandler(...INTERCEPTORS, sayHello);
    ```

=== "JAVA"

    !!!warning

        Java is not yet supported.

=== "PYTHON"

    !!!warning

        Python is not yet supported.

!!!note

    If you wish to deviate from the folder structure of the `handlers` projects, or wish to implement your operations in a language not supported by Type Safe API, or through a non-lambda interation you can omit the `@handler` trait or `x-handler` vendor extension.

You can implement your lambda handlers in any of the supported languages, or mix and match languages for different operations if you prefer.

An example unit test will also be generated for each handler. These unit tests are only generated when the corresponding handler is initially generated, so you can safely delete the generated test if you do not want it.

!!!tip

    Annotate your Smithy `service` with the `@connectHandler` and `@disconnectHandler` traits to generate handlers for the connect and disconnect events. In OpenAPI, use the top level vendor extensions `x-connect-handler` and `x-disconnect-handler`.

## Function CDK Constructs

As well as generating lambda handler stubs, when you use the `@handler` Smithy trait or `x-handler` OpenAPI vendor extension, your generated CDK infrastructure project will include lambda function CDK constructs with preconfigured paths to your handler distributables. This allows you to quickly add lambda integrations to your API:

=== "TS"

    ```ts hl_lines="1 11"
    import { WebSocketApi, SayHelloFunction } from "myapi-typescript-infra";

    new WebSocketApi(this, id, {
      authorizer: new WebSocketIamAuthorizer(),
      integrations: {
        sayHello: {
          integration: new WebSocketLambdaIntegration("SayHelloIntegration", new SayHelloFunction(this, "SayHello")),
        },
      },
    });
    ```

=== "JAVA"

    !!!warning

        Java is not yet supported.

=== "PYTHON"

    !!!warning

        Python is not yet supported.

!!!warning

    The `<Operation>Function` constructs will point to the implementation in the project corresponding to the `language` you selected in the `@handler` Smithy trait or `x-handler` OpenAPI vendor extension. If you relocate your handler implementation and leave the trait a new handler stub will be generated and the construct will point to that. If you remove the `@handler` Smithy trait or `x-handler` OpenAPI vendor extension from an operation, your generated CDK infrastructure will not include a CDK function construct, and you will need to write your own.

!!!tip

    Annotate your Smithy `service` with the `@connectHandler` and/or `@disconnectHandler` trait to generate `$ConnectFunction` and `$DisconnectFunction` constructs. In OpenAPI, use the top level vendor extensions `x-connect-handler` and `x-disconnect-handler`.

### Lambda Architectures

Lambda architectures can be configured in the same way as REST APIs. Please refer to the [REST API documentation on Lambda Handlers](./lambda_handlers.md).

#### Native Dependencies

Native dependencies can be handled in the same way as REST APIs. Please refer to the [REST API documentation on Lambda Handlers](./lambda_handlers.md).

## Runtime Versions

Runtime versions can be configured in the same way as REST APIs. Please refer to the [REST API documentation on Lambda Handlers](./lambda_handlers.md).

## Handler Router

The lambda handler wrappers can be used in isolation as handlers for separate lambda functions. If you would like to use a single lambda function to serve all requests, you can wrap your individual handlers with a "handler router", for example:

=== "TS"

    ```ts
    import {
      handlerRouter,
      sayHelloHandler,
      sayGoodbyeHandler,
    } from "myapi-typescript-runtime";
    import { myInterceptor } from "./interceptors";
    import { sayGoodbye } from "./handlers/say-goodbye";

    const sayHello = sayHelloHandler(async ({ connectionId, sdk }) => {
      await sdk.sendGreeting(connectionId, { greeting: 'Hello!' });
    });

    export const handler = handlerRouter({
      // Interceptors declared in this list will apply to all operations
      interceptors: [myInterceptor],
      // Assign handlers to each operation here
      handlers: {
        sayHello,
        sayGoodbye,
      },
    });
    ```

=== "JAVA"

    !!!warning

        Java is not yet supported.

=== "PYTHON"

    !!!warning

        Python is not yet supported.

When you use a handler router, you must specify the same lambda function for every integration in your `Api` CDK construct. To save typing, you can use the `Operations.all` method from your generated runtime package:

=== "TS"

    ```ts
    import { Operations } from "myapi-typescript-runtime";
    import { Api } from "myapi-typescript-infra";
    import { WebSocketIamAuthorizer } from "aws-cdk-lib/aws-apigatewayv2-authorizers";
    import { WebSocketLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
    import { NodejsFunction } from "aws-cdk-lib/aws-lambda";

    new WebSocketApi(this, "Api", {
      authorizer: new WebSocketIamAuthorizer(),
      // Use the same integration for every operation.
      integrations: Operations.all({
        integration: new WebSocketLambdaIntegration("RouterIntegration", new NodejsFunction(this, "Router")),
      }),
    });
    ```

=== "JAVA"

    !!!warning

        Java is not yet supported.

=== "PYTHON"

    !!!warning

        Python is not yet supported.

## Connect and Disconnect Handlers

Using the `@connectHandler`/`@disconnectHandler` Smithy traits (or the `x-connect-handler`/`x-disconnect-handler` vendor extensions in OpenAPI) will generate lambda handler stubs for managing connections.

The `$connect` handler is called when a new client attempts to connect to the WebSocket API, and is authenticated. You may optionally choose to deny the connection if you would like to perform additional authorization. Note that the connection is not established (or denied) until the lambda function returns, so you cannot use the Server SDK to send messages to the given connection. You can however use the SDK to send messages to other connections.

Often, the `$connect` handler is used to store connection IDs along with metadata such as the authenticated user, and the `$disconnect` handler is used to clean up any state pertaining to a connection.

=== "TS"

    ```ts
    import {
      $connectHandler,
      $ConnectChainedLambdaHandlerFunction,
      INTERCEPTORS,
      LoggingInterceptor,
      $PendingConnection,
    } from 'myapi-typescript-runtime';

    import { isAuthenticated } from "./my-auth-utilities";

    /**
     * Type-safe handler for the $connect event, invoked when a new client connects to the websocket
     */
    export const $connect: $ConnectChainedLambdaHandlerFunction = async (request) => {
      LoggingInterceptor.getLogger(request).info('Start $connect');

      // `connectionId` is the ID of the new connection
      // `sdk` is used to send messages to connected clients
      // Note that you cannot send messages to the new connection until after this function returns
      const { connectionId, sdk } = request;

      // TODO: Implement

      // Use the below to allow or deny the incoming connection (when the lambda returns).
      // The connection is allowed by default.
      if (!isAuthenticated(request)) {
        $PendingConnection.of(request).deny();
      }
    };
    ```

=== "JAVA"

    !!!warning

        Java is not yet supported.

=== "PYTHON"

    !!!warning

        Python is not yet supported.