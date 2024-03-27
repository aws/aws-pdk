# Clients

Type Safe WebSocket APIs include clients generated from your model, which can be used to send messages to the server or listen for messages from the server. These can be configured by passing `libraries` to your `TypeSafeWebSocketApiProject`.

If you configure `WebSocketLibrary.TYPESCRIPT_WEBSOCKET_CLIENT`, a TypeScript client is generated. This client can be used in a Node runtime, or a web browser.

## Configuring Clients

Clients must be configured with the `WebSocketApi` URL, which can be found in CDK in the `defaultStage.url` property. Clients can also be configured with an authentication strategy. When clients are instantiated, they initiate a WebSocket connection with the server, and will automatically reconnect if disconnected.

=== "TS"

    ```ts
    import { DefaultApiWebSocketClient } from "myapi-typescript-websocket-client";

    const client = await DefaultApiWebSocketClient.connect({
      url: `wss://your.websocket.api.url`,
      // Optional authentication strategy, choose from none, iam or custom
      authentication: {
        iam: {
          region: "us-west-2", // <- use your WebSocket API region
          credentials: () => { ... }// <- function to return AWS Credentials.
        },
      },
    });
    ```

    !!!tip

        The [`@aws-sdk/credential-providers`](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-credential-providers/) package contains several useful credential providers that can be used for `iam.credentials`, including `fromNodeProviderChain()` which is the default used for AWS SDK clients.

=== "JAVA"

    !!!warning

        Java is not yet supported.

=== "PYTHON"

    !!!warning

        Python is not yet supported.

### Custom Authentication

You can use a `custom` authentication strategy if you would like to authenticate using a JWT or Cognito token, or some other mechanism. This provides a hook for you to add credentials to the URL used to connect to the WebSocket.

=== "TS"

    ```ts
    import { DefaultApiWebSocketClient } from "myapi-typescript-websocket-client";

    const client = await DefaultApiWebSocketClient.connect({
      url: `wss://your.websocket.api.url`,
      authentication: {
        custom: async ({ url }) => ({ url: `${url}?myJwtToken=${await getMyJwtCredentials()}` }),
      },
    });
    ```

=== "JAVA"

    !!!warning

        Java is not yet supported.

=== "PYTHON"

    !!!warning

        Python is not yet supported.

## Sending Messages

The client includes type-safe methods for sending messages on the WebSocket according to your API model. A method is generated for every `client_to_server` and `bidirectional` operation. If the WebSocket is connected, the client will immediately send the message on the WebSocket this method is invoked. If the WebSocket connection was dropped and the client is reconnecting, the message will be queued and sent when the connection has been re-established.

For example, if a `client_to_server` operation named `SayHello` is defined in your model, you can invoke it as follows:

=== "TS"

    ```ts
    import { DefaultApiWebSocketClient } from "myapi-typescript-websocket-client";

    const client = await DefaultApiWebSocketClient.connect(...);

    // Send the message to the server. The method is the same as the operation name defined in your model.
    await client.sayHello({ name: "Jack" });
    ```

=== "JAVA"

    !!!warning

        Java is not yet supported.

=== "PYTHON"

    !!!warning

        Python is not yet supported.

## Listening to Messages

The client includes type-safe methods for registering listeners to each `server_to_client` and `bidirectional` operation. The listener will be invoked whenever a message is received from the server for that operation. These follow the naming convention `on<OperationName>`.

For example, if a `server_to_client` operation named `SendGreeting` is defined in your model, you can listen to messages as follows:

=== "TS"

    ```ts
    import { DefaultApiWebSocketClient } from "myapi-typescript-websocket-client";

    const client = await DefaultApiWebSocketClient.connect(...);

    // Listen to greetings. A function is returned which can be used to remove the listener.
    const unlistenToGreetings = await client.onSendGreeting((input) => {
      // Input is typed according to your model
      console.log(`Received greeting ${input.greeting}`);
    });

    // Invoke the returned unlisten function to remove the listener
    unlistenToGreetings();
    ```

=== "JAVA"

    !!!warning

        Java is not yet supported.

=== "PYTHON"

    !!!warning

        Python is not yet supported.

### Subscriptions

A common pattern is for clients to choose to subscribe to messages from a server based on some criteria, which the client provides the server as it initiates a subscription. WebSocket connections can sometimes hang up, due to timeouts or transient issues. In these cases, clients must re-subscribe once the connection has been re-established such that the messages it desires are sent from the server on the new connection. You can use the `$withReconnect` method to register a callback which is invoked immediately as well as re-invoked whenever the WebSocket reconnects.

For example, if the model defines a `client_to_server` operation named `SubscribeToNotifications` which tells the server it would like to listen to notifications on a given `topic`, and the model defines a `server_to_client` operation named `SendNotification` for the server to send notifications to the client, usage may look as follows:

=== "TS"

    ```ts
    import { DefaultApiWebSocketClient } from "myapi-typescript-websocket-client";

    const client = await DefaultApiWebSocketClient.connect(...);

    // Subscribe to notifications for the "foo" topic
    const unlistenToReconnect = client.$withReconnect(async () => {
      await client.subscribeToNotifications({ topic: "foo" });
    });
    // Listen to notifications
    const unlistenToNotifications = client.onSendNotification((input) => {
      console.log(`Received notification ${input.message}`);
    });

    // Invoke the returned unlisten functions to remove the listeners when finished
    unlistenToReconnect();
    unlistenToNotifications();
    ```

=== "JAVA"

    !!!warning

        Java is not yet supported.

=== "PYTHON"

    !!!warning

        Python is not yet supported.

!!!note

    Note that server-side, you will need to implement any subscription business logic, for example storing the connection ID and the provided `topic` in DynamoDB to be loaded whenever a notification should be sent from the server to clients.

### Errors

You can register listeners for any errors using the `$onError` method. Registered error listeners will, for example, be invoked when a message is sent which does not conform to the model, and the WebSocket API's validation fails.

=== "TS"

    ```ts
    import { DefaultApiWebSocketClient } from "myapi-typescript-websocket-client";

    const client = await DefaultApiWebSocketClient.connect(...);

    // Listen for errors
    const unlistenToErrors = client.$onError(({ message }) => {
      console.error(`Received error: ${message}`);
    });

    // Invoke the returned unlisten function to remove the listener when finished
    unlistenToErrors();
    ```

=== "JAVA"

    !!!warning

        Java is not yet supported.

=== "PYTHON"

    !!!warning

        Python is not yet supported.