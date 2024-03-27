# Integrations

Integrations define what happens when the WebSocket API receives a message for a particular `client_to_server` or `bidirectional` operation.

Integrations from the [AWS APIGatewayv2 Integrations CDK module](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigatewayv2_integrations-readme.html#websocket-apis) are used to define these.

When you instantiate your generated `Api` construct, you will need to provide an integration for every operation.

=== "TS"

    ```ts
    new WebSocketApi(this, "Api", {
      integrations: {
        // An integration is required for every operation
        sayHello: {
          integration: new WebSocketLambdaIntegration(...),
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

You can also provide integrations for `$connect` and `$disconnect`, which are called when a client connects to or disconnects from your WebSocket API. By default, the API will allow connections to be established according to the provided authorizer. If you would like to add additional custom authorization logic, you can do so for `$connect`.

=== "TS"

    ```ts
    new WebSocketApi(this, "Api", {
      connect: {
        integration: new WebSocketLambdaIntegration(...),
      },
      disconnect: {
        integration: new WebSocketLambdaIntegration(...),
      },
      integrations: {
        ...
      },
    });
    ```

=== "JAVA"

    !!!warning

        Java is not yet supported.

=== "PYTHON"

    !!!warning

        Python is not yet supported.

## Lambda integration

For integrating an API operation with a lambda, use `new WebSocketLambdaIntegration("SomeId", yourLambdaFunction)`.

## Mock integration

Since WebSocket APIs do not return responses, mocking an operation just means accepting messages from clients.

To mock an individual API operation, use the `WebSocketMockIntegration` construct. For convenience, you can use `MockIntegrations.mockAll()` from your generated infrastructure package to mock all operations.
