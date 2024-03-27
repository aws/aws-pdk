# Server SDK

The generated runtime packages include a Server SDK which you can use to send messages to connected clients. The Server SDK includes a type-safe method for each `server_to_client` or `bidirectional` operation.

The lambda handlers are automatically configured with an instance of the Server SDK, but you can also use the Server SDK in other parts of your application, for example within a lambda function running as part of a Step Functions state machine.

## Configuring the Server SDK

To configure the Server SDK, you need to provide your `WebSocketApi`'s callback url, as well as grant permissions to invoke the API Gateway management API, which the Server SDK uses to send messages.

### CDK Infrastructure

The below example shows how to obtain the callback url for use in a lambda function which is not a WebSocket API integration:

=== "TS"

    ```ts
    const api = new WebSocketApi(this, "Api", ...);

    const myLambdaFunction = new NodejsFunction(this, "MyLambdaFunction", {
      ...,
      environment: {
        // Provide the callback url to the lambda function, so it can be used to configure the server SDK
        CALLBACK_URL: api.defaultStage.callbackUrl,
      },
    });

    // Grant the lambda function permissions to use the Server SDK
    api.defaultStage.grantManagementApiAccess(myLambdaFunction);
    ```

=== "JAVA"

    !!!warning

        Java is not yet supported.

=== "PYTHON"

    !!!warning

        Python is not yet supported.

### Lambda Implementation

The below example demonstrates how to construct and use the server SDK. To send messages to connections, you must provide the `connectionId`. You are required to manage connections yourself, as this is application specific business logic. For example in your Step Functions state machine, you may wish to load all connections associated with an authenticated user which you have stored in DynamoDB, and send progress notifications to these connections:

=== "TS"

    ```ts
    import { DefaultApiServerSdk } from "myapi-typescript-runtime";

    // Retrieve the callback url we passed as an environment variable
    const { CALLBACK_URL } = process.env;

    export const handler = async (event: any) => {
      // Initialise the server SDK
      const sdk = new DefaultApiServerSdk({ callbackUrl: CALLBACK_URL! });

      // Load the relevant connection ids according to your desired business logic
      const connectionIds = await loadConnectionsFromDynamoDb(event.user);

      // Send messages to all connections
      await Promise.all(connectionIds.map(
        (connectionId) => sdk.sendGreeting(connectionId, { greeting: "Hello!" })
      ));
    };
    ```

=== "JAVA"

    !!!warning

        Java is not yet supported.

=== "PYTHON"

    !!!warning

        Python is not yet supported.
